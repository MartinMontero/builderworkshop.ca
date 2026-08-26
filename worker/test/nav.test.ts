import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
  The nav had two links pointing at the same anchor and keying React on that
  anchor. Two failures in one:

    - the key collision, which React resolves by rendering one of the two
      wrong rather than by failing;
    - the navigation bug underneath it. #paths is the SECTION wrapper and The
      Builder's Stack sits at the top of that section, so both THE STACK and
      THE PATHS landed on the Stack and the pathways were unreachable from the
      nav entirely.

  These assert the fix and make a recurrence fail here instead of silently in
  a browser.
*/

const root = process.cwd();
const nav = readFileSync(join(root, 'src', 'components', 'Nav.tsx'), 'utf8');
const pathways = readFileSync(join(root, 'src', 'sections', 'Pathways.tsx'), 'utf8');
const css = readFileSync(join(root, 'src', 'index.css'), 'utf8');
const sitemap = readFileSync(join(root, 'public', 'sitemap.xml'), 'utf8');

/** Parse the LINKS array into {id, label, href}. */
function links(): Array<{ id: string; label: string; href: string }> {
  const block = nav.slice(nav.indexOf('const LINKS = ['), nav.indexOf('];', nav.indexOf('const LINKS = [')));
  return [...block.matchAll(/\{\s*id:\s*'([^']+)',[^}]*label:\s*'([^']+)',\s*href:\s*'([^']+)'/g)].map((m) => ({
    id: m[1],
    label: m[2],
    href: m[3],
  }));
}

/** Every id="..." rendered anywhere in the app's sections. */
function anchors(): Set<string> {
  const files = ['AssetMap', 'Contribute', 'Directory', 'Hero', 'Mission', 'Pathways'];
  const found = new Set<string>();
  for (const f of files) {
    const src = readFileSync(join(root, 'src', 'sections', `${f}.tsx`), 'utf8');
    for (const m of src.matchAll(/\bid="([a-z][a-z0-9-]*)"/g)) found.add(m[1]);
  }
  return found;
}

test('every nav key is unique', () => {
  const ids = links().map((l) => l.id);
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, ids.length, `duplicate nav id — React would render one link wrong: ${ids}`);
});

test('the key is not derived from href, so shared destinations stay legal', () => {
  assert.match(nav, /key=\{l\.id\}/);
  assert.ok(!/key=\{l\.href\}/.test(nav), 'keying on href is what caused the collision');
});

test('every nav link points at an anchor that actually exists', () => {
  const present = anchors();
  for (const l of links()) {
    const target = l.href.replace(/^#/, '');
    assert.ok(present.has(target), `${l.label} points at #${target}, which no section renders`);
  }
});

test('THE STACK and THE PATHS go to different places', () => {
  const byLabel = new Map(links().map((l) => [l.label, l.href]));
  const stack = byLabel.get('THE STACK');
  const paths = byLabel.get('THE PATHS');
  assert.ok(stack && paths);
  assert.notEqual(stack, paths, 'the two links must not share a destination again');
  assert.equal(stack, '#stack');
  assert.equal(paths, '#pathways');
});

test('no two nav links share a destination by accident', () => {
  const hrefs = links().map((l) => l.href);
  assert.equal(new Set(hrefs).size, hrefs.length, `two nav links share a destination: ${hrefs}`);
});

test('the anchors sit on the right blocks, in the right order', () => {
  const stackAt = pathways.indexOf('id="stack"');
  const pathwaysAt = pathways.indexOf('id="pathways"');
  const stackMap = pathways.indexOf('STACK.map');
  const pathwaysMap = pathways.indexOf('PATHWAYS.map');
  assert.ok(stackAt > -1 && pathwaysAt > -1, 'both anchors must exist');
  // #stack must precede the stack list; #pathways must precede the pathway cards
  assert.ok(stackAt < stackMap, '#stack must be above the stack content');
  assert.ok(pathwaysAt < pathwaysMap, '#pathways must be above the pathway cards');
  assert.ok(stackAt < pathwaysAt, 'the stack comes first in the section');
});

test('the new anchors clear the fixed nav', () => {
  // section[id] alone does not match a div, so the utility must exist and be used.
  assert.match(css, /\.scroll-anchor\s*\{[^}]*scroll-margin-top/s);
  assert.match(pathways, /id="stack"[^>]*className="scroll-anchor/);
  assert.match(pathways, /id="pathways" className="scroll-anchor/);
});

test('#paths survives — the sitemap points at it', () => {
  assert.match(sitemap, /#paths/);
  assert.match(pathways, /<section id="paths"/, 'removing #paths would break a published sitemap URL');
});
