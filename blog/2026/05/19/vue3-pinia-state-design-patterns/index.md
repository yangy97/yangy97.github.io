---
url: /blog/2026/05/19/vue3-pinia-state-design-patterns/index.md
---
Pinia 是 Vue 3 官方推荐的状态库：**无 mutations、TS 友好、可按 store 拆模块**。本篇讲 **怎么拆 store、何时持久化、如何与路由守卫/权限** 配合，避免「一个大 store 装天下」。

***

### 一、按领域拆 store

```text
stores/
  user.ts      # 登录态、profile
  permission.ts # 路由权限、按钮码
  app.ts       # 侧栏折叠、主题、locale
  order.ts     # 业务域（按需）
```

\==原则==：**跨页共享且非服务端真相** 的放 Pinia；服务端真相 **仍以 API 为准**，store 是缓存。

***

### 二、Setup Store 示例

```typescript
// stores/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi, fetchProfile } from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(null);
  const profile = ref<{ name: string; roles: string[] } | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  async function login(payload: { username: string; password: string }) {
    const { accessToken } = await loginApi(payload);
    token.value = accessToken;
    await loadProfile();
  }

  async function loadProfile() {
    profile.value = await fetchProfile();
  }

  function logout() {
    token.value = null;
    profile.value = null;
  }

  return { token, profile, isLoggedIn, login, loadProfile, logout };
});
```

***

### 三、持久化

```typescript
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// 只持久化 token 等必要字段，不要持久化大列表
persist: {
  pick: ['token'],
}
```

**敏感 token**：更推荐 **HttpOnly Cookie**（BFF 场景）；若必须 localStorage，配合 **短过期 + 刷新**。

***

### 四、与路由守卫

```typescript
router.beforeEach(async (to) => {
  const user = useUserStore();
  if (to.meta.requiresAuth && !user.isLoggedIn) return '/login';
  if (to.meta.roles && !to.meta.roles.some((r) => user.profile?.roles.includes(r))) {
    return '/403';
  }
});
```

权限码与 **RBAC 后台** 对齐，见[《Vue Router 4 权限路由》](/2026/05/20/vue-router4-permission-dynamic-menu/)与 RBAC 系列。

***

### 五、反模式

* 在 store 里 **直接操作 DOM**
* 把 **分页列表全量** 常驻内存不清理
* 组件里 `watch` store 再发重复请求——用 **action 内聚** 或 `pinia colada`/请求层去重

***

### 六、小结

Pinia = **领域 store + setup 语法 +  selective persist + 守卫联动**。项目结构见[《Vue + Vite 项目目录约定》](/2022/05/09/vue-vite-project-structure/)。
