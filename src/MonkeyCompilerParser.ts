import MonkeyLexer,{Token} from './MonkeyLexer'

class Node {
  tokenLiteral: string
  type: string
  lineNumber: number
    constructor (props: Object) {
        this.tokenLiteral = ""
        this.type = ""
        this.lineNumber =  Number.MAX_SAFE_INTEGER
        for (const i in props) {
          if (props[i].getLineNumber !== undefined) {
            console.log("line: " + props[i].getLineNumber())
            if (props[i].getLineNumber() < this.lineNumber) {
              this.lineNumber = props[i].getLineNumber()
            }
          }
        }
    }

    getLiteral() {
	    return this.tokenLiteral
	  }
    getLineNumber() {
      return this.lineNumber
    }
}

class Statement extends Node{ 
	statementNode () {
      this.type = "Statement"
	    return this
	}
}
interface ExpressionProps {
  token: Token
  expression: Expression
}
class Expression extends Node{
    constructor(props: ExpressionProps) {
        super(props)
        this.type = "Expression"
        this.tokenLiteral = props.token.getLiteral()
    }
    expressionNode () {
        return this
    }
}

class Identifier extends Expression {
    token: Token
    value: string
    constructor(props) {
        super(props)
        this.tokenLiteral = props.token.getLiteral()
        this.token = props.token
        this.value = ""
        this.type = "Identifier"
    }
}
interface LetStatementProps {
  token: Token
  identifier: Identifier
  expression: Expression
}
class LetStatement extends Statement {
    token: Token
    name: Identifier
    value: Expression
    constructor(props: LetStatementProps) {
        super(props)
        this.token = props.token  //对应keywords
        this.name = props.identifier  //identifer的实例
        this.value = props.expression
        let s = "This is a Let statement, left is an identifer:"
        s += props.identifier.getLiteral()
        s += " right size is value of "
        s += this.value.getLiteral()
        this.tokenLiteral = s

        this.type = "LetStatement"
    }
}
interface ReturnStatementProps {
  token: Token
  expression: Expression
}
class ReturnStatement extends Statement{
  token: Token
  expression: Expression
  constructor(props: ReturnStatementProps) {
    super(props)
    this.token = props.token
    this.expression = props.expression
    this.tokenLiteral = "return with " + this.expression.getLiteral()
    this.type = "ReturnStatement"
  }
}


class ExpressionStatement extends Statement {
  token: Token
  expression: Expression
  constructor(props) {
    super(props)
    this.token = props.token
    this.expression = props.expression
    this.tokenLiteral = "expression: " + this.expression.getLiteral()
    this.type = "ExpressionStatement"
  }
}

class PrefixExpression extends Expression {
  token: Token
  operator: string
  right: any
  constructor(props) {
    super(props)
    this.token = props.token
    this.operator = props.operator
    this.right = props.expression
    this.tokenLiteral = "(" + this.operator + this.right.getLiteral() + " )"
    this.type = "PrefixExpression"
  }
}

class InfixExpression extends Expression {
  token: any
  left: any
  operator: any
  right: any
  constructor(props) {
    super(props)
    this.token = props.token
    this.left = props.leftExpression
    this.operator = props.operator
    this.right = props.rightExpression
    this.tokenLiteral = `(${this.left.getLiteral()} ${this.operator} ${this.right.getLiteral()})`
    this.type = "InfixExpression"
  }
}

class IntegerLiteral extends Expression {
    token: any
    value: any
    constructor(props) {
        super(props)
        this.token = props.token
        this.value = props.value
        this.tokenLiteral = `Integer value is: ${this.token.getLiteral()}`
        this.type = "Integer"
    }
}

class BooleanCtr extends Expression {
  token: any
  value: any
  constructor(props) {
    super(props)
    this.token = props.token
    this.value = props.value
    this.tokenLiteral =  `Integer value is: ${this.value}`
    this.type = "Boolean"
  }
}

class BlockStatement extends Statement {
  token: any
  statements: any
  constructor(props) {
    super(props)
    this.token = props.token
    this.statements = props.statements
    let s = ""
    for (let i = 0; i < this.statements.length; i++) {
        s += `${this.statements[i].getLiteral()}\n`
    }
    this.tokenLiteral = s
    this.type = "blockStatement"
  }
}

class IfExpression extends Expression {
  token: any
  condition: any
  consequence: any
  alternative: any
  constructor(props) {
    super(props)
    this.token = props.token
    this.condition = props.condition
    this.consequence = props.consequence
    this.alternative = props.alternative

    let s = `if expression width condition:
    ${this.condition.getLiteral()}\n 
    statements in if block are: 
    ${this.consequence.getLiteral()}`
    if (this.alternative) {
      s += `\n statements in else block are: ${this.alternative.getLiteral()}`
    }
    this.tokenLiteral = s

    this.type = "IfExpression"
  }
}

class FunctionLiteral extends Expression {
  token: Token
  parameters: Array<Identifier>
  body: BlockStatement
  constructor(props) {
    super(props)
    this.token = props.token
    this.parameters = props.parameters
    this.body = props.body

    let s = `It is a nameless function,input parameters are: (`
    for (let i = 0; i < this.parameters.length; i++) {
      s += `${this.parameters[i].getLiteral()}\n`
    }
    s += `)\n statements in function body are : { ${this.body.getLiteral()} }`
    this.tokenLiteral = s

    this.type = "FunctionLiteral"
  }
}

class CallExpression extends Expression {
  token: any
  function: any
  arguments: any
  constructor(props) {
    super(props)
    this.token = props.token
    this.function = props.function
    this.arguments = props.arguments

    let s = "It is a function call : " +
    this.function.getLiteral()

    s += "\n It is input parameters are: ("
    for (let i = 0; i < this.arguments.length; i++) {
      s += "\n" 
      s += this.arguments[i].getLiteral()
      s += ",\n"
    }
    s += ")"
    this.tokenLiteral = s
    this.type = "CallExpression"
  }
}

class StringLiteral extends Node {
  token: any
  value: any
  constructor(props) {
    super(props)
    this.token = props.token 
    this.tokenLiteral = props.token.getLiteral()
    this.value = this.tokenLiteral
    this.type = "String"
  }
}

class ArrayLiteral extends Expression {
  token: any
  elements: any
  constructor(props) {
    super(props)
    this.token = props.token 
    //elements 是Expression 对象列表
    this.elements = props.elements
    this.type = "ArrayLiteral"
  }

  getLiteral() {
     let str = ""
    for (let i = 0; i < this.elements.length; i++) {
      str += this.elements[i].getLiteral()
      if (i < this.elements.length - 1) {
        str += ","
      }
    }
    this.tokenLiteral = str
    return this.tokenLiteral
  }

}

class IndexExpression extends Expression {
  token: any
  left: any
  index: any
  constructor(props) {
    super(props)
    this.token = props.token 
    //left 也就是[前面的表达式，它可以是变量名，数组，函数调用
    this.left = props.left 
    //index可以是数字常量，变量，函数调用
    this.index = props.index 
    this.tokenLiteral = `([${this.left.getLiteral()}] [${this.index.getLiteral()}])`
    this.type = "IndexExpression"
  }
}

class HashLiteral extends Expression {
  token: any
  keys: any
  values: any
  constructor(props) {
    super(props)
    this.token = props.token //for '{'
    //对应 expression:expression
    this.keys = props.keys
    this.values = props.values 
    this.type = "HashLiteral"
  }

  getLiteral() {
    let s = "{"
    for (let i = 0; i < this.keys.length; i++) {
      s += `${this.keys[i].getLiteral()}:${this.values[i].getLiteral()}`
      if (i < this.keys.length - 1) {
        s += ","
      }
    }
    s += "}"
    this.tokenLiteral = s
    return s 
  }
}

class Program {
  statements: any[]
  type: string
	constructor () {
	    this.statements = []
        this.type = "program"
	}

    getLiteral() {
        if (this.statements.length > 0) {
            return this.statements[0].tokenLiteral()
        } else {
            return ""
        }
    }
}

// class PopStackStatement extends Statement {
//     constructor(props) {
//     super(props)
//     this.token = props.token //identifier name
//     this.type = "PopStackStatement"
//   }
//
//   getLiteral() {
//     return "Asserting value from stack to identifier : " +
//     this.token
//   }
// }

class MonkeyCompilerParser {
    lexer: MonkeyLexer
    tokenPos: number
    curToken: Token
    peekToken: any
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
    constructor(lexer) {
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
        this.prefixParseFns[this.lexer.BANG_SIGN] =  this.parsePrefixExpression
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

    peekPrecedence() {
      const p = this.precedencesMap[this.peekToken.getType()]
      if (p !== undefined) {
        return p
      }
      return this.LOWEST
    }

    curPrecedence() {
      const p = this.precedencesMap[this.curToken.getType()]
      if (p !== undefined) {
        return p
      }
      return this.LOWEST
    }

    registerInfixMap() {
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

    parseHashLiteral(caller: MonkeyCompilerParser) {
      let props = {
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

    parseArrayLiteral(caller: MonkeyCompilerParser) {
      const props = {
        token: caller.curToken,
        elements: caller.parseExpressionList(caller.lexer.RIGHT_BRACKET)
      }
        const obj = new ArrayLiteral(props);
        console.log("parsing array result: ", obj.getLiteral())
      return obj
    }
   //解析数组表达式
    parseExpressionList(end) {
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

    parseIndexExpression(caller: MonkeyCompilerParser, left) {
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

    parseStringLiteral(caller: MonkeyCompilerParser) {
      const props = {
        token: caller.curToken
      }
      return new StringLiteral(props)
    }

    parseInfixExpression(caller: MonkeyCompilerParser, left) {
      const props = {
        leftExpression: left,
        token: caller.curToken,
        operator: caller.curToken.getLiteral(), 
        rightExpression: null
      }
      const precedence = caller.curPrecedence()
      caller.nextToken()
      props.rightExpression = caller.parseExpression(precedence)
      return new InfixExpression(props)
    }

    parseBoolean(caller: MonkeyCompilerParser) {
      const props = {
        token: caller.curToken,
        value: caller.curTokenIs(caller.lexer.TRUE)
      }
      return new BooleanCtr(props)
    }

    parseGroupedExpression(caller: MonkeyCompilerParser) {
      caller.nextToken()
      const exp = caller.parseExpression(caller.LOWEST)
      if (caller.expectPeek(caller.lexer.RIGHT_PARENT) !== true) {
        return null
      }

      return exp
    }

    parseIfExpression(caller: MonkeyCompilerParser) {
      const props = {
        token: caller.curToken,
        condition: "",
        consequence: null,
        alternative :null
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

    parseBlockStatement(caller: MonkeyCompilerParser) {
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

    parseFunctionLiteral(caller: MonkeyCompilerParser) {
      const props = {
        token: caller.curToken,
        parameters:  [],
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

    parseFunctionParameters(caller: MonkeyCompilerParser) {
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

    parseCallArguments(caller: MonkeyCompilerParser) {
      const args = []
      if (caller.peekTokenIs(caller.lexer.RIGHT_PARENT)) {
        caller.nextToken()
        return args
      }

      caller.nextToken()
      args.push(caller.parseExpression(caller.LOWEST))

      while(caller.peekTokenIs(caller.lexer.COMMA)) {
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

    parseProgram() {
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

    parseStatement(): Statement{
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

    parseLetStatement(): LetStatement|null {
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

    parseExpression(precedence) {
        const prefix = this.prefixParseFns[this.curToken.getType()]
        if (prefix == null) {
            console.log("no parsing function found for token " + 
              this.curToken.getLiteral())
            return null
        }
        let leftExp = prefix(this)
        while (this.peekTokenIs(this.lexer.SEMICOLON) !== true
            && precedence < this.peekPrecedence()) {
          const  infix = this.infixParseFns[this.peekToken.getType()]
          if (infix === null) {
            return leftExp
          }
          this.nextToken()
          leftExp = infix(this, leftExp)
        }
        return leftExp
    }

    parseIdentifier(caller) {
        return caller.createIdentifier()
    }

    parseIntegerLiteral(caller): IntegerLiteral {
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
        expression:""
      }
      caller.nextToken()
      props.expression = caller.parseExpression(caller.PREFIX)
      return new PrefixExpression(props)
    }

    curTokenIs (tokenType): boolean{
        return this.curToken.getType() === tokenType
    }

    peekTokenIs(tokenType): boolean{
        return this.peekToken.getType() === tokenType
    }

    expectPeek(tokenType): boolean{
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