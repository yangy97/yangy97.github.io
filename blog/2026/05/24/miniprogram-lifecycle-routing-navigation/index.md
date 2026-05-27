---
url: /blog/2026/05/24/miniprogram-lifecycle-routing-navigation/index.md
---
小程序和 H5 最大的结构差异之一是：**页面由客户端托管的「栈」管理**，生命周期分 **App 级** 与 **Page 级**，参数传递还有 **冷启动 / 热启动** 之分。搞不清这三块，很容易出现 **参数丢失、返回刷新异常、分享进错页**。

本篇以微信小程序为主（其他平台概念相近），把 **生命周期 → 路由 API → 参数与场景值 → 常见坑** 串成一条线。

***

### 一、App 级生命周期

```javascript
// app.js
App({
  onLaunch(options) {
    // 冷启动，全局只触发一次
    // options: path, query, scene, referrerInfo 等
  },
  onShow(options) {
    // 从后台切前台、或从其他小程序返回
  },
  onHide() {
    // 切后台
  },
  onError(msg) {
    // 脚本错误、API 失败等
  },
  globalData: {},
});
```

| 钩子 | 何时触发 | 排障要点 |
|------|----------|----------|
| `onLaunch` | 冷启动 | 做 **一次性的** 初始化：更新检查、登录态恢复 |
| `onShow` | 前台可见 | 从分享/扫码进入时 **也会走**；参数在 `options.query` |
| `onHide` | 进后台 | 暂停计时器、音视频 |
| `onError` | 未捕获错误 | 上报 Sentry/自建监控 |

\==坑==：`App.onShow` 的 `options` **不等于** 页面 `onLoad` 的 `options`——App 层参数在 `options.query` 里；页面层是路径 query 解析结果。从卡包/外链进小程序时，**以页面 onLoad 为准更稳**（旧文[《微信卡包跳转小程序》](/2020/09/14/weixin/)里的经验仍适用）。

***

### 二、Page 级生命周期

```javascript
Page({
  data: { id: '' },
  onLoad(options) {
    // 页面首次加载，options 为路由参数
  },
  onShow() {
    // 每次显示（含 navigateBack 返回）
  },
  onReady() {
    // 首屏渲染完成，适合拿节点信息
  },
  onHide() {},
  onUnload() {
    // 页面被销毁（redirectTo / navigateBack 出栈等）
  },
});
```

**顺序（首次打开）**：`onLoad` → `onShow` → `onReady`。

**从 B 页 navigateBack 回 A**：A 的 `onShow` 触发，**不会** 再触发 A 的 `onLoad`——若你在 `onLoad` 里拉数据，返回时 **不会自动刷新**，需要在 `onShow` 里判断或使用 **事件总线 / 全局 store**。

***

### 三、路由 API 与页面栈

| API | 行为 | 栈 |
|-----|------|-----|
| `wx.navigateTo` | 压栈打开新页 | 最多 **10 层** |
| `wx.redirectTo` | 替换当前页 | 不增加层数 |
| `wx.reLaunch` | 清空栈，打开新页 | 重置 |
| `wx.switchTab` | 切 tabBar 页 | 各 tab 栈独立 |
| `wx.navigateBack` | 出栈 | `delta` 可一次退多层 |

```javascript
wx.navigateTo({ url: '/pages/detail/index?id=42&from=list' });

// 带复杂对象：用全局/store，或 encodeURIComponent(JSON.stringify(obj))
// 不推荐 query 过长——有长度限制
```

**设计建议**

* 列表 → 详情 → 编辑：用 `navigateTo`；编辑完成 **返回列表要刷新** 时，在列表 `onShow` 读标志位或 emit 事件。
* 登录成功进首页：用 `reLaunch` 或 `switchTab`，避免用户 **手势返回** 回到登录页。

***

### 四、场景值 scene 与启动参数

`onLaunch` / `onShow` 的 `options.scene` 表示 **进入方式**（扫码、分享、搜索等）。分享卡片、二维码可在 **后台配置 path + query**。

```javascript
onLoad(options) {
  const { id, channel } = options;
  if (!id) {
    wx.showToast({ title: '参数缺失', icon: 'none' });
    return;
  }
  this.loadDetail(id, channel);
},
```

**测试清单**

* 冷启动带参 / 热启动带参；
* 分享进二级页（非首页）；
* 从另一小程序 `navigateToMiniProgram` 返回；
* Android / iOS 各测一遍（部分 API 行为差异）。

***

### 五、与 uni-app / Taro 的对应关系

| 原生 | uni-app | 说明 |
|------|---------|------|
| `onLoad` | `onLoad` | 一致 |
| `navigateTo` | `uni.navigateTo` | 注意 `url` 不要带多余 `/` |
| 全局数据 | `pinia` / `vuex` | 跨页状态优先 store，少滥用 `globalData` |

编译到多端时，**路由栈上限、tabBar 规则** 以 **微信约束** 为底线做设计。

***

### 六、常见坑小结

1. **只在 onLoad 请求数据** → 返回不刷新；改 `onShow` 或事件通知。
2. **App.onShow 与 Page.onLoad 参数混用** → 统一在 Page 解析。
3. **栈满仍 navigateTo** → 改 `redirectTo` 或 `reLaunch`。
4. **query 传大 JSON** → 改 id + 服务端拉详情。
5. **tab 页用 navigateTo 打开** → 必须 `switchTab`，且 tab 页 path 不能带参数（需全局存）。

***

### 七、延伸阅读

* [《小程序网络请求、缓存与订阅消息》](/2026/05/25/miniprogram-network-storage-subscription/)——登录态与接口层
* [《小程序性能优化与审核踩坑》](/2026/05/26/miniprogram-performance-audit-practice/)——包体积与 setData
* 旧笔记[《微信卡包跳转小程序》](/2020/09/14/weixin/)——外链参数缓存问题
