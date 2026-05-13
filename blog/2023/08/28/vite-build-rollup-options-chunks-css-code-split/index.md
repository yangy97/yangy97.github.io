---
url: /blog/2023/08/28/vite-build-rollup-options-chunks-css-code-split/index.md
---
生产构建走 ==Rollup==；Vite 把高级选项透传到 **`build.rollupOptions`**。**拆 chunk** 用 **`output.manualChunks`**；**CSS** 默认可 **按异步 chunk 拆分**。本篇给 **常用片段** 与 **避免拆坏的注意点**。

***

### 一、基础开关

```ts
export default defineConfig({
  build: {
    target: 'es2018',
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vue-vendor';
            return 'vendor';
          }
        },
      },
    },
  },
});
```

\==manualChunks== 过粗或过细都会影响 **缓存与并行**；改完 **用 analyzer 看分布**。

***

### 二、与动态 import 的关系

**路由懒加载** 天然产生 **async chunk**；`manualChunks` 再 **合并 vendor**，减少 **重复依赖**。若 **同一库** 被打进 **多个 vendor**，检查 **是否多版本** 或 **条件导出** 导致 **两条解析路径**。

***

### 三、CSS Code Splitting

默认 **`build.cssCodeSplit: true`**：异步路由带的 CSS **随 chunk 走**。若必须 **单文件 CSS**（老环境或特殊缓存策略），可 **`cssCodeSplit: false`**（体积与缓存权衡自己承担）。

***

### 四、`external` 与库模式

打包 **组件库** 时 often **`external: ['vue']`**，避免 **把 Vue 打进去**。应用项目 **不要轻易 external 业务依赖**，除非你知道 **运行时如何保证全局存在**。

***

### 五、小结

Rollup 题：**先 waterfall 与体积** → **再 manualChunks** → **最后看 CSS 拆分是否符合部署**。与《optimizeDeps》区分：**那是 dev 预构建**，这是 **prod 输出**。
