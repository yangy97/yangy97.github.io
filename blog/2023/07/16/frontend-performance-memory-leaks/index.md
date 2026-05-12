---
url: /blog/2023/07/16/frontend-performance-memory-leaks/index.md
---
泄漏 = ==应被回收的对象仍被 GC Root 可达==。SPA 里常见：**事件未解绑**、**定时器未清**、**全局 Map 无限涨**、**闭包抓住已卸下的 DOM**、**ObjectURL 未 revoke**。本篇补：**Vue 模式、第三方 dispose、WeakMap、验证步骤**。

***

### 一、监听与定时器：同一函数引用

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const x = ref(0);
const onScroll = () => {
  x.value = window.scrollY;
};
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  timer = setInterval(() => {}, 30_000);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  if (timer) clearInterval(timer);
});
</script>
```

\==错误==：`removeEventListener("scroll", () => onScroll())` —— **新函数**，永远对不上。

***

### 二、第三方：ECharts / 地图 / 富文本

只 `v-if=false` **不等于** 释放 WebGL/Canvas 资源：

```ts
onUnmounted(() => {
  chart?.dispose();
  chart = undefined;
});
```

读文档：**dispose / destroy / removeMap**。

***

### 三、`URL.createObjectURL`

```ts
const url = URL.createObjectURL(blob);
img.src = url;
// 用完：
URL.revokeObjectURL(url);
```

若存进 **长期缓存** 而不 revoke，等于 **泄漏 blob 内存**。

***

### 四、全局缓存：LRU 与 WeakMap

**DOM 节点 → 数据** 若用普通 `Map` 且 **不删**，Detached DOM 下不来。若生命周期与 DOM 绑定，可考虑 **`WeakMap`**（key 为 DOM 节点，节点消失自动可回收）。

**业务缓存**仍建议 **LRU + 上限**：

```ts
const MAX = 200;
const cache = new Map<string, Blob>();

function touch(key: string, val: Blob) {
  cache.delete(key);
  cache.set(key, val);
  if (cache.size > MAX) cache.delete(cache.keys().next().value);
}
```

***

### 五、WebSocket / EventBus / Pinia 订阅

```ts
const off = bus.on("x", handler);
onUnmounted(() => off());
```

WebSocket：`close()` + 清 `onmessage`。

***

### 六、Vue `KeepAlive` + 大列表

缓存 **太多页面实例** 会占内存；设 **`max`**，或对 **大数据页** 排除缓存。

***

### 七、验证：Memory 面板

1. **Heap snapshot** baseline。
2. 重复 **进入/离开** 路由 20～30 次。
3. 第二次 snapshot → **Comparison** → 过滤 **Detached**、**Array**、**system / Context**。
4. 若某 **Constructor** 计数随次数 **线性涨** → 追到 **保留路径（retainer）**。

***

### 八、与性能指标

泄漏不直接体现在 LCP，但会让 **长时间 INP**、滚动越来越差。对 **长开后台** 必测 **30min+**。

***

### 九、收束

**成对注册**、**有界缓存**、**第三方显式销毁**、**ObjectURL 成对 revoke**。四条习惯比事后查快照便宜。
