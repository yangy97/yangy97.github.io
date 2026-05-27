---
url: /blog/2026/05/20/vue3-composables-design-patterns-deep/index.md
---
`useXxx` 是 Vue 3 组合式 API 的核心复用单元。写得好的 composable **像小型服务**；写得坏的会变成 **隐式全局状态泥球**。本篇在[《组合式 API 常用写法》](/2022/04/20/vue3-composition-api-patterns/)基础上加深 **命名、参数、副作用、测试**。

***

### 一、何时抽 composable

| 适合 | 不适合 |
|------|--------|
| 2+ 组件重复的逻辑 | 只用一次的 5 行代码 |
| 有明确输入输出 | 强绑定某页面 DOM 结构 |
| 可单测的纯逻辑 | 到处读写 unrelated store |

***

### 二、标准结构

```typescript
// composables/usePagination.ts
import { ref, computed } from 'vue';

export function usePagination(fetchPage: (page: number, size: number) => Promise<{ total: number; list: unknown[] }>) {
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const list = ref<unknown[]>([]);
  const loading = ref(false);

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1);

  async function load() {
    loading.value = true;
    try {
      const res = await fetchPage(page.value, pageSize.value);
      list.value = res.list;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  }

  async function go(p: number) {
    page.value = p;
    await load();
  }

  return { page, pageSize, total, list, loading, totalPages, load, go };
}
```

**约定**：返回值用对象；异步错误 **要么 throw 要么返回 Result**，组件内统一 toast。

***

### 三、依赖注入式 composable

```typescript
// composables/useAuth.ts
import { inject, provide, type InjectionKey } from 'vue';

const AuthKey: InjectionKey<ReturnType<typeof createAuth>> = Symbol('auth');

export function provideAuth() {
  const auth = createAuth();
  provide(AuthKey, auth);
  return auth;
}

export function useAuth() {
  const auth = inject(AuthKey);
  if (!auth) throw new Error('useAuth() without provider');
  return auth;
}
```

适合 **Storybook / 测试替换 mock**。

***

### 四、副作用与清理

```typescript
import { onScopeDispose } from 'vue';

export function useEventListener(target: EventTarget, event: string, handler: EventListener) {
  target.addEventListener(event, handler);
  onScopeDispose(() => target.removeEventListener(event, handler));
}
```

凡 **定时器、订阅、DOM 监听** 必须 onScopeDispose。

***

### 五、测试

```typescript
import { usePagination } from './usePagination';
import { flushPromises } from '@vue/test-utils';

it('loads page 1', async () => {
  const fetchPage = vi.fn().mockResolvedValue({ total: 1, list: [{ id: 1 }] });
  const { load, list } = usePagination(fetchPage);
  await load();
  expect(list.value).toHaveLength(1);
});
```

Composable **不 mount 组件也能测**——这是相对 mixin 的优势。

***

### 六、小结

Composable = **单一职责 + 显式依赖 + 清理副作用 + 可单测**。与 Pinia 分工：跨页持久态 Pinia，页面内复用 composable。
