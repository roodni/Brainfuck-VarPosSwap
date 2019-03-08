"use strict";

{
    // jQuery使え
    const $ = (q) => document.querySelector(q);

    const
        $code_input = $("#code_input"),
        $code_compressed = $("#code_compressed"),
        $code_swaped = $("#code_swaped"),
        $varpos_tbody = $("#varpos_tbody"),
        $run = $("#run"),
        $bytes_compressed = $("#bytes_compressed"),
        $bytes_swaped = $("#bytes_swaped"),
        $info_log = $("#info_log");

    // 命令外文字および+-,<>を削除
    const compressCode = (code) => {
        code = code.replace(/[^+\-><\[\].,]/g, "");
        const po = /\+-|-\+|><|<>/g
        while (po.test(code)) {
            code = code.replace(po, "");
        }
        return code;
    };

    // 変数位置を入れ替えやすい中間コードの作成
    const makeChukanCode = (code) => {
        code = compressCode(code);
        let
            chukanCode = [],
            pos = 0,
            miniCode = "";
        const pushCode = () => {
            chukanCode.push({
                pos: pos,
                code: miniCode
            });
            miniCode = "";
        };
        for (let c of code) {
            if ((c === ">" || c === "<") && miniCode !== "") {
                pushCode();
            }
            switch (c) {
                case ">":
                pos++;
                break;
                case "<":
                pos--;
                break;
                default:
                miniCode += c;
                break;
            }
        }
        pushCode();
        
        return chukanCode;
    };

    // 中間コードと変数位置テーブルからbfコードを復元
    // {元コードの変数位置 : 新しい変数位置}
    // 変数位置の変更がない場合は省略可能
    const makeCodeFromChukan = (chukan, table) => {
        let code = "";

        let prevPos = 0;
        for (let c of chukan) {
            let pos = (c.pos in table) ? table[c.pos] : c.pos;
            let move = pos - prevPos;
            code += ((move >= 0) ? ">" : "<").repeat(Math.abs(move));
            code += c.code;
            prevPos = pos;
        }

        return code;
    };

    $code_input.addEventListener("change", () => {
        const po = makeChukanCode($code_input.value);
        console.clear();
        for (let s of po) {
            console.log(s);
        }
        
        const code = makeCodeFromChukan(po, {});
        $code_compressed.value = code;
        $bytes_compressed.innerText = code.length;
    })
    
}