import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('deployment is manual, SHA-bound, serialized, and gated by environment approval', () => {
  const workflow = readFileSync('.github/workflows/codeapp-deploy.yml', 'utf8')
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /source_sha:[\s\S]*required: true/)
  assert.match(workflow, /contents: read/)
  assert.match(workflow, /cancel-in-progress: false/)
  assert.match(workflow, /group: codeapp-deploy-7a457b55-1919-ef9c-8b65-ca3c03926d14-024f9390-23bd-404e-9e48-062a7e253409/)
  assert.match(workflow, /GITHUB_REF -cne 'refs\/heads\/main'/)
  assert.match(workflow, /APPROVED_SHA -cne \$env:GITHUB_SHA/)
  assert.doesNotMatch(workflow, /^\s+(?:push|pull_request|pull_request_target|workflow_run):/m)

  const [validation, publication] = workflow.split('\n  deploy:')
  assert.doesNotMatch(validation, /secrets\.|PA_CLI_SP_CLIENT_SECRET|pa app push/)
  assert.match(publication, /needs: validate/)
  assert.match(publication, /environment: codeapp-development/)
  assert.equal((workflow.match(/ref: \$\{\{ github.sha \}\}/g) || []).length, 2)
  assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 2)
  assert.equal((workflow.match(/\$actual -cne \$env:GITHUB_SHA/g) || []).length, 2)
  for (const command of ['npm test', 'npm run lint', 'npm run build', 'npm run predeploy']) {
    assert.ok(validation.includes(command), `Missing validation command: ${command}`)
  }
  assert.match(publication, /npm ci --no-audit --no-fund/)
  assert.match(publication, /npm run build[\s\S]*npm run predeploy[\s\S]*PA_CLI_SP_CLIENT_SECRET:/)
  assert.equal((workflow.match(/\$\{\{\s*secrets\./g) || []).length, 1)
  assert.match(publication, /vars\.PA_CLI_SP_CLIENT_ID/)
  assert.match(publication, /vars\.PA_CLI_SP_TENANT_ID/)
  assert.match(publication, /secrets\.PA_CLI_SP_CLIENT_SECRET/)
  assert.match(publication, /PA_CLI_SP_TENANT_ID -cne '655bd66a-5001-4cb3-9aad-ce54a27d5d95'/)
  assert.match(publication, /npx --no-install pa app push --non-interactive/)
  assert.match(publication, /npx --no-install pa app list --non-interactive --json/)
  assert.doesNotMatch(workflow, /VITE_.*(?:SECRET|TENANT|CLIENT)/)
})

test('predeploy rejects missing or different existing application IDs', () => {
  const config = JSON.parse(readFileSync('power.config.json', 'utf8'))
  assert.equal(config.appId, '024f9390-23bd-404e-9e48-062a7e253409')
  const directory = mkdtempSync(join(tmpdir(), 'codeapp-predeploy-'))
  try {
    mkdirSync(join(directory, 'dist'))
    writeFileSync(join(directory, 'dist', 'index.html'), '')
    for (const appId of [config.appId, null, '00000000-0000-0000-0000-000000000001']) {
      writeFileSync(join(directory, 'power.config.json'), JSON.stringify({ ...config, appId }))
      const result = spawnSync(process.execPath, [resolve('scripts/ci/predeploy.mjs')], {
        cwd: directory,
        encoding: 'utf8',
      })
      assert.ifError(result.error)
      assert.equal(result.status, appId === config.appId ? 0 : 1, result.stderr)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
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
