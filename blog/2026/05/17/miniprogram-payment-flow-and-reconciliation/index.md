---
url: /blog/2026/05/17/miniprogram-payment-flow-and-reconciliation/index.md
---
小程序支付不是「调一个 wx.requestPayment 就完事」，而是 **商户单号 → 预下单 → 拉起收银台 → 异步通知 → 对账** 一整条链路。本篇按 **时序、幂等、安全、iOS 规则** 讲清，并给出可落地的代码骨架。

***

### 一、标准时序（必须服务端参与）

```text
小程序                你的 BFF/API              微信支付
  │                        │                        │
  │──① 创建业务订单────────►│                        │
  │                        │──② unifiedorder ──────►│
  │                        │◄─ prepay_id ───────────│
  │◄─ ③ 签名参数 ──────────│                        │
  │──④ wx.requestPayment ──────────────────────────►│
  │                        │◄─ ⑤ notify（异步）──────│
  │◄─ ⑥ 轮询/推送结果 ──────│                        │
```

\==关键==：**永远不要在前端用 appSecret 签名**；`paySign` 等参数由服务端用商户密钥生成。

***

### 二、小程序端代码骨架

```javascript
// services/pay.js
export async function payOrder(orderId) {
  const { timeStamp, nonceStr, package: pkg, signType, paySign } =
    await request({ url: '/pay/prepay', method: 'POST', data: { orderId } });

  await wx.requestPayment({
    timeStamp,
    nonceStr,
    package: pkg,
    signType: signType || 'RSA',
    paySign,
  });

  // 支付结果以服务端 notify + 订单查询为准，不要只信 success 回调
  return request({ url: `/orders/${orderId}/status` });
}
```

**success / fail / complete**：用户取消、密码错误、网络中断都会走不同分支；**业务状态以服务端订单表为准**。

***

### 三、服务端：幂等与 notify

| 环节 | 要点 |
|------|------|
| 预下单 | 同一 `orderId` 重复请求应返回同一 `prepay_id` 或明确拒绝 |
| notify | 验签 → 更新订单（仅 `WAIT_PAY → PAID`）→ 返回 SUCCESS |
| 重复 notify | 微信可能重试；更新语句带 **状态条件**，已 PAID 直接 SUCCESS |
| 主动查单 | notify 丢失时用 `orderquery` 补偿 |

```javascript
// 伪代码：notify 处理
async function onWechatNotify(xml) {
  const data = verifyAndParse(xml);
  if (data.result_code !== 'SUCCESS') return failXml();

  const updated = await db.order.update(
    { id: data.out_trade_no, status: 'WAIT_PAY' },
    { status: 'PAID', transactionId: data.transaction_id, paidAt: new Date() }
  );
  // updated 为 0 也可能是已处理过，仍返回 SUCCESS
  return successXml();
}
```

***

### 四、对账与差错

* **T+1 下载对账单**，与本地 `PAID` 订单比对金额、笔数；
* 常见差错：**notify 未到但用户已扣款** → 查单补单；**重复退款** → 退款单独立幂等；
* 日志保留：`out_trade_no`、`transaction_id`、notify 原文（脱敏存）。

***

### 五、iOS 虚拟支付边界

| 商品类型 | 小程序内支付 |
|----------|--------------|
| 实物电商 | 可用微信支付 |
| 虚拟会员、游戏币、数字内容 | **iOS 通常禁止小程序内直接微信支付**，需走苹果 IAP 或引导到合规 H5/公众号（以平台当期规则为准） |

提审前核对 **类目 + 商品描述**；文案避免出现「充值钻石」却在 iOS 走微信支付——高概率拒审。

***

### 六、联调清单

1. 沙箱/真实商户号环境分离
2. 0.01 元走通 notify
3. 断网支付后查单补偿
4. 重复点击支付按钮（前端 debounce + 后端幂等）
5. 退款流程与对账字段一致

***

### 七、小结

支付链路的本质是 **分布式事务**：前端只负责拉起；**状态机、幂等、验签、对账** 都在服务端。

**延伸阅读**：[《小程序深入：网络请求、登录态与本地缓存》](/2026/05/25/miniprogram-network-storage-subscription/)、[《小程序性能优化与审核踩坑清单》](/2026/05/26/miniprogram-performance-audit-practice/)。
