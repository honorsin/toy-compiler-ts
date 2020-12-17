/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Component, Fragment } from 'react'
import { Button, PageHeader } from 'antd'

import { CaretRightOutlined } from '@ant-design/icons';
import MonkeyLexer from './MonkeyLexer'
import MonkeyCompilerEditer from './MonkeyCompilerEditer'
import MonkeyCompilerParser from './MonkeyCompilerParser/MonkeyCompilerParser' //不要删除，调试产生sourcemap
import MonkeyEvaluator from './MonkeyCompilerEvaluator/MonkeyEvaluator'
// @ts-ignore
import Worker from './channel.worker'
// @ts-ignore
import EvalWorker from './eval.worker'
import './css/MonkeyCompilerIDE.css'
import { highlightLineByLine } from './tools/common'
interface State {
    stepEnable: boolean
}
class MonkeyCompilerIDE extends Component<any, State> {
    lexer: MonkeyLexer;
    breakPointMap: any;
    channelWorker: any;
    inputInstance: MonkeyCompilerEditer;
    currentLine: any;
    currentEnviroment: any;
    ide: MonkeyCompilerIDE;
    constructor(props) {
        super(props)
        this.lexer = new MonkeyLexer("")
        this.state = { stepEnable: false }
        this.breakPointMap = null
        this.channelWorker = new Worker()
        this.inputInstance = null
    }

    updateBreakPointMap(bpMap) {
        this.breakPointMap = bpMap
    }

    onLexingClick() {
        this.inputInstance.setIDE(this)
        this.channelWorker.postMessage(['code', this.inputInstance.getContent()])
        this.channelWorker.addEventListener('message',
            this.handleMsgFromChannel.bind(this))
    }

    handleMsgFromChannel(e) {

        const cmd = Array.isArray(e.data) ? e.data[0] : e.data

        if (cmd === "beforeExec") {
            console.log("receive before execBefore msg from channel worker")
            this.setState({ stepEnable: true })
            const execInfo = e.data[1]
            this.currentLine = execInfo['line']
            this.currentEnviroment = execInfo['env']
            highlightLineByLine(execInfo['line'], true)
        } else if (cmd === "finishExec") {
            console.log("receive finishExec msg: ", e.data[1])
            const execInfo = e.data[1]
            this.currentEnviroment = execInfo['env']
        }
    }

    getSymbolInfo(name) {
        return this.currentEnviroment[name]
    }

    onContinueClick() {
        this.channelWorker.postMessage("execNext")
        this.setState({ stepEnable: false })
        highlightLineByLine(this.currentLine, false)
    }


    getCurrentEnviroment() {
        return this.currentEnviroment
    }

    render() {
        return (
            <Fragment>
                <PageHeader
                    className="site-page-header"
                    title="Monkey Compiler"
                />
                <MonkeyCompilerEditer
                    keyWords={this.lexer.getKeyWords()}
                    ref={(ref) => { this.inputInstance = ref }}
                />
                <Button
                    className="button button-run"
                    icon={<CaretRightOutlined />}
                    onClick={this.onLexingClick.bind(this)}
                >
                    Parsing
                </Button>
                <Button
                    className="button button-step danger"
                    onClick={this.onContinueClick.bind(this)}
                    disabled={!this.state.stepEnable}
                >
                    Step
                </Button>
            </Fragment>
        );
    }
}

export default MonkeyCompilerIDE