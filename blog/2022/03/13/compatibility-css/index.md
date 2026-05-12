---
url: /blog/2022/03/13/compatibility-css/index.md
---
## CSS问题

### padding

> 如果容器可以滚动 `在IE和FireFox下 ``padding-bottom`会被`忽略`,`chrome不会`

> chrome是子元素超过`content box`触发滚动条显示,在IE和FireFox,是`padding box`会触发滚动条

> `建议: 页面底部留白不建议用padding`

### margin 合并规则

> 正正取最大,正负值相加,负负最负值

### `margin=>auto`

> *==auto是平分剩余空间==*
> eg:

```css
.demo{
  width:100px;
}
.demo-son{
  width:20px;
  margin-left:10px;
  margin-right:auto
}
/* margin-right:auto是平分 100-20-10=70px,也就是铺满70px */
```

### border绘制与color变色

eg:上传图片按钮 hover后变色

> 可以利用`border`不设置颜色,直接修改color来实现

```html
<a href class="add" title="继续上传">
  添加图片
</a>
```

```css
.add {
    display: inline-block;
    width: 76px; height: 76px;
    color: #ccc;
    border: 2px dashed;
    text-indent: -12em;
    transition: color .25s;
    position: relative;
    overflow: hidden;
}
.add:hover {
    color: #34538b; // 这里是重点
}
.add::before, .add::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
}
.add::before {
    width: 20px;
    border-top: 4px solid;
    margin: -2px 0 0 -10px;
}
.add::after {
    height: 20px;
    border-left: 4px solid;
    margin: -10px 0 0 -2px;
}

```

### 透明border的应用

#### 优雅增加点击区域大小

`输入框删除按钮 移动端太小 不容易点击 `

> 加透明`border`

```html
<input id="search" type="search" value="我是初始值" required>
<label for="search" class="icon-clear"></label>
```

```css
input[type="search"] {
    width: 200px; height: 40px;
    padding: 10px 40px 10px 10px;
    border: 1px solid #ccc;
    box-sizing: border-box;
}
.icon-clear {
    width: 16px; height: 16px;
    margin: 1px 0 0 -38px;
    border: 11px solid transparent;
    border-radius: 50%;
    background: #999;
    color: white;
    position: absolute;
    visibility: hidden;
}
.icon-clear:before {
    content: "×";
}
input:valid + .icon-clear { 
    visibility: visible;
}
```

#### 绘制三角形

```css
div{
  width: 0;
  border: 1px solid ;
  border-color: #f30 transparent transparent;
}
```

#### 同理绘制梯形就很简单

![图css-1](/_missing-image.svg)

只需要把其他边框透明

```css
div{
 width: 10px;
      height: 10px;
      border: 10px solid;
      border-color: #f30 transparent transparent transparent;
      margin: 0 auto;
      margin-top: 190px;
}
```

![图css-2](/_missing-image.svg)

`同理将宽度变为 0 又可以绘制三角形`
那么各式各样的都能制作 比如气泡箭头等

### `x-height`

> `x-height`表示小写字母x等高度,也就是基线和等分线之间的距离
> `vertical-align`:`middle`,在css中middle表示基线往上`1/2 x-height`的高度

### `line-hieght`

```html
<div class="test1">我的高度是？</div>
<div class="test2">我的高度是？</div>
```

```css
.test1,
.test2 {
    margin: 24px 0;
    border: 1px solid #ccc;
    background: #eee;
}
.test1 {
    font-size: 16px;
    line-height: 0;
}
.test2 { 
    font-size: 0;
    line-height: 16px;
}
```

![图css-3](/_missing-image.svg)

可以看出 纯内联元素 可视高度由`line-height`决定

#### `line-height`

如果是数字 所有子元素继承这个数字
如果是百分比或者长度 那么子元素继承 计算后的值
eg:

```html
<div class="box box-1">
    <h3>标题</h3>
    <p>内容</p>
</div>
<div class="box box-2">
    <h3>标题</h3>
    <p>内容</p>
</div>
<div class="box box-3">
    <h3>标题</h3>
    <p>内容</p>
</div>
```

```css
.box   { font-size: 14px; }
.box-1 { line-height: 1.5; }
.box-2 { line-height: 150%; }
.box-3 { line-height: 1.5em; }

h3, p {
    margin: 0;
}
h3 { font-size: 32px; }
p  { font-size: 20px; }
```

![图css-4](/_missing-image.svg)
