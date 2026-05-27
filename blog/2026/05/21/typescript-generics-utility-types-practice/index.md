---
url: /blog/2026/05/21/typescript-generics-utility-types-practice/index.md
---
「类型体操」不必为炫技；在中后台里 **最常用的是接口约束、Partial/Pick/Omit、ReturnType**。本篇用 **API 封装与表格列配置** 两个场景讲透。

***

### 一、API 响应泛型

```typescript
type ApiResult<T> = { code: number; data: T; message: string };

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json()) as ApiResult<T>;
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}

type User = { id: string; name: string };
const user = await get<User>('/api/user/1');
```

***

### 二、工具类型日常

```typescript
type UserForm = Omit<User, 'id'>;
type UserPatch = Partial<Pick<User, 'name'>>;
type ReadonlyUser = Readonly<User>;

// 从函数推断
type FetchUser = typeof fetchUser;
type UserReturn = Awaited<ReturnType<FetchUser>>;
```

***

### 三、表格列类型安全

```typescript
type Column<T> = {
  key: keyof T;
  title: string;
  render?: (row: T) => string;
};

function defineColumns<T>(cols: Column<T>[]): Column<T>[] {
  return cols;
}

defineColumns<User>([
  { key: 'name', title: '姓名' },
  // { key: 'nmae', title: '错' }  // TS 报错
]);
```

***

### 四、联合与收窄

```typescript
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

function handle(s: State) {
  if (s.status === 'error') console.log(s.message);
}
```

***

### 五、别过度

* 三层以上嵌套 conditional type 除非库作者，否则拆 **具名类型**
* 运行时边界用 **zod/io-ts** 校验外部 JSON

***

### 六、小结

实用 TS = **泛型 API + keyof 约束 + 工具类型减重复**。项目配置见前一篇。
