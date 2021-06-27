import {Token} from '../MonkeyLexer'
export class Node {
    tokenLiteral: string
    type: string
    lineNumber: number
      constructor (props: Object) {
          this.tokenLiteral = ""
          this.type = ""
          this.lineNumber =  Number.MAX_SAFE_INTEGER
          for (const i in props) {
            if (props[i]?.getLineNumber) {
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
export class Statement extends Node{ 
	statementNode () {
      this.type = "Statement"
	    return this
	}
}
interface ExpressionProps {
  token: Token
  expression: Expression
}
export class Expression extends Node{
    constructor(props: ExpressionProps) {
        super(props)
        this.type = "Expression"
        this.tokenLiteral = props.token.getLiteral()
    }
    expressionNode () {
        return this
    }
}
export class Identifier extends Expression {
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
export class LetStatement extends Statement {
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
export class ReturnStatement extends Statement{
  token: Token
  expression: Expression
  constructor(props: ReturnStatementProps) {
    super(props)
    this.token = props.token
    this.expression = props.expression
    this.tokenLiteral = "return with " + this.expression?.getLiteral()
    this.type = "ReturnStatement"
  }
}

export class ExpressionStatement extends Statement {
  token: Token
  expression: Expression
  constructor(props) {
    super(props)
    this.token = props.token
    this.expression = props.expression
    this.tokenLiteral = "expression: " + this.expression?.getLiteral()
    this.type = "ExpressionStatement"
  }
}

export class PrefixExpression extends Expression {
  token: Token
  operator: string
  right: Expression
  constructor(props) {
    super(props)
    this.token = props.token
    this.operator = props.operator
    this.right = props.expression
    this.tokenLiteral = "(" + this.operator + this.right.getLiteral() + " )"
    this.type = "PrefixExpression"
  }
}

export class InfixExpression extends Expression {
  token: Token
  left: Expression
  operator: string
  right: Expression
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

export class IntegerLiteral extends Expression {
    token: Token
    value: number
    constructor(props) {
        super(props)
        this.token = props.token
        this.value = props.value
        this.tokenLiteral = `Integer value is: ${this.token.getLiteral()}`
        this.type = "Integer"
    }
}

export class BooleanCtr extends Expression {
  token: Token
  value: boolean
  constructor(props) {
    super(props)
    this.token = props.token
    this.value = props.value
    this.tokenLiteral =  `Integer value is: ${this.value}`
    this.type = "Boolean"
  }
}

export class BlockStatement extends Statement {
  token: Token
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

export class IfExpression extends Expression {
  token: Token
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

export class FunctionLiteral extends Expression {
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
interface CallArguments {
  [index: number]:any
  length: number
}
export class CallExpression extends Expression {
  token: Token
  function: Expression
  arguments: CallArguments
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

export class StringLiteral extends Node {
  token: Token
  value: string
  constructor(props) {
    super(props)
    this.token = props.token 
    this.tokenLiteral = props.token.getLiteral()
    this.value = this.tokenLiteral
    this.type = "String"
  }
}

export class ArrayLiteral extends Expression {
  token: Token
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

export class IndexExpression extends Expression {
  token: Token
  left: Expression
  index: Expression
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

export class HashLiteral extends Expression {
  token: Token
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

export class Program {
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

/* class PopStackStatement extends Statement {
    constructor(props) {
    super(props)
    this.token = props.token //identifier name
    this.type = "PopStackStatement"
  }

  getLiteral() {
    return "Asserting value from stack to identifier : " +
    this.token
  }
} */