// Copyright 2021 yn-nishi All Rights Reserved.
(function() {
  'use strict';
  const url = 'https://www.gotthai.net';
  const url2 = 'https://www.gotthai.net/search_all?utf8=%E2%9C%93&search_form_all%5Bkeyword%5D=';
  const characterLimit = 20;
  const settings = {};
  // 設定読み込み
  document.onmousedown = ()=>{
    chrome.storage.local.get(null, (storage)=>{
      settings['bubbleFunction'] = storage['bubbleFunction'] || false;
    });
  }

  document.onmouseup = e =>{
    // 選択情報取得 kw = keyword
    const selection = window.getSelection();
    const kw = selection.toString();
    // 前回のアンカーと吹き出し情報取得
    const previousAnchor = document.getElementById('gotthai-mini-anchor');
    const previousBubble = document.getElementById('gotthai-bubble-box');
    // 吹き出し上のクリックは何もせず終了
    if (e.path.includes(previousBubble)) return;
    // 前回のアンカーと吹き出し削除
    previousAnchor && previousAnchor.remove();
    previousBubble && previousBubble.remove();
    // メイン処理
    if (kw.trim() !== '' && settings['bubbleFunction'] && isThai(kw) && !isFormArea()) {
      const anchorRect = setAnchor(selection);
      if (kw.length > characterLimit) {
        const boxElm = createErrorBox(kw);
        setBubbleBox(anchorRect, boxElm);
      } else {
      //   new Promise((resolve) => { 
          chrome.runtime.sendMessage({'keyword': kw}, response =>{
            const boxElm = response.success ? createBubbleBox(kw, response) : createErrorBox(kw);
            setBubbleBox(anchorRect, boxElm);
        });
      }
    }
  }

  // タイ文字:3585 ~ 3675 数字等:48~57
  const isThai = kw =>{
    const removeSpace = kw.replace(/\s+/g, "");
    for (var i = 0, t = 0; i < removeSpace.length; ++i) {
      const char = removeSpace[i].charCodeAt();
      if ((3584 < char && char < 3676) || (47 < char && char < 58 )) ++t;
    }
    return t / i >= 0.5 ? true : false;
  }

  //<textarea>と<input>は検索しない
  const isFormArea = ()=>{
    const elmName = document.activeElement.nodeName;
    return  elmName === 'TEXTAREA' || elmName === 'INPUT';
  }

  // 例外処理通知吹き出しDOM作成
  const createErrorBox = kw =>{
    const box = document.createElement('div');
    box.id = 'gotthai-bubble-box';
    box.className = 'gotthai-bubble-box';
    const error = document.createElement('div');
    error.className = 'gotthai-bubble-error';
    if (kw.length > characterLimit) {
      error.textContent = characterLimit + '文字以上は検索できません。';
    } else {
      error.textContent = 'ごったいに接続できませんでした。';
    }
    const itemName = document.createElement('div');
    itemName.className = 'gotthai-bubble-item-name';
    itemName.textContent = '選択文字列';
    const selectedText = document.createElement('div');
    selectedText.className = 'gotthai-bubble-selected-text';
    selectedText.textContent = kw;
    box.append(error, itemName, selectedText);
    return box;
  }

  // 検索結果吹き出しDOM作成
  const createBubbleBox = (kw, response)=>{
    const box = document.createElement('div');
    box.id = 'gotthai-bubble-box';
    box.className = 'gotthai-bubble-box';
    if (response.matching[0] == 0 && response.matching[1] == 0) {
      const itemName = document.createElement('div');
      itemName.className = 'gotthai-bubble-item-name';
      itemName.textContent = '選択文字列';
      const notice = document.createElement('div');
      notice.className = 'gotthai-bubble-notice';
      notice.innerHTML = '<a href="' + url2 + kw + '" target="_blank">' + kw +'</a><br>は見つかりませんでした。';
      box.append(itemName, notice);
    } else {
      const itemName1 = document.createElement('div');
      itemName1.className = 'gotthai-bubble-item-name';
      itemName1.textContent = '検索結果';
      const result = document.createElement('div');
      result.className = 'gotthai-bubble-result';
      const resultLink = document.createElement('a');
      resultLink.href = url + response.href;
      resultLink.target = '_blank';
      resultLink.textContent = response.word;
      result.appendChild(resultLink);
      if (response.matching[0] > 0) {
        const voice = document.createElement('div');
        voice.className = 'gotthai-bubble-voice';
        voice.addEventListener("click", ()=>{ 
            chrome.runtime.sendMessage({},()=>{});
          });
        result.appendChild(voice);
      }
      const pronunciation = document.createElement('div');
      pronunciation.className = 'gotthai-bubble-pronunciation';
      pronunciation.textContent = response.pronunciation;
      const katakana = document.createElement('div');
      if (response.matching[0] > 0) {
        katakana.className = 'gotthai-bubble-katakana';
        katakana.textContent = response.katakana;
        box.appendChild(katakana);
      }
      const itemName2 = itemName1.cloneNode(true);
      itemName2.textContent = '意味';
      const meaning = document.createElement('div');
      meaning.className = 'gotthai-bubble-meaning';
      if (response.matching[0] > 0) {
        const ol = document.createElement('ol');
        ol.innerHTML = response.meaning;
        meaning.appendChild(ol);
      } else {
        meaning.textContent = response.meaning;
      }
      const itemName3 = itemName1.cloneNode(true);
      itemName3.textContent = '選択文字列';
      const selectedText = document.createElement('div');
      selectedText.className = 'gotthai-bubble-selected-text';
      selectedText.textContent = kw;
      const matching = document.createElement('div');
      matching.className = 'gotthai-bubble-matching';
      const matchingLink = document.createElement('a');
      matchingLink.href = url2 + kw;
      matchingLink.target = '_blank';
      matchingLink.textContent = `タイ語${response.matching[0]}件、例文${response.matching[1]}件`;
      matching.appendChild(matchingLink);
      box.append(itemName1, result, pronunciation, katakana, itemName2, meaning, itemName3, selectedText, matching);
    }
    return box;
  }

  // 吹き出しを見やすい位置に配置
  const setBubbleBox = (aRect, box)=>{
    document.body.appendChild(box);
    box.style.visibility = 'hidden';
    const bRect = box.getBoundingClientRect();
    const ww = document.documentElement.clientWidth;
    const wh = document.documentElement.clientHeight;
    const aCenter = aRect.left + aRect.width / 2;
    if (wh - aRect.bottom > bRect.height || aRect.top < bRect.height) {
      box.style.top =  aRect.bottom + window.pageYOffset + 7 + 'px';
    } else {
      box.style.top = aRect.top + window.pageYOffset  - bRect.height - 10 + 'px';
    }
    if (aCenter - bRect.width / 2 < 0) {
      box.style.left = window.pageXOffset + 'px';
    } else if (aCenter + bRect.width / 2 > ww) {
      box.style.left = 2 * ww - window.innerWidth - bRect.width + window.pageXOffset + 'px';
    } else {
      box.style.left = aCenter - bRect.width / 2 + window.pageXOffset + 'px';
    }
    box.style.width = bRect.width + 'px';
    box.style.height = bRect.height + 'px';
    box.style.visibility = 'visible';
  }

  // 選択範囲の位置にアンカーを打つ
  const setAnchor = (selection)=>{
    const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
    const anchor = document.createElement('div');
    anchor.id = 'gotthai-mini-anchor';
    const styles = (`
      position: absolute;
      top: ${window.pageYOffset + selectionRect.top}px;
      left: ${window.pageXOffset + selectionRect.left}px;
      width: ${selectionRect.width}px;
      height: ${selectionRect.height}px;
    `);
    anchor.style = styles;
    document.body.appendChild(anchor);
    return anchor.getBoundingClientRect();
  }
})();



