---
url: /blog/2026/05/24/react-vite-project-structure-basics/index.md
---
本站主栈是 **Vue**，但微前端、招聘、协作常遇到 React 项目。本篇用 Vue 读者 familiar 的类比，给 **React（UI 库）+ Vite（ESM  dev 构建工具）** 目录约定——对标[《Vue + Vite 项目结构》](/2022/05/09/vue-vite-project-structure/)。

***

### 一、推荐目录

```text
src/
  app/              # 路由、Provider 组合
  pages/            # 路由页（对标 views）
  components/       # 展示组件
  features/         # 按业务域（order/user）
  hooks/            # 对标 composables
  api/              # 请求封装
  stores/           # Zustand/Jotai（若需要）
  utils/
  types/
  main.tsx
  App.tsx
```

***

### 二、创建项目

```bash
pnpm create vite my-app --template react-ts
cd my-app && pnpm install
```

***

### 三、状态与路由

| Vue | React 常见 |
|-----|------------|
| Pinia | Zustand / Jotai |
| Vue Router | React Router 6+ |
| composable | custom hook |

***

### 四、与微前端

React 子应用 **Module Federation / qiankun** 导出 bootstrap 生命周期；见微前端系列 **React 子应用** 章节。

***

### 五、何时深入 React

* 主职栈转 React → 继续读 [Hooks 与状态管理：从 useState 到 Zustand](/2026/06/01/react-hooks-state-management-patterns/)
* 仅维护子应用 → 本篇 + Hooks 文 + 官方文档通常足够

***

### 六、小结

React 项目 = **features 分层 + hooks + api 层**，原则与 Vue 工程化相同。构建链仍看 Vite/Webpack 工程化目录。
