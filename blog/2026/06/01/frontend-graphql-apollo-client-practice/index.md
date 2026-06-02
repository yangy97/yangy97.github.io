---
url: /blog/2026/06/01/frontend-graphql-apollo-client-practice/index.md
---
REST 之外，中台与 BFF 层 increasingly 暴露 **GraphQL**（查询语言，客户端指定字段）（查询语言，客户端指定字段）（查询语言，客户端指定字段）。本站已有 [Protobuf RPC 客户端栈](/2023/08/15/bff-protobuf-rpc-client-stack-srpc-pattern/)，本篇补 **前端怎么接、和 REST 怎么选、缓存怎么踩坑**——以 Apollo Client + Vue/React（UI 组件库）（UI 组件库） 为例，概念可迁移到 urql / TanStack Query。

***

### 一、GraphQL 解决什么、不解决什么

| 适合 | 不适合 |
|------|--------|
| 多端字段需求不同（App 要 3 个字段、Web 要 10 个） | 简单 CRUD、文件上传为主 |
| 聚合多个下游 REST/DB | 强缓存 CDN 的静态 JSON |
| 类型化 Schema、自描述 API | 团队无 Schema 治理、随意改字段 |

**GraphQL 不自动更快**：错误设计会变成 **N+1 查询** 或 **超大 resolver**——性能在后端。

***

### 二、核心概念（前端视角）

```graphql
# Query：读
query OrderDetail($id: ID!) {
  order(id: $id) {
    id
    amount
    items { sku name qty }
  }
}

# Mutation：写
mutation CancelOrder($id: ID!) {
  cancelOrder(id: $id) {
    id
    status
  }
}
```

* **一个 endpoint**（通常 `POST /graphql`），body 里带 `query` + `variables`。
* **Schema** 由服务端定义；前端用 **Codegen** 生成 TS 类型。
* **Introspection** 可拉 Schema，生产环境常 **关闭** 或限内网。

***

### 三、Apollo Client 最小集成（Vue 3）

```bash
pnpm add @apollo/client graphql @vue/apollo-composable
```

```typescript
// src/apollo/client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
  credentials: 'include', // Cookie 会话时
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

```vue
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const ORDER = gql`
  query Order($id: ID!) {
    order(id: $id) { id amount status }
  }
`;

const props = defineProps<{ id: string }>();
const { result, loading, error } = useQuery(ORDER, () => ({ id: props.id }));
</script>
```

React 用 `@apollo/client` 的 `useQuery`，模式相同。

***

### 四、Codegen：别手写类型

```bash
pnpm add -D @graphql-codegen/cli @graphql-codegen/client-preset
```

```yaml
# codegen.ts
schema: 'https://api.example.com/graphql'
documents: ['src/**/*.graphql', 'src/**/*.vue'],
generates:
  src/graphql/:
    preset: client
```

生成 `graphql()` 函数与 **operation 类型**，refactor 时字段删改 **编译期报错**。

***

### 五、缓存策略（Apollo InMemoryCache）

GraphQL 默认按 **`__typename + id`** 规范化存储。

```typescript
new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        orders: {
          keyArgs: ['status', 'page'],
          merge(existing = [], incoming) {
            return [...existing, ...incoming]; // 分页 append
          },
        },
      },
    },
  },
});
```

| 场景 | 策略 |
|------|------|
| 列表分页 | `fetchPolicy: 'cache-and-network'` + merge |
| 详情强一致 | `fetchPolicy: 'network-only'` |
| Mutation 后列表更新 | `refetchQueries` 或 `cache.modify` 写回 |

**坑**：没返回 `id` 的 object **无法去重**，同一实体多份缓存。

***

### 六、错误、鉴权与文件

#### 6.1 错误形态

GraphQL HTTP 200 时 body 仍可能有 `errors` 数组：

```json
{
  "data": { "order": null },
  "errors": [{ "message": "Forbidden", "extensions": { "code": "FORBIDDEN" } }]
}
```

前端须 **同时看 `error` 与 `errors[0].extensions.code`**，不要只判断 HTTP status。

#### 6.2 鉴权

* Cookie 会话：`credentials: 'include'` + 后端 CORS。
* Bearer：用 `setContext` link 加 `Authorization` 头（见 [Token 存储](/2023/05/22/frontend-auth-token-storage-refresh-xss/)）。
* **401**：清 cache + 跳登录，避免旧 user 数据残留。

#### 6.3 文件上传

GraphQL  multipart spec 或 **单独 REST 上传拿 URL 再 mutation**——后者更简单、更常见。

***

### 七、与 REST / BFF 分工

```text
浏览器 ──► BFF GraphQL ──► 聚合 REST / gRPC / DB
         └──► REST 仍负责：上传、导出、Webhook
```

微前端子应用 **各自** 建 ApolloClient 实例，避免 cache 串租户；共享 session 靠 Cookie。

***

### 八、和 TanStack Query 的关系

若只需「请求 + 缓存 + 重试」，REST 用 **TanStack Query** 往往更简单。GraphQL 的价值在 **Schema + 字段级查询 + 类型 Codegen**；可 **graphql-request + TanStack Query** 轻量组合，不必强上 Apollo。

***

### 九、一句话

**GraphQL 前端 = Schema 驱动类型 + 单 endpoint + 规范化缓存治理**；先 Codegen，再谈 cache merge；上传和大文件仍走 REST。
