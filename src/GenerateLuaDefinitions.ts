import { MushclientFunction } from './types/MushclientFunction'
import fs from 'fs'

export class GenerateLuaDefinitions {
  documentBase = `-- Generated automatically by https://github.com/aardorphean/mushclient-client-declarations
-- Orphean@Aardwolf to blame.

---@meta`

  Generate(funcs: MushclientFunction[]) {
    let doc = this.documentBase

    for (const func of funcs) {
      doc = this.formatItem(doc, func)
    }

    fs.writeFileSync('./mushclient_definitions.lua', doc)

    console.log('Definitions file written!')
  }

  formatItem(doc: string, func: MushclientFunction) {
    const paramNames: string[] = []

    switch (func.type) {
      case 'Property':
        doc = `${doc}

---${func.summary}
---@return ${func.returnType}
${func.name} = nil`
        break

      case 'Method':
        {
          doc = `${doc}

---${func.summary}`

          for (const param of func.parameters) {
            doc = `${doc}
---@param ${param.name} ${param.type}${
              param.description ? ` # ${param.description}` : ''
            }`

            paramNames.push(param.name)
          }

          if (func.returnType !== 'any') {
            doc = `${doc}
---@return ${func.returnType}`
          } else {
            ;['boolean', 'string', 'number', 'nil'].forEach(type => {
              doc = `${doc}
---@return ${type}`
            })
          }

          doc = `${doc}
function ${func.name}(${paramNames.join(', ')}) end`
        }
        break
    }

    return doc
  }
}

export default new GenerateLuaDefinitions()
