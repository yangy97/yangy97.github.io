---
url: /blog/2026/05/13/eggjs-multipart-upload-oss-boundaries/index.md
---
后台「导入 Excel」「贴图富文本」「工单附件」都会触发上传。Egg 侧既有 **`multipart`** 走磁盘缓存的模式，也有 **前端直传 OSS** 只走后端签名的模式。本篇对比 **瓶颈、鉴权与恶意文件** 三道防线。

***

### 一、Egg multipart：字段契约与体积上限

* **`fileSize` / `whitelist` / `fileExtensions`**：尽早拒绝，节省磁盘 IO。
* **临时目录与清理**：异常路径上要 **finally unlink**，避免 `/tmp` 打满。
* **并发**：上传风暴要打 **全局限流**（令牌桶）或网关层 QoS。

***

### 二、OSS 直传：STS / Post Policy

流程：**Egg 校验登录与权限 → 签发短时凭证或 Policy → 浏览器 PUT 到 OSS → 回调或前端带回 object key → Egg 落库元数据**。

关键点：

* **回调验签** 不可省略；否则伪造成功上传。
* **MIME 与后缀双校验**：OSS 可配置 **Content-Type** 限制。
* **路径前缀**：按租户/日期打散，避免单 bucket 热点前缀 listing 慢。

***

### 三、恶意内容：不只是病毒

* **SVG/HTML**：若允许浏览器预览，需 **CSP** 或 **禁止 inline HTML**。
* **ZIP 炸弹**：解压导入要在 **独立 Worker / 子进程** 限额条目数与解压体积。
* **异步杀毒**：高合规场景 **投递队列**，未完成标记「扫描中」不可分发外链。

***

### 五、示例：`config.multipart` 限额（节选）

```js
// config/config.default.js —— 字段名以框架文档为准
exports.multipart = {
  mode: 'file',
  fileSize: '15mb',
  whitelist: [ '.pdf', '.png', '.xlsx' ],
  tmpdir: '/tmp/egg-multipart',
};
```

Controller 里 **`await ctx.multipart()`** 之后务必 **`try/finally`** 删除临时文件；对大文件优先 **流式转存 OSS**，不要把整个 Buffer 常驻内存。

***

### 六、OSS Post Policy 签名思路（无 SDK 细节）

服务端生成 **`expiration` + `conditions`**（限制 **`bucket`**、**`key` 前缀**、最大 **`content-length-range`**），用密钥算出 **`signature`**，前端表单 **`POST`** 直传。回调接口验证 OSS **带签 body**（或 MNS 消息）后再 **`INSERT INTO attachments`**——**未收到可信回调前**，业务上视为上传未完成。

***

### 七、网关限流示例（示意）

```nginx
# nginx —— 按 IP 限制上传接口并发 / 速率，仅为示意
limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;
location /api/upload {
  limit_req zone=upload burst=20 nodelay;
  proxy_pass http://egg_upstream;
}
```

Egg 内可再配合 **`rateLimiter` 中间件**（Redis 令牌桶），防止单一内网客户端绕过 nginx。

***

### 八、小结

上传链路的安全模型是 **「谁能发起」「传到哪里」「服务端承认什么」** 三件事分立设计。Egg 既可以扛小文件 multipart，也应在大流量下尽快迁到 **直传 + 强校验回调**，否则磁盘与 Node 单线程都会成为瓶颈。
