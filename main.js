"use strict";

{
    // jQuery使え
    const $ = (q) => document.querySelector(q);

    const
        $code_input = $("#code_input"),
        $code_compressed = $("#code_compressed"),
        $code_swaped = $("#code_swaped"),
        $run = $("#run"),
        $bytes_compressed = $("#bytes_compressed"),
        $bytes_swaped = $("#bytes_swaped");

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

    $run.addEventListener("click", () => {
        const po = makeChukanCode($code_input.value);
        console.clear();
        for (let s of po) {
            console.log(s);
        }
    })
    
}