---
url: /blog/2023/06/22/frontend-download-stream-blob-range/index.md
---
「点链接下载」看似简单：小文件 ==`a[download]` + blob URL== 即可；大文件或 **生成型** 内容则要 **`Stream`、背压、内存**。另有一类是 **断点续传下载**（多线程、Range）。下面分 **同源下载、跨域、流式写出、Range 与播放器**，并附 **示例**。

***

### 一、最小可行：Blob 与 `URL.createObjectURL`

```typescript
function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

\==适用==：**小到内存装得下** 的导出（Excel、JSON、小图片）。

**注意**：`revokeObjectURL` 延迟到 `click` 后下一帧或 `setTimeout`，避免 Safari 偶发 **未开始下载就释放**。

***

### 二、大文件：不要整进内存——`ReadableStream` + `Response.body`

若接口返回 **`fetch(url)`** 且 `response.body` 是 **ReadableStream**，在 **支持的环境** 可直接交给 **StreamSaver.js / File System Access API** 或 **自己读 reader 分块写**。

**示例：把流落到 Blob（仍占内存，仅中等文件）**

```typescript
const res = await fetch('/api/export');
const blob = await res.blob();
downloadBlob('export.bin', blob);
```

**真正流式落盘**（Chrome）：`fileHandle.createWritable()` + `pipeTo`，需 **用户授权** 选保存路径（**File System Access API**）。

***

### 三、`Content-Disposition` 与文件名

服务端推荐：

```
Content-Disposition: attachment; filename*=UTF-8''%E6%8A%A5%E8%A1%A8.xlsx
```

前端 **`fetch` + blob** 再 `download` 时，**文件名** 常需从 **`Content-Disposition`** 解析（`content-disposition` 库或手写），否则只能写死。

***

### 四、跨域下载：Canvas 与 `a[download]` 限制

* **跨域图片** 画到 Canvas 会 **污染**，`toBlob` 失败 → 需 **图片响应带 CORS** 且 `crossOrigin='anonymous'`。
* **`a[download]` 跨域**：部分浏览器对 **非同源 URL** 忽略 `download`，行为以浏览器为准；稳妥做法是 **`fetch` 同源代理** 或 **blob 化**。

***

### 五、Range：视频、大文件与「多线程下载」

HTTP **`Range: bytes=0-1023`** 只取一段；响应 **206 Partial Content**。

**场景**

* **`<video src>`**：浏览器 **自动 Range** 拉流。
* **大文件下载器**：多 Range **并行** + **合并**（需服务端支持 **Accept-Ranges** 与 **一致 ETag**）。

**示例：单线程 Range 续传（概念）**

```typescript
let start = localStorage.getItem('dl-offset') ? Number(localStorage.getItem('dl-offset')) : 0;
const res = await fetch('/api/big', {
  headers: { Range: `bytes=${start}-` },
});
// 206 时 append 到 FileWriter；记录新 start
```

**注意**：部分 CDN **对 Range 缓存策略** 不同，排障要看 **响应头**。

***

### 六、`fetch` 上传流（与上传篇呼应）

**Request body** 为 **`ReadableStream`** 时，可实现 **不经内存拼整文件** 的上传（需服务端支持 chunked / 流式读）。

```typescript
const stream = file.stream();
await fetch('/upload', { method: 'POST', body: stream, duplex: 'half' }); // fetch 流式 body 以规范与运行时为准
```

**兼容性**：Node 18+、`fetch` 流式上传在 **浏览器** 侧仍要查 **当前 Chromium 版本**；生产常仍用 **分片** 更可控。

***

### 七、背压（backpressure）

ReadableStream 管道里，**下游慢** 应 **反压上游**（`pipeTo` 默认会）。自己 `while (reader.read())` 写 DOM 时，若 **写太快** 会占满内存——大导出应用 **`requestIdleCallback` / 分帧** 或 **Worker**。

***

### 八、小结

前端下载 = **小文件 Blob URL**、**大文件流 + 保存 API**、**视频 Range** 三套心智。先量 **文件量级与是否必须落盘**，再选方案；**跨域与文件名** 是线上高频坑。
