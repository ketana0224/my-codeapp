import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

const customizations = ['agents', 'prompts', 'skills']
  .flatMap((directory) => filesIn(resolve(root, '.github', directory)))
  .filter((path) => /(?:\.agent\.md|\.prompt\.md|[\\/]SKILL\.md)$/.test(path));

function frontmatter(path) {
  const content = readFileSync(path, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  assert.ok(match, `${relative(root, path)}: missing frontmatter`);
  return match[1];
}

test('shared definitions have names, quoted descriptions and valid skill names', () => {
  assert.ok(customizations.length >= 5, 'Expected the agent, prompts and both skills');
  for (const path of customizations) {
    const metadata = frontmatter(path);
    const name = /^name: ([A-Za-z0-9-]+)\r?$/m.exec(metadata)?.[1];
    assert.ok(name, `${relative(root, path)}: missing or invalid name`);
    const description = /^description: ("[^\r\n]+")\r?$/m.exec(metadata)?.[1];
    assert.ok(description, `${relative(root, path)}: quote the description`);
    assert.ok(JSON.parse(description).trim(), `${relative(root, path)}: empty description`);
    if (path.endsWith(`${sep}SKILL.md`)) {
      assert.equal(name, dirname(path).split(sep).at(-1));
    }
  }
});

test('customization links resolve inside the repository', () => {
  const documents = ['.github/skills/README.md', 'README.md', '利用手順.md']
    .map((path) => resolve(root, path));
  for (const path of [...customizations, ...documents]) {
    const content = readFileSync(path, 'utf8');
    for (const [, target] of content.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
      const destination = resolve(dirname(path), decodeURIComponent(target.split('#')[0]));
      const local = relative(root, destination);
      assert.ok(!isAbsolute(local) && local !== '..' && !local.startsWith(`..${sep}`),
        `${relative(root, path)}: link escapes the repository: ${target}`);
      assert.ok(existsSync(destination), `${relative(root, path)}: broken link: ${target}`);
    }
  }
});

test('application README keeps access to the standalone usage guide', () => {
  assert.ok(existsSync(resolve(root, '利用手順.md')), 'The standalone usage guide must remain available');
  assert.match(read('README.md'), /\[[^\]]+\]\((?:\.\/)?(?:利用手順\.md|%E5%88%A9%E7%94%A8%E6%89%8B%E9%A0%86\.md)(?:#[^)]*)?\)/i);
});

test('prompt agents exist in the shared bundle', () => {
  const agents = new Set(customizations
    .filter((path) => path.endsWith('.agent.md'))
    .map((path) => /^name: (.+)\r?$/m.exec(frontmatter(path))[1].trim()));
  for (const path of customizations.filter((file) => file.endsWith('.prompt.md'))) {
    const agent = /^agent: (.+)\r?$/m.exec(frontmatter(path))?.[1].trim();
    assert.ok(agents.has(agent), `${relative(root, path)}: unknown agent ${agent}`);
  }
});

test('bundle metadata identifies the version and limits automatic updates', () => {
  const metadata = JSON.parse(read('.github/customizations.json'));
  assert.match(metadata.version, /^\d+\.\d+\.\d+$/);
  assert.equal(metadata.upstream, 'ketana0224/gh-codeapps-management-copilot');
  assert.ok(metadata.upstreamCommit === null || /^[a-f0-9]{40}$/.test(metadata.upstreamCommit));
  assert.ok(Array.isArray(metadata.managedPaths) && metadata.managedPaths.length > 0);
  assert.equal(new Set(metadata.managedPaths).size, metadata.managedPaths.length);
  const allowed = new Set([
    '.github/agents', '.github/prompts', '.github/skills', '.github/tests',
  ]);
  for (const path of metadata.managedPaths) {
    assert.ok(allowed.has(path), `Unexpected automatic update path: ${path}`);
    assert.ok(existsSync(resolve(root, path)), `Missing managed path: ${path}`);
  }
});

test('template CI runs without package files or application dependencies', () => {
  const workflow = read('.github/workflows/customizations-ci.yml');
  assert.match(workflow, /node --test \.github\\tests\\customizations\.test\.mjs/);
  assert.doesNotMatch(workflow, /npm (?:ci|install)|cache:\s*npm|npm run/);
  assert.match(workflow, /contents: read/);
  if (!existsSync(resolve(root, 'package.json'))) {
    assert.ok(!existsSync(resolve(root, '.github/workflows/codeapp-ci.yml')),
      'Do not activate application CI before application initialization');
  }
});

test('application CI is available as a setup reference, not a dependency of template CI', () => {
  const workflow = read('.github/skills/gh-management-setup/references/workflows/codeapp-ci.yml');
  assert.match(workflow, /name: Code App CI/);
  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm run predeploy/);
});

test('deployment reference shipped by the template remains explicitly locked', () => {
  const workflow = read('.github/workflows/codeapp-deploy.yml');
  // Application repositories may deliberately unlock deployment after setup.
  if (!workflow.includes('name: Code App deployment (locked)')) {
    assert.ok(existsSync(resolve(root, 'package.json')),
      'A template without an application must keep deployment locked');
    return;
  }
  assert.match(workflow, /permissions: \{\}/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /exit 1/);
  assert.doesNotMatch(workflow, /secrets\.|actions\/checkout|(?:pa|pac) (?:code )?(?:push|publish)/);
});
