---
url: /blog/2024/08/03/node-buffer-encoding-binary/index.md
---
`Buffer` 是 ==固定长度的字节序列==（类似 Uint8Array 的视图），网络与文件在底层都是字节；**字符串** 是 UTF-16（JS 层面）与 **存储传输时的 UTF-8** 等编码之间的映射。**slice 共享底层 ArrayBuffer**、**`allocUnsafe` 未清零**、**按「字符」还是按「字节」截断**，都是线上 bug 来源。

***

### 一、创建与内存安全

| API | 行为 |
|-----|------|
| ==`Buffer.from(string[, encoding])`== | 拷贝/编码成新 Buffer |
| **`Buffer.alloc(size)`** | **零填充**，安全 |
| **`Buffer.allocUnsafe(size)`** | **快**，但可能含旧数据，需立刻 **write** 或 **fill** |

热路径大量创建 Buffer 时注意 **对象池** 与 **复用**，避免 GC 压力；安全敏感场景 **禁用未初始化内存泄漏信息**。

***

### 二、`slice` 与 `subarray`（或 copy）

* **`buf.slice(start, end)`**（旧习惯）与 **`subarray`**：**共享同一底层存储**，修改一侧会影响另一侧。
* 需要 **独立副本** 时用 **`Buffer.from(buf)`** 或 **`buf.copy(target)`**。

把 **大 Buffer 的一小段** 交给别的模块长期持有，容易导致 **整块内存无法回收**——这是 **隐式泄漏** 常见原因。

***

### 三、编码：UTF-8 与 `encoding` 参数

* **`buf.toString('utf8')`**：按 UTF-8 解码；**非法序列** 可能被替换为 \`\`（依赖 `Buffer` 解码策略）。
* **字符串 → Buffer**：多字节字符（中文、emoji）占 **多个字节**；**`.length` 是字节长度**，不是字符数。

**截断**：在任意字节处 `slice` 可能 **切断多字节字符**；需要 **按字符边界** 截断时要 **从字符串侧** 处理，或逐段解码校验。

***

### 四、Base64、Hex 与协议场景

* **Base64**：体积约 **4/3**，用于 **文本信道** 传二进制；注意 **padding** 与 **URL-safe** 变体。
* **Hex**：调试、短密钥展示；**不要** 当压缩格式。
* **网络协议**：长度前缀（length-prefixed）、 TLV、protobuf——都是 **字节级** 约定，**与 JSON 字符串混用** 时要分清层。

***

### 五、与 TypedArray / DataView

需要 **多字节整数、浮点、大端小端** 时，用 **`DataView`** 或 **显式读写字节序**，避免手写移位出错。 **WebSocket / 自定义二进制帧** 常走这一路。

***

### 六、小结

Buffer 题：**字节 ≠ 字符**；**slice 共享**；**allocUnsafe 要初始化**。协议题：**先定字节布局再写代码**，不要先 `JSON.stringify` 再拍脑袋补二进制头。
