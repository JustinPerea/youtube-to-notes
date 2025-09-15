# MCP Setup Guide (Supabase + Vercel)

This project is configured to expose Supabase and Vercel via MCP (Model Context Protocol) so MCP‑aware tools (e.g., IDE agents) can query deployments, env vars, and data safely without baking tokens into code.

## Files
- MCP config: `.mcp.json`
- This guide: `README_MCP.md`

## Security First
- Do NOT commit real tokens in `.mcp.json`.
- `.mcp.json` uses `${ENV_VAR}` placeholders. Provide real values via your local shell or a secret manager.

## Prerequisites
- Node.js and `npx` available on your machine
- An MCP host (your IDE/agent that reads `.mcp.json`), or an MCP inspector
- Access to your Supabase and Vercel accounts

## Environment Variables to Set (shell, not committed)

Supabase:
- `SUPABASE_ACCESS_TOKEN` — recommended read‑only token
- Project ref is already set in `.mcp.json` as `--project-ref=guuxhmfzimnryzusjykm` (change if needed)

Vercel:
- `VERCEL_TOKEN` — Personal Access Token (Account → Settings → Tokens)
- `VERCEL_ORG_ID` — Team/User ID (e.g., `team_...` or `user_...`)
- `VERCEL_PROJECT_ID` — Project ID (e.g., `prj_...`)

Set them for the current shell session:

```sh
export SUPABASE_ACCESS_TOKEN='...'
export VERCEL_TOKEN='...'
export VERCEL_ORG_ID='team_...'
export VERCEL_PROJECT_ID='prj_...'
```

Optionally persist (zsh example):

```sh
echo "export SUPABASE_ACCESS_TOKEN='...'" >> ~/.zshrc
echo "export VERCEL_TOKEN='...'" >> ~/.zshrc
echo "export VERCEL_ORG_ID='team_...'" >> ~/.zshrc
echo "export VERCEL_PROJECT_ID='prj_...'" >> ~/.zshrc
source ~/.zshrc
```

Project‑scoped option (recommended): use `direnv`
- Add a git‑ignored `.envrc` in the repo root with the exports
- Run `direnv allow` when you open the project

## Verify IDs (Vercel)
- UI: Project → Settings → General → copy Project ID; Team/User Settings → General → copy Team ID
- CLI: `npx vercel link` creates `.vercel/project.json` with `orgId` and `projectId`

## .mcp.json (current)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase", "--read-only", "--project-ref=guuxhmfzimnryzusjykm"],
      "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}",
        "VERCEL_ORG_ID": "${VERCEL_ORG_ID}",
        "VERCEL_PROJECT_ID": "${VERCEL_PROJECT_ID}"
      }
    }
  }
}
```

## Bringing It Online
1) Set environment variables (above)
2) Restart your MCP host / IDE so it reloads `.mcp.json` and env vars
3) In your MCP client UI, confirm you see two servers: `supabase` and `vercel`
4) List tools for each server (your client usually has a “Tools” pane or command)

## Quick Sanity Checks
- Supabase server:
  - Try a read‑only operation (whatever your MCP client exposes, e.g., list tables or run a safe query)
- Vercel server:
  - Try listing deployments or env vars for the current project
  - If supported, remove non‑needed envs (e.g., `NODE_ENV`) directly via the MCP tool

## Troubleshooting
- 401/403 Unauthorized: Token invalid or missing — recheck `export` values and scopes
- 404 Not Found: Wrong `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID`
- Server not visible in Tools: Host not restarted or `.mcp.json` not at project root
- Rate limits / timeouts: Try again; ensure your token has necessary scopes

## Rotating Tokens
If you ever pasted tokens in files or chats:
- Revoke them in the provider (Vercel/Supabase)
- Create new ones; update your shell/`.envrc`

---
Feel free to ask and we can add a few example MCP calls tailored to your IDE’s MCP UI once we know the tool names it exposes.
