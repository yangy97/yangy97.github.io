---
url: /blog/2023/08/10/frontend-performance-vue-practice/index.md
---
Vue 3 的响应式 + 编译器已经很快，但 ==误用响应式边界==、**巨型列表**、**错误 key**、**首屏瀑布请求** 仍会把主线程和内存打满。下面按 **响应式粒度、列表、异步、路由、构建** 写深一层。

***

### 一、`ref` / `reactive` / `shallowRef` / `markRaw` 怎么选

| 场景 | 建议 |
|------|------|
| 标量、替换引用 | `ref` |
| 结构固定、多处修改的对象 | `reactive`（注意解构丢响应） |
| 第三方大实例（地图、图表、编辑器） | ==`shallowRef`== 或存实例用 **`markRaw`** |
| 仅防止被代理 | `markRaw` |

```vue
<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from "vue";
import { createMap } from "./mapVendor";

const map = shallowRef<ReturnType<typeof createMap> | null>(null);
onMounted(() => {
  map.value = createMap("#map");
});
onUnmounted(() => {
  map.value?.destroy?.();
  map.value = null;
});
</script>
```

把整个 map 对象 `ref()` 包起来可能触发 **深度代理**，既慢又易踩坑。

***

### 二、`v-memo`：减少子树重复比对

当父级常更新、但 **行内仅少数字段变** 时：

```vue
<div v-for="item in list" :key="item.id" v-memo="[item.id, item.status]">
  <Heavy :row="item" />
</div>
```

**风险**：依赖数组漏字段 → **界面不更新**。适合 **高价值热点列表**，不适合到处撒。

***

### 三、`:key` 与列表重排

插入/删除导致顺序变化时，**index key** 会造成 **错误复用**（内部状态串行）+ **多余 patch**：

```vue
<!-- 避免 -->
<div v-for="(r, i) in rows" :key="i">

<!-- 更好 -->
<div v-for="r in rows" :key="r.id">
```

***

### 四、路由懒加载与 magic comment

```ts
const Report = () =>
  import(/* webpackChunkName: "report" */ "../views/Report.vue");
```

Network 里 chunk 名可读，利于 **归因**。

***

### 五、`defineAsyncComponent` 与错误/超时

```ts
const Editor = defineAsyncComponent({
  loader: () => import("./Editor.vue"),
  delay: 200,
  timeout: 12000,
  onError(error, retry, fail, attempts) {
    if (attempts <= 2) retry();
    else fail();
  },
});
```

弱网环境避免 **无限白块**。

***

### 六、首屏请求：并行与取消

**并行：**

```ts
const [user, menu] = await Promise.all([fetchUser(), fetchMenu()]);
```

**取消**：`AbortController` 在路由切换时 **abort** 未完成请求，避免 **竞态覆盖** 与无效更新。

```ts
const ctrl = new AbortController();
fetch("/api/x", { signal: ctrl.signal });
onBeforeRouteLeave(() => ctrl.abort());
```

***

### 七、`computed` vs 模板里调函数

```vue
<!-- 差：每次渲染可能执行 -->
<div>{{ filterList(list) }}</div>
```

```ts
const shown = computed(() => filterList(list.value));
```

***

### 八、`KeepAlive`：缓存与内存

缓存 **列表页表单状态** 很爽，但 **缓存实例多** 会占内存；设 **`max`**，或在路由 meta 里 **显式排除** 大列表页。

***

### 九、Pinia / 大列表

* 全表几万行 **不要** `reactive` deep 全量；用 **分页数据** + **shallowRef** 存「当前页原始数组」等策略。
* **拆分 store**，减少无关订阅（依使用模式而定）。

***

### 十、构建

* `rollup-plugin-visualizer` 看依赖；
* 生产 **关闭 devtools 插件**；
* 检查 **是否误把 devDependencies 打进 bundle**。

***

### 十一、收束

Vue 优化 = **响应式边界** + **列表策略** + **异步与取消** + **通用 Web 性能**。先用 Performance 判断是 **Script** 还是 **Layout** 瓶颈。
