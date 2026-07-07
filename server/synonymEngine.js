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

// Check if word shares the same root as the original — e.g. "summery" from "summer"
// Blocks lazy variants (prefix/suffix of original word) that aren't real distinct concepts
function isSameRoot(word, original) {
  const w = word.toLowerCase();
  const o = original.toLowerCase();
  if (w === o) return true;
  // One contains the other as a substring (e.g. "summer" inside "midsummer"/"summery")
  if (w.includes(o) || o.includes(w)) return true;
  // Share first 4+ letters (common root, e.g. "happy"/"happily")
  const minLen = Math.min(w.length, o.length);
  if (minLen >= 4 && w.slice(0, 4) === o.slice(0, 4)) return true;
  return false;
}

function isGoodWord(w, difficulty='medium', original=null) {
  if (!w || typeof w !== 'string') return false;
  const clean = w.toLowerCase().trim();
  if (clean.length < 4 || clean.length > 14) return false;
  if (!/^[a-z]+$/.test(clean)) return false;
  if (ALWAYS_BLOCKED.has(clean)) return false;
  if (original && isSameRoot(clean, original)) return false; // block "summery" for "summer"
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
    // Priority 1: rel_syn = STRICT synonyms only (most accurate, no antonyms/related words)
    const r2 = await axios.get(DATAMUSE, { params:{ rel_syn:lower, max:20 }, timeout:5000 });
    const strictSynonyms = (r2.data||[])
      .map(r=>r.word.toLowerCase())
      .filter(w => w!==lower && isGoodWord(w,difficulty,lower))
      .filter((v,i,a) => a.indexOf(v)===i);

    if (strictSynonyms.length >= 3) return strictSynonyms.slice(0,3);

    // Priority 2: ml (means-like) as backup, but filter out antonym-prone results
    const r1 = await axios.get(DATAMUSE, { params:{ ml:lower, max:40 }, timeout:5000 });
    const meansLike = (r1.data||[])
      .map(r=>r.word.toLowerCase())
      .filter(w => w!==lower && isGoodWord(w,difficulty,lower))
      .filter(w => !strictSynonyms.includes(w))
      .filter((v,i,a) => a.indexOf(v)===i);

    const combined = [...strictSynonyms, ...meansLike].slice(0,3);
    if (combined.length >= 3) return combined;

    if (SYN_FALLBACKS[lower]) return SYN_FALLBACKS[lower];
    return ['alike','similar','matching'];
  } catch(e) {
    console.warn(`Synonym error for "${word}":`, e.message);
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
      .filter(w => w!==lower && isGoodWord(w,difficulty,lower))
      .filter((v,i,a) => a.indexOf(v)===i)
      .slice(0,3);
    if (trigger.length >= 3) return trigger;

    const r2 = await axios.get(`${CONCEPTNET}/c/en/${lower}`, {
      params:{ filter:'/c/en', limit:50 }, timeout:6000
    });
    const concept = (r2.data?.related||[])
      .map(r => r['@id'].split('/').pop().replace(/_/g,'').toLowerCase())
      .filter(w => w!==lower && isGoodWord(w,difficulty,lower))
      .filter((v,i,a) => a.indexOf(v)===i);

    const combined = [...new Set([...trigger,...concept])].slice(0,3);
    if (combined.length >= 3) return combined;
    if (ASSOC_FALLBACKS[lower]) return ASSOC_FALLBACKS[lower];
    return ['linked','nearby','grouped'];
  } catch(e) {
    return ASSOC_FALLBACKS[lower] || ['linked','nearby','grouped'];
  }
}

// ─── Word Definitions (for results screen) ───────────────────────────────────
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

// Curated fallbacks for common words
const DEFINITION_FALLBACKS = {
  joyful: 'Feeling or showing great happiness and delight. A joyful person radiates positive energy and often smiles or laughs easily.',
  elated: 'Extremely happy and excited, often after hearing good news or achieving something. Being elated is a stronger feeling than simply being pleased.',
  content: 'Feeling satisfied and at peace with one\'s situation. A content person is comfortable with what they have rather than constantly wanting more.',
};

// ─── Education Mode definition (standard dictionary) ──────────────────────────
async function getDefinition(word) {
  const lower = word.toLowerCase().trim();
  try {
    const response = await axios.get(`${DICTIONARY_API}/${encodeURIComponent(lower)}`, { timeout: 5000 });
    const entry = response.data?.[0];
    // Get all meanings and definitions
    const allMeanings = entry?.meanings || [];
    let bestDef = null;
    let bestExample = null;
    let partOfSpeech = null;

    // Pick the most complete definition (longest one with an example preferred)
    for (const meaning of allMeanings) {
      for (const def of (meaning.definitions || [])) {
        if (!bestDef || (def.example && !bestExample) || def.definition.length > (bestDef?.length || 0)) {
          bestDef = def.definition;
          bestExample = def.example;
          partOfSpeech = meaning.partOfSpeech;
        }
      }
    }

    if (bestDef) {
      let result = bestDef;
      if (!result.endsWith('.')) result += '.';
      if (bestExample) {
        result += ` For example: "${bestExample}".`;
      } else {
        result += ` This word is commonly used as a ${partOfSpeech || 'term'} in everyday language.`;
      }
      return result;
    }
    throw new Error('No definition found');
  } catch (err) {
    if (DEFINITION_FALLBACKS[lower]) return DEFINITION_FALLBACKS[lower];
    return `"${word}" — definition not available right now.`;
  }
}

// ─── Fun Mode definition (context-aware — relates word back to topic) ─────────
async function getContextDefinition(word, topicWord) {
  const lower = word.toLowerCase().trim();
  const topic = topicWord.toLowerCase().trim();

  try {
    const response = await axios.get(`${DICTIONARY_API}/${encodeURIComponent(lower)}`, { timeout: 5000 });
    const entry = response.data?.[0];
    const allMeanings = entry?.meanings || [];

    // Try to find a definition that mentions the topic word or is most relevant
    let bestDef = null;
    let bestExample = null;
    let partOfSpeech = null;
    let topicRelatedDef = null;

    for (const meaning of allMeanings) {
      for (const def of (meaning.definitions || [])) {
        const defLower = def.definition.toLowerCase();
        // Prefer a definition that mentions the topic word
        if (defLower.includes(topic) && !topicRelatedDef) {
          topicRelatedDef = { def: def.definition, example: def.example, pos: meaning.partOfSpeech };
        }
        if (!bestDef || def.definition.length > bestDef.length) {
          bestDef = def.definition;
          bestExample = def.example;
          partOfSpeech = meaning.partOfSpeech;
        }
      }
    }

    // Use topic-related definition if found, otherwise use best definition
    const chosen = topicRelatedDef || { def: bestDef, example: bestExample, pos: partOfSpeech };

    if (chosen.def) {
      let result = chosen.def;
      if (!result.endsWith('.')) result += '.';
      // Always add context sentence linking back to the topic
      if (chosen.example) {
        result += ` For example: "${chosen.example}".`;
      }
      result += ` In the context of "${topicWord}", this word is associated because ${getContextReason(lower, topic)}.`;
      return result;
    }
    throw new Error('No definition');
  } catch (err) {
    return `"${word}" relates to "${topicWord}" — ${getContextReason(lower, topic)}.`;
  }
}

// Generate a short reason why the word relates to the topic
function getContextReason(word, topic) {
  const reasons = {
    // Sports
    football: { lineman: 'linemen are the players who block on the line of scrimmage', linebacker: 'linebackers defend against runs and passes behind the defensive line', league: 'football is organised into leagues and divisions', referee: 'referees officiate football matches', stadium: 'football matches are played in stadiums', goal: 'scoring goals is the objective of the game' },
    doctor: { nurse: 'nurses work alongside doctors in healthcare', hospital: 'doctors work in hospitals', medicine: 'doctors prescribe medicine to treat patients', surgery: 'surgeons perform operations', stethoscope: 'doctors use stethoscopes to examine patients' },
    school: { teacher: 'teachers instruct students at school', student: 'students attend school to learn', classroom: 'learning happens in classrooms at school', homework: 'teachers assign homework for students to complete' },
  };
  return reasons[topic]?.[word] || `it is commonly associated with the topic of ${topic}`;
}

// ─── Batch fetch definitions ──────────────────────────────────────────────────
// clusterMap: { topicWord: [word1, word2, word3] } — used for Fun Mode context
async function getDefinitions(words, mode = 'education', clusterMap = {}) {
  const results = {};

  // Build reverse map: word → topicWord
  const wordToTopic = {};
  if (mode === 'fun' && clusterMap) {
    for (const [topic, cluster] of Object.entries(clusterMap)) {
      for (const w of cluster) {
        wordToTopic[w.toLowerCase()] = topic;
      }
    }
  }

  await Promise.all(words.map(async (w) => {
    const lower = w.toLowerCase().trim();
    if (mode === 'fun' && wordToTopic[lower]) {
      results[w] = await getContextDefinition(lower, wordToTopic[lower]);
    } else {
      results[w] = await getDefinition(lower);
    }
  }));

  return results;
}

module.exports = { getSynonyms, getAssociations, getDefinition, getContextDefinition, getDefinitions };
