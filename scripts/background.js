// Copyright 2023 yn-nishi All Rights Reserved.
"use strict";
const url = 'https://www.gotthai.net/search_all?utf8=%E2%9C%93&search_form_all%5Bkeyword%5D=';
// 設定初期化
chrome.storage.local.get(null, (storage)=>{
  if (storage['bubbleFunction'] === undefined) {
    chrome.storage.local.set({'bubbleFunction': true});
  }
});

// manifest v3 から background.js に色々と制約がかかったので対策
chrome.offscreen.createDocument({
  reasons: ['AUDIO_PLAYBACK'],
  justification: 'play audio',
  url: '../html/offscreen.html'
});

// メイン処理
chrome.runtime.onMessage.addListener((req, sender, sendResponse)=>{
  (async () => {
    let res = {};
    console.log(req);
    if (req.keyword) {
      let keywordFetch = await fetch(url + req.keyword);
      if (keywordFetch.ok) {
        res.isSuccess = true;
        let data = await keywordFetch.text();
        res.data = data;
      } else {
        res.isSuccess = false;
      }
      sendResponse(res);
    } else if (req.voiceUrl) {
      let voiceFetch = await fetch('https://www.gotthai.net/' + req.voiceUrl);
      let reader = new FileReader();
      reader.onloadend = () => {
        res = reader.result;
        sendResponse(res);
      }
      reader.readAsDataURL(await voiceFetch.blob());
    }
  })();
  return true;
});