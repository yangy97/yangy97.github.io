---
url: /blog/2026/05/24/miniprogram-learning-path-index/index.md
---
小程序文章分散在多篇里，本篇是 **阅读顺序索引**：先建立生命周期与网络层，再组件化与性能，最后支付与云开发；旧笔记标注 **考古参考**。

***

### 一、推荐路径（2024+ 实战向）

| 顺序 | 文章 | 说明 |
|------|------|------|
| 1 | [生命周期、路由与页面栈](/2026/05/24/miniprogram-lifecycle-routing-navigation/) | 基础中的基础 |
| 2 | [网络请求、登录态与本地缓存](/2026/05/25/miniprogram-network-storage-subscription/) | request 封装 |
| 3 | [性能优化与审核踩坑](/2026/05/26/miniprogram-performance-audit-practice/) | 上线前必读 |
| 4 | [自定义组件、分包与 Skyline](/2026/05/17/miniprogram-custom-component-skyline-package/) | 组件化 |
| 5 | [支付、回调与对账](/2026/05/17/miniprogram-payment-flow-and-reconciliation/) | 商业闭环 |
| 6 | [云开发与云函数](/2026/05/18/miniprogram-cloudbase-cloud-function-debug/) | 轻后端 |
| 7 | [uni-app / Taro 选型](/2026/05/17/miniprogram-uniapp-taro-selection-and-pitfalls/) | 多端 |
| 8 | [隐私合规与接口申请](/2026/05/26/miniprogram-privacy-compliance-guide/) | 提审必备 |
| 9 | [跨小程序与半屏](/2026/05/26/miniprogram-navigate-miniprogram-half-screen/) | 跳转 |
| 10 | [直播与视频号概览](/2026/05/27/miniprogram-live-channels-overview/) | 带货/活动 |

***

### 二、移动端延伸（微信外）

* App 内 H5：[JSBridge](/2026/05/27/mobile-h5-webview-jsbridge-native-interaction/) → [登录态](/2026/05/18/mobile-h5-app-login-session-cookie-itp/) → [离线包](/2026/05/18/mobile-h5-offline-package-release-rollback/)

***

### 三、考古参考（2020 笔记）

以下文章 **思路仍有用**，但代码/截图较旧，读时注意平台规则已更新：

* [微信卡包跳转小程序](/2020/09/14/weixin/)
* [微信+uniapp 踩坑](/2020/07/01/weixin-uniapp/)
* [禁止二次转发](/2020/08/26/weixin-jump/)

参数缓存、SSL/ATS 等问题在新文中已有覆盖。

***

### 四、还缺什么（可自行实践后补文）

* **视频号 deep link** 更多组合玩法（随官方能力迭代）
* **小程序与企微** 互通场景
* 某垂直类目 **证照清单**（医疗/金融需法务把关，本站不写死）

***

### 五、小结

按 **生命周期 → 网络 → 性能 → 组件 → 支付 → 云 → 多端** 读下来，能覆盖大多数业务小程序。有问题欢迎按标签 [小程序](/posts/tags/?tag=%E5%B0%8F%E7%A8%8B%E5%BA%8F) 浏览全站。
