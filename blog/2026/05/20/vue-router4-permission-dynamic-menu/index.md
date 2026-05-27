---
url: /blog/2026/05/20/vue-router4-permission-dynamic-menu/index.md
---
中后台常见需求：**登录后按权限生成菜单和路由**。Vue Router 4 用 **动态 addRoute + meta** 即可实现；微前端场景还要对齐 **base / activeRule**。本篇给可落地模式。

***

### 一、静态 + 动态路由分离

```typescript
// router/routes.static.ts
export const staticRoutes = [
  { path: '/login', component: () => import('@/views/Login.vue') },
  { path: '/403', component: () => import('@/views/Forbidden.vue') },
];

// router/routes.async.ts —— 可由后端菜单 JSON 转换
export function buildAsyncRoutes(menu: MenuDto[]): RouteRecordRaw[] {
  return menu.map((m) => ({
    path: m.path,
    name: m.name,
    component: () => import(`@/views/${m.component}.vue`),
    meta: { title: m.title, roles: m.roles, inSidebar: true },
    children: m.children ? buildAsyncRoutes(m.children) : undefined,
  }));
}
```

***

### 二、登录后注入路由

```typescript
let dynamicAdded = false;

router.beforeEach(async (to, from, next) => {
  const user = useUserStore();
  if (!user.isLoggedIn && to.path !== '/login') return next('/login');

  if (user.isLoggedIn && !dynamicAdded) {
    const menu = await fetchMenu();
    const routes = buildAsyncRoutes(menu);
    routes.forEach((r) => router.addRoute(r));
    dynamicAdded = true;
    return next({ ...to, replace: true });
  }
  next();
});
```

**logout** 时：`router.removeRoute(name)` 或 **整页 reload** 清动态路由（简单可靠）。

***

### 三、按钮级权限

```typescript
// directives/permission.ts
app.directive('permission', {
  mounted(el, binding) {
    const codes = usePermissionStore().codes;
    if (!codes.includes(binding.value)) el.remove();
  },
});
```

```vue
<el-button v-permission="'order:export'">导出</el-button>
```

***

### 四、微前端 base

子应用：

```typescript
createWebHistory(window.__POWERED_BY_QIANKUN__ ? '/app-order/' : '/');
```

主应用 **activeRule** 与 **router base、Vite base** 三处字符串一致（见 qiankun 详版文）。

***

### 五、路由即菜单

侧栏递归 `router.getRoutes()` 过滤 `meta.inSidebar`，与[《OA 模板 Monorepo 架构》](/2026/05/15/oa-template-monorepo-frontend-architecture/)思路一致——**单一真相源**。

***

### 六、小结

动态路由 = **静态骨架 + addRoute + meta.roles + 退出清理**。Pinia 见前一篇；后台模型见 RBAC 系列。
