---
url: /blog/2026/05/21/vitest-vue-test-utils-zero-to-one/index.md
---
Vitest 与 Vite 同生态，**配置复用、HMR 测起来快**。本篇搭好 **Vitest + @vue/test-utils + jsdom**，写第一个组件测试并接进 CI。

***

### 一、安装

```bash
pnpm add -D vitest @vue/test-utils jsdom @vitest/coverage-v8
```

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

```typescript
// tests/setup.ts
import { config } from '@vue/test-utils';
config.global.stubs = { transition: false };
```

***

### 二、第一个测试

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { ref } from 'vue';
const n = ref(0);
</script>
<template>
  <button @click="n++">{{ n }}</button>
</template>
```

```typescript
// Counter.spec.ts
import { mount } from '@vue/test-utils';
import Counter from './Counter.vue';

it('increments', async () => {
  const w = mount(Counter);
  await w.get('button').trigger('click');
  expect(w.get('button').text()).toBe('1');
});
```

***

### 三、mock 模块

```typescript
vi.mock('@/api/user', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ name: 'test' })),
}));
```

***

### 四、CI

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

```yaml
- run: pnpm test
```

***

### 五、与 Playwright 分工

Vitest 管 **组件/逻辑**；E2E 见[《Playwright 架构》](/2025/11/16/headless-playwright-architecture-tracing-ci/)与[《测试策略》](/2026/05/22/frontend-testing-strategy-unit-integration-e2e/)。

***

### 六、小结

Vitest 上手 = **vite test 块 + mount + vi.mock + CI run**。AI 辅助见[《AI 辅助写测试》](/2026/05/19/ai-assisted-testing-vitest-playwright/)。
