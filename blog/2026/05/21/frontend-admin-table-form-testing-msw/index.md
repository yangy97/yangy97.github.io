---
url: /blog/2026/05/21/frontend-admin-table-form-testing-msw/index.md
---
中后台测试难点在 **请求 + 表格 + 表单校验** 叠在一起。用 **MSW（Mock Service Worker）** 在 Vitest 里拦截 HTTP，比 mock 整个 axios 更接近真实。

***

### 一、MSW  setup

```bash
pnpm add -D msw
```

```typescript
// tests/msw/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/orders', () =>
    HttpResponse.json({ code: 0, data: { list: [{ id: '1', amount: 100 }], total: 1 } }),
  ),
];

export const server = setupServer(...handlers);
```

```typescript
// tests/setup.ts
import { server } from './msw/server';
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

***

### 二、测列表页

```typescript
import { mount, flushPromises } from '@vue/test-utils';
import OrderList from '@/views/OrderList.vue';

it('renders rows from api', async () => {
  const w = mount(OrderList);
  await flushPromises();
  expect(w.text()).toContain('100');
});
```

***

### 三、测表单提交

```typescript
it('submits valid form', async () => {
  let posted: unknown;
  server.use(
    http.post('/api/orders', async ({ request }) => {
      posted = await request.json();
      return HttpResponse.json({ code: 0, data: { id: '2' } });
    }),
  );

  const w = mount(OrderForm);
  await w.get('[data-testid=name]').setValue('foo');
  await w.get('form').trigger('submit');
  await flushPromises();
  expect(posted).toMatchObject({ name: 'foo' });
});
```

***

### 四、实践建议

* 用 **data-testid**，少依赖 CSS 类名
* 错误分支：MSW 返回 500，断言 toast
* 不要 snapshot 整张 Element Plus 表格

***

### 五、小结

中后台测试 = **MSW 管 HTTP + flushPromises + testid**。策略分层见下一篇。
