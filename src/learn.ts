import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { parseResults } from './learn-results.ts'

export async function searchLearn(query: string, signal: AbortSignal) {
  if (!query.trim()) throw new Error('検索語を入力してください。')
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(30_000)])
  const client = new Client({ name: 'mycodeapp', version: '0.1.0' })
  const transport = new StreamableHTTPClientTransport(new URL('https://learn.microsoft.com/api/mcp'), {
    requestInit: { signal: deadline, credentials: 'omit' },
  })
  try {
    await client.connect(transport)
    const { tools } = await client.listTools({}, { signal: deadline })
    const tool = tools.find((entry) => entry.name === 'microsoft_docs_search')
    if (!tool || tool.inputSchema.properties?.query === undefined) {
      throw new Error('MCP 検索ツールが見つからないか、仕様が変更されています。')
    }
    const result = CallToolResultSchema.parse(await client.callTool({
      name: tool.name, arguments: { query: query.trim() },
    }, undefined, { signal: deadline }))
    if (result.isError) throw new Error('Microsoft Learn MCP が検索エラーを返しました。')
    if (result.structuredContent !== undefined) return parseResults(result.structuredContent)
    const text = result.content.find((entry) => entry.type === 'text')
    if (!text || text.type !== 'text') throw new Error('MCP 検索結果に本文がありません。')
    return parseResults(JSON.parse(text.text))
  } finally {
    await client.close()
  }
}
