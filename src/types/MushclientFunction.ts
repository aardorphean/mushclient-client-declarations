export type LuaType = 'boolean' | 'string' | 'number' | 'nil' | 'any'

export interface Parameter {
  name: string
  type: LuaType
  description?: string
}

export interface MushclientFunction {
  name: string
  summary: string
  parameters: Parameter[]
  returnType: LuaType
  type: string
}
