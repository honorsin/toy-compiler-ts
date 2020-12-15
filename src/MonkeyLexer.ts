class Token {
	tokenType: number
	literal: string
	lineNumber: number
	constructor(type, literal, lineNumber) {
		this.tokenType = type
		this.literal = literal
		this.lineNumber = lineNumber
	}

	getType() {
		return this.tokenType
	}

	getLiteral() {
		return this.literal
	}

	getLineNumber() {
		return this.lineNumber
	}

};

class MonkeyLexer {
	sourceCode: string
	position: number
	readPosition: number
	lineCount: number
	ch: string|number
	observer: any
	observerContext: any
	case: any
	ILLEGAL: number
	EOF: number
	LET: number
	IDENTIFIER: number
	ASSIGN_SIGN: number
	PLUS_SIGN: number
	INTEGER: number
	SEMICOLON: number
	IF: number
	ELSE: number
	MINUS_SIGN: number
	BANG_SIGN: number
	ASTERISK: number
	SLASH: number
	LT: number
	GT: number
	COMMA: number
	FUNCTION: number
	TRUE: number
	FALSE: number
	RETURN: number
	LEFT_BRACE: number
	RIGHT_BRACE: number
	EQ: number
	NOT_EQ: number
	LEFT_PARENT: number
	RIGHT_PARENT: number
	STRING: number
	LEFT_BRACKET: number
	RIGHT_BRACKET: number
	COLON: number
	keyWordMap: any[]
	tokens: any[]

	constructor(sourceCode) { //source:传入的字符串
		this.initTokenType() //类型分类
		this.initKeywords()
		this.sourceCode = sourceCode
		this.position = 0
		this.readPosition = 0
		this.lineCount = 0
		this.ch = ''

		this.observer = null
		this.observerContext = null
		this.case = null
	}

	initTokenType() {
		//这样设计只是为了我们可读方便
        this.ILLEGAL = -2
	    this.EOF = -1  //文本末尾终结符
	    this.LET = 0
	    this.IDENTIFIER = 1
	    this.ASSIGN_SIGN = 2
	    this.PLUS_SIGN = 3
	    this.INTEGER = 4
	    this.SEMICOLON = 5
	    this.IF = 6
	    this.ELSE = 7

	    this.MINUS_SIGN = 8 
	    this.BANG_SIGN = 9
	    this.ASTERISK = 10
	    this.SLASH = 11
	    this.LT = 12
	    this.GT = 13
	    this.COMMA = 14

	    this.FUNCTION = 15
	    this.TRUE = 16
	    this.FALSE = 17
	    this.RETURN = 18

	    this.LEFT_BRACE = 19
	    this.RIGHT_BRACE = 20
	    this.EQ = 21
	    this.NOT_EQ = 22
	    this.LEFT_PARENT = 23
	    this.RIGHT_PARENT = 24

	    this.STRING = 25
		//中括号
	    this.LEFT_BRACKET = 26
	    this.RIGHT_BRACKET = 27
		//大括号
	    this.LEFT_BRACE = 28
	    this.RIGHT_BRACE = 29
		//冒号
	    this.COLON = 30
	}

	getLiteralByTokenType(type) {
		switch (type) {
		    case this.EOF:
		      return "end of file"
		    case this.LET:
		      return "let"
		    case this.IDENTIFIER:
		      return "identifier"
		    case this.ASSIGN_SIGN:
		      return "assign sign"
		    case this.PLUS_SIGN:
		      return "plus sign"
		    case this.INTEGER:
		      return "integer"
		    case this.SEMICOLON:
		      return "semicolon"
		    case this.IF:
		      return "if"
		    case this.ELSE:
		      return "else"
		    case this.MINUS_SIGN:
		      return "minus sign"
		    case this.BANG_SIGN:
		      return "!"
		    case this.ASTERISK:
		      return "*"
		    case this.SLASH:
		      return "slash"
		    case this.LT:
		      return "<"
		    case this.GT:
		      return ">"
		    case this.COMMA:
		      return ","
		    case this.FUNCTION:
		      return "fun"
		    case this.TRUE:
		      return "true"
		    case this.FALSE:
		      return "false"
		    case this.RETURN:
		      return "return"
		    case this.LEFT_BRACE:
		      return "{"
		    case this.RIGHT_BRACE:
		      return "}"
		    case this.EQ:
		      return "==="
		    case this.NOT_EQ:
		      return "!=="
		    case this.LEFT_PARENT:
		      return "("
		    case this.RIGHT_PARENT:
		      return ")"
            case this.COLON:
              return ":"
			default:
				return
		}
	}

	initKeywords() {
		this.keyWordMap = [];
		this.keyWordMap["let"] = new Token(this.LET, "let", 0)
		this.keyWordMap["if"] = new Token(this.IF, "if", 0)
		this.keyWordMap["else"] = new Token(this.ELSE, "else", 0)

		this.keyWordMap["fn"] = new Token(this.FUNCTION, "fn", 0)
		this.keyWordMap["true"] = new Token(this.TRUE, "true", 0)
		this.keyWordMap["false"] = new Token(this.FALSE, "false", 0)
		this.keyWordMap["return"] = new Token(this.RETURN, "return", 0)
	}

	setLexingObserver(o, context, newCase) {
		if (o !== null && o !== undefined) {
			this.observer = o
			this.observerContext = context
			this.case = newCase
		}
	}

	getKeyWords() {
		return this.keyWordMap
	}

	readChar() {
        if (this.readPosition >= this.sourceCode.length) {
        	this.ch = -1
        } else {
        	this.ch = this.sourceCode[this.readPosition]
        }

        this.readPosition++
	}

	peekChar () {
	     if (this.readPosition >= this.sourceCode.length) {
        	return false
        } else {
        	return this.sourceCode[this.readPosition]
        }
	}

	skipWhiteSpaceAndNewLine() {
		/*
		忽略空格
		*/
		while (this.ch === ' '
			|| this.ch === '\t'  //回车换行
			|| this.ch === '\u00a0'
			|| this.ch === '\n') {
		    if (this.ch === '\t' || this.ch === '\n') {
		    	this.lineCount++;    //换行。加行号
		    }
		    this.readChar()
		}
	}

	nextToken () {
		let tok
		this.skipWhiteSpaceAndNewLine() 
		let lineCount = this.lineCount
		let needReadChar = true;
		this.position = this.readPosition

		switch (this.ch) {
			case '"':
			const str = this.readString()
			if (str === undefined) {
				tok = new Token(this.ILLEGAL, undefined, lineCount)
			} else {
				tok = new Token(this.STRING, str, lineCount)
			}
			break
			case '=':
			if (this.peekChar() === '=') {
			    this.readChar()
				if (this.peekChar() === '=') {
					this.readChar()
					tok = new Token(this.EQ, "===", lineCount)
				}
			} else {
				tok = new Token(this.ASSIGN_SIGN, "=", lineCount)
			}
			break
			case ';':
			tok = new Token(this.SEMICOLON, ";", lineCount)
			break;
			case '+':
			tok = new Token(this.PLUS_SIGN, "+", lineCount)
			break;
			case -1:
			tok = new Token(this.EOF, "", lineCount)
			break;
			case '-':
			tok = new Token(this.MINUS_SIGN, "-", lineCount)
			break;
			case '!':
			if (this.peekChar() === '=') {
			    this.readChar()
				if (this.peekChar() === '=') {
					this.readChar()
					tok = new Token(this.NOT_EQ, "!==", lineCount)
				}
			} else {
				tok = new Token(this.BANG_SIGN, "!", lineCount)
			}
			break;
			case '*':
			tok = new Token(this.ASTERISK, "*", lineCount)
			break;
			case '/':
			tok = new Token(this.SLASH, "/", lineCount)
			break;
			case '<':
			tok = new Token(this.LT, "<", lineCount)
			break;
			case '>':
			tok = new Token(this.GT, ">", lineCount)
			break;
			case ',':
			tok = new Token(this.COMMA, ",", lineCount)
			break;
			case '(':
		    tok = new Token(this.LEFT_PARENT, "(", lineCount)
		    break;
		    case ')':
            tok = new Token(this.RIGHT_PARENT, ")", lineCount)
			break;
			case '[':
			tok = new Token(this.LEFT_BRACKET, "[", lineCount)
			break
			case ']':
			tok = new Token(this.RIGHT_BRACKET, "]", lineCount)
			break
			case '{':
			tok = new Token(this.LEFT_BRACE, "{", lineCount)
			break
			case '}':
			tok = new Token(this.RIGHT_BRACE, "}", lineCount)
			break
			case ':':
			tok = new Token(this.COLON, ":", lineCount)
			break
			default:
			let res = this.readIdentifier()  //判断是不是26个字母或下划线
			if (res !== false) {
				if (this.keyWordMap[res] !== undefined) {
					const keyword = this.keyWordMap[res]
					tok = new Token(keyword.getType(), 
						keyword.getLiteral(), lineCount)
				} else {
					tok = new Token(this.IDENTIFIER, res, lineCount)
				}
			} else {
				res = this.readNumber() //数字字符串
				if (res !== false) {
					tok = new Token(this.INTEGER, res, lineCount)
				}
			}

			if (res === false) {
				tok = undefined
			}
			needReadChar = false;

		}

        if (needReadChar === true) {
        	this.readChar()
        }

        if (tok !== undefined) {
        	this.notifyObserver(tok)
        }
		return tok
	}

	readString() {
		// 越过开始的双引号
		this.readChar()
		let str =""
		while (this.ch !== '"' && this.ch !== this.EOF) {
			str += this.ch
			this.readChar()
		}

		if (this.ch !== '"') {
			return undefined
		}

		return str 
	}
	//this.observer指向notifyTokenCreation
	notifyObserver(token) {
		if (this.observer !== null) {
			this.observer.notifyTokenCreation(token,
			this.observerContext, this.position - 1, 
			this.readPosition)
		}
		
	}


	isLetter(ch) {
		return ('a' <= ch && ch <= 'z') || 
		       ('A' <= ch && ch <= 'Z') ||
		       (ch === '_')
	}

	readIdentifier() {
		let identifier = ""
		let charBegin = false
		if (this.isLetter(this.ch)) {
			charBegin = true 
		}

		while (charBegin === true &&
			(this.isLetter(this.ch) || this.isDigit(this.ch))) {
			identifier += this.ch
			this.readChar()
		}

		if (identifier.length > 0) {
			return identifier
		} else {
			return false
		}
	}

	isDigit(ch) {
		return '0' <= ch && ch <= '9'
	}

	readNumber() {
		let number = ""
		while (this.isDigit(this.ch)) {
			number += this.ch
			this.readChar()
		}

		if (number.length > 0) {
			return number
		} else {
			return false
		}
	}

	lexing(lexer) {
		this.readChar()
		this.tokens = []
		let token = this.nextToken()
		while(token !== undefined && 
			token.getType() !== this.EOF) {
			this.tokens.push(token)
			token = this.nextToken()
		}
			this.tokens.push(token)

	}
}

export default MonkeyLexer