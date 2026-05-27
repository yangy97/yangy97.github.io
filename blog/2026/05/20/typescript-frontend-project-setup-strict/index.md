---
url: /blog/2026/05/20/typescript-frontend-project-setup-strict/index.md
---
TypeScript 的价值在 **编译期拦住接口漂移**，不是堆 `any`。本篇给 Vue + Vite 中后台项目的 **tsconfig 分层、strict 取舍、paths 与 CI typecheck**。

***

### 一、推荐 tsconfig 分层

```text
tsconfig.json          # references 入口
tsconfig.app.json      # 前端 src
tsconfig.node.json     # vite.config.ts
tsconfig.vitest.json   # 测试（可选）
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

***

### 二、strict 子项怎么选

| 选项 | 建议 |
|------|------|
| `strict` | 新项目全开 |
| `noUncheckedIndexedAccess` | 开，数组/Record 访问更安全 |
| `exactOptionalPropertyTypes` | 大项目可暂缓 |
| `skipLibCheck` | `true` 加速 CI |

老项目迁移：`strict` 分模块开，**新目录先 strict**。

***

### 三、与 Vite 对齐

`vite.config.ts` alias 与 `paths` **必须一致**（见[《Vue + Vite 项目结构》](/2022/05/09/vue-vite-project-structure/)）。

`vue-tsc --noEmit` 作为 CI 一步：

```json
"scripts": {
  "typecheck": "vue-tsc --noEmit -p tsconfig.app.json"
}
```

***

### 四、环境变量类型

```typescript
// env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

***

### 五、常见坑

* `.vue` 未纳入 include → 模板类型不检
* 双 package.json types 冲突 → 锁 `@types/node` 版本
* API 响应用 `any` → 用 **生成类型或 zod 校验**

***

### 六、小结

TS 工程化 = **分层 tsconfig + strict + vue-tsc CI**。进阶见[《泛型与工具类型》](/2026/05/21/typescript-generics-utility-types-practice/)[《Vue + TS 组件类型》](/2026/05/21/vue-typescript-props-emit-component-types/)。
