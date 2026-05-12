---
url: /blog/2022/01/16/js-learn-storage/index.md
---
### 存储

#### cookie

> 不超过4kb,4096 字节，上下可以有一个字节的误差。(单个)

\==特点== 部分

1. 不区分大小写 mycookie 和MYCookie 一样
2. 值：存储在 cookie 里的字符串值。这个值必须经过 URL 编码
3. 可以设置过期时间
   `Set-Cookie: name=value; expires=Mon, 07-Jan-23 07:10:24 GMT; domain=.wrox.com`
   这个头部设置一个名为"name"的 cookie，这个 cookie 在 2023 年 1 月 07 日 7:10:24 过期，对
   www.wrox.com 及其他 wrox.com 的子域（如 p2p.wrox.com）有效

#### Storage

1. clear()：删除所有值；不在 Firefox 中实现。
2. getItem(name)：取得给定 name 的值。
3. key(index)：取得给定数值位置的名称。
4. removeItem(name)：删除给定 name 的名/值对。
5. setItem(name, value)：设置给定 name 的值。

##### sessionStorage

> sessionStorage对象只存储会话数据，这意味着数据只会存储到浏览器关闭。这跟浏览器关闭时会消失的会话 cookie 类似

可以根据方法获取值
`let name = sessionStorage.getItem("name");`
还可以根据属性 这个一般不知道吧=》
`let name = sessionStorage.name;`

##### localStorage

> 要访问同一个 localStorage 对象，页面必须来自同一个域（子域不可以）、在相同的端口上使用相同的协议,`用法和sessionStorage一样`

*区别*

> 存储在 localStorage 中的数据会保留到通过 JavaScript 删除或者用户清除浏览器缓存。localStorage 数据不受页面刷新影响，也不会因关闭窗口、标签或重新启动浏览器而丢失

`不同浏览器给 localStorage 和 sessionStorage 设置了不同的空间限制，但大多数会限制为每个源 5MB`
