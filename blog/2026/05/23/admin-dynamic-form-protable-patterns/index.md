---
url: /blog/2026/05/23/admin-dynamic-form-protable-patterns/index.md
---
中后台大量页面是 **「表格 + 搜索 + 弹窗表单」**（**ProTable**（Ant Design Pro 类表格+搜索封装） + **动态表单**）。用 **schema 驱动**（用 JSON/TS 描述字段与列，而非手写每个表单项）可以少写重复 CRUD；字段级 **RBAC**（Role-Based Access Control，基于角色的访问控制） 用 `visibleIf` / `perm` 与路由权限对齐。本篇讲 **字段 schema、联动、权限隐藏** 的可维护写法（不绑定某一 UI 库，示意为主）。

***

### 一、Schema 示例

```typescript
type FieldSchema = {
  key: string;
  label: string;
  component: 'input' | 'select' | 'date';
  props?: Record<string, unknown>;
  visible?: (ctx: { roles: string[] }) => boolean;
  rules?: Array<{ required?: boolean; message: string }>;
};

const orderSearchSchema: FieldSchema[] = [
  { key: 'orderNo', label: '单号', component: 'input' },
  { key: 'status', label: '状态', component: 'select', props: { options: [] } },
];
```

***

### 二、渲染器模式

```vue
<template>
  <component
    v-for="f in visibleFields"
    :key="f.key"
    :is="componentMap[f.component]"
    v-model="model[f.key]"
    v-bind="f.props"
  />
</template>
```

**componentMap** 注册 Input/Select/DatePicker，新增类型只扩 map。

***

### 三、表格列 schema

```typescript
type ColumnSchema<T> = {
  key: keyof T;
  title: string;
  width?: number;
  sortable?: boolean;
  permission?: string;
};
```

与 `v-permission` 指令结合（见 Router 权限文）。

***

### 四、联动

```typescript
watch(() => model.type, (t) => {
  if (t === 'VIP') schema.push(vipField);
});
```

复杂联动抽 **useFormSchema composable**，避免页面里堆 watch。

***

### 五、与低代码边界

* schema 适合 **80% 标准 CRUD**
* 极复杂交互仍 **手写页面**
* schema 存 JSON 时要做 **版本迁移**

***

### 六、小结

ProTable/动态表单 = **schema + 渲染器 + 权限 + composable 联动**。RBAC 见 07 目录系列。
