---
url: /blog/2020/10/22/vue-learn-build/index.md
---
### 构建脚本

我们通常会配置 `script` 字段作为 NPM 的执行脚本，`Vue.js` 源码构建的脚本如下:

```javascript 代码如下
{
  "script":{
    "build": "node scripts/build.js ",
    "build:ssr": "npm run build -- runtime-cjs,server-renderer",
  }
}
```

当在命令行运行 `npm run build` 的时候，实际上就会执行 `node scripts/build.js`，接下来我们来看看 `scripts/build.js` 文件

```javascript 代码如下

let builds = require('./config').getAllBuilds()

// filter builds via command line arg
// 拿到配置的第二个参数
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  console.log(filters, 'filters')
  // 查询需要打包的文件类型
  builds = builds.filter(b => {
    return filters.some(
      f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1
    )
  })
}
console.log(builds, '打印的build')
build(builds)

```

`process.argv[2]` 就是我们执行 `"build": "node scripts/build.js  --sourcemap",` 中的`--sourcemap` 参数
这段代码逻辑非常简单，先从配置文件读取配置，再通过命令行参数对构建配置做过滤，这样就可以构建出不同用途的 `Vue.js` 了。接下来我们看一下配置文件，在 `scripts/config.js`:

```javascript
const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'runtime-cjs-dev': {
    entry: resolve('web/entry-runtime.ts'),
    dest: resolve('dist/vue.runtime.common.dev.js'),
    format: 'cjs',
    env: 'development',
    banner
  },
  'runtime-cjs-prod': {
    entry: resolve('web/entry-runtime.ts'),
    dest: resolve('dist/vue.runtime.common.prod.js'),
    format: 'cjs',
    env: 'production',
    banner
  },
  //....省略部分代码
}
```

以 `web-runtime-cjs` 配置为例，它的 `entry` 是 `resolve('web/entry-runtime.js')`，先来看一下 `resolve` 函数的定义。

源码目录：`scripts/config.js`

```javascript
const aliases = require('./alias')
const resolve = p => {
  const base = p.split('/')[0]// ['web','entry-runtime.js']
  if (aliases[base]) {//base =>web
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    return path.resolve(__dirname, '../', p)
  }
}
```

在来看看`./alias`

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

很显然，这里 web 对应的真实的路径是 `path.resolve(__dirname, '../src/platforms/web')`，这个路径就找到了 Vue.js 源码的 web 目录。然后 `resolve` 函数通过 `path.resolve(aliases[base], p.slice(base.length + 1))` 找到了最终路径，它就是 Vue.js 源码 web 目录下的 `entry-runtime.js`。因此，web-runtime-cjs 配置对应的入口文件就找到了。

它经过 Rollup 的构建打包后，最终会在 dist 目录下生成 `vue.runtime.common.js`

## 大致过程就是如此

### 提一个 在vue2中

`"build": "node scripts/build.js  --sourcemap",` 添加第二参数为--sourcemap会报错 是因为vue2中如果没有修改内置文件，添加第二参数 是只能支持对应文件的打包 比如`"build": "node scripts/build.js  vue.esm.js",` 会打包` vue.esm.js` ，

## 问题来了？

那怎么才能像vue3中一样直接打印xxx.js.map文件呢？
其实很简单

通过分析, 我们发现, 我们通过加参数,是不能实现生成 对应的xxx.js.map 文件了, 既然不行, 我们就从 rollup 的 config 入手, 打开官方, 因为是打包输出, 所以我们自然而然的找到 config.output, 然后通过 vue3.x的 sourcemap, 找到 config.output.sourcemap, 接下来我们就去看看 生成 builds 的方法 getAllBuilds

> builds 的每一项 都执行了 genConfig 方法, 所以我们主要看 genConfig 方法

> 返回的就是 rollup 的 config, 所以我们只需要在 output 里面 加上 sourcemap: true, 就行了

```javascript
function genConfig(name) {
  const opts = builds[name];

  // 省略代码

  const config = {
    input: opts.entry,
    external: opts.external,
    plugins: [
      alias({
        entries: Object.assign({}, aliases, opts.alias),
      }),
      ts({
        /** 省略 ts plugin 参数 */
      }),
    ].concat(opts.plugins || []),
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: opts.moduleName || 'Vue',
      exports: 'auto',
    },
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
  };

  // 省略代码

  return config;
}

function buildEntry(config) {
  console.log(config, '打印的配置')
  const output = config.output
  const { file, banner } = output
  const isProd = /(min|prod)\.js$/.test(file)
  return rollup
    .rollup(config)
    .then(bundle => bundle.write(output))//这里修改为rollup 的write方法 原本是generate  查看rollup.d.ts文件 发现generate 和write是返回的一样的类型 
    .then(async ({ output: [{ code, map }] }) => {
      if (isProd) {
        const { code: minifiedCode } = await terser.minify(code, {
          toplevel: true,
          compress: {
            pure_funcs: ['makeMap']
          },
          format: {
            ascii_only: true
          }
        })
        const minified = (banner ? banner + '\n' : '') + minifiedCode
        return write(file, minified, true)
      } else {
        if (map) {
          const splitArr = file.split('/')
          code += `//# sourceMappingURL=${splitArr[splitArr.length - 1]}.map`
        }
        return write(file, code)
      }
    })
}
```
