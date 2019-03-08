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

    // bfコードの文法チェック＋変数位置入れ替え可能か確認
    // result.ok: 入れ替え可能か
    // result.msg: エラーメッセージなど
    const codeCheck = (code) => {
        let result = {
            ok: true,
            msg: ""
        };
        let line = 1;
        let col = 1;
        const nest = [];
        let pos = 0;

        for (let c of code) {
            switch (c) {
            case ">":
                pos++;
                break;
            case "<":
                pos--;
                break;
            case "[":
                nest.push({
                    line: line,
                    col: col,
                    pos: pos,
                    posErrorIgnore: false
                });
                break;
            case "]":
                if (nest.length === 0) {
                    result.ok = false;
                    result.msg += `文法エラー：']'に対応する'['がありません。（行${line}、列${col}）\n`;
                } else {
                    const blockInfo = nest.pop();
                    if (!blockInfo.posErrorIgnore && blockInfo.pos !== pos) {
                        // 上の[]で同じ注意を発生させない
                        for (let info of nest) {
                            info.posErrorIgnore = true;
                        }
                        result.ok = false;
                        result.msg += `注意：'['の直後と対応する']'の直前でポインタが変化しているため、変数位置入れ替え機能を利用できません。（行${blockInfo.line}、行${blockInfo.col}）\n`;
                    }
                }
                break;
            case "\n":
                line++;
                col = 0;
                break;
            }
            col++;
        }
        for (let blockInfo of nest) {
            result.ok = false;
            result.msg += `文法エラー：'['に対応する']'がありません。（行${blockInfo.line}、列${blockInfo.col}）\n`;
        }
        if (result.ok) {
            result.msg += `変数位置入れ替え機能を利用できます。\n`;
        }
        return result;
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
        const check = codeCheck($code_input.value);

        $info_log.value = check.msg;
        
        const code = makeCodeFromChukan(po, {});
        $code_compressed.value = code;
        $bytes_compressed.innerText = code.length;
    })
    
}