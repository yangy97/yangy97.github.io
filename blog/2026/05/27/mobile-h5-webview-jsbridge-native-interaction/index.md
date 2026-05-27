---
url: /blog/2026/05/27/mobile-h5-webview-jsbridge-native-interaction/index.md
---
业务里常见形态：**App 壳 + WebView 跑 H5**（活动页、支付结果、旧系统迁移）。前端要能 **调相机、分享、返回、传 token**，Native 要能 **控导航栏、注入登录态、收 H5 事件**——中间这层就是 ==JSBridge==。

本篇讲清 **调用模型、协议设计、双端注入、安全与调试**，并给出可直接改的 JS 模板。

***

### 一、WebView 里的三种通信方式

| 方式 | 方向 | 特点 |
|------|------|------|
| **URL Scheme 拦截** | H5 → Native | 实现简单；大数据不便 |
| **prompt / 注入对象** | H5 → Native | Android `@JavascriptInterface`、iOS `WKScriptMessageHandler` |
| **Native 调 JS** | Native → H5 | `evaluateJavascript` / `callHandler` |

生产环境多为 **混合**：注册表 + 回调 id + JSON payload（类似 RPC）。

***

### 二、H5 侧统一 Bridge 封装

```javascript
// bridge.js
const callbacks = {};
let seq = 0;

function invoke(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = `cb_${Date.now()}_${++seq}`;
    callbacks[id] = { resolve, reject };

    const message = JSON.stringify({ id, method, params });

    // Android：注入对象
    if (window.NativeBridge && window.NativeBridge.postMessage) {
      window.NativeBridge.postMessage(message);
      return;
    }
    // iOS WKWebView
    if (window.webkit?.messageHandlers?.NativeBridge) {
      window.webkit.messageHandlers.NativeBridge.postMessage(message);
      return;
    }
    // 降级：iframe + scheme（仅小 payload）
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `myapp://bridge?payload=${encodeURIComponent(message)}`;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 0);

    // 超时
    setTimeout(() => {
      if (callbacks[id]) {
        delete callbacks[id];
        reject(new Error('bridge timeout'));
      }
    }, 15000);
  });
}

// Native 回调入口（Native 执行 JS 调用）
window.__bridgeCallback = function (id, ok, data) {
  const cb = callbacks[id];
  if (!cb) return;
  delete callbacks[id];
  ok ? cb.resolve(data) : cb.reject(data);
};

export const Bridge = {
  getToken: () => invoke('getToken'),
  openCamera: (opts) => invoke('openCamera', opts),
  closeWebView: () => invoke('closeWebView'),
  share: (payload) => invoke('share', payload),
};
```

**Native 处理完** 后执行：

```javascript
// 伪代码：Native 注入
webView.evaluateJavascript(
  `window.__bridgeCallback('${id}', true, ${JSON.stringify(result)})`
);
```

***

### 三、Android 注入示例（Kotlin 思路）

```kotlin
class AppBridge(private val activity: Activity) {
    @JavascriptInterface
    fun postMessage(json: String) {
        val msg = JSONObject(json)
        when (msg.getString("method")) {
            "getToken" -> {
                val token = TokenStore.get()
                callback(msg.getString("id"), true, mapOf("token" to token))
            }
            "closeWebView" -> activity.finish()
            // ...
        }
    }

    private fun callback(id: String, ok: Boolean, data: Any) {
        val js = "window.__bridgeCallback('${id}', $ok, ${JSONObject(data)})"
        activity.runOnUiThread {
            webView.evaluateJavascript(js, null)
        }
    }
}

// WebSettings
webView.settings.javaScriptEnabled = true
webView.addJavascriptInterface(AppBridge(activity), "NativeBridge")
```

**安全**：`@JavascriptInterface` 仅对 **可信域** 开启；禁止 file 协议加载远程脚本；API 18+ 注意 **任意网页调接口** 风险——配合 **域名白名单** 与 **签名校验**。

***

### 四、iOS WKWebView 示例（Swift 思路）

```swift
userContentController.add(self, name: "NativeBridge")

func userContentController(_ userContentController: WKUserContentController,
                           didReceive message: WKScriptMessage) {
    guard message.name == "NativeBridge",
          let body = message.body as? String,
          let data = body.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let method = json["method"] as? String,
          let id = json["id"] as? String else { return }

    switch method {
    case "getToken":
        let token = KeychainHelper.token ?? ""
        evaluateCallback(id: id, ok: true, data: ["token": token])
    default: break
    }
}
```

注意 **WKWebView 内存**：Bridge 对象避免循环引用；页面销毁时 `removeScriptMessageHandler`。

***

### 五、协议设计建议

1. **版本字段** `version: 1`，便于灰度；
2. **method 字符串枚举**，文档化参数 schema；
3. **异步一律带 callback id**，不要假设同步；
4. **错误码统一** `{ code, message }`，H5 可 toast 或上报；
5. **幂等**：`closeWebView`、`share` 等防重复点击。

**登录态**：优先 Native **注入 cookie / header**（同域 BFF），H5 少碰 raw token；必须给 H5 时 **短期 token + 刷新由 Native 做**。

***

### 六、Navigation 与返回栈

| 场景 | 做法 |
|------|------|
| H5 想关页 | `Bridge.closeWebView()` |
| Native Navbar 返回 | Native 拦截返回键，先问 H5 `canGoBack` |
| H5 内路由 | 监听 `popstate`，Native 返回先 `history.back()` |

```javascript
export function setupBackHandler() {
  Bridge.register?.('onNativeBack', () => {
    if (window.history.length > 1) {
      history.back();
      return { handled: true };
    }
    return { handled: false };
  });
}
```

***

### 七、安全清单

* 仅 **HTTPS** 加载 H5；禁止混合内容；
* Bridge method **白名单**，禁止任意 URL 打开；
* 校验 **message 来源**（包名、域名）；
* 敏感能力（支付、剪贴板） **二次确认**；
* 禁止 H5 直接拿 **长期 refresh token**。

***

### 八、调试技巧

* Android：`chrome://inspect` 远程调试 WebView；
* iOS：Safari 开发菜单 → 模拟器/真机 WebView；
* 双端 mock：`window.NativeBridge` 在 dev 环境由 **Vite 插件** 注入 fake 实现；
* 日志：Bridge 层统一 **log 入参出参**（生产脱敏）。

***

### 九、小结

JSBridge 本质是 **带 callback 的跨进程 RPC**：H5 发 `{ id, method, params }`，Native 执行后 `__bridgeCallback`。把协议、错误、安全写进文档，比每个页面各自 `window.prompt` 稳一个数量级。

下一篇：[《混合 App 架构：WebView 容器、离线包与选型》](/2026/05/17/mobile-hybrid-app-architecture-schemes/)——从工程视角看 **什么时候该上 Bridge、什么时候该换容器**。

相关移动端基础：[《viewport/DPR/rem》](/2022/05/28/mobile-viewport-dpr-rem-vw-fundamentals/)、[《VisualViewport 与键盘》](/2022/07/23/mobile-keyboard-visualviewport-input-fixed/)、[《安全区 env(safe-area)》](/2022/06/15/mobile-safe-area-notch-env-dynamic-island/) 系列。
