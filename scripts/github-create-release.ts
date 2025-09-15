import fs from 'fs'
import path from 'path'
import { createGitHubController } from '@/lib/mcp/github-controller'

function parseChangelog(tag: string) {
  const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md')
  const content = fs.readFileSync(changelogPath, 'utf8')
  const lines = content.split(/\r?\n/)
  const header = `## ${tag}`

  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(header)) { start = i; break }
  }
  if (start === -1) {
    throw new Error(`Tag header not found in CHANGELOG.md: ${header}`)
  }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break }
  }

  const section = lines.slice(start, end)
  const titleLine = section[0].replace(/^##\s+/, '').trim()
  const name = titleLine
  const body = section.slice(1).join('\n').trim()
  return { name, body }
}

async function main() {
  const tag = process.argv[2] || 'v0.2.0'
  const token = process.env.GITHUB_TOKEN || ''
  const owner = process.env.GITHUB_OWNER || ''
  const repo = process.env.GITHUB_REPO || ''
  const baseUrl = process.env.GITHUB_API_URL || 'https://api.github.com'

  if (!token || !owner || !repo) {
    throw new Error('Missing env vars. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO')
  }

  const { name, body } = parseChangelog(tag)

  const controller = createGitHubController({ token, owner, repo, baseUrl })
  const release = await controller.createRelease(tag, name, body, false, false)
  console.log('✅ Release created:', release.url)
}

main().catch(err => {
  console.error('❌ Release creation failed:', err)
  process.exit(1)
})

