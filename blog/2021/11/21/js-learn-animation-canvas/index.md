---
url: /blog/2021/11/21/js-learn-animation-canvas/index.md
---
### 动画\&canvas

#### requestAnimationFrame

> 一般计算机显示器的屏幕刷新率都是 60Hz,实现平滑动画最佳的重绘间隔为 `1000 毫秒/60，大约 17 毫秒`
> `requestAnimationFrame`()方法接收一个参数，此参数是一个要在重绘屏幕前调用的函数,表示下次重绘的时间,传给 `requestAnimationFrame`()的函数实际上可以接收一个参数

#### cancelAnimationFrame

> `requestAnimationFrame`()也返回一个请求 ID，可以用于通过另一个方法 `cancelAnimationFrame`()来取消重绘任务

```js
let requestID = window.requestAnimationFrame(() => { 
 console.log('Repaint!'); 
}); 
window.cancelAnimationFrame(requestID);
```

#### canvas

```js
<canvas id="drawing" width="200" height="200">A drawing of something.</canvas>
```

##### `toDataURL()`

> 导出`<canvas>`元素上的图像,参数要生成图像的 MIME 类型

```js
let drawing = document.getElementById("drawing"); 
// 确保浏览器支持<canvas> 
if (drawing.getContext) { 
 // 取得图像的数据 URI 
 let imgURI = drawing.toDataURL("image/png"); 
 // 显示图片
 let image = document.createElement("img"); 
 image.src = imgURI; 
 document.body.appendChild(image); 
}
```

##### getContext()方法可以获取对绘图上下文的引用

```js
let drawing = document.getElementById("drawing"); 
// 确保浏览器支持<canvas> 
if (drawing.getContext) { 
 let context = drawing.getContext("2d"); 
 // 其他代码
}
```

###### 填充(fill)和描边(stroke)

###### `fillRect()`、`strokeRect()`和 `clearRect()`

> 这些方法都接收 4 个参数：矩形 x 坐标、矩形 y 坐标、
> 矩形宽度和矩形高度

> 想学习可以系统性看 [MDN Canvas](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)

#### WebGL

> [MDN WebGL](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API)

```js
let drawing = document.getElementById("drawing"); 
// 确保浏览器支持<canvas> 
if (drawing.getContext) { 
 let gl = drawing.getContext("webgl"); 
 if (gl){ 
 // 使用 WebGL 
 } 
}
```

### 小结

`requestAnimationFrame` 是简单但实用的工具，可以让 `JavaScript` 跟进浏览器渲染周期，从而更
加有效地实现网页视觉动效。
`HTML5` 的`<canvas>`元素为 `JavaScript` 提供了动态创建图形的 API。这些图形需要使用特定上下文
绘制，主要有两种。第一种是支持基本绘图操作的 2D 上下文：

1. 填充和描绘颜色及图案
2. 绘制矩形
3. 绘制路径
4. 绘制文本
5. 创建渐变和图案
   第二种是 3D 上下文，也就是 WebGL。WebGL 是浏览器对 OpenGL ES 2.0 的实现。OpenGL ES 2.0
   是游戏图形开发常用的一个标准。WebGL 支持比 2D 上下文更强大的绘图能力，包括：
6. 用 OpenGL 着色器语言（GLSL）编写顶点和片段着色器；
7. 支持定型数组，限定数组中包含数值的类型；
8. 创建和操作纹理。
   目前所有主流浏览器的较新版本都已经支持`<canvas`>标签
