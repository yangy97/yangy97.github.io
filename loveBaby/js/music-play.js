/*
 * @version: V1.0.0
 * @Author: 小杨不吃土豆
 * @Date: 2023-03-02 17:03:34
 * @LastEditors: 小杨不吃土豆
 * @LastEditTime: 2023-03-02 17:49:04
 * @company: xxx
 * @Mailbox: y1597355434@gamil.com
 * @FilePath: /www/yangy97.github.io/loveBaby/js/music-play.js
 * @Descripttion:
 * @Params:
 * @Return:
 */

//鎾斁鍣ㄦ帶鍒�
var audio = document.getElementById("BBW_mp3Btn"); //鑾峰彇鎾斁鍣�
var audio_ctr = document.getElementById("BBW_audio_ctr"); //鑾峰彇鎸夐挳
//鍏煎鑻规灉寰俊鎵撳紑鏃犺儗鏅煶涔�

window.addEventListener("touchstart", forceSafariPlayAudio, false);
//鏃嬭浆鎸夐挳鐐瑰嚮
audio_ctr.onclick = function (e) {
  //闃叉鍐掓场
  console.log("进入了啊");
  e.stopPropagation();
  if (audio.paused) {
    console.log("点击了这里1");
    //濡傛灉褰撳墠鏄殏鍋滅姸鎬�
    audio.play(); //鎾斁 audio鑷韩鑷甫鍑芥暟play()
    audio_ctr.className = "BBW_play"; //鍔ㄦ€佹洿鏀规爣绛剧殑绫诲悕
  } else {
    console.log("点击了这里2");
    //褰撳墠鏄挱鏀剧姸鎬�
    audio.pause(); //鏆傚仠
    audio_ctr.className = "BBW_pause"; //鍔ㄦ€佹洿鏀规爣绛剧殑绫诲悕
  }
};
// //鍏煎鑻规灉鍘熺敓
// var _ua = navigator.userAgent.toLowerCase();
// if (
//   _ua.indexOf("applewebkit") > -1 &&
//   _ua.indexOf("mobile") > -1 &&
//   _ua.indexOf("safari") > -1 &&
//   _ua.indexOf("linux") === -1 &&
//   _ua.indexOf("android") === -1 &&
//   _ua.indexOf("chrome") === -1 &&
//   _ua.indexOf("ios") === -1 &&
//   _ua.indexOf("browser") === -1
// ) {
//   audio_ctr.className = "BBW_pause"; //鍔ㄦ€佹洿鏀规爣绛剧殑绫诲悕
// }
