---
url: /blog/2026/05/17/miniprogram-custom-component-skyline-package/index.md
---
组件化能降 **setData 面、提复用**，但小程序的 **组件树、样式隔离、分包引用** 和 Web 不同。本篇讲 **自定义组件设计、分包异步组件、Skyline 渲染** 的适用边界与写法。

***

### 一、自定义组件基础

```javascript
// components/order-card/index.js
Component({
  properties: {
    order: { type: Object, value: {} },
  },
  data: {
    expanded: false,
  },
  methods: {
    toggle() {
      this.setData({ expanded: !this.data.expanded });
    },
  },
});
```

```xml
<!-- index.wxml -->
<view class="card" bindtap="toggle">
  <text>{{order.title}}</text>
  <view wx:if="{{expanded}}">{{order.detail}}</view>
</view>
```

**样式隔离**：默认 `isolated`；需要穿透用 `externalClasses` 或 `::v-deep` 类写法（视基础库文档）。

***

### 二、组件通信

| 方式 | 场景 |
|------|------|
| `properties` | 父 → 子 |
| `triggerEvent` | 子 → 父 |
| `relations` | 复杂父子（如 form + field） |
| 全局 store / mobx-miniprogram | 跨多层 |

```javascript
this.triggerEvent('change', { id: this.data.order.id });
```

避免滥用 `getApp().globalData` 传大对象。

***

### 三、分包异步化（按需注入组件）

大组件放分包，主包 **用时再下载**：

```json
{
  "usingComponents": {
    "heavy-chart": "/packageCharts/chart/index"
  },
  "componentPlaceholder": {
    "heavy-chart": "view"
  }
}
```

`componentPlaceholder` 在组件未加载前显示占位，避免白块。

***

### 四、Skyline 渲染引擎

Skyline 是微信新一代渲染方案，**更贴近原生性能**，但：

* 需在 `app.json` 或页面 json 开启 `"renderer": "skyline"`
* 部分 CSS（如某些 float 老写法）不支持
* 与 **glass-easel** 组件框架配合

**适用**：动画多、列表复杂的新页面；**不适用**：老页面一次性全量迁移。

```json
{
  "navigationStyle": "custom",
  "renderer": "skyline",
  "componentFramework": "glass-easel"
}
```

迁移前用官方 **兼容检测** 扫一遍 WXML/WXSS。

***

### 五、性能建议

1. 组件 `data` 只放 **模板绑定字段**
2. 纯展示组件设 `"virtualHost": true`（基础库支持时）减少节点
3. 列表项组件避免在 `observers` 里频繁 setData
4. 与[《小程序性能优化与审核踩坑》](/2026/05/26/miniprogram-performance-audit-practice/)中的 setData 策略一起用

***

### 六、小结

**自定义组件** 管复用与隔离；**分包异步化** 管主包体积；**Skyline** 管渲染性能上限。三者按页面阶段选用，不要 Skyline 全开增加维护成本。
