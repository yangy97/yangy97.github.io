---
url: /blog/2023/06/27/frontend-large-file-upload-chunk-oss/index.md
---
浏览器 ==不能直接写磁盘路径==，上传依赖 **`input[type=file]` + FormData / Blob**，大文件若一次性 `POST`，容易 **超时、断网全丢、服务端内存爆**。企业里常见方案：**分片（multipart）**、**断点续传**、**秒传（哈希去重）**、**前端直传对象存储**（OSS/COS/S3）。下面按 **协议与流程、前端切片、并发与合并、与后端/OSS 配合** 写深，并带 **示例**。

***

### 一、为什么必须分片：TCP、超时与网关

| 问题 | 说明 |
|------|------|
| ==HTTP 超时== | 反向代理 / LB 常有 **60s～300s** 读超时，单请求传 2GB 易挂 |
| **内存** | 服务端一次性读入 body，**OOM** 风险 |
| **弱网** | 失败重传从 0 开始，体验差 |

**思路**：客户端切成 **N 个块**，每块独立 **上传 + 校验**，服务端或 OSS **合并**；失败只 **重传失败分片**。

***

### 二、分片大小与数量：经验值与约束

* **单片大小**：常见 **1MB～8MB**（过小则请求数多、过大则单次失败成本高）。
* **总分片数**：部分 OSS **单次完成上传** 限制 **最多 10000 分片**（产品文档为准）。
* **并发**：浏览器 **同一域名并发 6 左右**（HTTP/1.1），可用 **分域名** 或 **HTTP/2 多路复用** 缓解（视部署）。

***

### 三、流程示例：自建合并 vs OSS 分片 API

**路径 A：经业务网关**

1. `POST /upload/init` → 返回 `uploadId`、建议 `partSize`。
2. 循环 `PUT /upload/part` 带 `partNumber` + **binary body**。
3. `POST /upload/complete` 携带 **ETag 列表**（顺序敏感）。

**路径 B：OSS 分片直传（推荐减轻应用机带宽）**

1. 后端签发 **STS 临时凭证** 或 **PostPolicy / 预签名 URL**。
2. 前端调 OSS SDK **`multipartUpload`**，**直传** 存储桶。
3. 业务侧只存 **最终 object key** 与元数据。

***

### 四、示例：浏览器端切片（原生 API）

```typescript
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

async function* iterateChunks(file: File) {
  let start = 0;
  while (start < file.size) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    yield file.slice(start, end); // Blob，内存友好
    start = end;
  }
}

// 使用
for await (const chunk of iterateChunks(file)) {
  await uploadPart(chunk); // 内部 fetch / xhr 发当前分片
}
```

**`file.slice` 不会一次性读全文件**，适合大文件。

***

### 五、断点续传：状态存在哪

客户端需持久化：

* `fileId`（或 **文件指纹 + 文件名 + 大小**）
* 已成功的 **partNumber → etag**
* `uploadId`

存 **`IndexedDB`** 优于 `localStorage`（容量大）。用户 **换浏览器** 则续不了，除非服务端按 **用户 + 文件 hash** 记录进度。

**恢复流程**：打开页 → 读 IndexedDB → **只上传缺失分片** → complete。

***

### 六、秒传：内容哈希与去重

**思路**：上传前计算 **文件 hash**（Web Crypto **SHA-256** 或 **spark-md5** 分块读），请求 `POST /file/exists?hash=...`。若服务端已有，则 **秒级完成**（链到新业务记录）。

**注意**：大文件 **全量 hash** 仍要读一遍文件，CPU + 磁盘；可与 **业务策略** 折中（仅图片/文档启用，或抽样）。

**Worker 中算 hash 示例（概念）**

```typescript
// main: postMessage(file) 到 Worker，Worker 里 file.stream() 分块 digest
```

避免阻塞主线程。

***

### 七、进度条：XHR vs fetch

* **`XMLHttpRequest.upload.onprogress`**：分片上传时 **每片** 回调，需 **累加已完分片 + 当前片进度**。
* **`fetch` + ReadableStream**：上传流 **进度** 需自己 **包装流** 计数 chunk（略繁琐）。

***

### 八、安全与鉴权

* **直传 OSS**：**bucket 权限** 必须 **最小化**（前缀、STS 条件）；**禁止** 前端写死 **长期 AK**。
* **回调**：OSS 上传完成 **回调业务** 或 前端再调 **`/complete`** 带 **服务端可验证签名**，防伪造完成。

***

### 九、小结

大文件上传 = **分片 + 可恢复状态 + 合并顺序正确**；上规模后 **直传 OSS + STS** 几乎是标配。先 **把 init/part/complete 状态机画清**，再写 UI。
