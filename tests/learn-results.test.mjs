import assert from 'node:assert/strict'
import test from 'node:test'
import { parseResults } from '../src/learn-results.ts'

const item = { title: 'Code Apps', content: 'Official excerpt', contentUrl: 'https://learn.microsoft.com/power-apps/' }

test('parses the observed MCP result shape, including missing excerpts and empty results', () => {
  assert.deepEqual(parseResults({ results: [item] }), [{ title: item.title, content: item.content, url: item.contentUrl }])
  assert.equal(parseResults({ results: [{ ...item, content: null }] })[0].content, null)
  assert.deepEqual(parseResults({ results: [] }), [])
})

test('rejects malformed responses rather than reporting false empty results', () => {
  for (const value of [null, {}, { results: null }, { results: [null] },
    { results: [{ ...item, title: 1 }] }, { results: [{ ...item, content: undefined }] }]) {
    assert.throws(() => parseResults(value))
  }
})

test('rejects unsafe and non-Learn links', () => {
  for (const contentUrl of ['javascript:alert(1)', 'http://learn.microsoft.com/x', 'https://example.com',
    'https://learn.microsoft.com.evil.example/x', 'https://user:pass@learn.microsoft.com/x', '/relative']) {
    assert.throws(() => parseResults({ results: [{ ...item, contentUrl }] }))
  }
})
