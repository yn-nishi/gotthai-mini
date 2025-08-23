// Copyright 2023 yn-nishi All Rights Reserved.
chrome.runtime.onMessage.addListener((req, sender, sendResponse) =>{
  (async () => {
    // voiceBlobUrlを受け取ってAudioで再生
    if(req.offscreenVoiceBlobUrl){
      let audio = new Audio(req.offscreenVoiceBlobUrl);
      console.log('play', req.offscreenVoiceBlobUrl);
      audio.play();
    //  voiceBlobUrlを作ってbackground経由でbubble_box.jsに返す
    } else if (req.offscreenVoiceUrl) {
      const res = await fetch('https://www.gotthai.net/' + req.offscreenVoiceUrl);
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const voiceBlobUrl = URL.createObjectURL(blob);
      sendResponse(voiceBlobUrl);
    }
  })();
  return true;
})