import MonkeyLexer, { Token } from '../MonkeyLexer'
import {
  Statement, Program, HashLiteral, ArrayLiteral, Expression,
  IndexExpression, StringLiteral,
  InfixExpression, BooleanCtr, IfExpression,
  BlockStatement, FunctionLiteral, Identifier,
  CallExpression, ReturnStatement, LetStatement,
  ExpressionStatement, IntegerLiteral,
  PrefixExpression,
} from "./ParserCtr"
interface HashProps {
  token: Token,
  keys: Array<Expression>,
  values: Array<Expression>
}
class MonkeyCompilerParser {
  lexer: MonkeyLexer
  tokenPos: number
  curToken: Token
  peekToken: Token
  program: Program
  LOWEST: number
  EQUALS: number
  LESSGREATER: number
  SUM: number
  PRODUCT: number
  PREFIX: number
  CALL: number
  INDEX: number
  prefixParseFns: object
  precedencesMap: object
  infixParseFns: object
  constructor(lexer: MonkeyLexer) {
    this.lexer = lexer
    this.lexer.lexing()
    this.tokenPos = 0
    this.curToken = null
    this.peekToken = null
    this.nextToken()  //调用两次，curtoken指向第一个token，peektoken指向第二个token
    this.nextToken()
    this.program = new Program()
    //  解析优先级
    this.LOWEST = 0
    this.EQUALS = 1  // ==
    this.LESSGREATER = 2 // < or >
    this.SUM = 3
    this.PRODUCT = 4
    this.PREFIX = 5 //-X or !X
    this.CALL = 6  //myFunction(X)
    //  数组取值具备最高优先级
    this.INDEX = 7

    //根据token类型执行对应解析函数
    this.prefixParseFns = {}
    this.prefixParseFns[this.lexer.IDENTIFIER] = this.parseIdentifier
    this.prefixParseFns[this.lexer.INTEGER] = this.parseIntegerLiteral
    //取反操作
    this.prefixParseFns[this.lexer.BANG_SIGN] = this.parsePrefixExpression
    this.prefixParseFns[this.lexer.MINUS_SIGN] = this.parsePrefixExpression

    this.prefixParseFns[this.lexer.TRUE] = this.parseBoolean
    this.prefixParseFns[this.lexer.FALSE] = this.parseBoolean
    this.prefixParseFns[this.lexer.LEFT_PARENT] = this.parseGroupedExpression
    this.prefixParseFns[this.lexer.IF] = this.parseIfExpression
    this.prefixParseFns[this.lexer.FUNCTION] = this.parseFunctionLiteral

    this.prefixParseFns[this.lexer.STRING] = this.parseStringLiteral
    //数组解析
    this.prefixParseFns[this.lexer.LEFT_BRACKET] = this.parseArrayLiteral

    this.prefixParseFns[this.lexer.LEFT_BRACE] = this.parseHashLiteral

    this.initPrecedencesMap()
    this.registerInfixMap()
  }

  initPrecedencesMap() {
    this.precedencesMap = {}
    this.precedencesMap[this.lexer.EQ] = this.EQUALS
    this.precedencesMap[this.lexer.NOT_EQ] = this.EQUALS
    this.precedencesMap[this.lexer.LT] = this.LESSGREATER
    this.precedencesMap[this.lexer.GT] = this.LESSGREATER
    this.precedencesMap[this.lexer.PLUS_SIGN] = this.SUM
    this.precedencesMap[this.lexer.MINUS_SIGN] = this.SUM
    this.precedencesMap[this.lexer.SLASH] = this.PRODUCT
    this.precedencesMap[this.lexer.ASTERISK] = this.PRODUCT
    this.precedencesMap[this.lexer.LEFT_PARENT] = this.CALL
    this.precedencesMap[this.lexer.LEFT_BRACKET] = this.INDEX
  }

  curOrPeekPrecedence(token: Token): number {
    const p = this.precedencesMap[token.getType()]
    if (p !== undefined) {
      return p
    }
    return this.LOWEST
  }

  registerInfixMap(): void {
    this.infixParseFns = {}
    this.infixParseFns[this.lexer.PLUS_SIGN] = this.parseInfixExpression
    this.infixParseFns[this.lexer.MINUS_SIGN] = this.parseInfixExpression
    this.infixParseFns[this.lexer.SLASH] = this.parseInfixExpression
    this.infixParseFns[this.lexer.ASTERISK] = this.parseInfixExpression
    this.infixParseFns[this.lexer.EQ] = this.parseInfixExpression
    this.infixParseFns[this.lexer.NOT_EQ] = this.parseInfixExpression
    this.infixParseFns[this.lexer.LT] = this.parseInfixExpression
    this.infixParseFns[this.lexer.GT] = this.parseInfixExpression
    //函数调用
    this.infixParseFns[this.lexer.LEFT_PARENT] = this.parseCallExpression
    //数组查找
    this.infixParseFns[this.lexer.LEFT_BRACKET] = this.parseIndexExpression
  }

  parseHashLiteral(caller: MonkeyCompilerParser): Object | null {
    let props: HashProps = {
      token: caller.curToken,
      keys: [],
      values: []
    }
    while (caller.peekTokenIs(caller.lexer.RIGHT_BRACE) !== true) {
      caller.nextToken()
      //先解析expression:expression中左边的算术表达式
      const key = caller.parseExpression(caller.LOWEST)
      //越过中间的冒号
      if (!caller.expectPeek(caller.lexer.COLON)) {
        return null
      }
      caller.nextToken()
      //解析冒号右边的表达式
      const value = caller.parseExpression(caller.LOWEST)
      props.keys.push(key)
      props.values.push(value)
      //接下来必须跟着逗号或者右括号
      if (!caller.peekTokenIs(caller.lexer.RIGHT_BRACE) &&
        !caller.expectPeek(caller.lexer.COMMA)) {
        return null
      }
    }
    //最后必须以右括号结尾
    if (!caller.expectPeek(caller.lexer.RIGHT_BRACE)) {
      return null
    }
    const obj = new HashLiteral(props)
    console.log("parsing map obj: ", obj.getLiteral())
    return obj
  }

  parseArrayLiteral(caller: MonkeyCompilerParser): ArrayLiteral {
    const props = {
      token: caller.curToken,
      elements: caller.parseExpressionList(caller.lexer.RIGHT_BRACKET)
    }
    const obj = new ArrayLiteral(props);
    console.log("parsing array result: ", obj.getLiteral())
    return obj
  }
  //解析数组表达式
  parseExpressionList(end: number): Array<Expression> | null {
    let list = []
    if (this.peekTokenIs(end)) {
      this.nextToken()
      return list
    }

    this.nextToken()
    list.push(this.parseExpression(this.LOWEST))
    while (this.peekTokenIs(this.lexer.COMMA)) {
      this.nextToken()
      this.nextToken() //越过逗号
      list.push(this.parseExpression(this.LOWEST))
    }

    if (!this.expectPeek(end)) {
      return null
    }
    return list
  }

  parseIndexExpression(caller: MonkeyCompilerParser, left: Expression): IndexExpression | null {
    const props = {
      token: caller.curToken,
      left: left,
      index: null
    }

    caller.nextToken()
    props.index = caller.parseExpression(caller.LOWEST)
    if (!caller.expectPeek(caller.lexer.RIGHT_BRACKET)) {
      return null
    }

    const obj = new IndexExpression(props)
    console.log("array indexing:", obj.getLiteral())
    return new IndexExpression(props)
  }

  parseStringLiteral(caller: MonkeyCompilerParser): StringLiteral {
    const props = {
      token: caller.curToken
    }
    return new StringLiteral(props)
  }

  parseInfixExpression(caller: MonkeyCompilerParser, left: Expression): InfixExpression {
    const props = {
      leftExpression: left,
      token: caller.curToken,
      operator: caller.curToken.getLiteral(),
      rightExpression: null
    }
    const precedence = caller.curOrPeekPrecedence(caller.curToken)
    caller.nextToken()
    props.rightExpression = caller.parseExpression(precedence)
    return new InfixExpression(props)
  }

  parseBoolean(caller: MonkeyCompilerParser): BooleanCtr {
    const props = {
      token: caller.curToken,
      value: caller.curTokenIs(caller.lexer.TRUE)
    }
    return new BooleanCtr(props)
  }

  parseGroupedExpression(caller: MonkeyCompilerParser): Expression| null{
    caller.nextToken()
    const exp = caller.parseExpression(caller.LOWEST)
    if (caller.expectPeek(caller.lexer.RIGHT_PARENT) !== true) {
      return null
    }

    return exp
  }

  parseIfExpression(caller: MonkeyCompilerParser): IfExpression| null{
    const props = {
      token: caller.curToken,
      condition: null,
      consequence: null,
      alternative: null
    }

    if (caller.expectPeek(caller.lexer.LEFT_PARENT) !== true) {
      return null
    }
    caller.nextToken()

    props.condition = caller.parseExpression(caller.LOWEST)
    if (caller.expectPeek(caller.lexer.RIGHT_PARENT) !== true) {
      return null
    }

    if (caller.expectPeek(caller.lexer.LEFT_BRACE) !==
      true) {
      return null
    }

    props.consequence = caller.parseBlockStatement(caller)

    if (caller.peekTokenIs(caller.lexer.ELSE) === true) {
      caller.nextToken()
      if (caller.expectPeek(caller.lexer.LEFT_BRACE) !== true) {
        return null
      }
      props.alternative = caller.parseBlockStatement(caller)
    }
    return new IfExpression(props)
  }

  parseBlockStatement(caller: MonkeyCompilerParser): BlockStatement{
    const props = {
      token: caller.curToken,
      statements: []
    }

    caller.nextToken()
    while (caller.curTokenIs(caller.lexer.RIGHT_BRACE) !== true) {
      const stmt = caller.parseStatement()
      if (stmt != null) {
        props.statements.push(stmt)
      }
      caller.nextToken()
    }
    return new BlockStatement(props)
  }

  parseFunctionLiteral(caller: MonkeyCompilerParser): FunctionLiteral| null{
    const props = {
      token: caller.curToken,
      parameters: [],
      body: null
    }

    if (caller.expectPeek(caller.lexer.LEFT_PARENT) !== true) {
      return null
    }

    props.parameters = caller.parseFunctionParameters(caller)

    if (caller.expectPeek(caller.lexer.LEFT_BRACE) !== true) {
      return null
    }

    props.body = caller.parseBlockStatement(caller)

    return new FunctionLiteral(props)
  }

  parseFunctionParameters(caller: MonkeyCompilerParser): Array<Expression>| null{
    const parameters = []
    if (caller.peekTokenIs(caller.lexer.RIGHT_PARENT)) {
      caller.nextToken()
      return parameters
    }

    caller.nextToken()
    const identProp = {
      token: caller.curToken
    }

    parameters.push(new Identifier(identProp))

    while (caller.peekTokenIs(caller.lexer.COMMA)) {
      caller.nextToken()
      caller.nextToken()
      const ident = {
        token: caller.curToken
      }
      parameters.push(new Identifier(ident))
    }

    if (caller.expectPeek(caller.lexer.RIGHT_PARENT) !==
      true) {
      return null
    }

    return parameters
  }

  parseCallExpression(caller: MonkeyCompilerParser, fun): CallExpression {
    const props = {
      token: caller.curToken,
      function: fun,
      arguments: caller.parseCallArguments(caller)
    }
    return new CallExpression(props)
  }

  parseCallArguments(caller: MonkeyCompilerParser): Array<Expression>| null{
    const args = []
    if (caller.peekTokenIs(caller.lexer.RIGHT_PARENT)) {
      caller.nextToken()
      return args
    }

    caller.nextToken()
    args.push(caller.parseExpression(caller.LOWEST))

    while (caller.peekTokenIs(caller.lexer.COMMA)) {
      caller.nextToken()
      caller.nextToken()
      args.push(caller.parseExpression(caller.LOWEST))
    }

    if (caller.expectPeek(caller.lexer.RIGHT_PARENT)
      !== true) {
      return null
    }

    return args
  }

  nextToken(): void {
    /*
    一次必须读入两个token,这样我们才了解当前解析代码的意图
    例如假设当前解析的代码是 5; 那么peekToken就对应的就是
    分号，这样解析器就知道当前解析的代码表示一个整数
    */
    this.curToken = this.peekToken
    this.peekToken = this.lexer.tokens[this.tokenPos]
    this.tokenPos++
  }

  parseProgram(): Program {
    while (this.curToken.getType() !== this.lexer.EOF) {
      const stmt = this.parseStatement()
      if (stmt !== null) {
        // const token = this.curToken.getType()
        this.program.statements.push(stmt)
      }
      this.nextToken()
    }
    return this.program
  }

  parseStatement(): Statement {
    switch (this.curToken.getType()) {
      case this.lexer.LET:
        return this.parseLetStatement()
      case this.lexer.RETURN:
        return this.parseReturnStatement()
      default:
        return this.parseExpressionStatement()
    }
  }

  parseReturnStatement(): ReturnStatement {
    const props = {
      token: this.curToken,
      expression: null
    }
    this.nextToken()
    props.expression = this.parseExpression(this.LOWEST)
    //  结尾必须是分号
    if (!this.expectPeek(this.lexer.SEMICOLON)) {
      return null
    }

    return new ReturnStatement(props)
  }

  createIdentifier(): Identifier {
    const identProps = {
      token: this.curToken,
      value: this.curToken.getLiteral()
    }

    return new Identifier(identProps)
  }

  parseLetStatement(): LetStatement | null {
    const props = {
      token: this.curToken,
      identifier: null,
      expression: null
    }

    //expectPeek 会调用nextToken将curToken转换为下一个token
    if (!this.expectPeek(this.lexer.IDENTIFIER)) {
      return null
    }
    props.identifier = this.createIdentifier()
    if (!this.expectPeek(this.lexer.ASSIGN_SIGN)) {
      return null
    }
    this.nextToken()
    props.expression = this.parseExpression(this.LOWEST)
    if (!this.expectPeek(this.lexer.SEMICOLON)) {
      return null
    }
    return new LetStatement(props)
  }

  parseExpressionStatement(): ExpressionStatement {
    const props = {
      token: this.curToken,
      expression: this.parseExpression(this.LOWEST)
    }

    const stmt = new ExpressionStatement(props);
    if (this.peekTokenIs(this.lexer.SEMICOLON)) {
      this.nextToken()
    }
    return stmt
  }

  parseExpression(precedence: number) {
    const prefix = this.prefixParseFns[this.curToken.getType()]
    if (prefix == null) {
      console.log("no parsing function found for token " +
        this.curToken.getLiteral())
      return null
    }
    let leftExp = prefix(this)
    while (this.peekTokenIs(this.lexer.SEMICOLON) !== true
      && precedence < this.curOrPeekPrecedence(this.peekToken)) {
      const infix = this.infixParseFns[this.peekToken.getType()]
      if (infix === null) {
        return leftExp
      }
      this.nextToken()
      leftExp = infix(this, leftExp)
    }
    return leftExp
  }

  parseIdentifier(caller: MonkeyCompilerParser) {
    return caller.createIdentifier()
  }

  parseIntegerLiteral(caller: MonkeyCompilerParser): IntegerLiteral | null {
    const intProps = {
      token: caller.curToken,
      value: parseInt(caller.curToken.getLiteral(), 10)
    }

    if (isNaN(intProps.value)) {
      console.log("could not parse token as integer")
      return null
    }

    return new IntegerLiteral(intProps)
  }

  //前序表达式
  parsePrefixExpression(caller: MonkeyCompilerParser): PrefixExpression {
    let props = {
      token: caller.curToken,
      operator: caller.curToken.getLiteral(),  //operator-操作符
      expression: ""
    }
    caller.nextToken()
    props.expression = caller.parseExpression(caller.PREFIX)
    return new PrefixExpression(props)
  }

  curTokenIs(tokenType): boolean {
    return this.curToken.getType() === tokenType
  }

  peekTokenIs(tokenType): boolean {
    return this.peekToken.getType() === tokenType
  }

  expectPeek(tokenType): boolean {
    if (this.peekTokenIs(tokenType)) {
      this.nextToken()
      return true
    } else {
      console.log(this.peekError(tokenType))
      return false
    }
  }

  peekError(type): string {
    return ("expected next token to be " +
      this.lexer.getLiteralByTokenType(type))
  }
}

export default MonkeyCompilerParser