---
url: /blog/2025/09/05/micro-frontend-wujie-practice-full-guide/index.md
---
[wujie](https://wujie-micro.github.io/doc/) 通过 ==Web Components 容器== 与 **代理能力**，让子应用运行在 **接近 iframe 的隔离环境** 中，在 **样式与 JS 隔离** 上往往比纯 JS 沙箱更省心。本篇按 **主应用 + 子应用 + 通信** 写可操作步骤。API 以 [官方文档](https://wujie-micro.github.io/doc/) 当前版本为准。

***

### 一、选型判断（何时优先 wujie）

* \==强隔离诉求==：子应用 **第三方库乱挂 window**、老项目 **难改构建**。
* **希望减少「改生命周期」的摩擦**：wujie 可支持 **子应用以较低改造成本接入**（具体能力看文档中 **无界启动 UMD/降级** 等说明）。
* **注意点**：**弹层挂 body**、**微前端全屏**、**子应用与主应用 DOM 互操作** 要按文档做 **激活/保活/降级** 相关配置，避免「点了无反应」。

***

### 二、主应用：Vue3 + wujie-vue3

**1）安装**

```bash
npm i wujie-vue3 wujie
```

在 **`main.ts`** 中 **use 插件**（具体名称以 `wujie-vue3` 导出的 `install` 为准，常见写法如下）：

```ts
import { createApp } from 'vue';
import App from './App.vue';
import WujieVue from 'wujie-vue3';
import { bus, setupApp, preloadApp } from 'wujie';

const app = createApp(App);
app.use(WujieVue);
app.mount('#app');
```

**2）页面中使用组件**（属性名以文档为准，以下为常见集）：

```vue
<template>
  <WujieVue
    width="100%"
    height="100%"
    name="order"
    :url="orderUrl"
    :sync="true"
    :props="childProps"
    :afterMount="onChildMount"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const orderUrl = ref('//localhost:8081/');
const childProps = { token: 'from-main' };

function onChildMount() {
  console.log('子应用已挂载');
}
</script>
```

* **`name`**：子应用唯一名，**预加载/保活/缓存** 会用到。
* **`url`**：子应用 **入口地址**（开发可用 `//localhost:8081/`，与 qiankun 一样 **协议可省略**）。
* **`sync`**：**路由同步** 相关，是否开启以业务为准（多 tab、浏览器前进后退行为需联调验证）。
* **`props`**：会注入子应用（子应用内通过 wujie 提供的方法读取，见下节文档）。

**3）预加载**（可提前缓存子应用，减少首进白屏时间）：

```ts
import { preloadApp } from 'wujie';

preloadApp({ name: 'order', url: '//localhost:8081/' });
```

在 **登录后、或菜单 hover** 时调用，注意 **别在低端机上无差别全量预加载**。

***

### 三、子应用：改造要点

1. **路由 base**：子应用使用 **history** 时 **basename** 与主应用为子应用分配的 **path** 一致，例如主应用是 `/order/*`，子应用 `createWebHistory('/order')`。
2. **资源路径**：`publicPath` / Vite `base` 要能在 **独立访问** 与 **嵌入 wujie** 两种方式下都加载到 `chunk`（以你部署目录为准做一条绝对或相对根路径方案）。
3. **独立运行**：保留 **`main.ts` 里直接 `mount`** 的入口，便于子团队单独开发；wujie 会注入运行环境，具体变量名以文档 **「子应用接入手册」** 为准（如 `__POWERED_BY_WUJIE__` 等若文档提供）。

***

### 四、主应用与子应用：bus 通信

**`wujie` 导出的 `bus` 是跨应用消息总线**，适合 **菜单切换、主题切换、低频次事件**。

主应用 **发送**：

```ts
import { bus } from 'wujie';

bus.$emit('change-theme', { mode: 'dark' });
```

子应用 **订阅**（在子应用内入口或根组件，注意 **重复订阅** 时要在 **卸载** 时 `$off`）：

```ts
import { bus } from 'wujie';

const handler = (data: { mode: string }) => { /* update theme */ };
bus.$on('change-theme', handler);
// 卸载时
// bus.$off('change-theme', handler);
```

**原则**：**能 REST 就不用 bus 传大对象**；**token** 可短量放在 **props**，长期会话优先 **HttpOnly Cookie + 同站 BFF**。

***

### 五、degrade 与保活

官方文档中常见能力包括：

* **保活（alive）**：子应用 **不销毁**，仅隐藏，适合 **频繁切 tab** 的列表页；注意 **内存占用**。
* **降级（degrade）**：在 **不兼容** 或 **问题页面** 退回到 **iframe 模式** 等（以文档 `degrade` 说明为准）。

接入时应在 **UAT 环境** 对 **全屏、打印、全屏 video、富文本弹层** 做专项回归。

***

### 六、与 qiankun 对照（同团队选型）

| 维度 | wujie 倾向 | qiankun 倾向 |
|------|------------|--------------|
| 隔离强度 | 更高（iframe/代理思路） | 依赖沙箱，边界需治理 |
| 生态/案例 | 增长中 | 国内资料更多 |
| 子应用打包 | **Vite 优先**（`base`、子路由、静态资源根路径） | 同左：**`vite-plugin-qiankun` + qiankun 生命周期** 是常见组合，与 wujie 文档中子工程说明对齐即可 |\
| Webpack 老项目 | 仅一句：按无界/各框架 UMD 要求改入口，**不展开** | 同左 |

***

### 七、联调与部署

* **联调**：主应用、子应用 **两个 dev server** 同时起，浏览器 **主应用域** 打开，看 **Network** 子应用 `js/css` 是否 200。
* **部署**：**子应用独立 CDN/静态桶** 即可；主应用配置 **子应用 `url` 的线上地址**。若 **HTTPS 主应用** 下嵌入 **http 子应用** 会 **混合内容** 被拦，**统一 HTTPS**。
* **回滚**：子应用 **发版** 不依赖主应用发版，只要 **url 不变** 或主应用有 **蓝绿/版本表** 即可。

***

### 八、常见问题与处理

| 问题 | 原因 | 处理 |
|------|------|------|
| **主应用里子应用区域空白，无报错** | `url` 错、**混合内容**（https 里嵌 **http**）、**CSP** 拦 iframe 类能力 | 打开 **子应用 `url` 新标签** 能否访问；**全站 https**；按文档开 **CSP 白名单** |
| **弹层/下拉挂到主窗口「看不见」或点不动** | 子应用 **Portal 挂 body** 与 wujie **沙箱/iframe 层** 叠加 | 查官方 **弹层/激活** 配置；必要时 **degrade** 或 **getMountNode** 类 API（以版本文档为准） |
| **切 tab 后子应用状态丢** | 未开 **保活** 时 **卸载了实例**；或保活后 **仍重复 mount** | 需要保 **列表/表单** 的 tab 时开 **保活**；注意 **内存** 与 **bus 只订阅一次** |
| **bus 事件触发多次** | 子应用 **未 unmount 时反复 `$on`**, 无 **`$off`** | 在子应用 **根组件 onUnmount** 里 **`$off`** 对应事件；路由级子应用要 **成对注册/释放** |
| **路由与主站不同步、后退异常** | **`sync`、basename** 与 **主站 router** 未对齐 | 对照文档开 **`sync`/`props`**，主应用与 **子 app 的 path 规则** 写进 RFC |
| **预加载后首屏更慢** | **无差别 preload 全部子应用** | 只 **预加载下一屏/高频菜单**；弱网下 **可关预加载** 用 Performance 数据说话 |

***

### 九、小结

wujie 落地 **= 主应用用组件/插件挂子应用 + 子应用路由与资源根路径正确 + bus 有订阅释放**。**弹层/全屏** 类用例务必做 **真机+多浏览器** 的 POC，再扩页面。
