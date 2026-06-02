---
url: /blog/2026/05/25/miniprogram-network-storage-subscription/index.md
---
小程序里 **wx.request**（HTTPS 网络请求）（HTTPS 网络请求）（HTTPS 请求 API） 包一层 大家都做过；难的是 **token 刷新**、**并发重复登录**、**缓存过期**、**订阅消息**（用户授权后模板推送）（用户授权后模板推送）（用户授权模板推送） 合规 这几块叠在一起时的边界。本篇给一套 **可拷贝再改** 的分层写法，并标出审核与线上常踩的坑。

***

### 一、推荐分层

```text
utils/request.js    # 统一 wx.request，拦截器
utils/auth.js       # login、refresh、logout
services/*.js       # 业务 API，只关心 path 与 data
stores/user.js      # 可选：全局用户态
```

业务页 **不要** 直接 `wx.request`——否则 token 逻辑会复制 N 份。

***

### 二、请求封装（含登录态）

```javascript
// utils/request.js
const BASE = 'https://api.example.com';

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error);
    else resolve(request({ ...config, header: { ...config.header, Authorization: `Bearer ${token}` } }));
  });
  pendingQueue = [];
}

export function request({ url, method = 'GET', data, header = {} }) {
  const token = wx.getStorageSync('access_token');
  return new Promise((resolve, reject) => {
    wx.request({
      url: url.startsWith('http') ? url : `${BASE}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...header,
      },
      success(res) {
        const { statusCode, data: body } = res;
        if (statusCode === 401) {
          handle401({ url, method, data, header }).then(resolve).catch(reject);
          return;
        }
        if (statusCode >= 200 && statusCode < 300) {
          resolve(body);
        } else {
          reject(body || { message: '请求失败' });
        }
      },
      fail: reject,
    });
  });
}

function handle401(config) {
  return new Promise((resolve, reject) => {
    pendingQueue.push({ resolve, reject, config });
    if (isRefreshing) return;

    isRefreshing = true;
    refreshToken()
      .then((newToken) => {
        wx.setStorageSync('access_token', newToken);
        isRefreshing = false;
        flushQueue(null, newToken);
      })
      .catch((err) => {
        isRefreshing = false;
        flushQueue(err);
        wx.removeStorageSync('access_token');
        wx.reLaunch({ url: '/pages/login/index' });
      });
  });
}
```

**要点**

* \==401 队列==：避免并发请求同时触发多次 `wx.login` / refresh。
* **域名**：必须在小程序后台配置 **request 合法域名**；开发阶段可开「不校验合法域名」，**提审前关掉**。
* **HTTPS + TLS 1.2+**：iOS 对 ATS 敏感，旧文 uni-app 轮播图案例即 **证书/TLS** 问题。

***

### 三、登录：code2Session

```javascript
// utils/auth.js
export function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success({ code }) {
        if (!code) return reject(new Error('no code'));
        request({ url: '/auth/wechat', method: 'POST', data: { code } })
          .then((res) => {
            wx.setStorageSync('access_token', res.accessToken);
            wx.setStorageSync('refresh_token', res.refreshToken);
            resolve(res);
          })
          .catch(reject);
      },
      fail: reject,
    });
  });
}

export function refreshToken() {
  const refresh = wx.getStorageSync('refresh_token');
  return request({ url: '/auth/refresh', method: 'POST', data: { refreshToken: refresh } })
    .then((res) => res.accessToken);
}
```

**session\_key 勿下发前端**；用户敏感信息走 **服务端解密**（如手机号 `getPhoneNumber` 的 encryptedData）。

***

### 四、本地缓存策略

| API（应用程序接口） | 容量 | 适用 |
|-----|------|------|
| `wx.setStorageSync` | 单 key 1MB，总计 10MB 量级 | 配置、token、草稿 |
| `wx.setStorage` 异步 | 同上 | 大 JSON 写盘不卡 UI |
| 文件系统 `wx.getFileSystemManager` | 更大文件 | 离线包、图片缓存 |

```javascript
const CACHE_TTL = 5 * 60 * 1000;

export function getCache(key) {
  const raw = wx.getStorageSync(key);
  if (!raw) return null;
  const { expire, data } = raw;
  if (Date.now() > expire) {
    wx.removeStorageSync(key);
    return null;
  }
  return data;
}

export function setCache(key, data, ttl = CACHE_TTL) {
  wx.setStorageSync(key, { expire: Date.now() + ttl, data });
}
```

**注意**：清缓存 / 换机 **token 丢失** 是常态；页面要能 **静默登录或引导登录**，不要假设 storage 永在。

***

### 五、订阅消息（一次性 / 长期）

用户 **主动触发** 后才能调 `wx.requestSubscribeMessage`：

```javascript
async function onPaySuccess() {
  try {
    const res = await wx.requestSubscribeMessage({
      tmplIds: ['模板ID1', '模板ID2'],
    });
    // res[模板ID] === 'accept' | 'reject' | 'ban'
    await request({ url: '/notify/subscribe', method: 'POST', data: { result: res } });
  } catch (e) {
    // 用户拒绝或不支持
  }
}
```

**审核**：诱导订阅、未使用场景批量弹窗会被拒；文案与 **实际推送内容** 一致。

***

### 六、安全与合规清单

* 合法域名 + **禁止明文 HTTP**（生产）；
* 敏感字段 **不在前端日志 console**；
* `wx.uploadFile` / `downloadFile` 域名单独配置；
* 用户隐私协议与 **收集清单** 与后台声明一致（2023 后隐私接口更严）。

***

### 七、小结

小程序网络层的核心是：**统一 request → 401 单飞刷新 → 业务 API 无感 token**；缓存带 TTL；订阅消息 **跟用户动作绑定**。把分层做好，后续换 uni-app/Taro 也只是换一层 transport。

相关：[《小程序深入：生命周期、路由与页面栈》](/2026/05/24/miniprogram-lifecycle-routing-navigation/)、[《小程序性能优化与审核踩坑》](/2026/05/26/miniprogram-performance-audit-practice/)。
