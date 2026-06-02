---
url: /blog/2026/05/18/mobile-webview-ios-android-debug-guide/index.md
---
同一套 H5 在 **Safari WebView** 与 **Android System WebView** 上表现不一致是常态。本篇按 **调试工具 → 平台差异表 → 白屏/卡顿/键盘/Cookie** 给排障路径。

***

### 一、调试工具

| 平台 | 工具 |
|------|------|
| Android | Chrome `chrome://inspect` → Remote devices |
| iOS 模拟器 | Safari → 开发 → Simulator |
| iOS 真机 | 设置 → Safari → 高级 → Web 检查器 + Mac Safari |
| 通用 | vConsole / Eruda（仅内测包） |

生产包尽量 **远程日志 + 截图上报**，不要依赖 vConsole。

***

### 二、高频差异表

| 现象 | iOS | Android |
|------|-----|---------|
| 软键盘顶起布局 | visualViewport 必看 | 部分机型 `resize` 行为不同 |
| fixed 底栏 | 键盘弹出易错位 | 相对少 |
| 日期 input | 原生 picker | 各厂商 WebView 不一 |
| 滚动穿透 | 橡皮筋 | overscroll 行为不同 |
| Cookie 第三方 | ITP 更严 | 相对宽松 |
| 视频自动播放 | 常需 muted + playsinline | 策略各异 |
| ES 新特性 | 随系统 WebKit | 随 Chrome 内核版本 |

***

### 三、白屏排查顺序

1. **URL 是否加载成功**（Native 监听 `onReceivedError`）
2. **Mixed Content**（HTTPS 页请求 HTTP 资源）
3. **JS 语法错误**（旧 WebView 不支持可选链等——看 minify target）
4. **CSP 拦截**（见[《XSS/CSP》](/2026/05/22/frontend-security-xss-csp-iframe-sandbox/)篇）
5. **离线包半包 / 路径错误**
6. **localStorage 满**（少见但存在）

Native 侧打开 `WebView.setWebContentsDebuggingEnabled(true)`（Android）便于第一时间看 Console。

***

### 四、键盘与输入框

* 使用 **VisualViewport API** 调整底部输入区（见[《软键盘与 VisualViewport》](/2022/07/23/mobile-keyboard-visualviewport-input-fixed/)）
* `input` 聚焦时避免整页 `position: fixed` 大改 layout
* iOS 上 `font-size < 16px` 可能 **自动 zoom**——表单建议 ≥16px

***

### 五、Cookie / 登录态

* 换 Session 后 **用接口探活**，不要只测 `document.cookie`
* Android 多 WebView 实例时确认 **CookieManager.flush()**
* 详见[《App 内 H5 登录态实战》](/2026/05/18/mobile-h5-app-login-session-cookie-itp/)

***

### 六、性能

* 避免多层 **透明 WebView 叠放**
* 长列表用虚拟滚动；离线包控制 **单页 JS 体积**
* 动画优先 CSS transform；减少主线程 Long Task

***

### 七、小结

WebView 排障 = **远程调试 + 平台差异表 + 分层排除（网络 → CSP → JS → 包）**。与移动端 CSS 系列、JSBridge 系列配合使用。
