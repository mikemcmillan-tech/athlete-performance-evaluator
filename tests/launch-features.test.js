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
const ctxStart = script.indexOf('var LEVEL_OPTIONS=');
const ctxEnd = script.indexOf('// \u2500\u2500\u2500 HELPERS', ctxStart);
vm.runInContext(script.slice(ctxStart, ctxEnd), sandbox);
const programCtxStart = script.indexOf('var PROGRAM_PHASES=');
const programCtxEnd = script.indexOf('var defaultPrograms=', programCtxStart);
vm.runInContext(script.slice(programCtxStart, programCtxEnd), sandbox);
[
  'normalizeGender',
  'normalize505Score',
  '_lerpScore',
  '_scoreLowerBetter100',
  '_scoreHigherBetter100',
  'score100ToScore5',
  'scv',
  'resolveAgilityLevel',
  'calculateAgilityTestScore',
  'calculateMetricScore100',
  'calculateMetricScore5',
  'sRSI',
  '_programDemandForPhase',
  '_programContradictions',
  '_programWeakestMetricLabel',
  'calculateTrainingFocus',
  '_combineNorm',
  '_combineTier',
  '_combineLevelKey',
  '_combineKey',
  'normalizeTimingMethod',
  'renderVerificationBadge',
  '_metricMeta',
  '_metricValue',
  'calculatePR',
  'calculateTrendDirection',
  'calculateImprovementPercentage',
  '_normEmail',
  'resolveViewerAthletesForEmail',
  'getLatestSession',
  'getViewerFocus',
  'validateCoachLogoFile'
].forEach((name) => vm.runInContext(extractFunction(name), sandbox));

const sessions = [
  { id: 's1', apeScore: 60, raw: { vj: 24, f5: 1.30 } },
  { id: 's2', apeScore: 70, raw: { vj: 27, f5: 1.25 } },
  { id: 's3', apeScore: 80, raw: { vj: 26, f5: 1.20 } }
];

assert.match(sandbox.renderVerificationBadge('Laser'), /verify-badge blue|Laser Verified/);
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

const viewerAthletes = [
  { id: 'a1', name: 'A One', athleteEmail: 'athlete@example.com', parentEmail: 'parent@example.com' },
  { id: 'a2', name: 'A Two', athleteEmail: 'other@example.com', parentEmail: 'parent@example.com' }
];
assert.equal(sandbox.resolveViewerAthletesForEmail(viewerAthletes, 'ATHLETE@example.com', 'athlete_viewer').length, 1);
assert.equal(sandbox.resolveViewerAthletesForEmail(viewerAthletes, 'parent@example.com', 'parent_viewer').length, 2);

const focus = sandbox.getViewerFocus({
  notes: 'Profile coach note',
  s: [{ id: 's1', focus: 'Change of Direction', defType: 'Mixed Deficiency', note: 'Session note', sc: { vp: 4, hp: 3, rs: 2, ac: 3, mv: 4, cod: 1, gps: 3 } }]
});
assert.equal(focus.primary, 'Change of Direction');
assert.equal(focus.weakest, 'Change of Direction');
assert.match(focus.coachNotes, /Session note/);
assert.match(focus.coachNotes, /Profile coach note/);

assert.equal(sandbox.validateCoachLogoFile({ type: 'image/png', size: 1024 }).ok, true);
assert.equal(sandbox.validateCoachLogoFile({ type: 'image/gif', size: 1024 }).ok, false);
assert.equal(sandbox.validateCoachLogoFile({ type: 'image/jpeg', size: 3 * 1024 * 1024 }).ok, false);

assert.equal(sandbox.resolvePosGroup('Football', 'C'), 'POWER_DOM');
assert.equal(sandbox.resolvePosGroup('Basketball', 'Guard'), 'REACTIVE');
assert.notEqual(sandbox.resolvePosGroup('Basketball', 'Guard'), sandbox.resolvePosGroup('Football', 'OL'));
assert.equal(sandbox.resolvePosGroup('Volleyball', 'Setter'), 'REACTIVE');
assert.equal(sandbox.resolvePosGroup('Lacrosse', 'Midfield'), 'ENDURANCE_SPD');
assert.equal(sandbox.resolvePosGroup('Flag Football', 'Center'), 'REACTIVE');
assert.equal(sandbox.resolvePosGroup('Softball', 'Pitcher'), 'POWER_DOM');
assert.equal(sandbox.getAthletePositionProfile({ sport: 'Football', position: 'WR' }).positionGroup, 'SPEED_SKILL');
assert.equal(sandbox.TIERS.middle, 'Middle School (6th-8th)');
assert.equal(sandbox.tierForGrade('6th'), 'middle');
assert.equal(sandbox.tierForGrade('8th'), 'middle');
assert.equal(sandbox.resolveAgilityLevel('middle', 13), 'middle');
assert.equal(sandbox.resolveAgilityLevel('', 12), 'middle');
assert.equal(sandbox.sRSI(2.45, 'middle'), 5);
assert.equal(sandbox.calculateMetricScore5(24, 'vj', 'middle', 'male', 13, sandbox.BENCH.middle.vj, false), 4);
assert.equal(sandbox._combineKey('Jordan Smith', 'Middle School', 'Volleyball 13 Gold'), 'jordan smith|volleyball 13 gold|middle');
assert.notEqual(
  sandbox._combineKey('Jordan Smith', 'Middle School', 'Volleyball 13 Gold'),
  sandbox._combineKey('Jordan Smith', 'Middle School', 'Volleyball 13 Blue')
);
assert.match(html, /First Name','Last Name','Full Name','Gender','Sport','Position','Level','Grade \/ Class','Age','Height','Weight','Team','Notes/);
assert.match(html, /ROSTER_TEMPLATE_SPORTS=\['Football','Basketball','Baseball','Softball','Volleyball','Track & Field','Soccer','Lacrosse','Wrestling','Boxing','MMA','Flag Football'\]/);
const beginnerRecommendation = sandbox.calculateTrainingFocus({
  bucket: 5,
  session: { sc: { vp: 4, hp: 4, rs: 2, ac: 3, mv: 4 }, defType: 'Force Deficient' },
  deficiency_class: 'Structural Weakness',
  training_age: 'beginner',
  current_phase: 'offSeason',
  athlete_goal: 'max velocity and plyometrics'
});
assert.equal(beginnerRecommendation.primary_training_focus, 'Tendon Code');
assert.match(beginnerRecommendation.schroeder_principle_applied, /Extreme isometrics/);
assert.ok(beginnerRecommendation.avoid_until_ready.some((x) => /plyometric|Ballistic/i.test(x)));
assert.equal(beginnerRecommendation.weekly_emphasis.cns_demand, 'low');

console.log('launch feature tests passed');
