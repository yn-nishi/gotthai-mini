// Copyright 2021 yn-nishi All Rights Reserved.
"use strict";
const url = 'https://www.gotthai.net/search_all?utf8=%E2%9C%93&search_form_all%5Bkeyword%5D=';
const xhr = new XMLHttpRequest();
const response = {};

// 設定初期化
chrome.storage.local.get(null, (storage)=>{
  if (storage['bubbleFunction'] === undefined) {
    chrome.storage.local.set({'bubbleFunction': true});
  }
});

// タイ語検索
chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
  if(request.keyword) {
    const kw = request.keyword;
    xhr.open("GET", url + kw, true);
    xhr.onreadystatechange = ()=>{
      response.success = true;
      if (xhr.readyState == 4) {
        if (xhr.status === 200) {
          const parser = new DOMParser();
          let dom = parser.parseFromString(xhr.responseText, "text/html");
          getInfo(dom);
          sendResponse(response);
        } else {
          response.success = false;
          sendResponse(response);
        }
      }
    }
    xhr.send();
  } else {
    const voiceData = new Audio(request.voiceUrl);
    voiceData.play();
  }
  return true
});

// スクレイピング
const getInfo = (dom)=>{
  let matching = dom.getElementsByClassName('found-count');
  if (matching.length === 0) {
    response.success = false;
    return true;
  }
  response.matching = [matching[0].textContent - 0, matching[1].textContent - 0];
  if (response.matching[0] > 0 || response.matching[1] > 0){
    dom = dom.getElementsByTagName('td');
    response.href = dom[0].getElementsByTagName('a')[0].getAttribute('href');
    response.word = dom[0].getElementsByTagName('a')[0].textContent;
    response.pronunciation = dom[0].getElementsByClassName('pronunciation')[0].textContent;
    if (response.matching[0] > 0) {
      response.voice = dom[0].getElementsByTagName('audio')[0].getAttribute('src');
      response.katakana = dom[0].getElementsByClassName('katakana katakana-sm')[0].textContent;
      response.meaning = dom[1].getElementsByClassName('ol ol-narrow')[0].innerHTML;
    } else {
      response.meaning = dom[1].textContent;
      response.voice = false;
      response.katakana = false;
    }
  }
}

// Google Analytics
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