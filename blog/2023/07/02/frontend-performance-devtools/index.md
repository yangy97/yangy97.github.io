---
url: /blog/2023/07/02/frontend-performance-devtools/index.md
---
目标：把「慢」拆成 ==可改动的变量==——**哪个资源、哪段 JS、哪次 Layout、是否泄漏**。下面按 **准备 → Lighthouse → Network → Performance → Memory → 其它面板** 写 **可重复流程**，Chrome 为准。

***

### 一、准备：减少假阳性

1. \==无痕== 或禁用扩展（广告插件会改请求时序）。
2. **硬刷新**（Empty Cache）测首访；再 **二次刷新** 看缓存是否命中。
3. **CPU 6× slowdown** + **Slow 4G**（Performance / Lighthouse 里）模拟长尾用户。
4. **固定 URL 与账号**，避免 A/B 实验干扰。

***

### 二、Lighthouse：何时用、看什么

**路径**：F12 → Lighthouse → **Navigation** → Mobile → Performance（可勾 Accessibility 等）。

**重点**：

* **Metrics**：LCP、TBT、CLS（实验口径）。
* **Opportunities**：未用 JS、图片过大、预连接——**改优先级清单**。
* **Diagnostics**：主线程时间、第三方时间。

**局限**：单样本；**本地 CPU 强** 会掩盖问题。用于 **同机前后对比** 极佳。

**Lighthouse CI**：可在 CI 跑（需 Puppeteer/Chrome），对 **关键 URL** 做 **阈值断言**（波动大时要宽松）。

***

### 三、Network：瀑布图读法

1. **按 Size 排序**：谁最大。
2. **按 Waterfall**：是否 **串行链**（看 **Initiator**）。
3. **Priority** 列（Chrome）：LCP 资源是否 **Low**（可能被 lazy/顺序坑了）。
4. **Headers**：`cache-control`、`content-encoding`（gzip/br）。

**典型结论**：

* 最大 JS → 拆包 / 按需。
* 图片最大 → 压缩与格式。
* 第三方域名多 → 延迟与治理。

***

### 四、Performance：录制与 Main 线程

**两段录制**：

1. **Load**：刷新页面至稳定。
2. **Interaction**：录 **点击、输入、滚动**。

**Main 条颜色（简记）**：

* 灰：**Task**
* 黄：**Script**
* 紫：**Layout / Recalculate Style**
* 绿：**Paint**

**长任务**：Task 宽度 **>50ms**（经验）→ 点开 **Bottom-Up**，看 **自耗时** 最高函数。

**Frames**：是否掉到 **30fps 以下**。

**Experience**（新面板）：**Layout shifts** 列表，点选对应 **CLS 元素**。

**Screenshots**：对齐卡顿帧与 UI。

***

### 五、JavaScript Profiler（补充）

对 **纯 CPU 热点**（加密、大循环），可用 **Profiler** 录 **CPU profile**，看 **火焰图** 哪个函数占比高（与 Performance 互补）。

***

### 六、Memory：泄漏与 Detached DOM

1. **Heap snapshot** → 基线。
2. 重复操作 **N 次**（如打开关闭弹窗 30 次）。
3. 再 snapshot → **Comparison**。
4. 搜 **Detached**，看是否某 **Vue 组件** / **DOM** 数量线性涨。

**Allocation instrumentation on timeline**：适合抓 **短周期暴涨**。

***

### 七、Coverage

**Coverage** → 刷新 → 看 **红色未使用** 比例。\
首屏加载了大块未执行 → **路由拆晚了** 或 **条件导入不足**。

***

### 八、Rendering 工具

* **Paint flashing**：绿框大 = 重绘范围大。
* **Layer borders**：看分层是否异常。
* **FPS meter**（可选）：帧率实时。

***

### 九、推荐顺序（再强调）

1. Lighthouse **定方向**
2. Network **定资源**
3. Performance **定主线程与 Layout**
4. Memory **仅久驻卡顿时**
5. Coverage **拆包前论证**

每修一类问题 **单独录屏**，便于 **归因**。

***

### 十、收束

DevTools 的目标是把问题变成 **文件路径 + 函数名 + 资源 URL**；再结合《网络与静态资源》《JavaScript 与加载》落地修改。
