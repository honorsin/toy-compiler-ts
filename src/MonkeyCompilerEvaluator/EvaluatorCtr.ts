export interface InfixProps{
	value: number|boolean
}
export interface BuiltinsArgs{
	[index: number]:ArrayCtr;
	length:number;
}
export class BaseObject {
	INTEGER_OBJ: string
	BOOLEAN_OBJ: string
	NULL_OBJ: string
	ERROR_OBJ: string
	RETURN_VALUE_OBJECT: string
	FUNCTION_LITERAL: string
	FUNCTION_CALL: string
	STRING_OBJ: string
	ARRAY_OBJ: string
	HASH_OBJ: string
	value: any
	constructor (prop) {
		this.INTEGER_OBJ = "INTEGER"
		this.BOOLEAN_OBJ = "BOOLEAN"
		this.NULL_OBJ = "NULL"
		this.ERROR_OBJ = "Error"
		this.RETURN_VALUE_OBJECT = "Return"
		this.FUNCTION_LITERAL = "FunctionLiteral"
		this.FUNCTION_CALL = "FunctionCall"
		this.STRING_OBJ = "String"
		this.ARRAY_OBJ = "Array"
		this.HASH_OBJ = "Hash"
	}

	type:()=> string

	inspect: ()=> string
}

export class Hash extends BaseObject {
	keys: any
	values: any
	constructor(props) {
		super(props)
		this.keys = props.keys
		this.values = props.values
	}

	type =()=> {
		return this.HASH_OBJ
	}

	inspect = ()=> {
		let s = "{"
		for (let i = 0; i < this.keys.length; i++) {
			const pair =`${this.keys[i].inspect()}: ${this.values[i].inspect()},`
			s += pair
		}
		s += "}"
		return s
	}
}

export class ArrayCtr extends BaseObject {
	elements: Array<BaseObject>
	constructor(props) {
		super(props)
		this.elements = props.elements
	}

	type =()=> {
		return this.ARRAY_OBJ
	}

	inspect = ()=>  {
		let s = "["
		for (let i = 0; i < this.elements.length; i++) {
			s += this.elements[i].inspect()
			s += ","
		}

		s += "]"
		return s
	}
}

export class StringCtr extends BaseObject {
	value: string
	constructor(props) {
		super(props)
		this.value = props.value
	}

	inspect = ()=>  {
		return "content of string is: " + this.value
	}

	type =()=> {
		return this.STRING_OBJ
	}
}

export class Integer extends BaseObject {
	value: number
	constructor(props) {
		super(props)
		this.value = props.value
	}

	inspect = ()=> {
		return `integer with value: ${this.value}`
	}

	type =()=>{
		return this.INTEGER_OBJ
	}
}

export class BooleanCtr extends BaseObject {
	value: boolean
	constructor (props) {
		super(props)
		this.value = props.value
	}

	type =()=> {
		return this.BOOLEAN_OBJ
	}

	inspect = ()=> {
		return `boolean with value: ${this.value }`
	}
}

export class Null extends BaseObject {
	type = ()=> {
		return this.NULL_OBJ
	}
	inspect = ()=> {
		return "null"
	}
}

export class Error extends BaseObject {
	msg: string
	constructor(props) {
		super(props)
		this.msg = props
	}

	type = ()=> {
		return this.ERROR_OBJ
	}

	inspect = ()=> {
		return this.msg
	}
}

export class ReturnValues extends BaseObject {
	valueObject: any
	msg: string
	constructor(props) {
		super(props)
		this.valueObject = props.value
	}

	type = ()=> {
		return this.RETURN_VALUE_OBJECT
	}

	inspect = ()=>  {
		this.msg = "return with : " + this.valueObject.inspect()
		return this.msg
	}
}

/*   class FunctionLiteral extends BaseObject {
	token: any
	parameters: any
	blockStatement: any
	paremeters: any
	constructor(props) {
		super(props)
		this.token = props.token  //对应关键字fn
		this.parameters = props.identifiers
		this.blockStatement = props.blockStatement
	}

	type = ()=>  {
		return this.FUNCTION_LITERAL
	}

	inspect = ()=> {
		let s = "fn("
		const identifiers = []
		for (let i = 0; i < this.paremeters.length; i++) {
			identifiers[i] = this.parameters[i].tokenLiteral
		}
		s += identifiers.join(',')
		s += "){\n"
		s += this.blockStatement.tokenLiteral
		s += "\n}"
		return s
	}
}  */

export class FunctionCall extends BaseObject {
	identifiers: string
	blockStatement: any
	environment: any
	constructor(props) {
		super(props)
		this.identifiers = props.identifiers
		this.blockStatement = props.blockStatement
		this.environment = undefined
	}
	type = ()=>  {
		return this.FUNCTION_CALL
	}
	inspect = ()=> {
		let s = "fn()"
		return s
	}
}

export class Environment {
	map: {}
	outer: any
	constructor() {
		this.map = {}
		this.outer = undefined
	}
	get(name) {
		let obj = this.map[name]
		if (obj !== undefined) {
			return obj
		}

		if (this.outer !== undefined) {
			obj = this.outer.get(name)
		}

		return obj
	}
	set(name, obj) {
		this.map[name] = obj
	}
}