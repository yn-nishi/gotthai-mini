---

<img src="./for_description/logo_400.png" width="200">

### ごったい-mini (Gotthai-mini)
タイ語をドラッグするだけで辞書が引けるChorome拡張機能。

(A Chrome Extension that you can look up a dictionary just by dragging Thai.)

辞書の機能に[ごったい](https://www.gotthai.net/)様を使用させて頂いています。  

---

### デモ映像 (Demonstration)
![demonstration](./for_description/animation.gif)

---

### 詳しい使い方 (Details of how to use)
[YouTube (Japanese only)](https://youtu.be/uHAtoQ3XLl8)

---

### ダウンロード (Download)

[Chromeウェブストア(Chrome web store)](https://chrome.google.com/webstore/detail/%E3%81%94%E3%81%A3%E3%81%9F%E3%81%84mini/ifcgngcnnmdcbnigbmfiedlnkmfiekkb?hl=ja&authuser=0)

---

### プログラムの流れ (Program flow)
- クリック位置と選択された文字列とその範囲を取得。
- クリック箇所が吹き出し以外の場所の場合、前回の吹き出しを削除。
- 以下の条件はプログラム途中終了。
  - 吹き出しを表示しない設定だった場合。
  - 吹き出しをクリックした場合。
  - ~~選択文字列の数字とタイ語の割合が50%以下。~~
  - 選択文字列のタイ文字の割合が50%以下。(v2.0.2以降)
  - ~~クリック箇所が\<textarea\>または\<input\>~~
  - 入力可能な箇所の文字の選択。タグに依存しない。(v2.0.2以降)
- 選択文字数が20文字以上の場合は検索できない旨のメッセージを表示。
- 以上の条件をクリアした場合に限りごったいと通信を行い、結果を見やすい位置に表示する。

---

### 変更履歴 (Update history)
v2.0.2 辞書の起動条件少しだけ修正
v2.0.1 リファクタリング
v2.0.0 音声の読み込み速度向上
v1.0.3 twitterで音声再生されない問題解消  
v1.0.2 GoogleAnalitics追加 & GitHubにinitial commit  
v1.0.1 リファクタリング & Googleウェブストア公開  
v1.0.0 完成

---
