// scripts/generate-test-logs.js
// Usage:
//   node scripts/generate-test-logs.js         -> generates 700 entries (default)
//   node scripts/generate-test-logs.js 500     -> generates 500 entries
//
// Output: website/data/test-logs.json

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'website', 'data');
const OUT_FILE = path.join(OUT_DIR, 'test-logs.json');

const arg = process.argv[2];
const DEFAULT_COUNT = 700;
const MIN_COUNT = 500;
const MAX_COUNT = 1000;
let count = parseInt(arg, 10) || DEFAULT_COUNT;
if (count < MIN_COUNT) count = MIN_COUNT;
if (count > MAX_COUNT) count = MAX_COUNT;

const categories = ['Work', 'Health', 'Relationships', 'Other'];
const tagsPool = ['meeting', 'gym', 'call', 'email', 'family', 'travel', 'finance', 'sleep', 'meditation', 'errand'];
const sampleTexts = [
  'Morning workout at the gym',
  'Daily standup and planning meeting',
  'Reviewed PR and left comments',
  'Lunch with parents',
  'Went for a 5km run',
  'Scheduled dentist appointment',
  'Quick check-in with product team',
  'Worked on billing integration',
  'Watched a talk about habit formation',
  'Asked about weather for tomorrow',
  'Booked flights for conference',
  'Had deep work session (3 hours)',
  'Evening walk with partner',
  'Sent client proposal',
  'Random message: what is the time?'
];

const importanceLevels = ['Low', 'Medium', 'High', 'Critical'];
const now = Date.now();
const MS_IN_DAY = 24*3600*1000;
const lookbackDays = 90; // generate over last 90 days

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pad(n){ return n < 10 ? '0'+n : ''+n; }
function isoDate(ts){ return new Date(ts).toISOString(); }
function yyyyMmDd(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function hhmm(ts){
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function choiceWeighted(weights){
  // weights: [{item, weight}, ...]
  const total = weights.reduce((s,w)=>s+w.weight,0);
  let r = Math.random()*total;
  for(const w of weights){
    if(r < w.weight) return w.item;
    r -= w.weight;
  }
  return weights[weights.length-1].item;
}

// Build an array of timestamps with bursts
function buildTimestamps(n){
  const arr = [];
  // pick some burst days
  const numBursts = Math.max(1, Math.floor(n / 200)); // ~1 burst per 200 items
  const burstDays = new Set();
  for(let i=0;i<numBursts;i++){
    const daysAgo = randInt(0, lookbackDays);
    burstDays.add(daysAgo);
  }
  for(let i=0;i<n;i++){
    // 10% chance to be in a burst day
    let daysAgo;
    if(Math.random() < 0.10 && burstDays.size){
      const chosen = Array.from(burstDays)[Math.floor(Math.random() * burstDays.size)];
      daysAgo = chosen;
      // pick hour cluster: morning or afternoon or evening
      const hour = choiceWeighted([{item:8,weight:3},{item:9,weight:2},{item:17,weight:3},{item:18,weight:2},{item:20,weight:1}]);
      const minute = randInt(0,59);
      const ts = now - (daysAgo * MS_IN_DAY) - ((hour * 3600 + minute * 60) * 1000);
      arr.push(ts - randInt(0,60*60*1000)); // jitter up to 1 hour
    } else {
      daysAgo = randInt(0, lookbackDays);
      const hour = randInt(6,22); // reasonable awake hours
      const minute = randInt(0,59);
      const ts = now - (daysAgo * MS_IN_DAY) - ((hour * 3600 + minute * 60) * 1000);
      arr.push(ts);
    }
  }
  // shuffle timestamps to avoid perfect ordering
  return arr.sort(() => Math.random() - 0.5).sort((a,b)=>a-b);
}

function sampleTags(){
  const out = [];
  const take = Math.random() < 0.4 ? 0 : randInt(1,3);
  for(let i=0;i<take;i++){
    const t = pick(tagsPool);
    if(!out.includes(t)) out.push(t);
  }
  return out;
}

function maybeMultiCategory(baseCat){
  // 20% chance to have a second category
  if(Math.random() < 0.2){
    const other = pick(categories.filter(c=>c!==baseCat));
    return [baseCat, other];
  }
  return [baseCat];
}

// generate
const timestamps = buildTimestamps(count);
const logs = timestamps.map((ts, idx) => {
  const baseText = pick(sampleTexts);
  // sometimes append small random detail
  const detailChance = Math.random();
  let text = baseText;
  if(detailChance < 0.2) text += ` — ${pick(['quick note','follow-up','left a comment','rescheduled','short call'])}`;
  if(detailChance > 0.95) text = `User: "${pick(['what time is it?', 'can you remind me tomorrow', 'ping', 'who is online?'])}"`; // noise

  const category = pick(categories);
  const categoriesArr = maybeMultiCategory(category);

  // type: Life Log 80% / Ignored 20%
  const type = Math.random() < 0.8 ? 'Life Log' : 'Ignored';

  // importance: Low most of the time, small chance of High/Critical
  const importance = choiceWeighted([
    { item: 'Low', weight: 70 },
    { item: 'Medium', weight: 20 },
    { item: 'High', weight: 8 },
    { item: 'Critical', weight: 2 },
  ]);

  // occasionally include session info (20%)
  const sessionId = Math.random() < 0.2 ? `sess_${randInt(1000,9999)}` : null;

  return {
    id: `log_${idx + 1}`,
    timestamp: isoDate(ts),
    date: yyyyMmDd(ts),
    time: hhmm(ts),
    text,
    categories: categoriesArr,
    tags: sampleTags(),
    type,
    importance: Math.random() < 0.05 ? importance : undefined, // keep importance sparse
    sessionId: sessionId || undefined,
    source: sessionId ? 'whatsapp' : (Math.random() < 0.05 ? 'email' : undefined)
  };
});

// ensure output dir exists
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(logs, null, 2), 'utf8');

console.log(`Generated ${logs.length} test logs → ${OUT_FILE}`);