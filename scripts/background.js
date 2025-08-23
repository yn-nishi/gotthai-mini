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
    if (req.keyword) {
      let keywordFetch = await fetch(url + req.keyword);
      if (keywordFetch.ok) {
        res.isSuccess = true;
        let data = await keywordFetch.text();
        res.data = data;
      } else {
        res.isSuccess = false;
      }

      // speakThai('กองบัญชาการกองทัพไทยนำคณะผู้สังเกตการณ์ชั่วคร').catch((err) => {
      //   console.error('TTS error:', err);
      // });
      //chrome.tts.speak('กองบัญชาการกองทัพไทยนำคณะผู้สังเกตการณ์ชั่วคร', {'lang': 'th-TH', 'rate': 1.0});
      sendResponse(res);
    // URLをoffscreenに投げて音声データを取得
    } else if (req.voiceUrl) {
      chrome.runtime.sendMessage(
        { offscreenVoiceUrl: req.voiceUrl },
        (voiceBlobUrl) => {
          sendResponse(voiceBlobUrl);
        }
      );
    // voiceBlobUrlをoffscreenに投げて再生
    } else if (req.voiceBlobUrl) {
      chrome.runtime.sendMessage(
        { offscreenVoiceBlobUrl: req.voiceBlobUrl }
      );
    }
  })();
  return true;
});

// タイ語の Google 系音声を探すヘルパ
async function findGoogleThaiVoice() {
  
  const voices = await chrome.tts.getVoices();
  // 1) Google/Translate を含み、lang が th*
  let cand = voices.find(v =>
    /^th(-|$)/i.test(v.lang || "") &&
    /Google|Translate/i.test(v.voiceName || "") // voiceName に "Google" / "Translate"
  );
  // 2) 見つからなければ、lang が th* の最初
  if (!cand) cand = voices.find(v => /^th(-|$)/i.test(v.lang || ""));
  // 3) それでも無ければ null
  cand = 'GoogleTranslate Thai';
  console.log(cand);
  return cand || null;
}

async function speakThai(text) {
  const v = await findGoogleThaiVoice();
  const opts = {
//    lang: v?.lang || "th-TH",
    lang: 'GoogleTranslate Thai',
    voiceName: v?.voiceName,               // 見つかったら指定
    extensionId: v?.extensionId,           // Google系が拡張エンジンならこれも指定
    rate: 1.0, pitch: 1.0, volume: 1.0
  };
  return new Promise((resolve, reject) => {
    chrome.tts.speak(text, opts, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(err); else resolve();
    });
  });
}
