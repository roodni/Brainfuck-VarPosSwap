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

    $run.addEventListener("click", () => {
        const unko = compressCode($code_input.value);
        $code_compressed.value = unko;
        //console.clear();
        //console.log(unko);
    })
    
}