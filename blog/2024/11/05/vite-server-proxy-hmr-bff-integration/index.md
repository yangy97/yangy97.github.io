---
url: /blog/2024/11/05/vite-server-proxy-hmr-bff-integration/index.md
---
本地开发时，浏览器访问 ==Vite 端口==（如 5173），接口走 **同源 `/api`** 再 **代理到后端**，可 **规避 CORS**。**HMR** 通过 **WebSocket** 推送 **模块更新**。本篇写 **`server.proxy` 配置**、**常见联调坑**、以及与 **Egg / Node BFF** 的配合（与《Egg + Vue 同仓》一文呼应）。

***

### 一、最小代理

```ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7001',
        changeOrigin: true,
      },
    },
  },
});
```

\==`changeOrigin`==：改 **Host 头**，部分后端 **虚拟主机** 路由依赖它。

***

### 二、WebSocket 与 SockJS（若后端也要 WS）

若 HMR **与代理冲突**，可配 **`server.hmr`** 指定 **clientPort / path**（多代理或 HTTPS 终止时常用）。升级 **vite 大版本** 后若 **热更新断了**，先 **清缓存 + 看浏览器控制台 WS 报错**。

***

### 三、HTTPS 本地证书

```ts
server: {
  https: {}, // 配合 @vitejs/plugin-basic-ssl 或 mkcert
}
```

前后端 **Cookie Secure**、**SameSite** 行为与 **纯 HTTP** 不同，**尽早对齐**。

***

### 四、与 BFF 同仓

* **开发**：Vite 代理 `/api` → **Egg 7001**。
* **生产**：Nginx **同域反代** `/api`，前端 **`fetch('/api')` 不变**。
* **preview**：`vite preview` **默认不带** 开发代理，需 **Nginx** 或 **同构代理** 才能测 **真实路径**。

***

### 五、收束

联调三件套：**代理前缀统一**、**后端监听地址可访问**、**Cookie/HTTPS 策略一致**。HMR 出问题先 **看是否多个 Vite 实例** 或 **浏览器插件拦截 WS**。
