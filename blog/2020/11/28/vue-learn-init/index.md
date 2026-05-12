---
url: /blog/2020/11/28/vue-learn-init/index.md
---
## ==1、源码下载==

```javascript
https://github.com/vuejs/vue.git
```

直接克隆下来

## **2.基本构建**

基本构建入口 `scripts/build.js`

```javascript
let builds = require('./config').getAllBuilds()

// filter builds via command line arg
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
} else {
  // filter out weex builds by default
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}

build(builds)
```

先从配置文件读取配置，再通过命令行参数对构建配置做过滤，这样就可以构建出不同用途的 Vue.js 了，在看看`config.js`中是怎么做的

```javascript
const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'web-runtime-cjs': {
    entry: resolve('web/entry-runtime.js'),
    dest: resolve('dist/vue.runtime.common.js'),
    format: 'cjs',
    banner
  },
  // Runtime+compiler CommonJS build (CommonJS)
  'web-full-cjs': {
    entry: resolve('web/entry-runtime-with-compiler.js'),
    dest: resolve('dist/vue.common.js'),
    format: 'cjs',
    alias: { he: './entity-decoder' },
    banner
  },
  // Runtime only (ES Modules). Used by bundlers that support ES Modules,
  // e.g. Rollup & Webpack 2
  'web-runtime-esm': {
    entry: resolve('web/entry-runtime.js'),
    dest: resolve('dist/vue.runtime.esm.js'),
    format: 'es',
    banner
  },
  。。。。。
  }
```

其中 `entry` 属性表示构建的入口 JS 文件地址，`dest` 属性表示构建后的 JS 文件地址。`format` 属性表示构建的格式，`cjs` 表示构建出来的文件遵循 `CommonJS` 规范，`es` 表示构建出来的文件遵循 `ES Module` 规范。 `umd` 表示构建出来的文件遵循 `UMD` 规范

`resolve`函数具体操作

```javascript
const aliases = require('./alias')
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    return path.resolve(__dirname, '../', p)
  }
}
```

`resolve`函数很简单，分割参数，在./alias中去做匹配 利用别名找到真实地址路径

```javascript
const path = require('path')

module.exports = {
  vue: path.resolve(__dirname, '../src/platforms/web/entry-runtime-with-compiler'),
  compiler: path.resolve(__dirname, '../src/compiler'),
  core: path.resolve(__dirname, '../src/core'),
  shared: path.resolve(__dirname, '../src/shared'),
  web: path.resolve(__dirname, '../src/platforms/web'),
  weex: path.resolve(__dirname, '../src/platforms/weex'),
  server: path.resolve(__dirname, '../src/server'),
  entries: path.resolve(__dirname, '../src/entries'),
  sfc: path.resolve(__dirname, '../src/sfc')
}
```

**以上就是最简单的构建（个人的理解）**

## 3.new Vue 发生了什么

来看看源码，在文件的`src/core/instance/index.js`中，其实就是个简单的类，
Vue 实际上是一个类，类在 Javascript 中是用 Function 来实现的

```javascript
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```

在看看`_init`函数发生了什么

```javascript
Vue.prototype._init = function (options?: Object) {
........
    initLifecycle(vm) //初始化生命周期
    initEvents(vm) //初始化事件中心
    initRender(vm) //初始化渲染 
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props inject
    initState(vm)
    initProvide(vm) // resolve provide after data/props provide 
    callHook(vm, 'created')
}
```

最重要的就是这些函数，Vue 初始化主要就干了几件事情，合并配置，初始化生命周期，初始化事件中心，初始化渲染，初始化 data、props、computed、watcher 等等

本期就到这里
