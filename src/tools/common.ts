
export function changeSpaceToNBSP(str:string)  {
    //空格转换成UNICODE空格编码'\u00a0'，用以保留空格
    let s = "";
    for (let i = 0; i < str.length; i++) {
        if (str[i] === " ") {
            s += "\u00a0";
        } else {
            s += str[i];
        }
    }
    return s;
}
//单步调试时高亮正在执行的语法行
export function highlightLineByLine (line:number, highLine:boolean)  {
    const lineClass = "line" + line;
    const spans: HTMLCollection = document.getElementsByClassName(lineClass);
    const span = spans[0]  as HTMLElement
    if (spans !== null && highLine === true) {
        span.style.backgroundColor = "yellow";
        // const arrow = document.createElement("span");
        // arrow.classList.add("anticon");
        // arrow.classList.add("ant-badge");
        // span.parentNode.insertBefore(arrow, span);
    }

    if (spans !== null && highLine === false) {
        span.style.backgroundColor = "white";
        // let arrow = document.getElementsByClassName("ArrowRight");
        // if (arrow !== undefined) {
        //     arrow[0].parentNode.removeChild(arrow[0]);
        // }
    }
}
export function createLineSpan(){
    const ruleClass1= 'span.LineSpan:before'
    let rule = 'counter-increment: line;content: counter(line);display: inline-block;'
    rule += 'border-right: 1px solid #ddd;padding: 0 .5em;'
    rule += 'margin-right: .5em;color: #666;'
    rule += 'pointer-events:all;'
    document.styleSheets[1].addRule(ruleClass1, rule);
}
