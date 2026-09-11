import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFactoryDocument } from './factory'
import { serializeBotDocument } from './schema'

const dir = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(dir, '../botIP.md')
const markdown = serializeBotDocument(buildFactoryDocument())
writeFileSync(target, markdown, 'utf8')
console.log(`wrote ${target} (${markdown.length} chars)`)
