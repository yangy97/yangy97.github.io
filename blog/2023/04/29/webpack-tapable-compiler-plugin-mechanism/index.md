---
url: /blog/2023/04/29/webpack-tapable-compiler-plugin-mechanism/index.md
---
Webpack 的扩展点本质是 ==事件驱动==：`Compiler` / `Compilation` 上挂了大量 **Hook**，插件往里 **tap** 回调。理解 **Tapable** 的类型（sync、async、bail、waterfall）和 **典型钩子顺序**，才能 **不抄模板地写插件、也能读懂官方插件源码**。下面从 **模型、钩子流、最小插件示例、调试** 展开。

***

### 一、Compiler vs Compilation

| 对象 | 生命周期 | 典型用途 |
|------|----------|----------|
| ==Compiler== | 一次 `webpack()` 调用，**多轮 watch 仍复用** | 读配置、注册插件、整体起止 |
| **Compilation** | 每次 **新的编译**（一次构建或一次增量） | 模块图、chunk、优化、生成资源 |

**直觉**：`Compiler` 像 **工厂**；`Compilation` 像 **某批次工单**。

***

### 二、Tapable：Hook 类型决定「怎么调」

| 类型 | 语义 | 常见场景 |
|------|------|----------|
| **SyncHook** | 依次执行，无返回值 | 通知 |
| **SyncBailHook** | 有一个返回 **非 undefined** 则中断 | 第一个返回真即命中 |
| **AsyncSeriesHook** | 异步 **串行** | 顺序敏感 |
| **AsyncParallelHook** | 异步 **并行** | 性能 |

插件里常见：

```js
compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
  // 生成阶段：资源已就绪，可改 assets
  callback();
});
```

**读源码技巧**：搜 `new SyncHook` / `tapAsync` 看 **谁在什么时机** 触发。

***

### 三、从入口到输出：简化钩子顺序（Webpack 5）

**概念顺序**（不同模式略有差异）：

1. `environment` → `afterPlugins` → `afterResolvers`
2. `beforeRun` → `run`
3. `compile` → `thisCompilation` → `compilation`
4. 在 `compilation` 上：`buildModule` → `succeedModule` → `finishModules` → `seal` → `optimize` 系列
5. `emit`：**写出文件前** 最后改 `compilation.assets`
6. `afterEmit` → `done`

**常用落点**

* **改模块源码**：`normalModuleFactory` / loader（更常见）或 `compilation.hooks.processAssets`（Webpack 5 Asset Modules）。
* **统计信息**：`done` 里读 `stats`。
* **注入 HTML**：`HtmlWebpackPlugin` 的 hook 或 `compilation.hooks.processAssets`。

***

### 四、示例：在 emit 阶段给每个 chunk 打「构建时间」注释（示意）

```js
class BuildMetaPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('BuildMetaPlugin', (compilation, cb) => {
      const t = new Date().toISOString();
      for (const name of Object.keys(compilation.assets)) {
        if (!name.endsWith('.js')) continue;
        const src = compilation.assets[name].source();
        compilation.updateAsset(
          name,
          new compiler.webpack.sources.RawSource(`/* build: ${t} */\n${src}`)
        );
      }
      cb();
    });
  }
}
module.exports = BuildMetaPlugin;
```

（`RawSource` 具体 import 以 Webpack 5 API 为准，可用 `webpack-sources` 包。）

***

### 五、调试插件

1. **`--inspect-brk` 起 node**，在插件 `tap` 回调里下断点。
2. **减少范围**：最小 `entry` + 单插件，避免噪音。
3. 看 **`compilation.moduleGraph`**（Webpack 5）理解 **依赖边**。

***

### 六、小结

Webpack 插件 = **找对 Hook + 理解 Tapable 语义 + 分清 Compiler/Compilation**。日常业务 **优先配置 + loader**；只有 **流程级** 需求再上插件。
