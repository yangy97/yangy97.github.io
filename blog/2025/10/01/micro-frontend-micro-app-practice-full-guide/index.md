---
url: /blog/2025/10/01/micro-frontend-micro-app-practice-full-guide/index.md
---
[micro-app](https://micro-zoe.github.io/micro-app/) 用 ==Web Components== 将子应用包在自定义标签里，主应用侧 **声明式** 强，对习惯 **在模板里放一块区域** 的团队友好。配置项与生命周期以 [官方文档](https://micro-zoe.github.io/micro-app/) 为准。本篇写 **主应用启动、属性、子应用、通信、与路由** 的常规落地顺序。

**子应用**新建请 **以 Vite 起 SPA** 为主；**Webpack** 老项目不单独开章节，只要 **`url` 能拉到 `index.html` 与 chunk** 即可。

***

### 一、总览

* \==主应用==：引入 **`micro-app` 的 JS** 后，在 **任意框架** 里写 `<micro-app />` 标签。
* **子应用**：仍是 **标准 SPA**（Vue/React/等），**独立构建、独立部署**；`url` 指向其 **`index.html` 可访问的地址**或 dev server 根。
* **名空间**：`name` 在 **同页** 中保持唯一，用于 **沙箱、缓存与实例区分**（具体行为见文档版本说明）。

***

### 二、主应用：安装与一次注册

**1）安装**

```bash
npm i @micro-zoe/micro-app
```

**2）入口注册（**必须** 在应用最早期执行）**

```ts
// main.ts
import microApp from '@micro-zoe/micro-app';

microApp.start();
```

未执行 **`start()`** 时，自定义元素可能 **不生效** 或子应用不加载。若用 **按需加载** 的框架，需保证 **首屏渲染前** 已 `start()`。

***

### 三、在模板中挂载子应用

**Vue 3 示例**（属性以最新文档为准）：

```vue
<template>
  <micro-app
    name="order"
    :url="orderUrl"
    baseroute="/order"
    :data="microData"
  ></micro-app>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import microApp from '@micro-zoe/micro-app';

const orderUrl = ref('http://localhost:8081/');
const microData = reactive({ token: 'xxx' });

onMounted(() => {
  // 监听子应用事件（API 以文档 data 事件 / addDataListener 为准）
  microApp.addDataListener('order', (data: unknown) => {
    console.log('from child', data);
  });
});
</script>
```

* **`name`**：与子应用 **实例绑定**，通信、监听器上都会用到。
* **`url`**：子应用 **入口页** 地址。
* **`baseroute`**：子应用 **子路由 base**，需与子应用 router **basename** 一致。
* **`data`**：主 → 子 **下发数据**；子 → 主 常用 **`dispatch` / 自定义事件**（见文档 **数据通信** 章节）。

**React** 中同理，用 **`className` / `ref`** 时注意 **不是** 把子应用当 iframe，而是 **自定义元素**，**属性名全小写** 在部分 React 版本需写成 **`baseroute` 的兼容写法**（若遇到警告，用文档推荐的 **`data-` 或 camelCase 映射**）。

***

### 四、子应用：路由与 publicPath

1. 若子应用是 **history** 模式，**`baseroute` 与 `createWebHistory` / `BrowserRouter` 的 basename** 对齐。
2. **`VUE_APP_` / Vite `base`** 与部署在 **`/order/`** 时，**静态资源** 能正确加载。
3. 子应用 **可单独打开** 同一 URL 做调试（部分场景需在 **子应用** 里识别「非嵌入模式」时 **补 default basename**，视团队规范而定）。

***

### 五、子应用与 micro-app 的「嵌入检测」

文档中通常会说明 **子应用内如何判断运行在 micro-app 中**（如 **全局变量/注入 data**），用于：

* 不重复 **请求用户信息**；
* **隐藏** 子应用里与主应用 **重复的顶栏/侧栏**。

实现方式随版本迭代，**以官方「子应用」章节为准**。

***

### 六、与 Vite 子应用

micro-app 持续迭代 **Vite 支持**；若遇到 **动态 import、chunk 路径** 问题：

* 看文档 **Vite 章节** 的 **`inline`、插件** 或 **关闭 sandBox 的某个选项**（若官方提供）；
* 先用 **生产 build** 的静态结果联调，再开 **HMR**。

***

### 七、沙箱、样式与 UI 库

* **沙箱** 能减轻 **子应用对 window 的污染**，但不是 **100% 替代码质量兜底**。
* **Element Plus / Ant Design** 等 **弹层挂 body** 时，**样式隔离** 需对照文档中 **`disableScopecss` 等** 开关做取舍。
* **暗色主题、CSS 变量** 建议主应用先定 **:root 变量名契约**，子应用只 **消费**。

***

### 八、部署

| 项 | 说明 |
|----|------|
| 主应用 | 无特殊要求，保证 **`microApp.start()`** 打进主包 |
| 子应用 | `url` 指向可访问的 **https** 地址；path 与 **baseroute** 一致 |
| 跨域 | 子应用 `index.html` 与 `chunk` 的 **CORS/ MIME** 正确 |

***

### 九、常见问题与处理

| 问题 | 原因 | 处理 |
|------|------|------|
| **`microApp.start()` 已写，子应用不加载** | **单页应用** 在 **`start` 之后** 才首屏、或 **标签未进 DOM** 就设 `url` | 保证 **入口最早期** `start`；`name/url` 在 **`onMounted` 后** 再绑稳定数据；看控制台 **是否报自定义元素** 未定义 |
| **`name` 换了但跑了旧子应用** | **缓存/实例** 以 `name` 为 key，**残留** 未销毁 | 换 **业务子应用** 时换 **`name` 或先 `unmount` 原实例**（以文档 unmount 为准） |
| **子应用路由跳主站 404** | **baseroute** 与 **子应用 router base** 不一致 | 三处同源：**`baseroute`、Vite `base`、createWebHistory(basename)** |
| **沙箱下第三方库报「找不到 document/window」** | 部分库在 **微前端沙箱** 里用 **硬编码** 取全局 | 见文档 **是否关闭某沙箱项** 或换库版本；最底线 **degrade/iframe 模式**（若文档有） |
| **样式被裁切或弹层在壳外** | **Shadow 样式作用域** 与 **弹层 portaled to body** 冲突 | 调 **`disable-sandbox` / 样式隔离** 相关开关（以官方为准）；**UI 库** 用文档推荐的 **getPopupContainer** 指回子应用根 |
| **`addDataListener` 收不到** | **name** 对不上 或 子应用 **未 `dispatch`** | 主应用 `name` 与标签一致；子应用用 **`window.microApp?.dispatch` 等** 官方 API 发数据（见数据通信章） |

***

### 十、小结

micro-app 落地 **= 先 `start()`、再 `name/url/baseroute` 三要素一致、数据通道按文档用 `data`/事件**。**标签化** 对 **主应用改动小**；复杂通信仍建议 **BFF 收口业务状态**。
