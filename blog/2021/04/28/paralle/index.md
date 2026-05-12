---
url: /blog/2021/04/28/paralle/index.md
---
话不多说只是上代码

```js
function isPromise(p) {
if (typeof p === "object" && typeof p.then === "function") {
  return true;
}

return false;
}

class Parallel {
constructor(parallelCount) {
  this.parallelCount = parallelCount || 2; //最大并发数量
  this.runningCount = 0; // 正在运行的数量
  this.taskQueue = [];
}
add(task) {
  return new Promise((resolve, reject) => {
    //添加任务到任务队列中
    this.taskQueue.push({
      task,
      resolve,
      reject,
    });
    this.runTask();
  });
}
runTask() {
  //执行数量小于最大并发并且队列存在任务
  while (this.runningCount < this.parallelCount && this.taskQueue.length) {
    const { task, resolve, reject } = this.taskQueue.shift();
    if (isPromise(task())) {
      // 运行任务++
      this.runningCount++;
      task()
        .then(resolve, reject)
        .finally(() => {
          // 完成后执行数量--
          this.runningCount--;
          this.runTask();
        });
    } else {
      throw new Error("task必须是promise");
    }
  }
}
}

function timeout(time) {
return new Promise((resolve) => {
  setInterval(() => {
    resolve();
  }, time);
});
}

const superTask = new Parallel();
function addTask(time, id) {
superTask
  .add(() => timeout(time))
  .then(() => {
    console.log(`任务${id}完成`);
  });
}
addTask(1000, 1);
addTask(1000, 2);
addTask(1000, 3);
addTask(1000, 4);
addTask(1000, 5);

```
