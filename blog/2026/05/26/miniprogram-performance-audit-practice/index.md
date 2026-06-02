---
url: /blog/2026/05/26/miniprogram-performance-audit-practice/index.md
---
小程序 **包体积、首屏、setData 频率** 直接影响留存；审核则是 **另一套规则**。本篇把性能工具链和 **提审常见拒因** 合成一份 checklist，方便上线前过一遍。

***

### 一、包体积与分包

**主包限制**（以微信当前规则为准，上线前再对一下官方文档）：

* 主包 + 分包总体有上限；单分包也有上限；
* **tabBar 页必须在主包**。

**策略**

```json
// app.json  excerpt
{
  "pages": ["pages/index/index", "pages/user/index"],
  "subPackages": [
    {
      "root": "packageOrder",
      "pages": ["list/index", "detail/index"]
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "wifi",
      "packages": ["packageOrder"]
    }
  }
}
```

* 按 **业务域** 拆分包，低频模块进分包；
* 图片走 **CDN**，大图不要打进包；
* 独立功能考虑 **插件** 或 **云开发** 减包。

***

### 二、setData：最贵的操作

`setData` 会触发 **逻辑层 → 渲染层** 通讯；频繁、大数据 setData 是卡顿首因。

**Do**

```javascript
// 只改用到的字段
this.setData({ 'list[2].title': '新标题' });

// 合并多次更新
const patch = {};
items.forEach((item, i) => { patch[`list[${i}].count`] = item.count; });
this.setData(patch);
```

**Don't**

* 一次 setData 塞 **整棵大树**；
* 在 `onPageScroll` 里高频 setData；
* 把 **未绑定 WXML 的字段** 放进 data（增大 diff）。

使用开发者工具 **性能面板 → SetData 统计** 找热点页。

***

### 三、首屏与渲染

| 手段 | 说明 |
|------|------|
| 骨架屏 | 首屏占位，数据到了再替换 |
| 分批渲染 | 长列表先渲染 20 条，其余 `requestIdleCallback` 或分页 |
| 自定义组件 `virtual-list` | 超长列表必看 |
| 避免同步 API 阻塞 | 大 JSON `parse` 放 worker（基础库支持时） |

**wx:if vs hidden**：频繁切换用 `hidden`；条件很少再渲染用 `wx:if` 减节点。

***

### 四、网络与图片

* 接口 **并行** 注意上限，关键路径 **串行最少化**；
* 列表图 **webp/合适尺寸**，`lazy-load="{{true}}"`；
* 开启 **HTTP2**、合理 `Cache-Control`（静态资源）。

***

### 五、体验评分与监控

* 小程序后台 **性能质量**、**体验分** 定期看；
* 自建：**慢启动上报**（`onLaunch` 到首屏可交互）、**JS 错误**（`onError` + 源映射）；
* 关键路径加 **埋点**：登录成功率、支付转化率。

***

### 六、审核踩坑（高频拒因）

| 类别 | 典型问题 | 处理 |
|------|----------|------|
| 类目与资质 | 医疗/金融/直播等缺证照 | 先改类目或补资质 |
| 隐私 | 未弹隐私协议、过度收集 | 接 **隐私保护指引**、最小化 API |
| 诱导分享 | 「分享得红包」无实质服务 | 改文案与流程 |
| 测试账号 | 审核员无法登录 | 提供 **清晰测试号 + 步骤** |
| 内容 UGC | 无举报、无过滤 | 加审核机制说明 |
| 虚拟支付 | iOS 虚拟商品走 IAP 规则 | 按平台规则拆支付 |
| 域名 | 请求未配置合法域名 | 后台配置 + 生产关闭跳过校验 |

**提审材料**：短录屏（核心路径 30s）+ 文字说明，比长篇小作文更有效。

***

### 七、与 uni-app 的差异提醒

* 条件编译 `#ifdef MP-WEIXIN` 隔离微信特有 API；
* 编译产物体积 **大于手写原生** 时，检查 **按需引入** 与 **tree-shaking**；
* iOS 真机与开发者工具 **渲染差异** 务必真机测（旧文轮播 SSL 案例）。

***

### 八、上线前 10 条自检

1. 主包体积 OK，分包合理
2. 首屏无 500、无白屏
3. 弱网 / 断网有提示
4. 401 能回登录
5. setData 热点已优化
6. 隐私协议与后台声明一致
7. 合法域名齐全
8. iOS + Android 各走一遍支付/分享
9. 测试账号可用
10. 无 console 敏感日志

***

### 九、小结

小程序性能 **80% 在 setData 与包体积**；审核 **80% 在资质、隐私、可测性**。把工具链和 checklist 固化到发版流程里，比临上线前突击有效得多。

延伸阅读：[《小程序深入：生命周期、路由与页面栈》](/2026/05/24/miniprogram-lifecycle-routing-navigation/)、[《小程序深入：网络请求、登录态与本地缓存》](/2026/05/25/miniprogram-network-storage-subscription/)。
