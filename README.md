# Brainfuck-VarPosSwap
Brainf*ck変数位置入れ替え補助ツール

## 機能
Brainfuckプログラムが使用する変数のメモリ割り当てを自由に変更することができます。
`[`直後とそれに対応する`]`直前でデータポインタが変化しないコードが対象です。

## 動作環境
最新版のChromeおよびSafariで動作を確認しています。

## 使い方
1. 「コード入力」エリアに変換したいコードを貼り付ける  
  自動的にコードが解析され、使用変数位置一覧と圧縮されたコードが表示されます。  
1. 「変数位置」欄で変数位置を設定
1. 「→」ボタンで変換  
  変換後のコードが「変換」エリアに出力されます。