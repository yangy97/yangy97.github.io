---
url: /blog/2026/05/26/miniprogram-privacy-compliance-guide/index.md
---
2023 后微信强化了 **隐私保护指引** 与 **敏感 API 声明**。很多提审失败不是代码 bug，而是 **「用了接口没在后台声明」** 或 **弹窗流程不对**。本篇按上线 checklist 讲。

***

### 一、三块合规

| 块 | 内容 |
|----|------|
| **隐私保护指引** | 小程序后台填写收集的信息类型与用途 |
| **用户同意弹窗** | 首次调用敏感 API 前必须 `requirePrivacyAuthorize` 等（以文档为准） |
| **接口权限** | 地理位置、相册、手机号等 **后台申请 + 类目匹配** |

***

### 二、常见敏感能力

* 地理位置：`wx.getLocation` / 选点
* 相册/相机：头像上传、扫码
* 手机号：`getPhoneNumber`（需企业认证等条件）
* 剪贴板、蓝牙、日历等——**用前查文档是否需声明**

***

### 三、前端流程建议

```javascript
// 伪代码：调用敏感 API 前
async function ensurePrivacy() {
  if (wx.requirePrivacyAuthorize) {
    await new Promise((resolve, reject) => {
      wx.requirePrivacyAuthorize({ success: resolve, fail: reject });
    });
  }
}

async function pickLocation() {
  await ensurePrivacy();
  return wx.chooseLocation({});
}
```

**原则**：敏感 API **集中封装**，不要散落在 20 个页面。

***

### 四、隐私政策页

* 独立 **隐私政策** H5/小程序页，链接放设置与首次弹窗
* 文案与后台 **收集清单一致**——审核会对照
* 更新政策时 **版本号 + 再次告知**（视法规与平台要求）

***

### 五、提审材料

* 测试账号 + 操作录屏（含 **授权弹窗** 步骤）
* 说明为何需要某权限（**最小必要**）
* 拒绝 **一启动就索要全部权限**

与 [审核踩坑清单](/2026/05/26/miniprogram-performance-audit-practice/) 配合使用。

***

### 六、小结

隐私合规 = **后台声明 + 用户同意 + 代码封装 + 材料一致**。旧笔记（2020）不含这部分，新业务 **必查当期文档**。
