// Copyright 2023 yn-nishi All Rights Reserved.
(function() {
  'use strict';

  const baseUrl = 'https://www.gotthai.net';
  const searchUrl = 'https://www.gotthai.net/search_all?utf8=%E2%9C%93&search_form_all%5Bkeyword%5D=';
  const bubbleStyleUrl = chrome.runtime.getURL('css/bubble_box.css');
  const characterLimit = 20;
  const overlayHostId = 'gotthai-mini-host';
  const overlayStyleAttr = 'data-gotthai-style';
  const settings = {
    bubbleFunction: false
  };
  let overlayStyleTextPromise = null;

  // 設定読み込み
  document.onmousedown = () => {
    chrome.storage.local.get(null, (storage) => {
      settings.bubbleFunction = storage.bubbleFunction || false;
    });
  };

  document.onmouseup = (e) => {
    void handleMouseUp(e);
  };

  async function handleMouseUp(e) {
    const selection = window.getSelection();
    const keyword = selection.toString();
    const overlayRoot = await ensureOverlayRoot();
    const eventPath = typeof e.composedPath === 'function' ? e.composedPath() : [];
    // 前回のアンカーと吹き出し情報取得
    const previousAnchor = overlayRoot.getElementById('gotthai-mini-anchor');
    const previousBubble = overlayRoot.getElementById('gotthai-bubble-box');
    // 吹き出し上のクリックは何もせず終了
    if (previousBubble && eventPath.includes(previousBubble)) return;
    // 前回のアンカーと吹き出し削除
    previousAnchor?.remove();
    previousBubble?.remove();

    // メイン処理
    if (!shouldShowBubble(keyword)) return;

    const anchorRect = setAnchor(selection, overlayRoot);
    if (keyword.length > characterLimit) {
      setBubbleBox(anchorRect, createErrorBox(keyword, overlayRoot));
      return;
    }

    const response = await lookupKeyword(keyword);
    const boxElm = response.isSuccess ? createBubbleBox(keyword, response, overlayRoot) : createErrorBox(keyword, overlayRoot);
    setBubbleBox(anchorRect, boxElm);
  }

  function shouldShowBubble(keyword) {
    return keyword.trim() !== '' &&
      settings.bubbleFunction &&
      isThai(keyword) &&
      !isFormArea();
  }

  function lookupKeyword(keyword) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ keyword }, (res = {}) => {
        if (res.isSuccess) {
          scrapeResult(res);
        }
        resolve(res);
      });
    });
  }

  const scrapeResult = (res) => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(res.data, 'text/html');
    const matching = dom.getElementsByClassName('found-count');
    // ごったいのDOMっぽくなかったら接続できないと返す
    if (matching.length === 0) {
      res.isSuccess = false;
      return;
    }

    // scraping
    res.matching = [Number(matching[0].textContent), Number(matching[1].textContent)];
    if (res.matching[0] <= 0 && res.matching[1] <= 0) {
      return;
    }

    const wordLink = dom.querySelector('.thai.thai-md a');
    const audio = dom.querySelector('.thai.thai-md audio');
    res.href = wordLink?.getAttribute('href');
    res.word = wordLink?.textContent;
    res.pronunciation = dom.querySelector('.pronunciation')?.textContent.trim();
    res.voiceUrl = audio?.getAttribute('src');

    // 単語
    if (res.matching[0] > 0) {
      res.katakana = dom.querySelector('.katakana.katakana-sm')?.textContent.trim();
      res.meaning = dom.querySelector('.jp-meaning .ol.ol-narrow')?.innerHTML;
    // 例文
    } else {
      res.meaning = dom.querySelector('.jp-meaning')?.textContent.trim();
      res.katakana = false;
    }
  };

  // タイ文字: 3585 ~ 3675
  const isThai = (keyword) => {
    const removeSpace = keyword.replace(/\s+/g, '');
    let thaiCount = 0;

    for (let i = 0; i < removeSpace.length; ++i) {
      const char = removeSpace[i].charCodeAt();
      if (3584 < char && char < 3676) thaiCount += 1;
    }

    return thaiCount / removeSpace.length >= 0.5;
  };

  // 入力中の文字には反応しない
  const isFormArea = () => {
    return document.activeElement.isContentEditable;
  };

  // 例外処理通知吹き出しDOM作成
  const createErrorBox = (keyword, overlayRoot) => {
    const box = createElement({ tag: 'div', id: 'gotthai-bubble-box', style: 'visibility: hidden', appendTo: overlayRoot });
    const errorRow = createElement({ tag: 'div', id: 'gotthai-bubble-result', appendTo: box });
    const error = createElement({ tag: 'div', id: 'gotthai-bubble-error', tx: 'ごったいに接続できませんでした。', appendTo: errorRow });
    if (keyword.length > characterLimit) {
      error.textContent = `${characterLimit}文字以上は検索できません。`;
      const copy = createElement({ tag: 'span', id: 'gotthai-bubble-copy-thai', appendTo: errorRow });
      copy.addEventListener('click', () => clipboard(keyword));
    }
    createElement({ tag: 'div', id: 'gotthai-bubble-item-name', tx: '選択文字列', appendTo: box });
    createElement({ tag: 'div', id: 'gotthai-bubble-selected-text', tx: keyword, appendTo: box });
    return box;
  };

  // 検索結果吹き出しDOM作成
  const createBubbleBox = (keyword, res, overlayRoot) => {
    const box = createElement({ tag: 'div', id: 'gotthai-bubble-box', style: 'visibility: hidden', appendTo: overlayRoot });

    if (res.matching[0] > 0 || res.matching[1] > 0) {
      appendResultContent(box, keyword, res);
    } else {
      appendNoticeContent(box, keyword);
    }

    return box;
  };

  function appendResultContent(box, keyword, res) {
    createElement({ tag: 'div', id: 'gotthai-bubble-item-name', tx: '検索結果', appendTo: box });
    const result = createElement({ tag: 'div', id: 'gotthai-bubble-result', appendTo: box });
    createElement({ tag: 'a', id: 'gotthai-bubble-result', tx: res.word, href: baseUrl + res.href, appendTo: result });

    if (res.voiceUrl) {
      // 音声先読み
      chrome.runtime.sendMessage({ preloadVoiceUrl: res.voiceUrl });
      const voice = createElement({ tag: 'span', id: 'gotthai-bubble-voice', appendTo: result });
      voice.addEventListener('click', () => chrome.runtime.sendMessage({ playVoiceUrl: res.voiceUrl }));
    }

    const copy = createElement({ tag: 'span', id: 'gotthai-bubble-copy-thai', appendTo: result });
    copy.addEventListener('click', () => clipboard(res.word));

    const pronunciation = createElement({ tag: 'div', id: 'gotthai-bubble-pronunciation', tx: res.pronunciation, appendTo: box });
    pronunciation.addEventListener('click', () => clipboard(res.pronunciation));

    if (res.matching[0] > 0) {
      createElement({ tag: 'div', id: 'gotthai-bubble-katakana', tx: res.katakana, appendTo: box });
    }

    createElement({ tag: 'div', id: 'gotthai-bubble-item-name', tx: '意味', appendTo: box });
    const meaning = createElement({ tag: 'div', id: 'gotthai-bubble-meaning', tx: res.meaning, appendTo: box });
    if (res.matching[0] > 0) {
      meaning.textContent = '';
      createElement({ tag: 'ol', id: 'gotthai-bubble-meaning', html: res.meaning, appendTo: meaning });
    }

    createElement({ tag: 'div', id: 'gotthai-bubble-item-name', tx: '選択文字列', appendTo: box });
    createElement({ tag: 'div', id: 'gotthai-bubble-selected-text', tx: keyword, appendTo: box });

    const matching = createElement({ tag: 'div', id: 'gotthai-bubble-matching', appendTo: box });
    createElement({ tag: 'a', tx: `タイ語${res.matching[0]}件、例文${res.matching[1]}件`, href: searchUrl + keyword, appendTo: matching });
  }

  function appendNoticeContent(box, keyword) {
    createElement({ tag: 'div', id: 'gotthai-bubble-item-name', tx: '選択文字列', appendTo: box });
    const notice = createElement({ tag: 'div', id: 'gotthai-bubble-notice', appendTo: box });
    createElement({ tag: 'a', href: searchUrl + keyword, tx: keyword, appendTo: notice });
    notice.innerHTML += '<br>は見つかりませんでした。';
  }

  // 吹き出しを見やすい位置に配置
  const setBubbleBox = (anchorRect, box) => {
    const bubbleRect = box.getBoundingClientRect();
    const windowWidth = document.documentElement.clientWidth;
    const windowHeight = document.documentElement.clientHeight;
    const anchorCenter = anchorRect.left + anchorRect.width / 2;

    if (windowHeight - anchorRect.bottom > bubbleRect.height || anchorRect.top < bubbleRect.height) {
      box.style.top = `${anchorRect.bottom + window.pageYOffset + 7}px`;
    } else {
      box.style.top = `${anchorRect.top + window.pageYOffset - bubbleRect.height - 10}px`;
    }

    if (anchorCenter - bubbleRect.width / 2 < 0) {
      box.style.left = `${window.pageXOffset}px`;
    } else if (anchorCenter + bubbleRect.width / 2 > windowWidth) {
      box.style.left = `${2 * windowWidth - window.innerWidth - bubbleRect.width + window.pageXOffset}px`;
    } else {
      box.style.left = `${anchorCenter - bubbleRect.width / 2 + window.pageXOffset}px`;
    }

    box.style.visibility = 'visible';
  };

  // 選択範囲の位置にアンカーを打つ
  const setAnchor = (selection, overlayRoot) => {
    const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
    const styles = `
      position: absolute;
      top: ${window.pageYOffset + selectionRect.top}px;
      left: ${window.pageXOffset + selectionRect.left}px;
      width: ${selectionRect.width}px;
      height: ${selectionRect.height}px;
    `;
    const anchor = createElement({ tag: 'div', id: 'gotthai-mini-anchor', style: styles, appendTo: overlayRoot });
    return anchor.getBoundingClientRect();
  };

  async function ensureOverlayRoot() {
    let host = document.getElementById(overlayHostId);
    if (!host) {
      host = document.createElement('div');
      host.id = overlayHostId;
      host.style.position = 'absolute';
      host.style.top = '0';
      host.style.left = '0';
      host.style.width = '100%';
      host.style.height = '0';
      host.style.zIndex = '2147483647';
      host.style.pointerEvents = 'none';
      document.documentElement.appendChild(host);
    }

    const shadowRoot = host.shadowRoot || host.attachShadow({ mode: 'open' });
    let styleElm = shadowRoot.querySelector(`style[${overlayStyleAttr}]`);
    if (!styleElm) {
      styleElm = document.createElement('style');
      styleElm.setAttribute(overlayStyleAttr, 'true');
      styleElm.textContent = await getOverlayStyleText();
      shadowRoot.appendChild(styleElm);
    }
    return shadowRoot;
  }

  function getOverlayStyleText() {
    if (!overlayStyleTextPromise) {
      overlayStyleTextPromise = fetch(bubbleStyleUrl).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load bubble stylesheet');
        }
        return response.text();
      });
    }
    return overlayStyleTextPromise;
  }

  // element作成簡略化
  const createElement = ({ tag, id, tx, href, html, style, appendTo }) => {
    const elm = document.createElement(tag);
    if (id) elm.id = id;
    if (tx !== undefined) elm.textContent = tx;
    if (html) elm.innerHTML += html;
    if (style) elm.style.cssText = style;
    if (appendTo) appendTo.appendChild(elm);
    if (href) {
      elm.href = href;
      elm.target = '_blank';
    }
    return elm;
  };

  function clipboard(text) {
    navigator.clipboard.writeText(text);
  }
})();
