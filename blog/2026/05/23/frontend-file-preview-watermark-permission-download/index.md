---
url: /blog/2026/05/23/frontend-file-preview-watermark-permission-download/index.md
---
中后台常要 **预览 PDF/Office、带水印、按权限下载**。前端不能「隐藏按钮就安全」，必须 **服务端鉴权 + 短期 URL**。本篇串完整链路。

***

### 一、架构

```text
浏览器 → GET /files/:id/preview（鉴权）
       ← 302 到 OSS 签名 URL（60s）
       或 ← 流式 proxy（敏感文件）
```

**禁止** 把永久 OSS 公网 URL 写进前端 JSON。

***

### 二、预览

| 类型 | 方案 |
|------|------|
| PDF | pdf.js / 浏览器 embed |
| Office | 服务端转 PDF 或微软/OnlyOffice 预览服务 |
| 图片 | img + 水印 canvas 叠加（仅防君子） |

***

### 三、水印

* **真水印**在服务端转码或 PDF 层写入
* 前端 canvas 水印 **可被 F12 去掉**，只作辅助

***

### 四、下载

```typescript
async function download(fileId: string) {
  const { url } = await api.getDownloadTicket(fileId);
  window.open(url, '_blank');
}
```

大文件：**Range 断点续传**（见[《大文件下载 stream blob》](/2023/06/22/frontend-download-stream-blob-range/)）。

***

### 五、权限

* 列表接口就不返回 **无权限 fileId**
* 每次 preview/download **服务端查 RBAC**
* 审计日志：谁、何时、哪个文件

***

### 六、小结

文件链路 = **ticket + 短签名 + 服务端水印 + 审计**。上传见[《分片上传 OSS》](/2023/06/27/frontend-large-file-upload-chunk-oss/)。
