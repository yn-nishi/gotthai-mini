// Copyright 2023 yn-nishi All Rights Reserved.

const baseUrl = 'https://www.gotthai.net/';
let audioContext = null;
const audioBufferCache = new Map();

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

async function ensureAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
}

async function fetchAudioArrayBuffer(voiceUrl) {
  const response = await fetch(baseUrl + voiceUrl);
  return response.arrayBuffer();
}

async function getAudioBuffer(voiceUrl) {
  const cachedAudioBuffer = audioBufferCache.get(voiceUrl);
  if (cachedAudioBuffer) {
    return cachedAudioBuffer;
  }

  const ctx = await ensureAudioContext();
  const audioBuffer = await ctx.decodeAudioData(await fetchAudioArrayBuffer(voiceUrl));
  audioBufferCache.set(voiceUrl, audioBuffer);
  return audioBuffer;
}

async function playAudioBuffer(audioBuffer) {
  const ctx = await ensureAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start(0);
}

async function playAudioFromUrl(voiceUrl) {
  await playAudioBuffer(await getAudioBuffer(voiceUrl));
}

async function createVoiceBlobUrl(voiceUrl) {
  const arrayBuffer = await fetchAudioArrayBuffer(voiceUrl);
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.offscreenPlayVoiceUrl) {
    (async () => {
      try {
        await playAudioFromUrl(req.offscreenPlayVoiceUrl);
        console.log('play (AudioContext)', req.offscreenPlayVoiceUrl);
      } catch (e) {
        console.error('Audio playback error:', e);
      }
    })();
    return false;
  }

  if (req.offscreenPreloadVoiceUrl) {
    (async () => {
      try {
        await getAudioBuffer(req.offscreenPreloadVoiceUrl);
        console.log('preload (AudioContext)', req.offscreenPreloadVoiceUrl);
      } catch (e) {
        console.error('Audio preload error:', e);
      }
    })();
    return false;
  }

  if (req.offscreenVoiceBlobUrl) {
    (async () => {
      try {
        const response = await fetch(req.offscreenVoiceBlobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const ctx = await ensureAudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        await playAudioBuffer(audioBuffer);
        console.log('play (AudioContext)', req.offscreenVoiceBlobUrl);
      } catch (e) {
        console.error('Audio playback error:', e);
      }
    })();
    return false;
  }

  if (req.offscreenVoiceUrl) {
    (async () => {
      try {
        sendResponse(await createVoiceBlobUrl(req.offscreenVoiceUrl));
      } catch (e) {
        console.error('Voice blob creation error:', e);
        sendResponse();
      }
    })();
    return true;
  }

  return false;
});
