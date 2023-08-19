// Copyright 2023 yn-nishi All Rights Reserved.
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if(req.voiceBlob){
    let voiceData = new Audio(req.voiceBlob);
    voiceData.play();
  }
  return true;
})