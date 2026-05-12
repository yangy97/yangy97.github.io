---
url: /blog/2021/08/19/js-learn-9/index.md
---
### Proxy

> 代理是使用 Proxy 构造函数创建的,这个构造函数接收两个参数：目标对象和处理程序对象。缺少其中任何一个参数都会抛出 TypeError

```js
const target = { 
 id: 'target' 
}; 
const handler = {}; 
const proxy = new Proxy(target, handler); 
// id 属性会访问同一个值
console.log(target.id); // target 
console.log(proxy.id); // target
// 给目标属性赋值会反映在两个对象上
// 因为两个对象访问的是同一个值
target.id = 'foo'; 
console.log(target.id); // foo 
console.log(proxy.id); // foo 
// 给代理属性赋值会反映在两个对象上
// 因为这个赋值会转移到目标对象
proxy.id = 'bar'; 
console.log(target.id); // bar 
console.log(proxy.id); // bar
```

### 定义一个 get()捕获器

```js
const target = { 
 foo: 'bar' 
}; 
const handler = { 
 // 捕获器在处理程序对象中以方法名为键
 get() { 
 return 'handler override'; 
 } 
}; 
const proxy = new Proxy(target, handler);
```

> proxy\[property]、proxy.property 或 Object.create(proxy)\[property]等操作都
> 会触发基本的 get()操作以获取属性 只有在代理对象上执行这些操作才会触发捕获器

#### get

> 包含三个参数 1. 到目标对象 2. 要查询的属性 3. 代理对象

```js
const target = { 
 foo: 'bar' 
}; 
const handler = { 
 get(trapTarget, property, receiver) { 
 console.log(trapTarget === target); 
 console.log(property); 
 console.log(receiver === proxy); 
 } 
}; 
const proxy = new Proxy(target, handler); 
proxy.foo; 
// true 
// foo 
// true
```

### Reflect 反射

> 和proxy一一对应

```js
const target = { 
 foo: 'bar' 
}; 
const handler = { 
 get() { 
 return Reflect.get(...arguments); 
 } 
}; 
const proxy = new Proxy(target, handler); 
console.log(proxy.foo); // bar 
console.log(target.foo); // bar
```

> 大致介绍几种 有兴趣可以去看看红宝书 、反射代理都是一一对应的

1. 处理` obj.xxx` 使用 `get`

```js
const obj = {
  name: 'xiaoyang',
};
const proxy = new Proxy(obj, {
  get(target, key, receiver) {
    console.log('get');
    return Reflect.get(target, key, receiver);
  },
});

```

2. 处理 `obj.xxx = xxx` 使用 `set`

```js
const obj = {
  name: 'xiaoyang',
};
const proxy = new Proxy(obj, {
  set(target, key, newVal, receiver) {
    console.log('set');
    return Reflect.set(target, key, newVal, receiver);
  },
});

```

3. 处理 `in` 操作符 使用 `has`

```js
const obj = {
  name: 'xiaoyang',
};
const proxy = new Proxy(obj, {
  has(target, key) {
    console.log('has');
    return Reflect.has(target, key);
  },
});

```

4. 处理 `for ... in` 使用 `ownkeys`

```js
const obj = {
  name: 'xiaoyang',
};
const proxy = new Proxy(obj, {
  ownkeys(target) {
    console.log('ownkeys');
    return Reflect.ownkeys(target);
  },
});

```

5. 处理 `delete` 操作符 使用 `deleteProperty`

```js
const obj = {
  name: 'xiaoyang',
};
const proxy = new Proxy(obj, {
  deleteProperty(target, key) {
    console.log('deleteProperty');
    return Reflect.deleteProperty(target, key);
  },
});

```
