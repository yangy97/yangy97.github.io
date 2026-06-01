---
url: /blog/2026/06/01/docker-frontend-deployment-basics/index.md
---
企业级文已有 [CI/CD 流水线](/2023/06/10/enterprise-cicd-pipeline-deep/) 与 [多环境配置](/2023/06/12/enterprise-multi-env-config-governance/)，但缺 **前端镜像怎么打**。这篇补 **多阶段 Dockerfile + Nginx 静态托管 + 与 Vite base 的配合**，适合 Vue/React SPA 与中后台。

***

### 一、为什么前端要 Docker 化

| 收益 | 说明 |
|------|------|
| 环境一致 | Node 版本、pnpm 锁文件在 build 阶段固定 |
| 交付物清晰 | 镜像里只有 `dist/` + Nginx，无源码 |
| 与 K8s 衔接 | Deployment + Ingress 标准套路 |
| 回滚 | 镜像 tag 对应 Git SHA |

纯静态站也可 **OSS + CDN** 跳过容器；需要 **私有网络、统一网关、Sidecar** 时 Docker 更常见。

***

### 二、多阶段 Dockerfile（Vite / Vue）

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_API_BASE=https://api.example.com
ENV VITE_API_BASE=$VITE_API_BASE
RUN pnpm build

FROM nginx:1.27-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1/ || exit 1
```

要点：

* **构建参数** `ARG VITE_*` 在 `pnpm build` 前注入——Vite 环境变量是 **构建期** 烘焙进 JS 的（见 [import.meta.env](/2023/04/02/vite-env-import-meta-base-deploy-path/)）。
* `pnpm fetch` + `--frozen-lockfile` 提高缓存命中。
* 最终镜像 **不含 node\_modules**，体积通常 < 50MB。

***

### 三、Nginx 配置要点（SPA）

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # 静态资源长缓存（文件名带 hash）
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  # HTML 不长期缓存，便于发版后拿到新 index
  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
  }

  # 可选：API 反代，避免浏览器 CORS（BFF 场景）
  location /api/ {
    proxy_pass http://backend:7001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  gzip on;
  gzip_types text/css application/javascript application/json;
}
```

**base 路径**：若 `base: '/blog/'`，root 下要有 `blog/index.html`，或 `location /blog/` 单独 `try_files`（与 [Vite base](/2023/04/02/vite-env-import-meta-base-deploy-path/) 一致）。

***

### 四、.dockerignore

```
node_modules
dist
.git
docs/.vuepress/dist
*.md
.env.local
```

避免把 **整仓 wiki 文档** 和本地 secret 打进 build context。

***

### 五、CI 里 build & push

```yaml
# GitHub Actions 片段
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/org/app:${{ github.sha }}
          build-args: |
            VITE_API_BASE=${{ vars.VITE_API_BASE }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

与 [性能预算 CI](/2023/05/25/frontend-performance-budget-ci/) 类似，可在同一 pipeline 加 **bundle size gate**。

***

### 六、K8s 最小 Deployment（概念）

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: nginx
          image: ghcr.io/org/app:abc123
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet: { path: /, port: 80 }
            initialDelaySeconds: 3
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits: { memory: 128Mi }
```

Ingress、TLS、蓝绿发布见 [发布策略](/2023/06/08/enterprise-release-strategies-canary-bluegreen/) 与 [流量入口](/2023/06/14/enterprise-ingress-traffic-forwarding/)。

***

### 七、常见坑

| 现象 | 原因 | 处理 |
|------|------|------|
| 刷新 404 | Nginx 未 fallback index.html | `try_files` |
| 接口 404 | 构建期 API 地址错 | 检查 ARG/ENV 或运行时注入方案 |
| 旧 JS 白屏 | HTML 被 CDN 长缓存 | HTML `no-cache`，JS 带 hash |
| 镜像巨大 | 单阶段 COPY 全仓库 | 多阶段 + dockerignore |
| SW 不更新 | `sw.js` 被缓存 | Nginx 对 sw 单独 no-cache |

***

### 八、运行时注入 env（可选进阶）

构建期烘焙 `VITE_*` 导致 **同一镜像难打多环境**。可选：

1. **容器启动脚本** 把 `window.__ENV__` 写入 `env.js`，`index.html` 先加载它。
2. **仅 SSR/BFF** 读环境变量，前端只调相对路径 `/api`。

中后台若环境少，继续 **每环境 build 一次** 往往更简单。

***

### 九、一句话

前端 Docker 化的标准答案是：**Node 阶段只负责 build，运行阶段只有 Nginx + dist**；路由 fallback、HTML 缓存策略和 Vite base 三处对齐，就能避免八成线上 404 与白屏。
