// Copyright 2021 yn-nishi All Rights Reserved.
"use strict";
const url = 'https://www.gotthai.net/search_all?utf8=%E2%9C%93&search_form_all%5Bkeyword%5D=';
const res = {};
let voiceData;
// 設定初期化
chrome.storage.local.get(null, (storage)=>{
  if (storage['bubbleFunction'] === undefined) {
    chrome.storage.local.set({'bubbleFunction': true});
  }
});

// メイン処理
chrome.runtime.onMessage.addListener((req, sender, sendResponse)=>{
  // 吹き出しの表示命令後、予め音声を読み込んでおく(ユーザー体感速度向上のため)
  if (req.keyword) {
    searchThai(req, sender, sendResponse)
    .then((audioSrc)=>{getVoice(audioSrc)});
    // bubble_box.jsで音声再生できないセキュリティが強いサイトもあるので、background.jsで再生
  } else if(req === 'play') {
    voiceData.play();
  }
  return true;
});

// タイ語検索
const searchThai = (req, sender, sendResponse)=>{
  return new Promise((resolve) => { 
    const xhr = new XMLHttpRequest();
    const kw = req.keyword;
    xhr.open("GET", url + kw, true);
    xhr.onreadystatechange = ()=>{
      if (xhr.readyState == 4) {
        if (xhr.status === 200) {
          res.success = true;
          const parser = new DOMParser();
          const dom = parser.parseFromString(xhr.responseText, "text/html");
          scraping(dom);
          sendResponse(res);
          res.voice && resolve(res.voice);
        } else {
          res.success = false;
          sendResponse(res);
        }
      }
    }
  xhr.send();
  });
};

// 音声データを読み込んでBase64形式で保持
const getVoice = (audioSrc) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", 'https://www.gotthai.net' + audioSrc, true);
  xhr.responseType = 'blob';
  xhr.onreadystatechange = ()=>{
    if (xhr.readyState == 4 && xhr.status === 200) {
      var reader = new FileReader();
      reader.readAsDataURL(xhr.response);
      reader.onloadend = ()=> voiceData = new Audio(reader.result);
    }
  }
  xhr.send();
  //GAも少し重たいのでこのタイミングで読み込む
  googleAnalytics();
}

// ウェブスクレイピング
const scraping = (dom)=>{
  const matching = dom.getElementsByClassName('found-count');
  if (matching.length === 0) {
    res.success = false;
    return true;
  }
  res.matching = [matching[0].textContent - 0, matching[1].textContent - 0];
  if (res.matching[0] > 0 || res.matching[1] > 0){
    dom = dom.getElementsByTagName('td');
    res.href = dom[0].getElementsByTagName('a')[0].getAttribute('href');
    res.word = dom[0].getElementsByTagName('a')[0].textContent;
    res.pronunciation = dom[0].getElementsByClassName('pronunciation')[0].textContent;
    if (res.matching[0] > 0) {
      res.voice = dom[0].getElementsByTagName('audio')[0].getAttribute('src');
      res.katakana = dom[0].getElementsByClassName('katakana katakana-sm')[0].textContent;
      res.meaning = dom[1].getElementsByClassName('ol ol-narrow')[0].innerHTML;
    } else {
      res.meaning = dom[1].textContent;
      res.voice = false;
      res.katakana = false;
    }
  }
}

// Google Analytics
const googleAnalytics = ()=>{
  (function(i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    (i[r] =
      i[r] ||
      function() {
        (i[r].q = i[r].q || []).push(arguments);
      }),
    (i[r].l = 1 * new Date());
    (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(
    window,
    document,
    'script',
    'https://ssl.google-analytics.com/analytics.js',
    'ga'
  );
  ga('create', 'UA-187863811-1', 'auto');
  ga('set', 'checkProtocolTask', null);
  ga('send', 'pageview', 'background.js');
}