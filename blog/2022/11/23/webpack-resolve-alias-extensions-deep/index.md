---
url: /blog/2022/11/23/webpack-resolve-alias-extensions-deep/index.md
---
\==resolve== 决定 `import './foo'` 最终落到哪个文件；配错会出现 **打包进两份 React**、**tree-shaking 失效**、**条件导出走错入口**。本篇按 **实战顺序** 写 `alias`、`extensions`、`mainFields`、`conditionNames` 与 **package exports**。

***

### 一、extensions：省略后缀时的查找顺序

```js
resolve: {
  extensions: ['.tsx', '.ts', '.js'],
}
```

\==越靠前越优先==。团队规范应 **统一**（全用 `.ts` 或全显式后缀），避免 `foo.js` 与 `foo.ts` 同时存在时 **静默选错**。

***

### 二、alias：缩短路径与换实现

```js
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    // 调试时可临时指向 fork
    // react: path.resolve(__dirname, 'vendor/react'),
  },
}
```

**注意**：`alias` 是 **字符串前缀匹配**，过宽的 key（如把 `'$'` 指错）会 **误伤**。更稳的是配合 **tsconfig paths** 与 **一致**。

***

### 三、mainFields：同包多入口时选谁

`package.json` 里常有 **`module`、`main`、`browser`**。Webpack 默认顺序大致为 **`['browser', 'module', 'main']`**（以版本文档为准）。

* **要更利于 tree-shaking**：往往希望走到 **ESM 入口**（`module`）。
* **若打给浏览器且某包 `browser` 字段替换了入口**，可能 **换掉 Node 专用实现**。

***

### 四、条件导出（exports）与现代 npm 包

许多包已使用 **`"exports"`** 白名单导出。Webpack 5 会尊重 **Node 解析规则**；若 **子路径 deep import** 被拒绝，应 **改从公开入口** 引入，而不是关 `fullySpecified` 乱绕（除非你知道代价）。

***

### 五、symlink 与 monorepo

```js
resolve: {
  symlinks: false, // 部分 pnpm/npm link 场景减少重复实体
}
```

**pnpm** 默认用 symlink；若 **同包多实例**，优先检查 **resolve 与 dedupe**，而不是先关 `symlinks`。

***

### 六、收束

resolve 题 = **「最终解析到哪个物理文件」**。出现 **两份 React**、**样式丢了**，先 **`npm ls`** 再 **`webpack --stats`** 看 **resolved 路径**。
