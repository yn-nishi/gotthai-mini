// Copyright 2021 yn-nishi All Rights Reserved.
"use strict";

const bubble = document.getElementById('bubble');

function initializeBubbleSetting() {
  chrome.storage.local.get(null, (storage) => {
    // 設定読み込み 未設定は吹き出しtrueにする
    if (storage.bubbleFunction === undefined) {
      chrome.storage.local.set({ bubbleFunction: true });
      bubble.checked = true;
      return;
    }

    bubble.checked = storage.bubbleFunction;
  });
}

function bindBubbleSetting() {
  // 設定変更の反映
  bubble.addEventListener('change', () => {
    chrome.storage.local.set({ bubbleFunction: bubble.checked });
  });
}

initializeBubbleSetting();
bindBubbleSetting();
