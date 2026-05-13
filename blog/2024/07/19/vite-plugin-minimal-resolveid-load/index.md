---
url: /blog/2024/07/19/vite-plugin-minimal-resolveid-load/index.md
---
Vite 插件 ==兼容 Rollup 插件钩子==，并扩展 **`configureServer`** 等 **仅开发期** 钩子。理解 **`resolveId` → `load` → `transform`** 三段，就能 **虚拟模块**、**替换环境常量**、**注入 HMR**。本篇给 **可复制的最小插件骨架**。

***

### 一、插件本质

```ts
import type { Plugin } from 'vite';

export function myPlugin(): Plugin {
  const virtualId = '\0virtual:hello';

  return {
    name: 'my-plugin',

    resolveId(id) {
      if (id === 'virtual:hello') return virtualId;
      return null;
    },

    load(id) {
      if (id === virtualId) {
        return `export const msg = "from virtual module";`;
      }
      return null;
    },
  };
}
```

\==`\0` 前缀==：约定 **虚拟模块** ID，避免与真实路径冲突。

***

### 二、`transform`：改源码

```ts
transform(code, id) {
  if (!id.endsWith('.vue') && !id.includes('node_modules')) {
    // 示例：给每个 JS 文件加注释（仅演示）
    return { code: `/* my */\n` + code, map: null };
  }
},
```

生产环境慎用 **大范围字符串替换**，优先 **AST**（unplugin、babel）以免 **破坏 source map**。

***

### 三、`configureServer`：只跑在 dev

```ts
configureServer(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url === '/__ping') {
      res.end('pong');
      return;
    }
    next();
  });
},
```

用于 **mock API**、**本地探活**；**不要** 把密钥写进插件。

***

### 四、与 `apply: 'build' | 'serve'` 过滤

```ts
export default defineConfig({
  plugins: [
    myPlugin(),
    { ...heavyPlugin(), apply: 'build' },
  ],
});
```

**减少开发期负担**。

***

### 五、小结

写插件前问：**改路径？改文件内容？只 dev？** 对应 **resolveId / load / transform / configureServer**。复杂需求优先搜 **unplugin** 生态是否已有轮子。
