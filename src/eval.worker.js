/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
import MonkeyEvaluator from '../src/MonkeyEvaluator.ts'
import MonkeyLexer from '../src/MonkeyLexer.ts'
import MonkeyCompilerParser from './MonkeyCompilerParser.ts'

self.addEventListener("message", handleMessage);

function handleMessage(event) {
	console.log("evaluator begin to eval")
    this.sharedArray = new Int32Array(event.data[0])
    this.execCommand = 123
    //初始化词法解析器
    this.lexer = new MonkeyLexer(event.data[1])
    //初始化语法解析器
    this.parser = new MonkeyCompilerParser(this.lexer)
    //开始语法解析
    this.program = this.parser.parseProgram()
    this.evaluator = new MonkeyEvaluator(this)
    this.evaluator.eval(this.program)
}

self.waitBeforeEval = function() {
	console.log("evaluator wait for exec command")
	Atomics.wait(this.sharedArray,0, 0)
	Atomics.store(this.sharedArray, 0)
}

self.sendExecInfo = function(msg, res) {
    console.log("evaluator send exec info")
	this.postMessage([msg, res])
}