const axios = require('axios');
const DATAMUSE = 'https://api.datamuse.com/words';
const CONCEPTNET = 'https://api.conceptnet.io/related';

// ─── Fallbacks ────────────────────────────────────────────────────────────────
const SYN_FALLBACKS = {
  happy:['joyful','elated','content'], sad:['sorrowful','melancholy','dejected'],
  fast:['swift','rapid','brisk'], slow:['sluggish','unhurried','leisurely'],
  big:['enormous','vast','immense'], small:['tiny','petite','compact'],
  smart:['astute','clever','shrewd'], angry:['furious','irate','livid'],
  brave:['courageous','valiant','bold'], tired:['weary','exhausted','fatigued'],
  funny:['hilarious','comical','amusing'], kind:['benevolent','gracious','compassionate'],
  old:['ancient','aged','venerable'], new:['novel','fresh','modern'],
  pretty:['beautiful','gorgeous','stunning'], strong:['powerful','robust','sturdy'],
  weak:['feeble','frail','fragile'], rich:['wealthy','affluent','prosperous'],
  cold:['frigid','icy','frosty'], hot:['scorching','blazing','sweltering'],
};

const ASSOC_FALLBACKS = {
  doctor:['nurse','hospital','medicine'], school:['teacher','student','classroom'],
  football:['goal','stadium','referee'], pizza:['cheese','oven','italy'],
  ocean:['waves','fish','ship'], music:['guitar','singer','concert'],
  computer:['keyboard','screen','mouse'], kitchen:['stove','chef','recipe'],
  garden:['flowers','soil','sunlight'], wedding:['bride','cake','ring'],
  space:['rocket','astronaut','planet'], library:['books','shelf','reading'],
  hospital:['doctor','nurse','medicine'], restaurant:['menu','waiter','food'],
  birthday:['cake','candles','party'], police:['officer','badge','patrol'],
  fire:['flame','smoke','heat'], water:['river','ocean','rain'],
  food:['hunger','taste','meal'], animal:['wild','fur','habitat'],
  sport:['team','coach','victory'], movie:['actor','screen','popcorn'],
  money:['bank','wallet','coins'], travel:['flight','hotel','passport'],
};

// Always blocked words
const ALWAYS_BLOCKED = new Set([
  'gnu','saas','paas','iaas','api','sql','html','css','xml','php','java',
  'linux','unix','nginx','sudo','chmod','bash','perl','ruby','rust',
  'related','connected','associated','similar','used','type','form',
  'part','kind','sort','make','take','give','come','know',
  'place','thing','person','point','work','area','hand',
  'case','fact','time','year','way','day','man','use','get',
  'also','just','more','some','such','than','them','then',
  'well','been','have','will','your','from','they','this','with',
]);

// Hard mode only
const HARD_ONLY = new Set([
  'hippocratic','stethoscope','residency','prognosis','pathology',
  'jurisprudence','litigation','ecclesiastical','metamorphosis',
  'thermodynamics','photosynthesis','pharmaceutical','carcinogen',
  'bureaucratic','infrastructure','monetization','cryptocurrency',
  'oscillation','perpendicular','isosceles','archipelago',
  'omniscient','perspicacious','loquacious','magnanimous',
]);

// Medium+ only
const MEDIUM_PLUS = new Set([
  'physician','surgeon','diagnosis','elated','euphoric','jubilant',
  'exuberant','melancholy','despondent','vivacious','tenacious',
  'benevolent','conscientious','diligent','astute','proficient',
  'eloquent','aesthetic','ambiguous','meticulous','voracious',
]);

function isGoodWord(w, difficulty='medium') {
  if (!w || typeof w !== 'string') return false;
  const clean = w.toLowerCase().trim();
  if (clean.length < 4 || clean.length > 14) return false;
  if (!/^[a-z]+$/.test(clean)) return false;
  if (ALWAYS_BLOCKED.has(clean)) return false;
  if (difficulty === 'easy') {
    if (HARD_ONLY.has(clean) || MEDIUM_PLUS.has(clean)) return false;
    if (clean.length > 9) return false;
  } else if (difficulty === 'medium') {
    if (HARD_ONLY.has(clean)) return false;
  }
  return true;
}

// ─── Education Mode ───────────────────────────────────────────────────────────
async function getSynonyms(word, difficulty='medium') {
  const lower = word.toLowerCase().trim();
  try {
    const [r1, r2] = await Promise.all([
      axios.get(DATAMUSE, { params:{ ml:lower, max:30 }, timeout:5000 }),
      axios.get(DATAMUSE, { params:{ rel_syn:lower, max:20 }, timeout:5000 }),
    ]);
    const words = [
      ...(r1.data||[]).map(r=>r.word.toLowerCase()),
      ...(r2.data||[]).map(r=>r.word.toLowerCase()),
    ].filter(w => w!==lower && isGoodWord(w,difficulty))
     .filter((v,i,a) => a.indexOf(v)===i)
     .slice(0,3);
    if (words.length >= 3) return words;
    if (SYN_FALLBACKS[lower]) return SYN_FALLBACKS[lower];
    return ['alike','similar','matching'];
  } catch(e) {
    return SYN_FALLBACKS[lower] || ['alike','similar','matching'];
  }
}

// ─── Fun Mode ─────────────────────────────────────────────────────────────────
async function getAssociations(word, difficulty='medium') {
  const lower = word.toLowerCase().trim();
  if (difficulty==='easy' && ASSOC_FALLBACKS[lower]) return ASSOC_FALLBACKS[lower];
  try {
    const r1 = await axios.get(DATAMUSE, { params:{ rel_trg:lower, max:50 }, timeout:5000 });
    const trigger = (r1.data||[])
      .map(r=>r.word.toLowerCase())
      .filter(w => w!==lower && isGoodWord(w,difficulty))
      .filter((v,i,a) => a.indexOf(v)===i)
      .slice(0,3);
    if (trigger.length >= 3) return trigger;

    const r2 = await axios.get(`${CONCEPTNET}/c/en/${lower}`, {
      params:{ filter:'/c/en', limit:50 }, timeout:6000
    });
    const concept = (r2.data?.related||[])
      .map(r => r['@id'].split('/').pop().replace(/_/g,'').toLowerCase())
      .filter(w => w!==lower && isGoodWord(w,difficulty))
      .filter((v,i,a) => a.indexOf(v)===i);

    const combined = [...new Set([...trigger,...concept])].slice(0,3);
    if (combined.length >= 3) return combined;
    if (ASSOC_FALLBACKS[lower]) return ASSOC_FALLBACKS[lower];
    return ['linked','nearby','grouped'];
  } catch(e) {
    return ASSOC_FALLBACKS[lower] || ['linked','nearby','grouped'];
  }
}

module.exports = { getSynonyms, getAssociations };
