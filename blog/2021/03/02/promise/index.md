---
url: /blog/2021/03/02/promise/index.md
---
### promise A+

```js
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
class MyPromise {
  #state = PENDING;
  #result = undefined;
  #handler = [];
  constructor(executor) {
    const resolve = (data) => {
      this.#changeState(FULFILLED, data);
    };
    const reject = (reason) => {
      this.#changeState(REJECTED, reason);
    };
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
  #isPromise(value) {
    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function")
    ) {
      return typeof value.then === "function";
    }
    return false;
  }
  #changeState(state, result) {
    //当状态改变后 不再继续执行
    if (this.#state !== PENDING) return;
    //修改当前状态
    this.#state = state;
    // 修改当前结果 成功或者失败
    this.#result = result;
    this.#run();
  }

  #run() {
    if (this.#state === PENDING) return;
    while (this.#handler.length) {
      let { onFulfilled, onRejected, resolve, reject } = this.#handler.shift();
     
      if (this.#state === FULFILLED) {
        this.#runOne(onFulfilled, resolve, reject);
      } else {
        this.#runOne(onRejected, resolve, reject);
      }
    }
  }
  #runOne(callback, resolve, reject) {
    this.#runMicroTask(() => {
       // 执行resolve, reject 的时机
      // 1 不是函数
     
      if (typeof callback !== "function") {
        const settle = this.#state === FULFILLED ? resolve : reject;
        settle(this.#result);
        return;
      }
      try {
         // 2.返回了promise
        const data = callback(this.#result);

        if (this.#isPromise(data)) {
          data.then(resolve, reject);
        } else {
          resolve(data);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  #runMicroTask(func) {
    // node.js
    if (typeof process === "object" && typeof process.nextTick === "function") {
      process.nextTick(func);
    }
    //browser
    else if (typeof MutationObserver === "function") {
      const ob = new MutationObserver(func);
      const textNode = document.createTextNode("1");
      ob.observe(textNode, { characterData: true });
      textNode.data = "2";
    } else {
      setTimeout(func, 0);
    }
  }
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.#handler.push({
        onFulfilled,
        onRejected,
        resolve,
        reject,
      });
      this.#run();
    });
  }
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
  static resolve(value) {
    if (value instanceof MyPromise) return value;
    let _resolved, _rejected;
    const p = new MyPromise((resolve) => {
      _resolved = resolve;
      _rejected = reject;
    });
    if (p.#isPromise(value)) {
      value.then(_resolved, _rejected);
    } else {
      _resolved(value);
    }
    return p;
  }
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }
  finally(onFinally) {
    return this.then(
      (data) => {
        onFinally();
        return data;
      },
      (err) => {
        onFinally();
        throw err;
      }
    );
  }
}


```

### promise all/race/any

```js
// 为了测试，实现一个 sleep 函数
const timeAll = (seconds) =>
  new Promise((resolve) => setTimeout(() => resolve(seconds), seconds));

// Promise.all([timeAll(1000), timeAll(2000), timeAll(3000)]).then((res) => {
//   console.log(res);
// });
const PromiseAll = (iteableList) => {
  return new Promise((resolve, reject) => {
    const result = [];
    const iteablelist = Array.from(iteableList);
    const len = iteableList.length;
    let count = 0;
    for (let index = 0; index < len; ++index) {
      Promise.resolve(iteablelist[index])
        .then((o) => {
          result[index] = o;
          console.log(result, "这里打印的值");
          if (++count === len) {
            return resolve(result);
          }
        })
        .catch((e) => {
          reject(e);
        });
    }
    return result;
  });
};

PromiseAll([timeAll(1000), timeAll(2000), timeAll(3000)]).then((res) => {
  console.log(res);
});

```

```js
const timeAll = (seconds) => {
  if (seconds === 2000) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(seconds), seconds);
    }).catch((e) => {
      console.log(e, "打印的错误");
    });
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(seconds), seconds);
  });
};


const PromiseRace = (iteableList) => {
  return new Promise((resolve, reject) => {
    for (let index = 0; index < iteableList.length; ++index) {
      Promise.resolve(iteableList[index])
        .then((o) => {
          resolve(o);
        })
        .catch((e) => {
          reject(e);
        });
    }
  });
};

PromiseRace([timeAll(1000), timeAll(2000), timeAll(3000)]).then((res) => {
  console.log(res);
});
```

## 手写any

```js
MyPromise.any = function(promises){
  return new Promise((resolve,reject)=>{
    promises = Array.isArray(promises) ? promises : []
    let len = promises.length
    // 用于收集所有 reject 
    let errs = []
    // 如果传入的是一个空数组，那么就直接返回 AggregateError
    if(len === 0) return reject(new AggregateError('All promises were rejected'))
    promises.forEach((promise)=>{
      promise.then(value=>{
        resolve(value)
      },err=>{
        len--
        errs.push(err)
        if(len === 0){
          reject(new AggregateError(errs))
        }
      })
    })
  })
}
```

## 插播一条 实现一个浅拷贝 保留原型链

```js
function shallowCopy(src) {
  // 方案一
  // const handler = {};
  // const copyObj = new Proxy(src, handler);
  // return copyObj;
  // 方案二
  var copyProto = Object.getPrototypeOf(src);
  var copyObj = Object.assign(Object.create(copyProto), src);
  return copyObj;
}
```
