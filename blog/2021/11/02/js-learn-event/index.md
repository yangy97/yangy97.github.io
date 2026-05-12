---
url: /blog/2021/11/02/js-learn-event/index.md
---
### 事件 Event

#### 事件冒泡(IE事件流)

> 简而言之 从最深节点向上触发,然后向上传播至没有那么具体的元素（文档）

```js
<!DOCTYPE html> 
<html> 
<head> 
 <title>Event Bubbling Example</title> 
</head> 
<body> 
 <div id="myDiv">Click Me</div> 
</body> 
</html>
// 在点击页面中的<div>元素后，click 事件会以如下顺序发生：
// (1) <div>
// (2) <body>
// (3) <html>
// (4) document
```

也就是说，`<div>`元素，即被点击的元素，最先触发 `click` `事件。然后，click` 事件沿 `DOM` 树一
路向上，在经过的每个节点上依次触发，直至到达 `document` 对象

![图 Event-1](/_missing-image.svg)

#### 事件捕获

> 从上到下触发
> 前面的例子使用事件捕获，则点击`<div>`元素会以下列顺序触发 `click` 事件：

1. `document`
2. ` <html>`
3. `<body>`
4. `<div>`

![图 Event-2](/_missing-image.svg)

#### DOM 事件流

> 事件捕获、到达目标和事件冒泡事件捕获最先发生，为提前拦截事件提供了可能。然后，实际的目标元素接收到事件。最后一个阶段是冒泡，最迟要在这个阶段响应事件
> 如图所示

![图 Event-3](/_missing-image.svg)

#### 合成事件

1. compositionstart，在 IME 的文本合成系统打开时触发，表示输入即将开始；
2. compositionupdate，在新字符插入输入字段时触发；
3. compositionend，在 IME 的文本合成系统关闭时触发，表示恢复正常键盘输入

```js
let textbox = document.getElementById("myText"); 
textbox.addEventListener("compositionstart", (event) => { 
 console.log(event.data); 
}); 
textbox.addEventListener("compositionupdate", (event) => { 
 console.log(event.data); 
}); 
textbox.addEventListener("compositionend", (event) => { 
 console.log(event.data); 
});
```

#### HTML5 事件

##### contextmenu事件

> 可以自定义右键菜单

> 一个简单右键vue hook

```js
import { onMounted, onUnmounted, ref } from "vue";
export default function (containerRef) {
  const showMenu = ref(false);
  const x = ref(0);
  const y = ref(0);
  function handerConextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    showMenu.value = true;
    x.value = e.clientX;
    y.value = e.clientY;
  }
  function closeMenu() {
    showMenu.value = false;
  }
  onMounted(() => {
    const div = containerRef.value;
    div.addEventListener("contextmenu", handerConextMenu);
    window.addEventListener("click", closeMenu, true);
    window.addEventListener("contextmenu", closeMenu, true);
  });
  onUnmounted(() => {
    const div = containerRef.value;
    div.removeEventListener("contextmenu", handerConextMenu);
    window.removeEventListener("click", closeMenu, true);
    window.removeEventListener("contextmenu", closeMenu, true);
  });
  return { x, y, showMenu };
}

```

#### orientationchange事件

> 移动 Safari 在 window 上暴露了 window.orientation 属性，它有以
> 下 3 种值之一：`0 表示垂直模式`，`90 表示左转水平模式`（主屏幕键在右侧），`–90 表示右转水平模式`（主
> 屏幕键在左）。

```js
window.addEventListener("load", (event) => { 
 let div = document.getElementById("myDiv"); 
 div.innerHTML = "Current orientation is " + window.orientation; 
 window.addEventListener("orientationchange", (event) => { 
 div.innerHTML = "Current orientation is " + window.orientation; 
 }); 
});
```

#### deviceorientation事件

```js
window.addEventListener("deviceorientation", (event) => { 
 let arrow = document.getElementById("arrow"); 
 arrow.style.webkitTransform = `rotate(${Math.round(event.alpha)}deg)`; 
});
```

> deviceorientation 触发时，event 对象中会包含各个轴相对于设备静置时坐标值的变化，
> 主要是以下 5 个属性。

1. alpha：0~360 范围内的浮点值，表示围绕 z 轴旋转时 y 轴的度数（左右转）。
2. beta：–180~180 范围内的浮点值，表示围绕 x 轴旋转时 z 轴的度数（前后转）。
3. gamma：–90~90 范围内的浮点值，表示围绕 y 轴旋转时 z 轴的度数（扭转）。
4. absolute：布尔值，表示设备是否返回绝对值。
5. compassCalibrated：布尔值，表示设备的指南针是否正确校准。

#### 事件委托

> 利用事件冒泡事件
