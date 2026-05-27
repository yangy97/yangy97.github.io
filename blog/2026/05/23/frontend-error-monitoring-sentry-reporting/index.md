---
url: /blog/2026/05/23/frontend-error-monitoring-sentry-reporting/index.md
---
线上白屏用户不会提 bug，要靠 **错误监控 + 性能指标**。本篇以 Sentry 为例讲 **接入、release、source map、告警策略**，与后端 observability 文呼应。

***

### 一、接入（Vue 3）

```typescript
import * as Sentry from '@sentry/vue';

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration({ router })],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_RELEASE,
});
```

***

### 二、Source Map

* 构建上传 map 到 Sentry，**CDN 不公开 map**
* `release` 与 CI 版本号一致

```bash
sentry-cli releases new "$VERSION"
sentry-cli releases files "$VERSION" upload-sourcemaps ./dist/assets
```

***

### 三、上下文

```typescript
Sentry.setUser({ id: user.id });
Sentry.setTag('tenant', tenantId);
```

**勿上报** 密码、token、完整手机号。

***

### 四、降噪

* 忽略 **浏览器插件**、已知第三方脚本
* `beforeSend` 过滤网络离线类噪音
* 合并同一 issue，设 **阈值告警**

***

### 五、与后端 trace 关联

传递 **trace id**（请求头 `x-trace-id`），Sentry tag 带上，便于和 Egg 日志串联。

***

### 六、小结

监控 = **Sentry + release/map + 采样 + 降噪 + trace 关联**。企业流量监控见 enterprise observability 文。
