import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const config = JSON.parse(readFileSync('power.config.json', 'utf8'))
assert.equal(config.appDisplayName, 'mycodeapp')
assert.equal(config.environmentId, '7a457b55-1919-ef9c-8b65-ca3c03926d14')
assert.equal(config.appType, 'CodeApp')
assert.ok(existsSync('dist/index.html'), 'Build the application before predeploy checks')
console.log('Build and target checks passed. No publication was performed.')
