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
    if (previousAnchor) previousAnchor.remove();
    if (previousBubble) previousBubble.remove();
    // メイン処理
    if (kw.trim() !== '' && settings['bubbleFunction'] && isThai(kw) && !isFormArea()) {
      const anchorRect = setAnchor(selection);
      if (kw.length > characterLimit) {
        const boxElm = createErrorBox(kw);
        setBubbleBox(anchorRect, boxElm);
      } else {
          chrome.runtime.sendMessage({'keyword': kw}, res =>{
            const boxElm = res.isSuccess ? createBubbleBox(kw, res) : createErrorBox(kw);
            setBubbleBox(anchorRect, boxElm);
        });
      }
    }
  }

  // タイ文字:3585 ~ 3675
  const isThai = kw =>{
    const removeSpace = kw.replace(/\s+/g, "");
    for (var i = 0, t = 0; i < removeSpace.length; ++i) {
      const char = removeSpace[i].charCodeAt();
      if (3584 < char && char < 3676) ++t;
    }
    return t / i >= 0.5 ? true : false;
  }

  // 入力中の文字には反応しない
  const isFormArea = ()=>{
    return document.activeElement.isContentEditable;
  }

  // 例外処理通知吹き出しDOM作成
  const createErrorBox = kw =>{
    const box = creElm({tag: 'div', id: 'gotthai-bubble-box', style: 'visibility: hidden', ap: document.body});
    const error = creElm({tag: 'div', id: 'gotthai-bubble-error', tx: 'ごったいに接続できませんでした。', ap: box});
    if (kw.length > characterLimit)  error.textContent = characterLimit + '文字以上は検索できません。';
    creElm({tag: 'div', id: 'gotthai-bubble-item-name', tx: '選択文字列', ap: box});
    creElm({tag: 'div', id: 'gotthai-bubble-selected-text', tx: kw, ap: box});
    return box;
  }

  // 検索結果吹き出しDOM作成
  const createBubbleBox = (kw, res)=>{
    const box = creElm({tag: 'div', id: 'gotthai-bubble-box', style: 'visibility: hidden', ap: document.body});
    if (res.matching[0] > 0 || res.matching[1] > 0) {
      creElm({tag: 'div', id: 'gotthai-bubble-item-name', tx: '検索結果', ap: box});
      const result = creElm({tag: 'div', id: 'gotthai-bubble-result', ap: box});
      creElm({tag: 'a', id: 'gotthai-bubble-result', tx: res.word, href: url+res.href, ap: result});
      if (res.matching[0] > 0) {
        const voice = creElm({tag:'div', id:'gotthai-bubble-voice', ap:result});
        voice.addEventListener("click", ()=> chrome.runtime.sendMessage('play'));
      }
      creElm({tag: 'div', id: 'gotthai-bubble-pronunciation', tx: res.pronunciation, ap: box});
      if (res.matching[0] > 0) creElm({tag: 'div', id: 'gotthai-bubble-katakana', tx: res.katakana, ap: box});
      creElm({tag: 'div', id: 'gotthai-bubble-item-name', tx: '意味', ap: box});
      const meaning = creElm({tag: 'div', id: 'gotthai-bubble-meaning', tx: res.meaning, ap: box});
      if (res.matching[0] > 0) {
        meaning.textContent = '';
        creElm({tag: 'ol', id: 'gotthai-bubble-meaning', html:res.meaning, ap: meaning});
      }
      creElm({tag: 'div', id: 'gotthai-bubble-item-name', tx: '選択文字列', ap: box});
      creElm({tag: 'div', id: 'gotthai-bubble-selected-text', tx: kw, ap: box});
      const matching = creElm({tag: 'div', id: 'gotthai-bubble-matching', ap: box});
      creElm({tag: 'a', tx: `タイ語${res.matching[0]}件、例文${res.matching[1]}件`, href: url2 + kw, ap: matching});
    } else {
      creElm({tag: 'div', id: 'gotthai-bubble-item-name', tx: '選択文字列', ap: box});
      const notice = creElm({tag: 'div', id: 'gotthai-bubble-notice', ap: box});
      creElm({tag: 'a', href: url2 + kw, tx: kw, ap:notice});
      notice.innerHTML += ('<br>は見つかりませんでした。');
    }
    return box;
  }

  // 吹き出しを見やすい位置に配置
  const setBubbleBox = (aRect, box)=>{
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
    const styles = (`
      position: absolute;
      top: ${window.pageYOffset + selectionRect.top}px;
      left: ${window.pageXOffset + selectionRect.left}px;
      width: ${selectionRect.width}px;
      height: ${selectionRect.height}px;
    `);
    const anchor = creElm({tag: 'div', id: 'gotthai-mini-anchor', style: styles, ap: document.body});
    return anchor.getBoundingClientRect();
  }

  // element作成簡略化
  const creElm = ({tag, id, tx, href, html, style, ap})=>{
    const elm = document.createElement(tag);
    if (id) elm.id = id;
    if (tx) elm.textContent = tx;
    if (html) elm.innerHTML += html;
    if (style) elm.style = style;
    if (ap) ap.appendChild(elm);
    if (href) {
      elm.href = href;
      elm.target = '_blank';
    }
    return elm;
  }

})();



