---
url: /blog/2024/02/06/eggjs-config-multi-env-and-plugin/index.md
---
Egg 用 ==多文件 config== 表达 **默认 / 环境 / 本地**；**插件** 把 **数据库、ORM、安全、Session** 等能力 **注册进应用**。本篇写 **合并直觉**、**环境变量注入**、**plugin.js 范例**，对齐线上「配置漂移」排障。

***

### 一、config 合并顺序（记层级即可）

由框架合并，常见 ==从下到上覆盖==（以官方文档为准）：

1. **框架内置默认**
2. **插件默认 config**
3. **`config/config.default.js`**（项目基线）
4. **`config/config.{env}.js`**（如 `prod`、`unittest`）
5. **`config/config.local.js`**（本机，**勿提交仓库**）

**环境**：`EGG_SERVER_ENV`（或团队脚本里导出）决定加载哪档；与 **`NODE_ENV`** 不要混为一谈——部署脚本里 **打印当前 env** 能少一半扯皮。

***

### 二、`config.default.js` 写法

支持 **对象** 或 **函数**（函数可拿到 `appInfo`）：

```js
/** @param {import('egg').EggAppInfo} appInfo */
module.exports = appInfo => ({
  keys: appInfo.name + '_change_me',

  cluster: {
    listen: {
      port: 7001,
      hostname: '0.0.0.0',
    },
  },

  sequelize: {
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'app',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  },
});
```

**敏感信息**：**密码、密钥只来自环境变量**，`config` 里 **不要写死**；`config.local.js` 仅个人开发机。

***

### 三、`plugin.js`：开什么插件

```js
exports.sequelize = {
  enable: true,
  package: 'egg-sequelize',
};

exports.redis = {
  enable: true,
  package: 'egg-redis',
};
```

**关闭**：`enable: false` 可 **显式关掉** 框架自带的某个能力（视插件支持）。**冲突**：两个插件都注册 **body 解析** 时，注意 **顺序与覆盖**，否则出现 **body 为空** 的诡异问题。

***

### 四、中间件顺序与 config

```js
module.exports = () => ({
  middleware: ['errorHandler', 'auth'],
});
```

**数组顺序 = 执行顺序**（洋葱外层到内层）。改一个中间件「为什么没生效」，先核对 **名字是否与文件名一致**、是否 **被 typo**。

***

### 五、和 Loader、线上排障的关系

* **「本地可以、线上不行」**：先 diff **`config.prod.js` vs default**、环境变量是否缺失、**是否读了错误的 `EGG_SERVER_ENV`**。
* **「插件行为不对」**：看该插件文档里 **依赖的 config 字段名**（大小写敏感）。

***

### 六、小结

配置 = **可审计的默认值 + 环境覆盖**；插件 = **可插拔模块**。上线前在 **预发** 打一条 **脱敏后的最终 config 快照**（或关键字段），比口头对齐靠谱。
