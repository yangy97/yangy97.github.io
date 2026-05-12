---
url: /blog/2022/04/20/vue3-composition-api-patterns/index.md
---
Vue 3 推荐用 ==组合式 API（`<script setup>`）== 组织逻辑：相近功能聚在一起，比选项式更利于 **抽 composable** 和 **类型推导**。这篇整理几种高频模式与注意点，默认你已会用 `ref` / `reactive` 基础。

***

### 一、`<script setup>` 里优先用 `ref` + 推导类型

对「标量、对象引用」用 `ref` 最直观；`reactive` 适合 ==固定结构的对象==，解构时容易丢响应，需 `toRefs` 或整包传递。

```ts
import { ref, computed } from "vue";

const count = ref(0);
const doubled = computed(() => count.value * 2);

function inc() {
  count.value++;
}
```

**习惯**：模板里自动解包，脚本里 **一定 `.value`**（除顶层解构特殊情况）。

***

### 二、把「一块业务」收成 composable

例如列表加载、分页、错误提示，可抽到 `useUserList.ts`：

```ts
import { ref, onMounted } from "vue";

export function useUserList() {
  const list = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      list.value = await fetchUsers();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);
  return { list, loading, error, reload: load };
}
```

页面里只关心「用什么数据、调什么方法」，**可测性**也更好（对 composable 单测即可）。

***

### 三、`watch` 与 `watchEffect` 怎么选

* **`watch`**：明确监听 **哪些源**，需要 `oldValue` / 深度控制时用。
* **`watchEffect`**：自动追踪依赖，适合「依赖关系简单、立即跑一遍」的副作用。

注意：**不要**在 watch 里无界地改被监听源，避免环路；异步逻辑要处理 **竞态**（后返回的请求覆盖先返回的）。

***

### 四、和 Pinia 的配合

* **页面局部 UI 状态**：留在组件或 composable。
* **跨路由共享、需持久化策略**：用 **Pinia**，store 里同样推荐 **组合式风格**（`defineStore` + setup 函数）。

避免「所有东西都进全局 store」，否则难以追踪数据流。

***

### 五、常见坑

1. **解构 `props`**：用 `toRefs(props)` 或 `props.xxx` 全名，避免丢响应。
2. **大对象进 `ref`**：`ref` 包一层即可；若用 `reactive`，注意不能随意解构。
3. **在 `setup` 外使用响应式 API**：除少数工具函数场景，尽量保持在 `setup` / composable 内。

***

### 六、收束

组合式的核心是 **按逻辑聚合 + 复用 composable**，而不是把选项式换个写法。下一步可看《Vue + Vite：项目目录怎么摆》了解工程侧组织。
