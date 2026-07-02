#!/usr/bin/env node
// verify-registry — machine-checks the Orchestrator's AC-OR01/AC-OR02 invariant:
// every event's payload field set in design/registry/entities.yaml must match the
// field set its *producing* GDD declares, and the producing GDD must not contradict
// itself (the failure mode that slipped past three manual review rounds — e.g.
// floorplan:loop's 4-vs-3 toRoom split).
//
// It parses the existing `payload:` free-text with a balanced-brace reader, so no
// `payload_fields:` schema change is needed. Run: `node tools/verify-registry.mjs`
// Self-test the parser:                              `node tools/verify-registry.mjs --selftest`
// Exit code 1 if any active event drifts; provisional events (producer GDD undesigned) are skipped.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'design/registry/entities.yaml');

// --- parser: from a string, read the balanced {...} starting at `from` (first `{` at/after it).
// Returns {inner, end} or null. Handles nested {} and [].
function readBraces(s, from = 0) {
  const start = s.indexOf('{', from);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) return { inner: s.slice(start + 1, i), end: i };
    }
  }
  return null; // unbalanced
}

// Top-level field NAMES from a brace inner string. `roomMeta:[{id,type}]` -> `roomMeta`.
function topFields(inner) {
  const parts = [];
  let depth = 0, buf = '';
  for (const c of inner) {
    if (c === '{' || c === '[') { depth++; buf += c; }
    else if (c === '}' || c === ']') { depth--; buf += c; }
    else if (c === ',' && depth === 0) { parts.push(buf); buf = ''; }
    else buf += c;
  }
  if (buf.trim()) parts.push(buf);
  return [...new Set(parts
    .map(p => p.split(':')[0].trim().replace(/[`'"]/g, ''))  // drop `:value` / `:[...]`, backticks/quotes
    .filter(Boolean))].sort();
}

const fieldStr = a => `{${a.join(', ')}}`;

// --- registry parse: line-based over the very regular events: block.
function parseRegistry(text) {
  const lines = text.split(/\r?\n/);
  const events = [];
  let inEvents = false, cur = null;
  for (const line of lines) {
    if (/^events:\s*$/.test(line)) { inEvents = true; continue; }
    if (!inEvents) continue;
    if (/^[^\s#]/.test(line) && !/^\s*-/.test(line)) break; // next top-level section (e.g. formulas:)
    const nameM = line.match(/^\s*- name:\s*(\S+)/);
    if (nameM) { cur = { name: nameM[1], status: '', source: '', payload: '' }; events.push(cur); continue; }
    if (!cur) continue;
    const st = line.match(/^\s*status:\s*(\S+)/); if (st) cur.status = st[1];
    const sr = line.match(/^\s*source:\s*(\S+)/); if (sr) cur.source = sr[1];
    const pl = line.match(/^\s*payload:\s*"(.*)"/); if (pl) cur.payload = pl[1];
  }
  return events;
}

// --- GDD parse: every place `eventName` is immediately followed by a {...}, collect the field set.
// Returns array of distinct field-set strings (empty array = event never declared with a shape).
function shapesInGDD(text, eventName) {
  const shapes = new Set();
  let idx = 0;
  while ((idx = text.indexOf(eventName, idx)) !== -1) {
    const after = idx + eventName.length;
    idx = after;
    if (/[a-zA-Z0-9_]/.test(text[after] || '')) continue; // prefix guard: scan:capture vs scan:captured
    const rest = text.slice(after);
    if (!/^\s*\{/.test(rest)) continue;                     // not followed by a brace = bare mention
    const b = readBraces(rest);
    if (b) shapes.add(fieldStr(topFields(b.inner)));
  }
  return [...shapes];
}

function selftest() {
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`selftest: ${msg}\n  got ${JSON.stringify(a)}\n  want ${JSON.stringify(b)}`); };
  eq(topFields('x, y, z'), ['x', 'y', 'z'], 'flat');
  eq(topFields(''), [], 'empty payload');
  eq(topFields('nodeId, valid:true, entityCaptured, coverage'), ['coverage', 'entityCaptured', 'nodeId', 'valid'], 'strip :value');
  eq(topFields('propertyId, roomMeta:[{id,type}], nodeRoster:[{nodeId,nodeType,roomId,estimatedPosition}]'),
     ['nodeRoster', 'propertyId', 'roomMeta'], 'nested collapses to top level');
  eq(readBraces('foo {a, b} bar').inner, 'a, b', 'readBraces flat');
  eq(readBraces('{x:[{y}], z}').inner, 'x:[{y}], z', 'readBraces nested');
  eq(shapesInGDD('emits `floorplan:loop {targetPosition, targetYaw, toRoom}` here', 'floorplan:loop'),
     ['{targetPosition, targetYaw, toRoom}'], 'gdd single shape');
  eq(shapesInGDD('a `x:e {p, q}` and later `x:e {p}`', 'x:e').sort(), ['{p, q}', '{p}'], 'gdd contradiction detected');
  eq(shapesInGDD('scan:captured {nodeId} and scan:capture_frame {angle}', 'scan:captured'),
     ['{nodeId}'], 'prefix guard: captured != capture_frame');
  console.log('selftest: OK (9 assertions)');
}

function main() {
  if (process.argv.includes('--selftest')) { selftest(); return; }
  const events = parseRegistry(readFileSync(REGISTRY, 'utf8'));
  const gddCache = new Map();
  const readGDD = p => { if (!gddCache.has(p)) gddCache.set(p, existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : null); return gddCache.get(p); };

  let fails = 0, skips = 0, passes = 0;
  const rows = [];
  for (const e of events) {
    const b = readBraces(e.payload);  // balanced braces out of the raw payload string (drops trailing # comments)
    const reg = fieldStr(b ? topFields(b.inner) : []);

    if (e.status === 'provisional') { rows.push(['SKIP', e.name, `provisional — producer ${e.source} undesigned`]); skips++; continue; }
    const gdd = readGDD(e.source);
    if (gdd === null) { rows.push(['FAIL', e.name, `source GDD not found: ${e.source}`]); fails++; continue; }

    const shapes = shapesInGDD(gdd, e.name);
    if (shapes.length === 0) {
      if (reg === '{}') { rows.push(['PASS', e.name, 'payload-less; no braced shape in GDD (consistent)']); passes++; }
      else { rows.push(['FAIL', e.name, `registry ${reg} but producing GDD declares no braced shape`]); fails++; }
      continue;
    }
    if (shapes.length > 1) { rows.push(['FAIL', e.name, `producing GDD contradicts itself: ${shapes.join(' vs ')}`]); fails++; continue; }
    if (shapes[0] !== reg) { rows.push(['FAIL', e.name, `registry ${reg} != GDD ${shapes[0]}`]); fails++; continue; }
    rows.push(['PASS', e.name, `${reg}`]); passes++;
  }

  for (const [v, name, detail] of rows) console.log(`  ${v.padEnd(4)}  ${name.padEnd(26)} ${detail}`);
  console.log(`\nverify-registry: ${passes} pass, ${fails} fail, ${skips} skip (provisional) — ${events.length} events`);
  if (fails) { console.error('DRIFT DETECTED — AC-OR01/AC-OR02 not satisfied.'); process.exit(1); }
  console.log('OK — registry matches producing GDDs.');
}

main();
