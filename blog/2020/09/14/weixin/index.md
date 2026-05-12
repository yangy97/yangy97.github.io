---
url: /blog/2020/09/14/weixin/index.md
---
\*\*

## 微信卡包跳转小程序

\==先梳理小程序生命周期==
\*\*
**小程序生命周期**

```javascript
onLaunch 生命周期函数--监听小程序初始化 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）

onShow 生命周期函数--监听小程序显示 当小程序启动，或从后台进入前台显示，会触发 onShow

onHide 生命周期函数--监听小程序隐藏 当小程序从前台进入后台，会触发 onHide

onError 错误监听函数 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
```

**一些例子**

```javascript
App({
  onLaunch: function (options) {
    console.log("app.js ---onLaunch---" );
  },
  onShow:function(){
    console.log("app.js ---onShow---");
  },
  onHide:function(){
    console.log("app.js ---onHide---");
  },
  onError: function (msg){
    console.log("app.js ---onError---" );
  },
  globalData: {
    userInfo: null
  }
})
```

**打印结果如下**
![图片丢失了](/_missing-image.svg)
至此知道了小程序的生命周期执行顺序以及触发条件

**微信卡包跳转小程序可以利用  app.js 里面的onshow方法  `onshow(options)` 通过`options`获取的到参数，这里值得注意的是在`app.js`里面的`onshow`里面的options获取的参数全部会被封装在`query`，也就是`options.query`来获取到进入小程序的参数**

**坑：**
**参数不一样，app.js有缓存**
**本以为`app.js`里面获取到的参数和一般页面onload获取的参数一样，其实不一样，建议在页面onload的时候将`onLoad: function (options) {}`参数重新赋值，这样每次就会获取到最新参数
如下所示**
![图片丢失了](/_missing-image.svg)
**附带卡包的一点配置**

```javascript

新增或者修改会员卡字段
https://api.weixin.qq.com/card/update?access_token=token

{
    "card_id": "pEVBpxI6Fb7xqUUfrTiD738NZht4",
    "member_card": {
        "custom_field2": {
            "name": "到家小程序",
            "app_brand_pass": "home/pages/index/index",
            "app_brand_user_name": "gh_69986111111@app"
        }
    }
}

特别注意的是：这个app_brand_user_name不是公众号的而是小程序的原始ID加上@app
app_brand_user_name
这样新增或者修改会员卡就可以进行跳转了;url也是需要的。

{
    "card_id": "pEVBpxI6Fb7xqUUfrTiD738NZht4",
    "member_card": {
        "custom_field2": {
            "url": "http://baidu.com",//这个URL必须存在
            "name": "到家小程序",
            "app_brand_pass": "home/pages/index/index",
            "app_brand_user_name": "gh_69986111111@app"
        }
    }
}



```
