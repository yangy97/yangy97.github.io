---
url: /blog/2026/05/23/frontend-file-preview-watermark-permission-download/index.md
---
中后台常要 **预览 PDF/Office、带水印、按权限下载**。前端不能「隐藏按钮就安全」，必须 **服务端鉴权 + 短期 URL**。本篇串完整链路，并补 **ticket 接口、OnlyOffice/pdf.js 集成与审计** 细节。

***

### 一、架构总览

```text
浏览器 → GET /files/:id/preview（Cookie/JWT 鉴权）
       ← 200 JSON { ticket, expiresIn }
       → GET /files/:id/content?ticket=xxx
       ← 302 到 OSS 签名 URL（60s）
       或 ← 流式 proxy（敏感文件，不经公网 CDN）
       或 ← 转码服务（Office → PDF）
```

**禁止** 把永久 OSS 公网 URL 写进列表接口 JSON。\
**禁止** 只在前端 `v-if="canDownload"` 而不校验 ticket。

与 RBAC 关系：列表层 **数据权限** 过滤 fileId（见 [行级数据权限](/2023/07/12/rbac-data-scope-row-level-department-tree/)）。

***

### 二、Ticket 与签名 URL

#### 2.1 签发（BFF / Egg）

```typescript
// 伪代码：ticket 一次性或短 TTL，绑定 user + file + action
async function issueFileTicket(userId: string, fileId: string, action: 'preview' | 'download') {
  await assertFilePermission(userId, fileId, action);
  const ticket = signJwt(
    { sub: userId, fileId, action, jti: randomId() },
    { expiresIn: '60s' },
  );
  await redis.setex(`file_ticket:${jti}`, 60, '1'); // 可选一次性
  auditLog({ userId, fileId, action, event: 'ticket_issued' });
  return { ticket, expiresIn: 60 };
}
```

#### 2.2 消费

```typescript
async function resolveContentUrl(ticket: string) {
  const payload = verifyJwt(ticket);
  if (payload.action !== 'preview') throw forbidden();
  await redis.del(`file_ticket:${payload.jti}`); // 一次性则删除
  const objectKey = await db.getObjectKey(payload.fileId);
  return ossClient.signatureUrl(objectKey, { expires: 60 });
}
```

前端 **不缓存** ticket URL 到 localStorage；预览组件销毁后 URL 应失效。

***

### 三、预览方案选型

| 类型 | 方案 | 前端要点 |
|------|------|----------|
| PDF | **pdf.js**（Mozilla） | Worker 路径、CMap 字体、大文件分页渲染 |
| PDF | 浏览器 `<embed>` | 简单但移动端行为不一致 |
| Office | 服务端 **LibreOffice / OnlyOffice** 转 PDF | 前端只嵌 PDF 或 OnlyOffice iframe |
| 图片 | `<img>` + 可选 canvas 水印 | 水印可被 F12 去掉 |
| 视频 | `<video>` + 签名 URL | Range 请求、防盗链 |
| 文本/代码 | 后端限大小拉取 + highlight | 超 1MB 拒绝或只下不传预览 |

#### 3.1 pdf.js 最小集成（Vue）

```vue
<script setup lang="ts">
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const props = defineProps<{ url: string }>(); // 短期签名 URL
const canvasRef = ref<HTMLCanvasElement>();

onMounted(async () => {
  const doc = await pdfjs.getDocument({ url: props.url, withCredentials: false }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = canvasRef.value!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
});
</script>

<template>
  <canvas ref="canvasRef" />
</template>
```

大 PDF：**虚拟滚动** 按页渲染，不要一次 `getDocument` 后渲染全部页（内存爆炸）。

#### 3.2 Office

* **OnlyOffice Document Server**：iframe 嵌入，文档 **不出域** 时在政企常见。
* **转 PDF 再 pdf.js**：实现简单，丢失交互表单。
* **微软 Office Online**：依赖公网与微软账号，内网往往不行。

***

### 四、水印

| 层级 | 防君子 | 防小人 | 适用 |
|------|--------|--------|------|
| 前端 canvas 叠加 | ✓ | ✗ | 低敏预览 |
| PDF 服务端嵌入文字/图片 | ✓ | △ | 合同、报表 |
| 图片盲水印 / 频域 | △ | △ | 溯源，成本高 |
| 屏幕录制审计 | — | 威慑 | 高敏 |

**真水印**在服务端转码或 PDF 层写入，内容含 **userId + 时间**：

```text
张三 2026-06-01 10:23  工号 E1024
```

前端 canvas 水印仅作 **辅助提醒**，不能作为合规唯一手段。

***

### 五、下载

```typescript
async function download(fileId: string) {
  const { ticket } = await api.postDownloadTicket(fileId);
  // 方式 1：新窗口（简单）
  window.open(`/api/files/${fileId}/download?ticket=${encodeURIComponent(ticket)}`, '_blank');
  // 方式 2：fetch blob + a[download]（可改文件名，见下载专文）
}
```

大文件：**Range 断点续传**（见 [《大文件下载 stream blob》](/2023/06/22/frontend-download-stream-blob-range/)）。\
下载与预览 **分开 ticket action**，避免预览 ticket 被改成下载。

***

### 六、权限与审计

* 列表接口就不返回 **无权限 fileId**（含 row-level scope）。
* 每次 preview/download **服务端查 RBAC**，不 trusting 前端 role 字符串。
* 审计日志：**谁、何时、哪个 fileId、action、IP、是否成功**；敏感文件对接 [审计与越权防控](/2023/07/15/rbac-audit-log-privilege-escalation-detection/)。
* **频率限制**：同一用户短时间大量 ticket 签发 → 告警。

***

### 七、安全清单

* \[ ] 列表/详情接口无永久 OSS URL
* \[ ] ticket 短 TTL，敏感场景一次性
* \[ ] download / preview 分权限、分 action
* \[ ] OSS 签名 **最小 HTTP 方法**（预览用 GET 只读桶策略）
* \[ ] CSP：`frame-src` 限制 OnlyOffice 域
* \[ ] 上传链路见 [《分片上传 OSS》](/2023/06/27/frontend-large-file-upload-chunk-oss/)，MIME 与病毒扫描在服务端

***

### 八、常见坑

| 现象 | 原因 |
|------|------|
| pdf.js 中文乱码 | 缺 CMap / 字体包 |
| iframe 空白 | X-Frame-Options、CSP frame-ancestors |
| 签名 URL 过期中途断 | TTL 太短，大文件用 proxy 流式 |
| 预览能下原文件 | preview ticket 未限制 Content-Disposition |
| 越权 | 只校验登录未校验 fileId 归属 |

***

### 九、小结

文件链路 = **ticket + 短签名 + 服务端水印 + 审计 + 预览转码选型**。前端负责 **正确消费 ticket 与体验**；安全边界在 **BFF 与对象存储策略**。
