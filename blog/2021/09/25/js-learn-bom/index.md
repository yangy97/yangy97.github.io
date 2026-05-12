---
url: /blog/2021/09/25/js-learn-bom/index.md
---
### BOM

#### setTimeOut中this指向

> 所有超时执行的代码（函数）都会在全局作用域中的一个匿名函数中运行，因此函数中的 this 值在非严格模式下始终指向 window，而在严格模式下是 undefined。如果给 setTimeout()提供了一个箭头函数，那么 this 会保留为定义它时所在的词汇作用域

#### URLSearchParams

> 这个实例上暴露了 get()、set()和 delete()等方法

```js
let qs = "?q=javascript&num=10"; 
let searchParams = new URLSearchParams(qs); 
console.log(searchParams.toString()); // " q=javascript&num=10"
```

#### screen

> 包含一些是客户端能力信息 感兴趣可以去查询

#### history

##### go()

> 这个方法只接收一个参数，这个参数可以是一个整数，表示前进或后退多少步。负值表示在历史记录中后退,旧版本可以是字符串

```js
history.go(-1); 
// 前进一页
history.go(1); 
// 前进两页
history.go(2);
// 导航到最近的 wrox.com 页面
history.go("wrox.com"); 
// 导航到最近的 nczonline.net 页面
history.go("nczonline.net");
```

> back() 和 forward()是go()简写

##### history.pushState()

> 第一个是一个对象 大小 500KB～1MB,包含正确初始化页面状态所必需的信息 ,第二个是标题,第三个可选 表示url

1. `浏览器页不会向服务器发送请求`

```js
let stateObject = {foo:"bar"};
history.pushState(stateObject, "My title", "baz.html");
```

#### navigator

##### 检测插件 有兼容性

```js

let hasPlugin = function(name) { 
 name = name.toLowerCase(); 

 for (let plugin of window.navigator.plugins){ 
 if (plugin.name.toLowerCase().indexOf(name) > -1){ 
 return true; 
 } 
 } 
 return false; 
} 
// 检测 Flash 
console.log(hasPlugin("Flash")); 
// 检测 QuickTime 
console.log(hasPlugin("QuickTime"));
```

##### 低版本

```js
// 在旧版本 IE 中检测插件
function hasIEPlugin(name) { 
 try { 
 new ActiveXObject(name); 
 return true; 
 } catch (ex) { 
 return false; 
 } 
} 
// 检测 Flash 
console.log(hasIEPlugin("ShockwaveFlash.ShockwaveFlash")); 
// 检测 QuickTime 
console.log(hasIEPlugin("QuickTime.QuickTime"));
```

##### navigator.geolocation

> 可以获取定位信息 ,第一次调用会提示是否开启

```js
// getCurrentPosition()会以 position 对象为参数调用传入的回调函数
navigator.geolocation.getCurrentPosition((position) => p = position);
console.log(p.timestamp); // 1682592952477 
console.log(p.coords); //GeolocationCoordinates{}

```

##### Battery Status API

> 浏览器可以访问设备电池及充电状态的信息。navigator.getBattery()方法会返回一个期约(promise)实例，解决为一个 BatteryManager 对象。

```js
navigator.getBattery().then((b) => console.log(b));
 // 添加充电状态变化时的处理程序
 navigator.getBattery().then((battery) => {
 const chargingChangeHandler = () => console.log('chargingchange'); 
 battery.onchargingchange = chargingChangeHandler; 
 // 或
 battery.addEventListener('chargingchange', chargingChangeHandler); 
 // 添加充电时间变化时的处理程序
 const chargingTimeChangeHandler = () => console.log('chargingtimechange'); 
 battery.onchargingtimechange = chargingTimeChangeHandler; 
 // 或
 battery.addEventListener('chargingtimechange', chargingTimeChangeHandler); 
 // 添加放电时间变化时的处理程序
 const dischargingTimeChangeHandler = () => console.log('dischargingtimechange'); 
 battery.ondischargingtimechange = dischargingTimeChangeHandler; 
 // 或
 battery.addEventListener('dischargingtimechange', dischargingTimeChangeHandler); 
 // 添加电量百分比变化时的处理程序
 const levelChangeHandler = () => console.log('levelchange'); 
 battery.onlevelchange = levelChangeHandler; 
 // 或
 battery.addEventListener('levelchange', levelChangeHandler); 
});
```
