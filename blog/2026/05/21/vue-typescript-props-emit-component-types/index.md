---
url: /blog/2026/05/21/vue-typescript-props-emit-component-types/index.md
---
`<script setup lang="ts">` 里 **Props/Emits 类型** 写对了，IDE 才能在整个仓库里传导约束。本篇覆盖 **defineProps、defineEmits、组件库 publish types**。

***

### 一、Props（Vue 3.4+ 推荐）

```vue
<script setup lang="ts">
type Props = {
  title: string;
  count?: number;
};
const props = withDefaults(defineProps<Props>(), { count: 0 });
</script>
```

运行时声明 + 类型（需兼容老工具时）：

```typescript
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
});
```

***

### 二、Emits

```typescript
const emit = defineEmits<{
  change: [id: string];
  submit: [payload: { name: string }];
}>();

emit('change', '42');
```

***

### 三、模板 ref 类型

```vue
<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import MyChart from './MyChart.vue';

const chartRef = ref<InstanceType<typeof MyChart> | null>(null);
</script>
```

***

### 四、组件库导出类型

```typescript
// packages/ui/src/button/index.ts
export { default as UiButton } from './Button.vue';
export type { ButtonProps } from './types';
```

`package.json`：

```json
{
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  }
}
```

Monorepo 用 **vite-plugin-dts** 或 **vue-tsc --declaration** 生成。

***

### 五、与 API 类型共享

```typescript
// packages/shared/src/user.ts
export type UserDto = { id: string; name: string };
```

前后端同仓时 **DTO 单一来源**（见 BFF/protobuf 文）。

***

### 六、小结

Vue + TS = **script setup 泛型 Props/Emits + 组件库 d.ts 导出**。配合 strict tsconfig 与 Pinia 类型推断。
