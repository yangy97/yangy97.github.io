---
url: /blog/2022/02/04/js-learn-rule/index.md
---
### 规范化

#### 可维护的代码

> 容易理解,符合常识,容易适配,容易扩展,容易调试

#### 编码规范

##### 可读性

1. 函数和方法 尽可能写清楚用途参数、写清楚注释 常见的一些兼容性问题注释等
2. 变量和函数命名 尽可能见名知意
   ii. 变量名应该是名词
   ii. 函数名应该以动词开
   ii 使用驼峰写法(camelCase)
3. 变量类型透明化

```js
let found = false; // 布尔值
let count = -1; // 数值
let name = ""; // 字符串
let person = null; // 对象
```

4. 一个函数尽可能只完成一件事情

##### 编码习惯

1. 不要给实例或原型添加属性。
2. 不要给实例或原型添加方法。
3. 不要重定义已有的方法

###### 不声明全局变量

###### 不要比较 nul

如果函数参数是数组尽可能这样

1. 如果值应该是引用类型，则使用 instanceof 操作符检查其构造函数。
2. 如果值应该是原始类型，则使用 typeof 检查其类型。
3. 如果希望值是有特定方法名的对象，则使用 typeof 操作符确保对象上存在给定名字的方法

```js
// function sortArray(values) { 
//  if (values !=null) { // 不推荐
//  values.sort(comparator); 
//  } 
// }
function sortArray(values) { 
 if (values instanceof Array) { // 推荐
 values.sort(comparator); 
 } 
}
```

###### 使用常量

比如自定义手写promise三种状态

```js
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
```

1. 重复出现的值：任何使用超过一次的值都应该提取到常量中，这样可以消除一个值改了而另一
   个值没改造成的错误。这里也包括 CSS 的类名
2. 任何可能变化的值：任何时候，只要在代码中使用字面值，就问问自己这个值将来是否可能会
   变。如果答案是“是”，那么就应该把它提取到常量中
3. URL eg:定义`ajax`中 `baseUrl`

#### 作用域意识

##### 避免全局查找

很简单的一点 变量缓存,提取`document`

```js
function updateUI() { 
 let imgs = document.getElementsByTagName("img"); 
 for (let i = 0, len = imgs.length; i < len; i++) { 
 imgs[i].title = '${document.title} image ${i}'; 
 } 
 let msg = document.getElementById("msg"); 
 msg.innerHTML = "Update complete."; 
}
function updateUI() { 
 let doc = document; 
// ....
}
```

##### 不使用`with()`

> with 语句会创建自己的作用域，
> 因此也会加长其中代码的作用域链。在 with 语句中执行的代码一定比在它外部执行的代码慢，因为作
> 用域链查找时多一步

##### 优化循环

ii. 使用后测试循环

```js
    for (let i = values.length - 1; i >= 0; i--) { 
 process(values[i]); 
}
let i = values.length-1; 
if (i > -1) { 
 do { 
 process(values[i]); 
 }while(--i >= 0); 
}
```

##### 其他优化

1. 用原生方法 (Math对象)
2. switch
   ii.如果代码中有复杂的 if-else 语句，将其转换成 switch 语句可以变得更
   快。然后，通过重新组织分支，把最可能的放前面，不太可能的放后面，可以进一步提升性能
3. 位操作很快

#### 语句最少化

1. 多个变量声明
   变为`,`

```js
// 有四条语句：浪费
let count = 5; 
let color = "blue"; 
let values = [1,2,3]; 
let now = new Date();

// 一条语句更好
let count = 5, 
color = "blue", 
values = [1,2,3], 
now = new Date();
```

2. 插入迭代性值

```js
let name = values[i]; 
i++;
// 推荐
let name = values[i++]; 

```

3. 使用数组和对象字面量

```js

// 创建和初始化数组用了四条语句：浪费
let values = new Array(); 
values[0] = 123; 
values[1] = 456; 
values[2] = 789; 
// 创建和初始化对象用了四条语句：浪费
let person = new Object(); 
person.name = "Nicholas"; 
person.age = 29; 
person.sayName = function() { 
 console.log(this.name); 
};


// 一条语句创建并初始化数组
let values = [123, 456, 789]; 
// 一条语句创建并初始化对象
let person = { 
 name: "Nicholas", 
 age: 29, 
 sayName() { 
 console.log(this.name); 
 } 
};
```

#### 与dom相关

##### `createDocumentFragment`

```js
let list = document.getElementById("myList"), 
 item; 
for (let i = 0; i < 10; i++) { 
 item = document.createElement("li"); 
 list.appendChild(item); 
 item.appendChild(document.createTextNode('Item ${i}'); 
}
```

`推荐`

```js

let list = document.getElementById("myList"), 
 fragment = document.createDocumentFragment(), 
 item; 
for (let i = 0; i < 10; i++) { 
 item = document.createElement("li"); 
 fragment.appendChild(item); 
 item.appendChild(document.createTextNode("Item " + i)); 
} 
list.appendChild(fragment);

```

##### 使用 innerHTML

> 在页面中创建新 DOM节点的方式有两种：使用 DOM方法如 `createElement()`和 `appendChild()`，
> 以及使用 `innerHTML`。对于少量 DOM 更新，这两种技术区别不大，`但对于大量 DOM 更新，使用innerHTML 要比使用标准 DOM 方法创建同样的结构快很多`

#### 代码压缩 JavaScript 编译

> 删除无用代码 转化为更简洁的代码、全局函数调用、常量和变量行内化

##### tree shaking

#### HTTP 压缩

> 所有当前主流的浏览器（IE/Edge、Firefox、Safari、Chrome 和 Opera）都支
> 持客户端解压缩收到的资源。服务器则可以根据浏览器通过请求头部（Accept-Encoding）标明自己支持
> 的格式，选择一种用来压缩 JavaScript 文件

> 使用 Apache 服务器上的两个模块（mod\_gzip 和 mod\_deflate）可以减少原始 JavaScript
> 文件的约 70%
