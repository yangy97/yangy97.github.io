---
url: /blog/2021/03/21/paralle-request/index.md
---
实现并发重点在于

1. 返回promise
2. 通过try catch finally 来拿到每一个请求 并且一一执行

在或者 通过promise.then().finally来处理,其实本质是一样的

```js
/*


*/
function fetch(url) {
  console.log(url);
  return url;
}
/**
 * @func
 * @Description
 * @Author: your name
 * @param {
 * array[] urls 请求数组
 * number maxNum 最大并发数量
 * }
 * @return {}
 */
function ParallelRequset(urls, maxNum) {
  return new Promise((resovle) => {
    if (urls.length === 0) {
      resovle([]);
      return;
    }
    let index = 0; // 当前请求下标
    const result = []; // 存放请求结果
    let count = 0; // 请求完成数量
    async function request() {
      if (index === urls.length) return;
      let i = index;
      const url = urls[index];
      index++;
      try {
        const resp = await fetch(url);
        result[i] = resp;
      } catch (error) {
        result[i] = error;
      } finally {
        count++;
        console.log(result, "111");
        if (count === urls.length) {
          return resovle(result);
        }
        request();
      }
    }
    const time = Math.min(urls.length, maxNum);
    for (let index = 0; index < time; index++) {
      request();
    }
    // request()
  });
}

const urls = [2, 1, 4, 3, 5, 6];
ParallelRequset(urls, 3).then((res) => {
  console.log(res);
});

```
