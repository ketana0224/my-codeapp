import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { searchLearn } from './learn.ts'
import type { LearnResult } from './learn-results.ts'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LearnResult[]>([])
  const [searched, setSearched] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = query.trim()
    if (!term || loading) return
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError('')
    setResults([])
    setSearched('')
    try {
      const found = await searchLearn(term, controller.signal)
      setResults(found)
      setSearched(term)
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(`検索できませんでした。${cause instanceof Error ? cause.message : '不明なエラーです。'} 通信環境を確認して再試行してください。`)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="./"><span className="brand-icon" aria-hidden="true">L</span> mycodeapp</a>
        <span className="badge">MICROSOFT LEARN × MCP</span>
      </header>
      <section className="hero" aria-labelledby="heading">
        <p className="eyebrow">OFFICIAL KNOWLEDGE, ONE SEARCH AWAY</p>
        <h1 id="heading">学びたいことを、<br /><span>公式ドキュメントから。</span></h1>
        <p className="intro">Microsoft Learn MCP で、技術の疑問を検索。<br />必要な情報と、その先の学びを見つけましょう。</p>
        <form onSubmit={search} className="search-form">
          <label htmlFor="query">Microsoft Learn を検索</label>
          <div className="search-box">
            <input id="query" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="例: Power Apps code apps の始め方" maxLength={1000} required disabled={loading}
              aria-describedby="privacy" />
            <button type="submit" disabled={loading || !query.trim()}>{loading ? '検索中…' : '検索する →'}</button>
          </div>
          <p id="privacy" className="privacy">検索語は Microsoft Learn の公開 MCP サーバーに送信されます。機密情報・個人情報は入力しないでください。</p>
        </form>
        <div className="suggestions" aria-label="検索のヒント">
          <span>試してみる</span>
          {['Power Apps code apps', 'Azure Functions', 'Copilot Studio'].map((topic) =>
            <button key={topic} type="button" disabled={loading} onClick={() => setQuery(topic)}>{topic}</button>)}
        </div>
      </section>
      <section className="results" aria-label="検索結果" aria-busy={loading}>
        <div role="status" aria-live="polite">
          {loading && <p className="notice">公式ドキュメントを検索しています…</p>}
          {searched && <h2>「{searched}」の検索結果 <span>{results.length} 件</span></h2>}
          {searched && results.length === 0 && <p className="notice">該当する情報はありません。別のキーワードで検索してください。</p>}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {!searched && !loading && !error && <div className="empty">
          <span aria-hidden="true">↗</span><h2>信頼できる情報から、次の一歩へ</h2>
          <p>キーワードや自然な文章で検索できます。<br />検索結果には、公式記事へのリンクと関連する抜粋を表示します。</p>
        </div>}
        <ol className="result-list">
          {results.map((result, index) => <li key={`${result.url}-${index}`} className="result-card">
            <p className="source">MICROSOFT LEARN <span>↗</span></p>
            <h3><a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}</a></h3>
            <p className="excerpt">{result.content || '抜粋はありません。公式記事で詳細を確認してください。'}</p>
            <a className="article-link" href={result.url} target="_blank" rel="noopener noreferrer">公式記事を読む ↗</a>
          </li>)}
        </ol>
      </section>
      <footer>Powered by Microsoft Learn MCP <span>検索結果の抜粋です。最新の詳細は公式記事で確認してください。</span></footer>
    </main>
  )
}

export default App
