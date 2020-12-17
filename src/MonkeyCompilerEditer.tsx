import React, { Component } from "react";
import rangy from "rangy/lib/rangy-selectionsaverestore";
import MonkeyLexer,{KeyWordMap as Props}  from "./MonkeyLexer";
import {Popover} from "antd";
import {changeSpaceToNBSP, createLineSpan} from "./tools/common"
interface State {
  popoverStyle:{
    title: string,
    content: string
  }
}
export default class MonkeyCompilerEditer extends Component<Props, State> {
  keyWords: any;
  keyWordClass: string;
  keyWordElementArray: any[];
  identifierElementArray: any[];
  textNodeArray: any[];
  lineNodeClass: string;
  lineSpanNode: string;
  identifierClass: string;
  breakPointClass: string;
  keyToIngore: string[];
  bpMap: {};
  ide: any;
  divInstance: any;
  lastBegin: number;
  lexer: MonkeyLexer;
  currentElement: any;
  constructor(props) {
    super(props);
    this.state = {
      popoverStyle:{
        title: "",
        content: ""
      }
    }
    this.keyWords = props.keyWords;
    rangy.init();
    this.keyWordClass = "keyword";
    this.keyWordElementArray = [];
    this.identifierElementArray = [];
    this.textNodeArray = [];
    this.lineNodeClass = "line";
    this.lineSpanNode = "LineSpan";
    this.identifierClass = "Identifier";
    this.breakPointClass = "breakpoint";
    //this.spanToTokenMap = {};

    this.keyToIngore = [
      "Enter",
      " ",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
    createLineSpan()
    this.bpMap = {};
    this.ide = null;
  }
  componentDidMount() {
    this.initPopoverControl();
  }

  initPopoverControl() {
    this.setState({
      popoverStyle: {
        title: "",
        content: ""
      }
    })
  }

  getContent() {
    return this.divInstance.innerText;
  }
  // dom树，找到节点，提供给lexer进行分词
  changeNode(n) {
    if (n.childNodes){
      const f = n.childNodes;
      for (const node of f) {
        this.changeNode(node);
      }
    }
    if (n.data) {
      this.lastBegin = 0;
      n.keyWordCount = 0;
      n.identifierCount = 0;
      const lexer = new MonkeyLexer(n.data);
      this.lexer = lexer;
      lexer.setLexingObserver(this, n);
      lexer.lexing();
    }
  }
  // 观察者模式  回调获得token对象，以及初始及结束位置
  notifyTokenCreation(token, elementNode, begin, end) {
    const e = {
      node: elementNode,
      begin: begin,
      end: end,
      token: token
    };
    

    if (this.keyWords[token.getLiteral()] !== undefined) {
      elementNode.keyWordCount++;
      this.keyWordElementArray.push(e);
    }

    if (
        elementNode.keyWordCount === 0 &&
        token.getType() === this.lexer.IDENTIFIER
    ) {
      elementNode.identifierCount++;
      this.identifierElementArray.push(e); //存入关键词数组
    }
  }

  hightLightKeyWord(token, elementNode, begin, end) {
    let strBefore = elementNode.data.substr(
        this.lastBegin,
        begin - this.lastBegin
    );
    //空格转换为unicode
    strBefore = changeSpaceToNBSP(strBefore);

    const textNode = document.createTextNode(strBefore);
    const parentNode = elementNode.parentNode;
    parentNode.insertBefore(textNode, elementNode);
    this.textNodeArray.push(textNode);
    //  关键词设置一个span标签
    const span = document.createElement("span");
    span.style.color = "green";
    span.classList.add(this.keyWordClass);
    span.appendChild(document.createTextNode(token.getLiteral()));
    parentNode.insertBefore(span, elementNode);

    this.lastBegin = end - 1;

    elementNode.keyWordCount--;
  }

  hightLightSyntax() {

    this.textNodeArray = [];

    for ( let i = 0; i < this.keyWordElementArray.length; i++) {
      const e = this.keyWordElementArray[i];
      this.currentElement = e.node;
      this.hightLightKeyWord(e.token, e.node, e.begin, e.end);

      if (this.currentElement.keyWordCount === 0) {
        const end = this.currentElement.data.length;
        let lastText = this.currentElement.data.substr(this.lastBegin, end);
        lastText = changeSpaceToNBSP(lastText);
        const parent = this.currentElement.parentNode;
        const lastNode = document.createTextNode(lastText);
        parent.insertBefore(lastNode, this.currentElement);
        // 解析最后一个节点，这样可以为关键字后面的变量字符串设立popover控件
        this.textNodeArray.push(lastNode);
        parent.removeChild(this.currentElement);
      }
    }
    this.keyWordElementArray = [];
  }

  getCaretLineNode() {
    const sel = document.getSelection();
    //得到光标所在行的node对象
    const nd = sel.anchorNode;
    //查看其父节点是否是span,如果不是，
    //我们插入一个span节点用来表示光标所在的行
    let currentLineSpan = null;
    const elements = document.getElementsByClassName(this.lineSpanNode);
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.contains(nd)) {
        currentLineSpan = element;
      }
      //删除自动复制的span class属性
      while (element.classList.length > 0) {
        element.classList.remove(element.classList.item(0));
      }
      element.classList.add(this.lineSpanNode);
      element.classList.add(this.lineNodeClass + String(i));
    }

    if (currentLineSpan !== null) {

      currentLineSpan.onclick = (e) => {
        this.createBreakPoint(e.toElement);
      }
      return currentLineSpan;
    }

    //计算一下当前光标所在节点的前面有多少个div节点，
    //前面的div节点数就是光标所在节点的行数
    const divElements = this.divInstance.childNodes;
    let l = 0;
    for (let i = 0; i < divElements.length; i++) {
      if (divElements[i].tagName === "DIV" && divElements[i].contains(nd)) {
        l = i;
        break;
      }
    }

    const spanNode = document.createElement("span") as HTMLElement;
    spanNode.classList.add(this.lineSpanNode);
    spanNode.classList.add(this.lineNodeClass + String(l));
    spanNode.dataset.lineNum = String(l);

    spanNode.onclick =  (e) => {
      this.createBreakPoint(e.relatedTarget);
    };

    nd.parentNode.replaceChild(spanNode, nd);
    spanNode.appendChild(nd);
    return spanNode;
  }

  setIDE(ide) {
    this.ide = ide;
  }

  createBreakPoint(elem) {
    if (elem.classList.item(0) !== this.lineSpanNode) {
      return;
    }
    //是否已存在断点，是的话就取消断点
    if (elem.dataset.bp === "true") {
      let bp = elem.previousSibling;
      bp.remove();
      elem.dataset.bp = "false";
      delete this.bpMap["" + elem.dataset.lineNum];
      if (this.ide) {
        this.ide.updateBreakPointMap(this.bpMap);
      }
      return;
    }

    //构造一个红色圆点
    elem.dataset.bp = "true";
    this.bpMap["" + elem.dataset.lineNum] = elem.dataset.lineNum;
    const bp = document.createElement("span");
    bp.style.height = "10px";
    bp.style.width = "10px";
    bp.style.backgroundColor = "red";
    bp.style.borderRadius = "50%";
    bp.style.display = "inline-block";
    bp.classList.add(this.breakPointClass);
    elem.parentNode.insertBefore(bp, elem.parentNode.firstChild);
    if (this.ide != null) {
      this.ide.updateBreakPointMap(this.bpMap);
    }
  }

  handleIdentifierOnMouseOver(e) {
    e.currentTarget.isOver = true;
    const token = e.currentTarget.token;
    this.setState({
      popoverStyle:{
        title:"Syntax",
        content:  "name:" + token.getLiteral() + "\nType:" + token.getType()
      }
    })
    if (this.ide) {
      const env = this.ide.getSymbolInfo(token.getLiteral());
      if (env) {
        this.setState({
          popoverStyle:{
            title: token.getLiteral(),
            content: env
          }})
      }
    }

    this.setState(this.state);
  }

  handleIdentifierOnMouseOut() {
    this.initPopoverControl();
  }

  addPopoverSpanToIdentifier(token, elementNode, begin, end) {
    let strBefore = elementNode.data.substr(
        this.lastBegin,
        begin - this.lastBegin
    );
    strBefore = changeSpaceToNBSP(strBefore);
    const textNode = document.createTextNode(strBefore);
    const parentNode = elementNode.parentNode;
    parentNode.insertBefore(textNode, elementNode);

    const span = document.createElement("span");
    span.onmouseenter = this.handleIdentifierOnMouseOver.bind(this);
    span.onmouseleave = this.handleIdentifierOnMouseOut.bind(this);
    span.classList.add(this.identifierClass);
    span.appendChild(document.createTextNode(token.getLiteral()));
    span.setAttribute("token",token);
    parentNode.insertBefore(span, elementNode);
    this.lastBegin = end - 1;
    elementNode.identifierCount--;
  }

  addPopoverByIdentifierArray() {
    //该函数的逻辑跟hightLightSyntax一摸一样
    for (let i = 0; i < this.identifierElementArray.length; i++) {
      //用 span 将每一个变量包裹起来，这样鼠标挪上去时就可以弹出popover控件
      const e = this.identifierElementArray[i];
      this.currentElement = e.node;
      //找到每个IDENTIFIER类型字符串的起始和末尾，给他们添加span标签
      this.addPopoverSpanToIdentifier(e.token, e.node, e.begin, e.end);

      if (this.currentElement.identifierCount === 0) {
        const end = this.currentElement.data.length;
        let lastText = this.currentElement.data.substr(this.lastBegin, end);
        lastText = changeSpaceToNBSP(lastText);
        const parent = this.currentElement.parentNode;
        const lastNode = document.createTextNode(lastText);
        parent.insertBefore(lastNode, this.currentElement);
        parent.removeChild(this.currentElement);
      }
    }

    this.identifierElementArray = [];
  }

  preparePopoverForIdentifers() {
    if (this.textNodeArray.length > 0) {
      //fix bug
      this.identifierElementArray = [];
      for (let i = 0; i < this.textNodeArray.length; i++) {
        //将text 节点中的文本提交给词法解析器抽取IDENTIFIER
        this.changeNode(this.textNodeArray[i]);
        this.addPopoverByIdentifierArray();
      }
      this.textNodeArray = [];
    } else{
      //为解析出的IDENTIFIER字符串添加鼠标取词功能
      this.addPopoverByIdentifierArray();
    }


  }

  onDivContentChange = (evt) => {
    if(document.getElementsByClassName("line0").length ===0  && evt.key === "Backspace"){
      alert('当前在首行，无法再进行回退')
      return;
    }
    if (this.keyToIngore.indexOf(evt.key) >= 0) {
      return;
    }

    let bookmark = undefined;
    if (evt.key !== "Enter") {
      //使用rangy组件确认光标能回到原来的位置
      bookmark = rangy.getSelection().getBookmark(this.divInstance);
    }

    //每当有输入只重新词法解析当前行
    let currentLine = this.getCaretLineNode();
    for (let i = 0; i < currentLine.childNodes.length; i++) {
      if (
          currentLine.childNodes[i].className === this.keyWordClass ||
          currentLine.childNodes[i].className === this.identifierClass
      ) {
        const child = currentLine.childNodes[i];
        const t = document.createTextNode(child.innerText);
        currentLine.replaceChild(t, child);
      }
    }

    //把所有相邻的text node 合并成一个
    currentLine.normalize();
    this.identifierElementArray = [];
    this.changeNode(currentLine);
    this.hightLightSyntax();
    this.preparePopoverForIdentifers();

    if (evt.key !== "Enter") {
      rangy.getSelection().moveToBookmark(bookmark);
    }
  }

  onClickDiv() {
    /*
        只有把pointerEvents设置为none，我们才能抓取鼠标在每行
        数字处点击的信息，但是设置后mouseenter消息就不能接收到
        于是当我们把鼠标挪到变量上方时，无法显现popover
        */
    const lineSpans = document.getElementsByClassName(this.lineSpanNode) as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < lineSpans.length; i++) {
      lineSpans[i].style.pointerEvents = "none";
    }
  }
  //
  // onMouseEnter() {
  //   /*
  //       要想让popover控件出现，必须接收mouseenter时间，
  //       只有把pointerEvent设置为空而不是none时，这个时间才能传递给
  //       span
  //       */
  //   const lineSpans = document.getElementsByClassName(this.lineSpanNode);
  //   for (let i = 0; i < lineSpans.length; i++) {
  //     lineSpans[i].style.pointerEvents = "";
  //   }
  // }

  render() {
    let textAreaStyle = {
      height: 480,
      border: "1px solid black",
      counterReset: "line",
      fontFamily: "monospace",
    };
    return (
        <div>
          <Popover
              placement="top"
              content={this.state.popoverStyle.content}
              title={this.state.popoverStyle.title}
              id="identifier-show"
          >
          <div
              style={textAreaStyle}
              onKeyUp={this.onDivContentChange}
              ref={(ref) => {
                this.divInstance = ref;
              }}
              contentEditable
          >
          </div>
          </Popover>
        </div>
    );
  }
}
