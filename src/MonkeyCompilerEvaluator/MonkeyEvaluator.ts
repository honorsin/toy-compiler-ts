import {
	ArrayCtr, BaseObject, BooleanCtr,
	BuiltinsArgs, Environment, FunctionCall,
	Hash, InfixProps, Null, ReturnValues,
	StringCtr, Integer
} from './EvaluatorCtr'

class MonkeyEvaluator {
	environment: Environment
	evalWorker: any
	constructor(worker) {
		this.environment = new Environment()
		this.evalWorker = worker
	}

	newEnclosedEnvironment(outerEnv) {
		const env = new Environment()
		env.outer = outerEnv
		return env
	}

	builtins(name: string, args: BuiltinsArgs) { //name->api名称 args-->token类型
		//实现内嵌API
		const props = {
			elements: [],
			value: 0
		}
		switch (name) {
			case "first":
				if (args.length !== 1) {
					return this.newError("Wrong number of arguments when calling len")
				}
				if (args[0].type() !== args[0].ARRAY_OBJ) {
					return this.newError("arguments of first must be ARRAY")
				}
				if (args[0].elements.length > 0) {
					console.log("the first element of array is :",
						args[0].elements[0].inspect())
					return args[0].elements[0]
				}
				return null
			case "rest":
				if (args.length !== 1) {
					return this.newError("Wrong number of arguments when calling len")
				}
				if (args[0].type() !== args[0].ARRAY_OBJ) {
					return this.newError("arguments of first must be ARRAY")
				}
				if (args[0].elements.length > 1) {
					//去掉第一个元素
					props.elements = args[0].elements.slice(1)
					const obj = new ArrayCtr(props)
					console.log("rest return: ", obj.inspect())
					return obj
				}
				return null
			case "append":
				if (args.length !== 2) {
					return this.newError("Wrong number of arguments when calling len")
				}
				if (args[0].type() !== args[0].ARRAY_OBJ) {
					return this.newError("arguments of first must be ARRAY")
				}

				props.elements = args[0].elements.slice(0)
				props.elements.push(args[1])
				const obj = new ArrayCtr(props)
				console.log("new array after calling append is: ",
					obj.inspect())
				return obj

			case "len":
				if (args.length !== 1) {
					return this.newError("Wrong number of arguments when calling len")
				}
				switch (args[0].type()) {
					case args[0].STRING_OBJ:
						props.value = args[0].value.length
						const obj = new Integer(props)
						console.log("API len return: ", obj.inspect())
						return obj
					case args[0].ARRAY_OBJ:
						props.value = args[0].elements.length
						console.log("len of array "
							+ args[0].inspect()
							+ " is "
							+ props.value)
						return new Integer(props)
					default:
						return this.newError("bad data type")
				}
			default:
				return this.newError("unknown function call")
		}

	}
	setExecInfo(node?) {
		interface Props {
			env: object;
			line?: number;
		}
		const props: Props = {
			env: {},
			line: 1
		}
		if (node !== undefined) {
			props['line'] = node.getLineNumber()
		}

		const env = {}
		for (const s in this.environment.map) {
			env[s] = this.environment.map[s].inspect()
		}
		props['env'] = env
		return props
	}
	//单步调试
	pauseBeforeExec(node): void {
		const props = this.setExecInfo(node)
		this.evalWorker.sendExecInfo("beforeExec", props)
		this.evalWorker.waitBeforeEval()
	}
	eval(node) {
		const props = {
			value: "",
			identifiers: "",
			token: "",
			elements: "",
			blockStatement: ""
		}
		switch (node.type) {
			case "program":
				return this.evalProgram(node)
			case "HashLiteral":
				return this.evalHashLiteral(node)
			case "ArrayLiteral":
				this.pauseBeforeExec(node)
				const elements = this.evalExpressions(node.elements)
				if (elements.length === 1 && this.isError(elements[0])) {
					return elements[0]
				}
				props.elements = elements
				return new ArrayCtr(props)
			case "IndexExpression":
				this.pauseBeforeExec(node)
				const indexLeft = this.eval(node.left)
				if (this.isError(indexLeft)) {
					return indexLeft
				}
				const index = this.eval(node.index)
				if (this.isError(index)) {
					return index
				}
				const obj = this.evalIndexExpression(indexLeft, index)
				if (obj != null) {
					console.log("the index value is :"
						+ index.value
						+ " with content : "
						+ obj.inspect())
				}
				return obj
			case "String":
				props.value = node.tokenLiteral
				return new StringCtr(props)
			case "LetStatement":
				this.pauseBeforeExec(node)
				const letVal = this.eval(node.value)
				if (this.isError(letVal)) {
					return letVal
				}
				this.environment.set(node.name.tokenLiteral, letVal)
				return letVal
			case "Identifier":
				console.log("variable name is:" + node.tokenLiteral)
				const identifierValue = this.evalIdentifier(node, this.environment)
				console.log("it is binding value is " + identifierValue.inspect())
				return identifierValue
			case "FunctionLiteral":
				props.token = node.token
				props.identifiers = node.parameters
				props.blockStatement = node.body
				const funObj = new FunctionCall(props)
				funObj.environment = this.newEnclosedEnvironment(this.environment)
				return funObj
			case "CallExpression":
				this.pauseBeforeExec(node)
				console.log("execute a function with content:", node.function.tokenLiteral)
				console.log("evaluate function call params:")
				const args = this.evalExpressions(node.arguments)
				if (args.length === 1 && this.isError(args[0])) {
					return args[0]
				}
				const functionCall = this.eval(node.function)
				if (this.isError(functionCall)) {
					return this.builtins(node.function.tokenLiteral, args)
				}
				for (let i = 0; i < args.length; i++) {
					console.log(args[i].inspect())
				}
				const oldEnvironment = this.environment
				//设置新的变量绑定环境
				this.environment = functionCall.environment
				//将输入参数名称与传入值在新环境中绑定
				for (let i = 0; i < functionCall.identifiers.length; i++) {
					const name = functionCall.identifiers[i].tokenLiteral
					const val = args[i]
					this.environment.set(name, val)
				}
				//执行函数体内代码
				const result = this.eval(functionCall.blockStatement)
				//执行完函数后，里面恢复原有绑定环境
				this.environment = oldEnvironment
				if (result.type() === result.RETURN_VALUE_OBJECT) {
					console.log("function call return with :",
						result.valueObject.inspect())
					return result.valueObject
				}
				return result
			case "Integer":
				console.log("Integer with value:", node.value)
				props.value = node.value
				return new Integer(props)
			case "Boolean":
				props.value = node.value
				console.log("Boolean with value:", node.value)
				return new BooleanCtr(props)
			case "ExpressionStatement":
				this.pauseBeforeExec(node)
				return this.eval(node.expression)
			case "PrefixExpression":
				this.pauseBeforeExec(node)
				const prefixRight = this.eval(node.right)
				if (this.isError(prefixRight)) {
					return prefixRight
				}
				const preObj = this.evalPrefixExpression(node.operator, prefixRight)
				console.log("eval prefix expression: ", (preObj as any).inspect())
				return preObj
			case "InfixExpression":
				this.pauseBeforeExec(node)
				const infixLeft = this.eval(node.left)
				if (this.isError(infixLeft)) {
					return infixLeft
				}
				const infixRight = this.eval(node.right)
				if (this.isError(infixRight)) {
					return infixRight
				}
				return this.evalInfixExpression(node.operator, infixLeft, infixRight)
			case "IfExpression":
				this.pauseBeforeExec(node)
				return this.evalIfExpression(node)
			case "blockStatement":
				return this.evalStatements(node)
			case "ReturnStatement":
				this.pauseBeforeExec(node)
				props.value = this.eval(node.expression)
				if (this.isError(props.value)) {
					return props.value
				}
				const returnObj = new ReturnValues(props)
				console.log(returnObj.inspect())
				return returnObj
			default:
				return new Null(null)
		}
	}

	evalHashLiteral(node) {
		/*
		先递归的解析哈希表的key，然后解析它的value,对于如下类型的哈希表代码
		let add = fn (x, y) { return x+y};
		let byOne = fn (z) { return z+1;}
		{add(1,2) : byOne(3)}
		编译器先执行add(1,2)得到3，然后执行byOne(3)得到4
		*/
		const props = {
			keys: [],
			values: []
		}
		for (let i = 0; i < node.keys.length; i++) {
			const key = this.eval(node.keys[i])
			if (this.isError(key)) {
				return key
			}
			if (this.hashtable(key) !== true) {
				return this.newError("unhashtable type:" +
					key.type())
			}
			const value = this.eval(node.values[i])
			if (this.isError(value)) {
				return value
			}
			props.keys.push(key)
			props.values.push(value)
		}

		const hashObj = new Hash(props)
		console.log("eval hash object: " + hashObj.inspect())
		return hashObj
	}

	hashtable(node) {
		return node.type() === node.INTEGER_OBJ ||
			node.type() === node.STRING_OBJ ||
			node.type() === node.BOOLEAN_OBJ;
	}

	evalIndexExpression(left: BaseObject, index) {
		if (left.type() === left.ARRAY_OBJ &&
			index.type() === index.INTEGER_OBJ) {
			return this.evalArrayIndexExpression(left, index)
		}
		if (left.type() === left.HASH_OBJ) {
			return this.evalHashIndexExpression(left, index)
		}
	}

	evalHashIndexExpression(hash, index) {
		if (!this.hashtable(index)) {
			return this.newError("unhashtable type: " + index.type())
		}

		for (let i = 0; i < hash.keys.length; i++) {
			if (hash.keys[i].value === index.value) {
				console.log("return hash value :" +
					hash.values[i])
				return hash.values[i]
			}
		}

		return null
	}

	evalArrayIndexExpression(array, index) {
		const idx = index.value
		const max = array.elements.length - 1
		if (idx < 0 || idx > max) {
			return this.newError("Array out of bounds ")
		}
		return array.elements[idx]
	}

	evalExpressions(exps) {
		const result = []
		for (let i = 0; i < exps.length; i++) {
			const evaluated = this.eval(exps[i])
			if (this.isError(evaluated)) {
				return evaluated
			}
			result[i] = evaluated
		}
		return result
	}

	evalIdentifier(node, env) {
		const val = env.get(node.tokenLiteral)
		if (val === undefined) {
			return this.newError("identifier no found:" + node.name)
		}

		return val
	}

	evalProgram(program) {
		let result = null
		for (let i = 0; i < program.statements.length; i++) {
			result = this.eval(program.statements[i])

			const props = this.setExecInfo()
			if (result.type() === result.RETURN_VALUE_OBJECT) {
				this.evalWorker.sendExecInfo("finishExec", props)
				return result.valueObject
			}

			if (result.type() === result.NULL_OBJ) {
				this.evalWorker.sendExecInfo("finishExec", props)
				return result
			}

			if (result.type === result.ERROR_OBJ) {
				this.evalWorker.sendExecInfo("finishExec", props)
				console.log(result.msg)
				return result
			}
		}
		const props = this.setExecInfo()
		this.evalWorker.sendExecInfo("finishExec", props)
		return result
	}

	isError(obj): boolean {
		if (obj !== undefined) {
			return obj.type() === obj.ERROR_OBJ
		}

		return false
	}

	newError(msg: string): Error {
		const props = {
			errMsg: "",
		}
		props.errMsg = msg
		return new Error(props.errMsg)
	}

	evalIfExpression(ifNode) {
		console.log("begin to eval if statement")
		const condition = this.eval(ifNode.condition)

		if (this.isError(condition)) {
			return condition
		}

		if (this.isTruthy(condition)) {
			console.log("condition in if holds, exec statements in if block")
			return this.eval(ifNode.consequence)
		} else if (ifNode.alternative != null) {
			console.log("condition in if no holds, exec statements in else block")
			return this.eval(ifNode.alternative)
		} else {
			console.log("condition in if no holds, exec nothing!")
			return null
		}
	}

	isTruthy(condition) {
		if (condition.type() === condition.INTEGER_OBJ) {
			return condition.value !== 0;

		}

		if (condition.type() === condition.BOOLEAN_OBJ) {
			return condition.value
		}

		return condition.type() !== condition.NULL_OBJ;


	}

	evalStatements(node) {
		let result = null
		for (let i = 0; i < node.statements.length; i++) {
			result = this.eval(node.statements[i])
			if (result.type() === result.RETURN_VALUE_OBJECT
				|| result.type() === result.ERROR_OBJ) {
				return result
			}
		}

		return result
	}

	evalInfixExpression(operator, left, right) {
		if (left.type() !== right.type()) {
			return this.newError(
				"type mismatch: "
				+ left.type() + " and " + right.type()
			)
		}

		if (left.type() === left.INTEGER_OBJ
			&& right.type() === right.INTEGER_OBJ) {
			return this.evalIntegerInfixExpression(
				operator, left, right)
		}

		if (left.type() === left.STRING_OBJ
			&& right.type() === right.STRING_OBJ) {
			return this.evalStringInfixExpression(
				operator, left, right)
		}

		const props = {
			value: false
		}
		if (operator === '===') {
			props.value = (left.value === right.value)
			console.log("result on boolean operation of "
				+ operator
				+ " is "
				+ props.value)
			return new BooleanCtr(props)
		} else if (operator === '!==') {
			props.value = (left.value !== right.value)
			console.log("result on boolean operation of " + operator
				+ " is " + props.value)
			return new BooleanCtr(props)
		}

		return this.newError("unknown operator: " + operator)
	}

	evalStringInfixExpression(operator, left, right) {
		if (operator !== "+") {
			return this.newError("unknown operator for string operation")
		}

		const leftVal = left.value
		const rightVal = right.value
		const props = {
			value: ""
		}
		props.value = leftVal + rightVal
		console.log("reuslt of string add is: ", props.value)
		return new StringCtr(props)
	}

	evalIntegerInfixExpression(operator, left, right) {
		const leftVal = left.value
		const rightVal = right.value
		const props: InfixProps = {
			value: -1
		}
		let resultType = "integer"

		switch (operator) {
			case "+":
				props.value = leftVal + rightVal
				break;
			case "-":
				props.value = leftVal - rightVal
				break;
			case "*":
				props.value = leftVal * rightVal
				break;
			case "/":
				props.value = leftVal / rightVal
				break;
			case "===":
				resultType = "boolean"
				props.value = (leftVal === rightVal)
				break;
			case "!==":
				resultType = "boolean"
				props.value = (leftVal !== rightVal)
				break
			case ">":
				resultType = "boolean"
				props.value = (leftVal > rightVal)
				break
			case "<":
				resultType = "boolean"
				props.value = (leftVal < rightVal)
				break
			default:
				return this.newError("unknown operator for Integer")
		}
		console.log("eval infix expression result is:", props.value)
		let result = null
		if (resultType === "integer") {
			result = new Integer(props)
		} else if (resultType === "boolean") {
			result = new BooleanCtr(props)
		}

		return result
	}

	evalPrefixExpression(operator, right) {
		switch (operator) {
			case "!":
				return this.evalBangOperatorExpression(right)
			case "-":
				return this.evalMinusPrefixOperatorExpression(right)
			default:
				return this.newError(`unknown operator:" ${operator}, ${right.type()}`)
		}
	}
	//取反
	evalBangOperatorExpression(right) {
		const props = {
			value: false
		}
		if (right.type() === right.BOOLEAN_OBJ) {
			if (right.value === true) {
				props.value = false
			}

			if (right.value === false) {
				props.value = true
			}
		}

		if (right.type() === right.INTEGER_OBJ) {
			props.value = right.value === 0;
		}

		if (right.type() === right.NULL_OBJ) {
			props.value = true
		}

		return new BooleanCtr(props)
	}

	evalMinusPrefixOperatorExpression(right) {
		if (right.type() !== right.INTEGER_OBJ) {
			return this.newError(`unknown operator:- " ${right.type()}`)
		}
		const props = {
			value: 1
		}
		props.value = -right.value
		return new Integer(props)
	}
}

export default MonkeyEvaluator