---
url: /blog/2020/08/08/js-learn/index.md
---
## typeof 与instanceof的区别

1. typeof 检测数据类型   少null多function\
   \==为什么 typeof null  =>object  ？==

   **在计算机中object存储的格式为二进制码，后三位000
   null 在计算机存储的时候全是000 所以显示  object**

**typeof function(){}    //function**

```
当typeof检测function的时候，如果有[[call]]方法就会显示function，反之为object
```

**instanceof 检测是布尔值 bool:true  false  顺着原型链检测**

建议使用 Object.prototype.toString.call(null)检测，返回的是对应的数据类型 如下"\[object Null]"

## 深浅拷贝

先说一说栈和堆  以及我自己对深浅拷贝的基本理解

```
    栈：计算机为原始类型开辟的一块内存空间 string number...   存的就是对应的值
    堆：计算机为引用类型开辟的一块内存空间 object  在栈里面存的是地址值 所以var a= {key:1} var b=a; b.key=2;会改变对应的值

    深浅拷贝 ：遍历赋值 Object.create() json.parse() json.stringif()
    深浅拷贝：简单来说如果B复制了A,当修改了A，B跟着一起变化，这就是浅拷贝，B没有变就是深拷贝
```

```javascript
var obj = {
            a: 1,
            b: {
                c: 2,
                d: 3
            },
            f: {
                g: 4
            }
        }
        //简单浅拷贝
        function copyObj(obj) {
            var objNew = {}
            for (let i in obj) {
                objNew[i] = obj[i]
            }
            return objNew
        }
        let objNew = copyObj(obj)
        objNew.b.c = 7
        console.log(obj)
        console.log(objNew)
        object.create()
        //利用Object.create实现浅拷贝
        var obj1 = Object.create(obj)
        obj1.b.c = 5
        console.log(obj)
        console.log(obj1)
        //深拷贝遍历加递归
        function deepCopy(obj, end) {
            var array = end || {};
            for (let key in obj) {
                if (typeof obj[key] == 'object') {
                    array[key] = obj[key].constructor == Array ? [] : Object.create({});
                    deepCopy(obj[key], array[key]);
                } else {
                    array[key] = obj[key]
                }
            }
            return array
        }
        var objNew = deepCopy(obj)
        objNew.b.c = 888

        console.log(obj)
        console.log(objNew)
        //原理在于先将object转化成string这个时候就是在栈里面保存的是值，在赋值的时候然后转换为object，这就简单的实现了深拷贝
//JSON.parse和JSON。stringify结合
        var objNew = JSON.parse(JSON.stringify(obj))
        objNew.a = 5555
        console.log(obj)
        console.log(objNew)
```

**特殊类型的隐式转换 NaN 0 null undefined "" =>false  其他都为true**

**js舍入误差**

```javascript
//第一种
  console.log(parseFloat(0.1 + 0.2).toFixed(2))
  //第二种
    function add(num1, num2) {
        let m = Math.pow(10, 2)
        return (num1 * m + num2 * m) / m

        // return (par)
    }
    console.log(add(0.1, 0.2))
```

## js常见内置对象

1. 三种包装对象：String Number Boolean
2. 其他常见标准内置对象：Array ,Date,function

## js中装箱和拆箱

装箱：基本数据类型变为对应的引用数据类型的操作
拆箱：引用类型对象转换为对应的值类型对象

js内部转换的过程![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a9a2439964034e84a33297df97af1e07~tplv-k3u1fbpfcp-zoom-1.image)

面试题

```javascript
   console.log([] + {})//[object Object]
        console.log({} + [])//[object Object] 或者 0，输出0是因为有些浏览器把｛｝当做代码块 console.log(+[])
        console.log(+[])
```

**栈：后进先出
队列：先进先出**

**数组的push pop unshift shift方法**

```javascript
var arr = [1, 2, 3, 4, 5, 6, 7]
//结尾出入栈 不影响数据本身索引位置 效率高点
        arr.push(8)
        console.log(arr)// [1, 2, 3, 4, 5, 6, 7, 8]
        var arr1 = arr.pop()
        console.log(arr1)//8
        console.log(arr)//[1, 2, 3, 4, 5, 6, 7]
        //开头出入栈 影响数据本身索引位置 效率低点
        arr.unshift(10)
        console.log(arr)//[10, 1, 2, 3, 4, 5, 6, 7]
        var arr2 = arr.shift()
        console.log(arr, arr2)//[1, 2, 3, 4, 5, 6, 7] 10
```

**js中sort函数**

```javascript
//sort排序：1.默认升序
        //2.将值转换为字符串，在寻找对应的Unicode码，根据Unicode排序
        //解决，定义一个比较器函数
        /arr1.sort(function (x, y) {
             return x - y  //小于0 x移动到y前面，大于0 移动到后面
         })
```

**地址栏转码，目前我遇到的就是在小程序端，移动端，对地址做解码**

```javascript
   var url = "http://localhost:8000/url?name=张三&age=12";
        console.log(unescape(escape(url))) //ASCII解码方式
        console.log(decodeURI(encodeURI(url)))
        console.log(decodeURIComponent(encodeURIComponent(url)))//简单一点就是上面两种的结合，
```

**Dom树解析**
![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/330b3d6f06ac483aab21f7dbbce1be25~tplv-k3u1fbpfcp-zoom-1.image)![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/aaae8abc3a0a49b39b644458a914c6b9~tplv-k3u1fbpfcp-zoom-1.image)
**重绘不一定引起回流，回流一定重绘**
回流：宽高，边距等发生变化，重新生成dom树，相当于刷新页面
重绘：元素颜色，背景等变化，不刷新页面

**js中三大事件**

```javascript
<input type="button" value="html事件" onclick="fun()">
    <input type="button" value="dom0级事件" id="dom0">
    <input type="button" value="dom2级事件" id="dom2">
    <script>
        //广义JavaScript：ECMAScript DOM BOM DOM0 DOM1 DOM2
        //狭义JavaScript：ECMAScript
        //1、html事件
        function fun() {
            alert('html事件')
        }

        //dom0级事件：事件绑定  只会执行最后一个绑定函数
        document.getElementById('dom0').onclick = function () {
            alert('dom0级事件')
        }
        //dom2级事件:事件监听  可绑定多个事件 因为js不支持事件重载，事件绑定相当于存了地址值，事件监听相当于发布订阅者
        //element.addEventListener(event,function,useCapture)
        //event, 必须 事件名
        //function 必须 事件名触发的函数，
        //useCapture 可选 指定事件是否在捕获或者冒泡阶段执行，true捕获，false冒泡 默认false
        //IE event. element.attachEvent(event,function) event 必须是 on-事件
        document.getElementById('dom2').addEventListener('click', function () {
            alert('dom2级事件')
        })

```

**事件监听  可绑定多个事件 因为js不支持事件重载，事件绑定相当于存了地址值，事件监听相当于发布订阅者**

**事件绑定  只会执行最后一个绑定函数**

匿名函数  ：定义的时候没有任何变量引用的函数
匿名函数的自调：函数只执行一次

```javascript
 (function (a, b) {
            console.log('a', +a);
            console.log('b', +b)
        })(1, 2)
        var button = [{ name: 1 }, { name: 2 }, { name: 3 }];
        function bind() {
            for (let index = 0; index < button.length; index++) {
                button[index].fun = function () {
                    console.log(index)
                }

            }
        }
        bind()
        button[0].fun();

        button[1].fun();
        button[2].fun();
```

类数组转换为数组Array.prototype.slice.apply    apply的应用

```javascript
   function bind() {
            var arr = Array.prototype.slice.apply(arguments)
            consol.log(arguments)
            console.log(arr)
        }
        bind(1, 2, 3, 4, 5)
```

**原型和原型链**

```javascript
//
        //1 一句话 =万物介对象 万物皆空null js
        //2 两个定义：原型：保存所有子对象的共有属性值和方法的父对象、原型链：由各级子对象的__proto__属性连续引用形成的结构
        //3. 三个属性：__proto__,constructor、prototype
        //创建一个类，当函数创建的时候会携带一个prototype属性，这个属性指向prototype对象也就是原型对象：｛｝原型对象创建完成后有一个；constructor 
        function Person(name, age) {
            this.name = name;
            this.age = age;
            this.say = function () {
                console.log('我是' + name)
            }
        }
        // 当函数创建的时候会携带一个prototype属性，这个属性指向prototype对象也就是原型对象
        Person.prototype.money = 20;
        Person.prototype.run = function () {
            console.log('跑步')
        }
        //constructor:Person.prototype 指针指向Person
        console.log(Person.prototype.constructor)

        var p1 = new Person('张三', 18);//实例化p1 .__proto__,所有对象都会有__proto__属性，是js中的内部属性
        console.log(p1.money)//20
        // console.log(p1.__proto__ == Person.prototype)//true
        console.log(Person.__proto__)
```

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ab971a43e8be4da6b7675ee98ce0c5d7~tplv-k3u1fbpfcp-zoom-1.image)
![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b8d7cea188b4bde9e9ba3bf16e8827d~tplv-k3u1fbpfcp-zoom-1.image)
![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4d93ef8fa45d4a4fbd012e6d5ddc9e48~tplv-k3u1fbpfcp-zoom-1.image)
**利用原型链写的一个tab切换的函数**

```javascript
 <div class="contentBlock">
        <div id="tabs">

            <li class="active tabs">
                tab1
            </li>
            <li class="tabs">
                tab2
            </li>
            <li class="tabs">
                tab3
            </li>
            <li class="tabs">
                tab4
            </li>

            <div class="bottomContent">
                <div class="blockContent"> tab1</div>
                <div class="blockContent none"> tab2</div>
                <div class="blockContent none">tab3</div>
                <div class="blockContent none">tab4</div>
            </div>
        </div>


    </div>
    <script>
        function Tabs(id) {
            var tabIds = document.getElementById(id);
            console.log(tabIds)
            // var tabDiv = tabIds.getElementsByClassName('tabDiv');
            var tabsSelect = tabIds.getElementsByClassName('tabs')[0];
            this.lis = tabIds.getElementsByTagName('li');
            this.divContentBlock = tabIds.getElementsByClassName('blockContent');
            console.log(this.lis, this.divContentBlock);
            for (let index = 0; index < this.lis.length; index++) {
                var that = this;
                // that.lis[index].num = index;
                console.log(index, 555)
                that.lis[index].onclick = function () {
                    that.TabChange(index);
                    console.log(index, 555)
                }

            }
        }
        Tabs.prototype.TabChange = function (j) {
            for (let index = 0; index < this.lis.length; index++) {
                this.lis[index].className = '';
                this.divContentBlock[index].className = ''
            }
            this.lis[j].className = "active";
            this.divContentBlock[j].style.display = 'block'
        }
        new Tabs('tabs')
    </script>
```

vue2.0中响应式数据

```javascript
function defineProperty(obj, key, val) {
            Object.defineProperty(obj, key, {
                get() {
                    console.log('get', val)
                    return val
                },
                set(newVal) {
                    if (newVal !== val) {
                        console.log('set', val, newVal)
                        val = newVal
                    }
                }
            })
        }
        let obj = {};
        defineProperty(obj, 'foo', '456')
        obj.foo
```

\*\*

## js数组对象数据格式处理

\*\*

```javascript
var list = [{"id" : 5, "name": "小明", "age" : 5},
    {"id" : 2, "name": "小红", "age" : 12},
    {"id" : 3, "name": "小花", "age" : 8},
    {"id" : 1, "name": "小红", "age" :24},
    {"id" : 4, "name": "小黑", "age" : 10}];
     var list1 = [
       {
         name:'小明',
         item:[
         {"id" : 5, "name": "小明", "age" : 5}
         ]
       },
       {
         name:'小红',
         item:[
         {"id" : 2, "name": "小红", "age" : 12},
         {"id" : 1, "name": "小红", "age" :24},
         ]
       },
       {
         name:'小黑',
         item:[
         {"id" : 4, "name": "小黑", "age" : 10}
         ]
       },
];
    let tempArr = [], newArr = []
    for (let i = 0; i < list1.length; i++) {
      if (tempArr.indexOf(list1[i].name) === -1) {
        newArr.push({
          name: list1[i].name,
          item: [list1[i]]
        })
        tempArr.push(list1[i].name);
      } else {
        for (let j = 0; j < newArr.length; j++) {
          if (newArr[j].name == list1[i].name) {
            newArr[j].item.push(list1[i])
            newArr[j].item.sort(compare('age'))
            // newArr[j].sort(sort1( newArr[j].item))
            let te1 = 0;
           for(let i=1;i<newArr.length;i++){
             debugger
             if(newArr[te1].item.length<newArr[i].item.length){
              var temp = newArr[i];
                newArr[i] = newArr[te1];
                newArr[te1] = temp;
                te1++
             }
           }
          }
        }
      }
    }
    function compare(property){
	return function (obj1,obj2){
		return obj2[property]-obj1[property];
	}
}
```

**持续更新中**
