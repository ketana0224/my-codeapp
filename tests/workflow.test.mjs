import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('deployment remains diagnostic-only, without publication or secret access', () => {
  const workflow = readFileSync('.github/workflows/codeapp-deploy.yml', 'utf8')
  assert.match(workflow, /permissions: \{\}/)
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /exit 1/)
  assert.doesNotMatch(workflow, /secrets[.[]|actions\/checkout|(?:pa|pac).*(?:push|publish)|^\s+(?:push|pull_request):/m)
})

test('application CI references real scripts and the approved main branch', () => {
  const workflow = readFileSync('.github/workflows/codeapp-ci.yml', 'utf8')
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const name of ['test', 'lint', 'build', 'predeploy']) {
    assert.ok(scripts[name], `Missing script: ${name}`)
    assert.ok(workflow.includes(name === 'test' ? 'npm test' : `npm run ${name}`))
  }
  assert.equal((workflow.match(/branches: \[main\]/g) || []).length, 2)
  assert.doesNotMatch(workflow, /secrets\.|pa app push/)
})
