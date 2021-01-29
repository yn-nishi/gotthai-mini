// Copyright 2021 yn-nishi All Rights Reserved.
"use strict";

// 設定読み込み 未設定は吹き出しtrueにする
const bubble = document.getElementById('bubble');
chrome.storage.local.get(null, (storage)=>{
  if (storage['bubbleFunction'] === undefined) {
    chrome.storage.local.set({'bubbleFunction': true});
    bubble.checked = true;
  } 
  bubble.checked = storage['bubbleFunction'];
});

// 設定変更の反映
bubble.addEventListener('change', ()=>{
  chrome.storage.local.set({'bubbleFunction': bubble.checked});
});