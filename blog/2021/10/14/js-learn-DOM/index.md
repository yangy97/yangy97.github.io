---
url: /blog/2021/10/14/js-learn-DOM/index.md
---
### DOM

#### MutationObserver

> MutationObserver 可以观察整个文档、DOM 树的一部分，或某个元素,可以在 DOM 被修改时异步执行回调

##### observe

> 包含两个参数 要观察其变化的 DOM 节点，以及一个 MutationObserverInit 对象

```js
let observer = new MutationObserver(() => console.log('DOM was mutated!'));
observer.observe(document.body, { attributes: true });
```

##### disconnect()

> 要提前终止执行回调

##### 观察子节点

`observer.observe(document.body, { childList: true });`

##### 观察子树

`observer.observe(document.body, { subtree: true });`

#### querySelector()

```js
// 取得<body>元素
let body = document.querySelector("body");
// 取得类名为"selected"的第一个元素
let selected = document.querySelector(".selected"); 
// 取得类名为"button"的图片
let img = document.body.querySelector("img.button");
```

#### querySelectorAll()

> 和querySelector()一样,querySelectorAll()返回的 NodeList

#### document.readyState

包含下面两种状态

1. loading，表示文档正在加载；
2. complete，表示文档加载完成

#### isSameNode()和 isEqualNode()

> 这两个方法都接收一个节点参数，如果这个节点与参考节点相同或相等，则返回 true

#### contentDocument和contentWindow

> contentDocument 属性是 Document 的实例，拥有所有文档属性和方法，因此可以像使用其他
> HTML 文档一样使用它。还有一个属性 contentWindow，返回相应窗格的 window 对象，这个对象上
> 有一个 document 属性

#### 偏移尺寸

> offsetLeft 和 offsetTop 是相对于包含元素的

![图 DOM-1](/_missing-image.svg)

#### clientWidth/clientHeight

> clientWidth 是内容区宽度加左、右内边距宽度，clientHeight 是内容区高度加上、下内边距高度

![图 DOM-2](/_missing-image.svg)

#### srcoll相关

1. scrollHeight，没有滚动条出现时，元素内容的总高度。整个页面高度
2. scrollLeft，内容区左侧隐藏的像素数，设置这个属性可以改变元素的滚动位置。
3. scrollTop，内容区顶部隐藏的像素数，设置这个属性可以改变元素的滚动位置。
4. scrollWidth，没有滚动条出现时，元素内容的总宽度。整个页面宽度

![图 DOM-3](/_missing-image.svg)

#### getBoundingClientRect

> left、top、right、bottom、height 和 width。这些属性给出了元素在页面中相对于视
> 口的位置

![图 DOM-4](/_missing-image.svg)
