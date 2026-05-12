---
url: /blog/2020/08/26/weixin-jump/index.md
---
目前在开发中遇到这种需求，就是分享到消息列表不能允许用户二次转发分享，==控制安卓以及ios端==

点击跳转到微信小程序开发者平台->[微信私密消息](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/share/private-message.html)

![图片丢失了](/_missing-image.svg)
![图片丢失了](/_missing-image.svg)
![图片丢失了](/_missing-image.svg)

```javascript
  wx.updateShareMenu({
      templateInfo: {},
      withShareTicket: false,
      isPrivateMessage: true,//设置为私密
      activityId: this.data.activityId//后端设置一个活动id，分享带上活动id
    })
```

如果是分享到群不允许二次转发，只要根据场景值判断即可，如下

***1007：单人聊天会话中的小程序消息卡片， 1008：群聊会话中的小程序消息卡片， 1044：带shareTicket的小程序消息卡片***
