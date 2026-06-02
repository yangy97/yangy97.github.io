---
url: /blog/2026/06/01/react-hooks-state-management-patterns/index.md
---
本站 Vue 内容多，但协作与微前端场景常碰 React（UI 组件库）（UI 组件库）。已有 [React + Vite 项目结构](/2026/05/24/react-vite-project-structure-basics/) 讲目录；这篇补 **Hooks**（React 函数组件状态/副作用 API） 心智模型 + 状态分层 + 选型，用 Vue 读者熟悉的类比降低切换成本。

***

### 一、Hooks 与 Composables 对照

| Vue 3 | React | 注意 |
|-------|-------|------|
| `ref` / `reactive` | `useState`（局部状态）/ `useReducer`（复杂状态归约） | React 状态 **不可变**，必须新对象/新数组 |
| `computed` | `useMemo` | 依赖数组写错会 stale |
| `watch` | `useEffect` | effect 兼管副作用，别用来推导状态 |
| `onMounted` | `useEffect(() => {}, [])` | 严格模式会双调用 mount |
| `provide/inject` | `Context` | **Context**（跨层传值） 变则 **所有 consumer 重渲染** |
| composable | custom hook | 命名 `useXxx`，遵守 Rules of Hooks |

**Rules of Hooks**：只在顶层调用；只在函数组件或 custom hook 里调用——违反会导致依赖错乱。

***

### 二、useState 与 useReducer

```tsx
// 简单标量
const [count, setCount] = useState(0);

// 复杂状态机：多字段、下一步依赖上一步
type State = { step: number; form: FormData; error?: string };
type Action =
  | { type: 'next' }
  | { type: 'patch'; payload: Partial<FormData> }
  | { type: 'fail'; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next':
      return { ...state, step: state.step + 1 };
    case 'patch':
      return { ...state, form: { ...state.form, ...action.payload } };
    case 'fail':
      return { ...state, error: action.message };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);
```

**何时上 reducer**：字段多、转移规则清晰、要可测试的纯函数 reducer——对标 Pinia 里 actions 拆逻辑。

***

### 三、useEffect 边界（最常翻车）

```tsx
// ❌ 用 effect 同步 props → state（多余且易循环）
useEffect(() => {
  setLocal(props.value);
}, [props.value]);

// ✅ 受控组件直接 props；非受控用 key 重置
<UserForm key={userId} defaultValues={initial} />
```

**依赖数组**：ESLint `react-hooks/exhaustive-deps` 应开着。漏依赖 → 读到旧闭包；多依赖 → 频繁重跑。

**清理**：订阅、定时器、AbortController 在 return 里 cleanup，对标 Vue `onUnmounted`。

***

### 四、Context：别当全局 Store 滥用

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return (
    <ThemeContext.Provider value={theme}>
      <Layout onToggle={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))} />
    </ThemeContext.Provider>
  );
}
```

Context **适合**：主题、locale、auth 快照等 **低频变、广分发**。\
**不适合**：高频变的列表数据——任一 consumer 都会重渲染。此时用 **外部 store** 或 **状态分片 + selector**。

***

### 五、状态管理选型（2026 常见）

| 方案 | 适用 | 体积/复杂度 |
|------|------|-------------|
| **useState + props** | 局部 UI、父子 1–2 层 | 最低 |
| **useReducer + Context** | 中小型、表单向导 | 中 |
| **Zustand** | 中后台全局态，API 简单 | 小，推荐默认 |
| **Jotai / Recoil** | 原子化、细粒度订阅 | 中 |
| **Redux Toolkit** | 大型团队、时间旅行、中间件生态 | 高 |
| **TanStack Query** | **服务端状态**（列表、详情、缓存） | 与 UI store 分工 |

**经验法则**：

* **服务端数据** → TanStack Query（对标 Vue 里 Pinia + 手写 fetch 的分工）。
* **客户端 UI 态**（侧栏折叠、步骤条）→ Zustand 或组件内 state。
* **不要** 把所有东西塞进一个 global store。

```tsx
// Zustand 最小示例
import { create } from 'zustand';

type SidebarStore = {
  collapsed: boolean;
  toggle: () => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
}));

// 组件里：const collapsed = useSidebarStore(s => s.collapsed); // selector 避免多余渲染
```

***

### 六、性能：memo 与 callback

```tsx
const MemoRow = React.memo(function Row({ item }: { item: Item }) {
  return <tr>...</tr>;
});

const onSelect = useCallback((id: string) => {
  dispatch({ type: 'select', id });
}, [dispatch]);
```

* `React.memo`：props 浅比较不变则跳过渲染——对标 Vue `defineComponent` + 手动优化，但 **先度量再 memo**。
* `useCallback` / `useMemo`：为 **稳定引用** 给 memo 子组件或 deps，不是「加速计算」万能药。

列表性能根本解仍是 **虚拟滚动**（见 [长列表性能](/2023/05/20/frontend-performance-list-image/)）。

***

### 七、与 Vue 协作时的接口约定

微前端子应用是 React、主应用是 Vue 时：

* **路由与鉴权** 由主应用下发 props 或 custom event，子应用 **不要** 各自读 localStorage 键名。
* **共享设计 token** 用 CSS 变量或 npm 包，避免复制 SCSS。
* 状态 **不要** 跨框架共享同一个 reactive 对象；用 **URL、postMessage、BFF session** 对齐。

见 [微前端理论边界](/2023/04/10/micro-frontend-theory-boundaries-routing/)。

***

### 八、一句话

React 状态管理的默认路径是：**组件内 useState → 复杂用 useReducer → 跨树低频 Context → 全局客户端态 Zustand → 服务端态 TanStack Query**；Hooks 写顺了，比背 API 更重要。
