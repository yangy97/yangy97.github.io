---
url: /blog/2021/05/17/js-learn-2/index.md
---
### Javascript 高级程序设计 第二章

#### 标签位置

1. head 里面

> 这种做法的主要目的是把外部的 CSS 和 JavaScript 文件都集中放到一起。不过，把所有 JavaScript
> 文件都放在`<head>`里，也就意味着必须把所有 JavaScript 代码都下载、解析和解释完成后，才能开始渲
> 染页面（页面在浏览器解析到`<body>`的起始标签时开始渲染）对于需要很多 JavaScript 的页面，这会
> 导致页面渲染的明显延迟，在此期间浏览器窗口完全空白

2. body 后面

> 这样一来，页面会在处理 JavaScript 代码之前完全渲染页面。用户会感觉页面加载更快了，因为浏
> 览器显示空白页面的时间短了

#### 推迟执行脚本

`HTML 4.01` 为`<script>`元素定义了一个叫 defer 的属性。这个属性表示脚本在执行的时候不会改
变页面的结构。也就是说，脚本会被延迟到整个页面都解析完毕后再运行。因此，在`<script>`元素上
设置 defer 属性，相当于告诉浏览器立即下载，但延迟执行,
也就是并行下载脚本 defer标签等待dom html解析完成在处理

#### 异步执行脚本

HTML5 为`<script>`元素定义了 async 属性 ,和defer类似 只不过当async下载完成后后立即执行

#### 动态加载脚本

```js
let script = document.createElement('script'); 
script.src = 'gibberish.js'; 
document.head.appendChild(script);
```

因为所有浏览器都支持 createElement()方法，但不是所有浏览器都支持 async 属性。因此，
如果要统一动态脚本的加载行为，可以明确将其设置为同步加载

```js
let script = document.createElement('script'); 
script.src = 'gibberish.js'; 
script.async = false; 
document.head.appendChild(script);
```

#### `<noscript>`元素

`<noscript>`元素可以包含任何可以出现在`<body>`中的 HTML 元素，`<script>`除外。在下列两种
情况下，浏览器将显示包含在`<noscript>`中的内容：

1. 浏览器不支持脚本；
2. 浏览器对脚本的支持被关闭
   任何一个条件被满足，包含在`<noscript>`中的内容就会被渲染。否则，浏览器不会渲染`<noscript>`
   中的内容。
