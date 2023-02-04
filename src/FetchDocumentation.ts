import axios from 'axios'
import { JSDOM } from 'jsdom'
import { MushclientFunction } from './types/MushclientFunction'
import GenerateLuaDefinitions from './GenerateLuaDefinitions'

export class FetchDocumentation {
  baseUrl = 'http://www.gammon.com.au'

  async Fetch() {
    const functionList = await this.FetchFunctionUrlList()
    const functionsMeta: MushclientFunction[] = []
    const total = functionList.length
    let current = 1

    // We could do this in parallel but let's not spam Nick's server
    // more than we have to.
    for (const funcUrl of functionList) {
      console.log(`Fetching ${current++}/${total}`)
      const func = await this.FetchFunction(funcUrl)
      functionsMeta.push(func)
    }

    console.log('Generating definitions file...')
    GenerateLuaDefinitions.Generate(functionsMeta)
    console.log('Done!')
  }

  async FetchFunctionUrlList() {
    const functionList: string[] = []
    const functionUrl = `${this.baseUrl}/scripts/doc.php?general=function_list`
    const selector =
      'div.indented > table > tbody > tr:nth-child(2) > td > font > p:nth-child(7) > a:nth-child(even)'

    try {
      const result = await axios.get<string>(functionUrl)
      const { document } = new JSDOM(result.data).window

      const links = document.querySelectorAll<HTMLAnchorElement>(selector)

      links.forEach(link => {
        functionList.push(link.href)
      })
    } catch (error) {
      console.error(`Could not fetch functions: ${error}`)
    } finally {
      return functionList
    }
  }

  async FetchFunction(functionUrl: string) {
    let mushclientFunction: MushclientFunction = {
      name: '',
      parameters: [],
      returnType: 'nil',
      summary: '',
      type: ''
    }

    const url = `${this.baseUrl}${functionUrl}`
    const nameSelector = 'div.indented > table > tbody > tr:nth-child(1) > th'
    const summarySelector =
      'div.indented > table > tbody > tr:nth-child(2) > td > font > p:nth-child(9)'
    const typeSelector =
      'div.indented > table > tbody > tr:nth-child(2) > td > font > p:nth-child(7)'
    const prototypeSelector =
      'div.indented > table > tbody > tr:nth-child(2) > td > font > p:nth-child(11) > code > font'

    try {
      const result = await axios.get<string>(url)
      const { document } = new JSDOM(result.data).window

      const nameElement =
        document.querySelector<HTMLTableHeaderCellElement>(nameSelector)
      const summaryElement =
        document.querySelector<HTMLParagraphElement>(summarySelector)
      const prototypeElement =
        document.querySelector<HTMLFontElement>(prototypeSelector)
      const typeElement =
        document.querySelector<HTMLParagraphElement>(typeSelector)

      if (
        !nameElement?.textContent ||
        !summaryElement?.textContent ||
        !prototypeElement?.textContent ||
        !typeElement?.textContent
      ) {
        // Didn't get what we expected, bail.
        throw new Error(`Could not extract function information from: ${url}`)
      }

      const name = nameElement.textContent
      const summary = summaryElement.textContent
      const functionType = typeElement.textContent
      const prototype = prototypeElement.textContent

      mushclientFunction.name = name
      mushclientFunction.summary = summary
      mushclientFunction.type = functionType

      mushclientFunction = this.parsePrototype(mushclientFunction, prototype)

      return mushclientFunction
    } catch (error) {
      // If we can't fetch the function page just bail.
      const message = error as string
      console.error(message)
      throw new Error(message)
    }
  }

  parsePrototype(func: MushclientFunction, prototype: string) {
    const returnMatch = prototype.match(/^([^ ]+)/)
    const paramsMatch = prototype.match(/.+\(([^)]+)\)/)
    const emptyParamsMatch = prototype.match(/\(\)/)

    if (!returnMatch) {
      throw new Error(`Could not parse return type: ${prototype}`)
    }

    const mushReturnType = returnMatch[1]
    func.returnType = this.mapToLuaType(mushReturnType)

    if (func.type === 'Property') {
      // Properties have no parameters, bail.
      return func
    }

    if (func.type === 'Method' && !paramsMatch && !emptyParamsMatch) {
      throw new Error(`Could not parse parameters: ${prototype}`)
    }

    if (!emptyParamsMatch && paramsMatch) {
      const mushParams = paramsMatch[1]
      const params = mushParams.split(', ')

      params.forEach(chunk => {
        const pair = chunk.split(' ')
        const paramType = this.mapToLuaType(pair[0])

        func.parameters.push({
          name: pair[1],
          type: paramType
        })
      })
    }

    return func
  }

  mapToLuaType(type: string) {
    switch (type) {
      case 'BSTR':
        return 'string'

      case 'BOOL':
      case 'boolean':
        return 'boolean'

      case 'long':
      case 'short':
      case 'date':
        return 'number'

      case 'void':
        return 'nil'

      case 'VARIANT':
        return 'any'

      default:
        return 'nil'
    }
  }
}

export default new FetchDocumentation()
