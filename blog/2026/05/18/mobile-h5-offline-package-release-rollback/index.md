---
url: /blog/2026/05/18/mobile-h5-offline-package-release-rollback/index.md
---
离线包让 H5 **首屏不依赖实时网络**，但发版链路比纯 CDN 多一层：**版本 manifest、差量更新、签名校验、灰度与回滚**。本篇给一套可落地的目录约定与流程。

***

### 一、产物结构

```text
dist/
  index.html
  assets/
manifest.json
dist.zip
```

```json
{
  "version": "20260604.3",
  "minNativeVersion": "3.2.0",
  "md5": "a1b2c3...",
  "entry": "index.html",
  "force": false,
  "gray": { "percent": 10, "whitelist": ["tester001"] }
}
```

***

### 二、Native 更新流程

```text
App 启动
  → GET https://cdn.example.com/h5/manifest.json
  → 比较 version / minNativeVersion
  → 下载 zip（或 bsdiff 差包）
  → 校验 md5
  → 解压到 sandbox/h5/{version}/
  → 原子切换 current 指针
  → WebView 加载 file:// 或 https://app.local/index.html
```

**原子切换**：新包解压完毕后再改 `current` 软链/配置文件，避免半包。

***

### 三、灰度策略

| 策略 | 实现 |
|------|------|
| 百分比 | `hash(userId) % 100 < gray.percent` |
| 白名单 | 测试账号强制新版本 |
| 强更 | `force: true` 且版本低于 manifest 则阻断旧包 |

服务端可在 manifest 接口按 **App 版本 + 用户 ID** 返回不同 JSON。

***

### 四、回滚

1. CDN 上保留 **最近 N 个 version 的 zip**
2. manifest 的 `version` 指回上一稳定版（或下发 `rollbackTo` 字段）
3. Native 检测到本地已有该 version 缓存则 **跳过下载**
4. 线上事故：**先回滚 manifest，再查因**

***

### 五、H5 侧注意

* `import.meta.env` / API（应用程序接口） 基址由 Native 注入 `window.__ENV__`，不要写死在包内
* 路由 history 模式要配合 **local server 或 hash 模式**
* 离线包内资源引用用 **相对路径** 或注入的 `publicPath`

***

### 六、CI 集成

```bash
pnpm build
node scripts/hash-dist.mjs > manifest.json
zip -r dist.zip dist manifest.json
aws s3 cp dist.zip s3://bucket/h5/20260604.3/dist.zip
aws s3 cp manifest.json s3://bucket/h5/manifest.json
```

构建机产出 **md5 与版本号**，避免人工改错。

***

### 七、小结

离线包发版 = **manifest 为单一真相源 + 校验 + 原子切换 + 可回滚 CDN**。与[《混合 App 架构》](/2026/05/17/mobile-hybrid-app-architecture-schemes/)《JSBridge》组成 App 内 H5 三板斧。
