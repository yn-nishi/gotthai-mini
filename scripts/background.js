// Copyright 2023 yn-nishi All Rights Reserved.
"use strict";

const searchUrl = 'https://www.gotthai.net/search_all?utf8=%E2%9C%93&search_form_all%5Bkeyword%5D=';
const offscreenUrl = '../html/offscreen.html';

async function ensureOffscreenDocument() {
  const hasDocument = await chrome.offscreen.hasDocument?.();
  if (!hasDocument) {
    await chrome.offscreen.createDocument({
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'play audio',
      url: offscreenUrl
    });
  }
}

function initializeSettings() {
  chrome.storage.local.get(null, (storage) => {
    if (storage.bubbleFunction === undefined) {
      chrome.storage.local.set({ bubbleFunction: true });
    }
  });
}

async function fetchKeywordResult(keyword) {
  const res = {};

  try {
    const keywordFetch = await fetch(searchUrl + keyword);
    if (keywordFetch.ok) {
      res.isSuccess = true;
      res.data = await keywordFetch.text();
    } else {
      res.isSuccess = false;
    }
  } catch (e) {
    console.error('Keyword fetch error:', e);
    res.isSuccess = false;
  }

  return res;
}

async function relayToOffscreen(message) {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage(message);
}

initializeSettings();
ensureOffscreenDocument();

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.keyword) {
    (async () => {
      sendResponse(await fetchKeywordResult(req.keyword));
    })();
    return true;
  }

  if (req.playVoiceUrl) {
    relayToOffscreen({ offscreenPlayVoiceUrl: req.playVoiceUrl }).catch((e) => {
      console.error('Voice playback relay error:', e);
    });
    return false;
  }

  if (req.preloadVoiceUrl) {
    relayToOffscreen({ offscreenPreloadVoiceUrl: req.preloadVoiceUrl }).catch((e) => {
      console.error('Voice preload relay error:', e);
    });
    return false;
  }

  if (req.voiceUrl) {
    (async () => {
      try {
        sendResponse(await relayToOffscreen({ offscreenVoiceUrl: req.voiceUrl }));
      } catch (e) {
        console.error('Voice blob fetch relay error:', e);
        sendResponse();
      }
    })();
    return true;
  }

  if (req.voiceBlobUrl) {
    relayToOffscreen({ offscreenVoiceBlobUrl: req.voiceBlobUrl }).catch((e) => {
      console.error('Voice blob relay error:', e);
    });
    return false;
  }

  return false;
});
