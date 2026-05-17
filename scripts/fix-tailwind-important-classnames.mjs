/**
 * Convert Tailwind v3 important prefix (!class) to v4 suffix (class!)
 * Only inside className="..." and className={`...`} string literals.
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('src')

function fixClassTokens(classList) {
  return classList
    .split(/\s+/)
    .map((token) => {
      if (!token.startsWith('!')) return token
      const body = token.slice(1)
      if (!body || !/^[a-z[\]/.:_-]/i.test(body)) return token
      return `${body}!`
    })
    .join(' ')
}

function fixFileContent(content) {
  return content.replace(
    /className=(["'`])([\s\S]*?)\1/g,
    (match, quote, inner) => {
      if (quote === '`' && inner.includes('${')) return match
      return `className=${quote}${fixClassTokens(inner)}${quote}`
    },
  )
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, files)
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) files.push(p)
  }
  return files
}

let changed = 0
for (const file of walk(SRC)) {
  const before = fs.readFileSync(file, 'utf8')
  const after = fixFileContent(before)
  if (after !== before) {
    fs.writeFileSync(file, after)
    changed++
    console.log('updated', path.relative(process.cwd(), file))
  }
}
console.log(`Done. ${changed} file(s) updated.`)
