const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((m) => m[1])
  .find((s) => s.includes('function renderVerificationBadge'));

function extractFunction(name) {
  const start = script.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`Missing function ${name}`);
  let i = script.indexOf('{', start);
  let depth = 0;
  for (; i < script.length; i++) {
    if (script[i] === '{') depth++;
    if (script[i] === '}') depth--;
    if (depth === 0) return script.slice(start, i + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const sandbox = {
  console,
  TIMING_METHODS: ['Hand Timed', 'Brower', 'Freelap', 'Hawkin', 'Force Plate', 'Laser'],
  PROGRESSION_METRICS: [
    { key: 'ape', label: 'APE Score', unit: '', higherBetter: true },
    { key: 'vj', label: 'Vertical Jump', unit: 'in', higherBetter: true },
    { key: 'bj', label: 'Broad Jump', unit: 'ft', higherBetter: true },
    { key: 'rsi', label: 'RSI', unit: '', higherBetter: true },
    { key: 'f5', label: '5-10 Fly', unit: 's', higherBetter: false },
    { key: 'f10', label: '10-10 Fly', unit: 's', higherBetter: false },
    { key: 'pro_agility_5_10_5', label: '5-10-5 COD', unit: 's', higherBetter: false },
    { key: 'gps', label: 'GPS Max Velocity', unit: 'mph', higherBetter: true }
  ],
  esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
};

vm.createContext(sandbox);
[
  'normalizeTimingMethod',
  'renderVerificationBadge',
  '_metricMeta',
  '_metricValue',
  'calculatePR',
  'calculateTrendDirection',
  'calculateImprovementPercentage',
  'validateCoachLogoFile'
].forEach((name) => vm.runInContext(extractFunction(name), sandbox));

const sessions = [
  { id: 's1', apeScore: 60, raw: { vj: 24, f5: 1.30 } },
  { id: 's2', apeScore: 70, raw: { vj: 27, f5: 1.25 } },
  { id: 's3', apeScore: 80, raw: { vj: 26, f5: 1.20 } }
];

assert.match(sandbox.renderVerificationBadge('Laser'), /#|verify-badge blue|Laser Verified/);
assert.match(sandbox.renderVerificationBadge('Force Plate'), /verify-badge blue/);
assert.match(sandbox.renderVerificationBadge('Brower'), /verify-badge navy/);
assert.match(sandbox.renderVerificationBadge('Hand Timed'), /verify-hand/);
assert.equal(sandbox.normalizeTimingMethod('Unknown'), 'Hand Timed');

assert.deepEqual(sandbox.calculatePR('vj', sessions), { sessionId: 's2', value: 27 });
assert.deepEqual(sandbox.calculatePR('f5', sessions), { sessionId: 's3', value: 1.2 });
assert.equal(sandbox.calculateTrendDirection('vj', sessions), 'up');
assert.equal(sandbox.calculateTrendDirection('f5', sessions), 'up');
assert.equal(sandbox.calculateImprovementPercentage('vj', sessions), 8.3);
assert.equal(sandbox.calculateImprovementPercentage('f5', sessions), 7.7);

assert.equal(sandbox.validateCoachLogoFile({ type: 'image/png', size: 1024 }).ok, true);
assert.equal(sandbox.validateCoachLogoFile({ type: 'image/gif', size: 1024 }).ok, false);
assert.equal(sandbox.validateCoachLogoFile({ type: 'image/jpeg', size: 3 * 1024 * 1024 }).ok, false);

console.log('launch feature tests passed');
