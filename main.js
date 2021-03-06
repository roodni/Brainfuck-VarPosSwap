"use strict";

function $(q) {
    return document.querySelector(q);
}

const
    $code_input = $("#code_input"),
    $code_compressed = $("#code_compressed"),
    $code_swaped = $("#code_swaped"),
    $varpos_tbody = $("#varpos_tbody"),
    $run = $("#run"),
    $bytes_compressed = $("#bytes_compressed"),
    $bytes_swaped = $("#bytes_swaped"),
    $info_log = $("#info_log");

// ** グローバル変数 **
let g_chukanCode = []; // 中間コードを格納する
let g_varPosTable = {}; // 変数位置変換表
let g_varPosInputs = {}; // 変数位置入力テーブルのinput要素へのアクセス

// 命令外文字および+-,<>を削除
function compressCode(code) {
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
function codeCheck(code) {
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
                    result.msg += `注意：'['の直後と対応する']'の直前でポインタが変化しているため、変数位置入れ替え機能を利用できません。（行${blockInfo.line}、列${blockInfo.col}）\n`;
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
function makeChukanCode(code) {
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
function makeCodeFromChukan(chukan, table) {
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

// 中間コードから使用する変数位置のソート済みリストを得る
function getVarPosList(chukan) {
    let used = new Set();
    for (let c of chukan) {
        used.add(c.pos);
    }
    let result = [...used.values()];
    result.sort((a, b) => a - b);
    return result;
}

// グローバルの変数位置変換表初期化
function initVarPosTable(varPosList) {
    g_varPosTable = {};
    for (let varPos of varPosList) {
        g_varPosTable[varPos] = varPos;
    }
}

// 変数位置リストから変数位置入力テーブルを作成、画面に反映する
function makeVarPosInput(varPosList) {
    const num_max = Math.max(100, varPosList[varPosList.length - 1]);
    g_varPosInputs = {};
    for (let varPos of varPosList) {
        const elm_tr = document.createElement("tr");

        const elm_td_original = document.createElement("td");
        elm_td_original.classList.add("varpos__cell", "varpos__td-original");
        elm_tr.appendChild(elm_td_original);

        elm_td_original.appendChild(document.createTextNode(varPos));

        const elm_td_new = document.createElement("td");
        elm_td_new.classList.add("varpos__cell", "varpos__td-new");
        elm_tr.appendChild(elm_td_new);

        const elm_num = document.createElement("input");
        elm_num.classList.add("varpos__num-input");
        elm_num.type = "number";
        elm_num.value = varPos;
        elm_num.max = num_max;
        elm_num.min = -num_max;
        elm_num.addEventListener("change", () => {
            let num = parseInt(elm_num.value);
            if (isNaN(num)) {
                num = varPos;
            } else if (num > num_max) {
                num = num_max;
            } else if (num < -num_max) {
                num = -num_max;
            }
            elm_num.value = num;
            g_varPosTable[varPos] = num;

            // 重複検出、表示
            const duplication = findVarPosDuplication(g_varPosTable);
            for (let varPosInput of Object.values(g_varPosInputs)) {
                varPosInput.classList.remove("varpos__num-input--duplicate");
            }
            for (let varPos of duplication) {
                g_varPosInputs[varPos].classList.add("varpos__num-input--duplicate");
            }
        });
        elm_td_new.appendChild(elm_num);
        g_varPosInputs[varPos] = elm_num;
        
        $varpos_tbody.appendChild(elm_tr);
    }
}

// 変数位置変換表の重複を検出
// result：重複のあったoriginalのvarPosを列挙した配列
function findVarPosDuplication(varPosTable) {
    let result = [];
    for (let i of Object.keys(varPosTable)) {
        for (let j of Object.keys(varPosTable)) {
            if (j !== i && varPosTable[j] === varPosTable[i]) {
                result.push(i);
                break;
            }
        }
    }
    return result;
}

// runボタンの使用可能/使用禁止
function enableRunButton() {
    $run.innerText = "→";
    $run.disabled = false;
}
function disableRunButton() {
    $run.innerText = "禁";
    $run.disabled = true;
}

$code_input.addEventListener("focus", () => {
    disableRunButton();
});
$code_input.addEventListener("blur", () => {
    const chukan = makeChukanCode($code_input.value);

    // 変数位置入力テーブルをすべて削除
    while ($varpos_tbody.firstChild) {
        $varpos_tbody.removeChild($varpos_tbody.firstChild);
    }

    const check = codeCheck($code_input.value);
    $info_log.value = check.msg;
    if (check.ok) {
        const varPosList = getVarPosList(chukan);
        initVarPosTable(varPosList);
        makeVarPosInput(varPosList);
        enableRunButton();
    } else {
        disableRunButton();
    }
    
    const code = makeCodeFromChukan(chukan, {});
    $code_compressed.value = code;
    $bytes_compressed.innerText = code.length;

    // 圧縮後のコードが変化したらswapedをクリア
    if (code !== makeCodeFromChukan(g_chukanCode, {})) {
        $code_swaped.value = "";
        $bytes_swaped.innerText = 0;
    }
    g_chukanCode = chukan;
});

$run.addEventListener("click", () => {
    const duplication = findVarPosDuplication(g_varPosTable);

    const code = makeCodeFromChukan(g_chukanCode, g_varPosTable);
    $code_swaped.value = code;
    $bytes_swaped.innerText = code.length;

    if (duplication.length !== 0) {
        $info_log.value += "警告：変数位置が重複していますが、変換を行いました。\n";
    } else {
        $info_log.value += "正常に変換を行いました。\n";
    }
});