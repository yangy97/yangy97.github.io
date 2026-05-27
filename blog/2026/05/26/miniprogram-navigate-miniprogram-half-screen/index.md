---
url: /blog/2026/05/26/miniprogram-navigate-miniprogram-half-screen/index.md
---
业务常要 **从 A 小程序打开 B**（支付、联名活动、服务商能力），或使用 **半屏小程序** 降低跳出感。本篇讲 **跳转配置、参数传递、返回栈与审核**。

***

### 一、跳转方式

| API | 场景 |
|-----|------|
| `wx.navigateToMiniProgram` | 打开其他小程序 |
| `wx.openEmbeddedMiniProgram` | **半屏**嵌入（基础库与类目有限制） |
| 返回 | `wx.navigateBackMiniProgram`（B 调起方返回 A） |

***

### 二、navigateToMiniProgram

```javascript
wx.navigateToMiniProgram({
  appId: 'wxXXXXXXXX',
  path: 'pages/order/index?id=123',
  extraData: { from: 'campaign' },
  envVersion: 'release', // develop / trial / release
  success() {},
  fail(err) {
    // 用户取消、未关联、未发布等
  },
});
```

**关联**：公众平台 **设置 → 跳转小程序** 互相绑定（或开放规则允许）。

***

### 三、参数与 extraData

* `path` 带 query → 目标页 `onLoad(options)`
* `extraData` → 目标 `App.onLaunch/onShow` 的 `referrerInfo.extraData`

与 [生命周期文](/2026/05/24/miniprogram-lifecycle-routing-navigation/) 一致：**页面 onLoad 解析最稳**。

***

### 四、半屏小程序

```javascript
wx.openEmbeddedMiniProgram({
  appId: 'wxYYYYYYYY',
  path: 'pages/pay/index',
  extraData: { orderId: '42' },
});
```

**注意**

* 能力随基础库更新，需 **真机测**
* UI 上仍是独立小程序上下文，**登录态不自动共享**
* 支付等仍走 **目标小程序商户号**

***

### 五、安全

* 只跳 **白名单 appId**（服务端下发配置）
* 不要把 **密钥** 放 extraData
* 回调业务结果用 **服务端对账**，不要只信前端 success

***

### 六、审核

* 跳转需 **用户明确触发**（点击按钮）
* 说明 **为何需要跳第三方**
* 半屏场景提供 **录屏**

***

### 七、小结

跨小程序 = **绑定关系 + path/extraData + 返回约定 + 服务端验单**。支付见 [支付深入](/2026/05/17/miniprogram-payment-flow-and-reconciliation/)。
