export interface LearnResult {
  title: string
  content: string | null
  url: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseResults(value: unknown): LearnResult[] {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    throw new Error('MCP 検索結果の形式が想定と異なります。')
  }
  return value.results.map((item: unknown) => {
    if (!isRecord(item) || typeof item.title !== 'string' || !item.title.trim()
      || typeof item.contentUrl !== 'string'
      || (item.content !== null && typeof item.content !== 'string')) {
      throw new Error('MCP 検索結果の記事形式が想定と異なります。')
    }
    const url = new URL(item.contentUrl)
    if (url.protocol !== 'https:' || url.hostname !== 'learn.microsoft.com' || url.username || url.password) {
      throw new Error('Microsoft Learn 以外の記事リンクが返されました。')
    }
    return { title: item.title, content: item.content, url: url.href }
  })
}
