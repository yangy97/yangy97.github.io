---
url: /blog/2021/12/28/js-learn-xhr/index.md
---
### XHR

#### readyState

1. 0：未初始化（Uninitialized）。尚未调用 open()方法。
2. 1：已打开（Open）。已调用 open()方法，尚未调用 send()方法。
3. 2：已发送（Sent）。已调用 send()方法，尚未收到响应。
4. 3：接收中（Receiving）。已经收到部分响应。
5. 4：完成（Complete）。已经收到所有响应，可以使用了。
   每次 readyState 从一个值变成另一个值，都会触发 readystatechange 事件

```js
let xhr = new XMLHttpRequest(); 
xhr.onreadystatechange = function() { 
 if (xhr.readyState == 4) { 
 if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) { 
 alert(xhr.responseText); 
 } else { 
 alert("Request was unsuccessful: " + xhr.status); 
 } 
 } 
}; 
xhr.open("get", "example.txt", true); 
xhr.send(null);
```

#### setRequestHeader

> 放在open后 send前
> key=》value

```js
xhr.setRequestHeader("MyHeader", "MyValue");
```

### Fetch

> 第一个参数 一般来说是URL,第二个对象,fetch返回一个promise

```js
let payload = JSON.stringify({ 
 foo: 'bar' 
}); 
let jsonHeaders = new Headers({ 
 'Content-Type': 'application/json' 
}); 
fetch('/send-me-json', { 
 method: 'POST', // 发送请求体时必须使用一种 HTTP 方法
 body: payload, 
 headers: jsonHeaders 
});
```

#### 中断请求

```js
let abortController = new AbortController(); 
fetch('wikipedia.zip', { signal: abortController.signal }) 
.catch(() => console.log('aborted!'); 
// 10 毫秒后中断请求
setTimeout(() => abortController.abort(), 10)
```

### Web Socket

```js
let socket = new WebSocket("ws://www.example.com/server.php");
```

浏览器会在初始化 WebSocket 对象之后立即创建连接。与 XHR 类似，WebSocket 也有一个
readyState 属性表示当前状态。不过，这个值与 XHR 中相应的值不一样。

1. WebSocket.OPENING（0）：连接正在建立。
2. WebSocket.OPEN（1）：连接已经建立。
3. WebSocket.CLOSING（2）：连接正在关闭。
4. WebSocket.CLOSE（3）：连接已经关闭。

#### 事件

1. open：在连接成功建立时触发。
2. error：在发生错误时触发。连接无法存续。
3. close：在连接关闭时触发。

````js
let socket = new WebSocket("ws://www.example.com/server.php"); 
socket.onopen = function() { 
 alert("Connection established."); 
}; 
socket.onerror = function() { 
 alert("Connection error."); 
}; 
socket.onclose = function() { 
 alert("Connection closed."); 
};```
````
