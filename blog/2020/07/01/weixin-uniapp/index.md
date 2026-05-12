---
url: /blog/2020/07/01/weixin-uniapp/index.md
---
### 初识微信+uniapp 以及遇到的部分坑

## 小程序iOS端轮播图不能正常显示

## Uniapp开发

\==1.	排错==
检查，代码是否出错，数组循环是否出错，生命周期中查找对应的函数，元素元素是否成功渲染
检查，请求是否成功，一步步排查，每一步打印对应的console。Log（）打印对应的数据。

> 1.在小程序端，图片不能使用本地图片，要转化base64格式才能正常，我这边是网络图片，排除，
>
> 2.对应的代码要写兼容性，重写代码兼容性，依旧如如此，排除
>
> 3，图片格式要求，检查排除

**2，检查**
我这边遇到的问题，轮播图在安装端正常显示，在iOS端不能正常显示，首先能想到的是不兼容，但是对于小程序兼容应该不存在，安卓能正常显示，iOS端vsconsole能正常显示出swiper结构，说明不是兼容性问题，
想到打印对应数组，再其次，就去百度了，是否没有进入success成功的进行回调呢

![轮播图代码](/_missing-image.svg)
![对应的代码](/_missing-image.svg)
![图片](/_missing-image.svg)
，结构结果还真的是，打印出对应的错误，显示在iOS端没有建立安全的连接，ssl错误，在一查 站长工具http://s.tool.chinaz.com/ats/?url=gate.cqhqkj.com\&port=443，查询显示没有ATS认证，

> *重新配置IIS 对应的TLS,ios9以后必须TLS1.2+才能正常显示，这是重点*

### 微信小程序遇到的问题2 options参数

\==1，参数解析失败==

```javascript
  wx.redirectTo({
                    url: `/pages/authorize/authorize?redirect=${params}` 
                });
```

这种参数解析如果params是类似于`/pages/authorize/authorize?name=111`,
这种在微信小程序中利用options取值的时候会被切割，解决办法就是利用编码，`encodeURIComponent`和`decodeURIComponent`处理一下

**2.拉起微信用户授权，（必须先调用getUserProfile 在login之前)**

```javascript
wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        wx.showLoading({
          title: '加载中'
        });
         wx.login({
			success:function(){
			}
})
        }
```

`getUserProfile`必须是用户主动获取，必须先在login前获取到用户信息，这里的用户信息是完整的用户微信信息，
微信改版后可以通过`login`的`code`后端直接换取`openid`已经`unionId`

**3逻辑跳转修改**

```javascript
var pages = getCurrentPages();
        var currentPage = pages[pages.length - 1];
        var route = '/' + currentPage.route;
        if (route !== "/pages/index/index") {

            var params = encodeURIComponent(`${route}${urlParamParse(currentPage.options)}`)
            console.log(`redirect=`+`${route}${urlParamParse(currentPage.options)}`,`${urlParamParse(currentPage.options)}`);
          
                wx.redirectTo({
                    url: `/pages/authorize/authorize?redirect=${params}` 
                });
            
           
        }
```

1. 第一如果`currentPage`没有及时刷新，可以调用`currentPage.onLoad`事件触发，

2. 第二如果前者还不行，可以加`wx.nextTick()`触发onload，个人感觉类似于`setTimeout`,这里遇到了个兼容问题，华为手机完全不支持，所以选择`wx.redirectTo`关闭当前页面，

```javascript
function urlParamParse (options) {
  let str = '';
  console.log(options,151515)
  for (let key in options) {
    str += `&${key}=${options[key]}`
  }
  str = str.replace(/&/, '?');
  return str;
 }
```

**参数解析如果for in 循环对象的时候，最好利用`[]`取值，不建议用obj.key，**
