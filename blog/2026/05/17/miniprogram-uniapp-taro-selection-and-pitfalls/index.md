---
url: /blog/2026/05/17/miniprogram-uniapp-taro-selection-and-pitfalls/index.md
---
一套代码多端（微信/支付宝/H5/App）很诱人，但 **编译层差异** 会在 iOS、分包、样式、API 上埋坑。本篇对比 **uni-app vs Taro** 的适用场景，并汇总 **高频踩坑**（含你旧文里 TLS/轮播类问题的升级版排查思路）。

***

### 一、快速对比

| 维度 | uni-app | Taro |
|------|---------|------|
| 语法 | Vue 为主（也支持 nvue、uts） | React 为主（Vue3 支持在演进） |
| 生态 | DCloud 插件市场、HBuilderX | 京东系、React 组件生态 |
| 编译 | 自有编译器到各端 | 编译到各端小程序 + H5 |
| 适合 | Vue 团队、要快出多端 MVP | React 团队、组件化强 |
| 学习成本 | Vue 开发者低 | 需熟悉 Taro 运行时差异 |

\==选型原则==：**主栈是什么就选什么**；不要为了「多端」强行换框架。

***

### 二、uni-app 常见坑

**1. 条件编译漏写**

```javascript
// #ifdef MP-WEIXIN
wx.requestSubscribeMessage({ tmplIds: ['xxx'] });
// #endif
```

**2. 样式差异**：`rpx` 在 H5 与小程序表现不同；fixed 底部栏要配合 `safe-area`。

**3. iOS 网络/证书**：请求域名 TLS 1.2+、证书链完整（参见旧文 uni-app 轮播 SSL 案例）——**先查 HTTPS，再查业务**。

**4. 图片路径**：小程序端本地大图应走 CDN，不要假设 `static/` 路径各端一致。

**5. Vue2/Vue3 项目混用文档**：确认 `manifest.json` 与依赖版本一致。

***

### 三、Taro 常见坑

**1. 运行时与 React 版本**：Taro 3/4 对应不同 React 版本，升级要全量回归。

**2. 样式**：默认 **px 转 rpx** 规则与 Design 稿要统一；第三方 UI 库需选 Taro 适配版。

**3. 生命周期**：`useLoad` / `useDidShow` 与 React `useEffect` 不要混用同一份副作用。

**4. 分包**：`app.config.ts` 的 `subPackages` 与页面路径大小写严格一致。

***

### 四、多端 API 抽象建议

```javascript
// utils/platform.js
export const pay = (params) => {
  // #ifdef MP-WEIXIN
  return wxPay(params);
  // #endif
  // #ifdef H5
  return h5Pay(params);
  // #endif
};
```

**支付、登录、分享、定位** 一律走适配层，页面不写平台 API 裸调用。

***

### 五、从原生小程序迁移

1. 先 **单端微信** 跑通，再开 `#ifdef`
2. 路由表与分包 **一对一映射**
3. 原生自定义组件评估是否需重写（Web 组件不能直接搬）
4. 性能：Taro/uni 包体积通常大于原生，关注 **主包体积**

***

### 六、小结

uni-app 适合 **Vue 系快速多端**；Taro 适合 **React 系**。无论选谁，**条件编译 + HTTPS + 分包 + 平台 API 适配层** 是四条保命绳。旧笔记《微信+uniapp》可作案例参考；系统阅读见[《小程序导读与学习路径》](/2026/05/24/miniprogram-learning-path-index/)。
