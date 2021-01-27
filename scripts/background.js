// Copyright 2021 yn-nishi All Rights Reserved.
"use strict";
const url = 'https://www.gotthai.net/search_all?utf8=%E2%9C%93&search_form_all%5Bkeyword%5D=';
const response = {};
let voiceData;
// 設定初期化
chrome.storage.local.get(null, (storage)=>{
  if (storage['bubbleFunction'] === undefined) {
    chrome.storage.local.set({'bubbleFunction': true});
  }
});

// タイ語検索
new Promise((resolve) => { 
      chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
      const xhr = new XMLHttpRequest();
      const kw = request.keyword;
      xhr.open("GET", url + kw, true);
      xhr.onreadystatechange = ()=>{
        if (xhr.readyState == 4) {
          if (xhr.status === 200) {
            response.success = true;
            const parser = new DOMParser();
            const dom = parser.parseFromString(xhr.responseText, "text/html");
            scraping(dom);
            console.log(response.voice);
            resolve(response.voice);
            sendResponse(response);
          } else {
            response.success = false;
            sendResponse(response);
          }
        }
      }
    console.log('backA')
    console.log('backA2')
    xhr.send();
  return true;
  })
})
.then((voiceUrl) => {
    console.log('#33')
    console.log(voiceUrl);
    console.log('#34')
    if (voiceUrl) {
    setTimeout(() => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", 'https://www.gotthai.net' + voiceUrl, true);
      xhr.responseType = 'blob';
      xhr.onreadystatechange = ()=>{
        if (xhr.readyState == 4 && xhr.status === 200) {
          var reader = new FileReader();
          console.log(xhr.response);
          reader.readAsDataURL(xhr.response);
          reader.onloadend = function() {
            voiceData = new Audio(reader.result);
            console.log(voiceData);
            voiceData.play();
          }
        }
      }
      xhr.send();
    },1000);
    }
});


// スクレイピング
const scraping = (dom)=>{
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

// function gegege (request, sender, sendResponse) {
  
//   const xhr = new XMLHttpRequest();
//   const kw = request.keyword;
//   xhr.open("GET", url + kw, true);
//   xhr.onreadystatechange = ()=>{
//     if (xhr.readyState == 4) {
//       if (xhr.status === 200) {
//         response.success = true;
//         const parser = new DOMParser();
//         let dom = parser.parseFromString(xhr.responseText, "text/html");
//         scraping(dom);
//         sendResponse(response);
//       } else {
//         response.success = false;
//         sendResponse(response);
//       }
//     }
//   }
//   xhr.send();
// }


  // } else {
  //   const xhr = new XMLHttpRequest();
  //   xhr.open("GET", request.voiceUrl, true);
  //   xhr.responseType = 'blob';
  //   xhr.onreadystatechange = ()=>{
  //     if (xhr.readyState == 4 && xhr.status === 200) {
  //       var reader = new FileReader();
  //       console.log(xhr.response);
  //       reader.readAsDataURL(xhr.response);
  //       reader.onloadend = function() {
  //       response.voiceBase64 = reader.result;
  //         sendResponse(response);
  //       }
  //     }
  //   }
  //   xhr.send();



  // const promise = new Promise((resolve, reject) => { // #1
  //   console.log('#1')
  //   resolve('Hello ')
  // })
  
  // promise.then((msg) => { // #2
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       console.log('#2')
  //       resolve(msg + "I'm ")
  //     }, 3000)
  //   })
  // }).then((msg) => { // #3
  //   console.log('#3')
  //   return msg + 'Jeccy.'
  // }).then((msg) => { // #4
  //   console.log('#4')
  //   console.log(msg)
  // }).catch(() => { // エラーハンドリング
  //   console.error('Something wrong!')
  // })