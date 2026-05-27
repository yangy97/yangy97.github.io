---
url: /blog/2026/05/18/miniprogram-cloudbase-cloud-function-debug/index.md
---
云开发（CloudBase）适合 **轻后端**：鉴权、CRUD、触发器，不用自建 Egg 也能上线。但 **环境隔离、权限规则、冷启动、本地调试** 若没理清，容易出现「开发能跑、上线 403」。

***

### 一、架构一眼

```text
小程序 wx.cloud ──► 云函数 / 云数据库 / 云存储
                      │
                      └── 环境 ID：dev / prod 分离
```

`wx.cloud.init({ env: 'xxx-dev' })` **不要写死 prod**；用 ext 配置或 CI 注入。

***

### 二、云函数最小示例

```javascript
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
  };
};
```

小程序端：

```javascript
wx.cloud.callFunction({ name: 'login' }).then(console.log);
```

***

### 三、数据库权限规则

\==默认拒绝==，按集合写规则：

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

**管理端写全员数据** 应走 **云函数 + 管理员校验**，不要放宽客户端 write 规则。

***

### 四、本地调试

1. 安装 **微信开发者工具** + 云开发控制台
2. `cloud functions` 目录右键 **上传并部署**（云端安装依赖）
3. 本地调试：工具里选 **云函数本地调试**，断点打在 `index.js`
4. 环境变量：控制台配置 **环境变量**，不要硬编码密钥

**冷启动**：合并小函数、减少依赖体积；高频接口考虑 **固定并发**（按套餐）。

***

### 五、与自建 BFF 混用

| 场景 | 建议 |
|------|------|
| 简单 CRUD、用户私有数据 | 云数据库 |
| 复杂事务、对接 ERP、支付 notify | 自建 BFF（Egg 等） |
| 统一登录 | 云函数换 openid → BFF 换 JWT |

支付 notify **必须在公网 HTTPS 服务端**，不要只放云函数而不验签。

***

### 六、上线 checklist

* \[ ] dev/prod 环境 ID 分离
* \[ ] 数据库规则 reviewed
* \[ ] 云函数权限最小化
* \[ ] 日志脱敏（openid 可留，手机号不可）
* \[ ] 费用与调用量告警

***

### 七、小结

云开发是 **快速 MVP 利器**，不是万能后端。复杂业务仍建议 **云函数 + 自建 BFF 分工**，支付与对账见[《小程序支付深入》](/2026/05/17/miniprogram-payment-flow-and-reconciliation/)。
