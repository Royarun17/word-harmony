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

// Easy: everyday, obvious associations
const ASSOC_EASY = {
  doctor:['nurse','hospital','medicine'],
  school:['teacher','student','homework'],
  football:['goal','player','stadium'],
  pizza:['cheese','dough','sauce'],
  ocean:['waves','fish','beach'],
  music:['guitar','singer','song'],
  computer:['keyboard','screen','mouse'],
  kitchen:['stove','chef','recipe'],
  garden:['flowers','soil','water'],
  wedding:['bride','cake','ring'],
  space:['rocket','planet','star'],
  library:['books','shelf','reading'],
  restaurant:['menu','waiter','food'],
  birthday:['cake','candles','party'],
  police:['officer','badge','patrol'],
  fire:['flame','smoke','heat'],
  money:['bank','wallet','coins'],
  travel:['flight','hotel','ticket'],
  boss:['employee','salary','office'],
  work:['desk','meeting','deadline'],
  sport:['team','coach','winner'],
  movie:['actor','screen','popcorn'],
  animal:['fur','wild','forest'],
  food:['taste','hunger','plate'],
};

// Medium: less obvious, requires some knowledge
const ASSOC_MEDIUM = {
  doctor:['physician','diagnosis','clinic'],
  school:['principal','curriculum','semester'],
  football:['referee','penalty','formation'],
  pizza:['mozzarella','topping','neapolitan'],
  ocean:['current','tidal','maritime'],
  music:['rhythm','melody','harmony'],
  computer:['processor','software','network'],
  kitchen:['cuisine','utensil','ingredient'],
  boss:['authority','manager','deadline'],
  space:['orbit','gravity','telescope'],
  money:['investment','currency','budget'],
  travel:['passport','itinerary','customs'],
  sport:['strategy','tournament','stamina'],
  movie:['director','screenplay','premiere'],
};

// Hard: cultural, historical, metaphorical
const ASSOC_HARD = {
  boss:['gotti','genovese','gambino'],
  music:['beethoven','symphony','concerto'],
  doctor:['hippocratic','prognosis','pathology'],
  space:['cosmology','relativity','nebula'],
  money:['cryptocurrency','arbitrage','portfolio'],
  sport:['olympiad','decathlon','podium'],
  movie:['cinematography','auteur','mise'],
  school:['pedagogy','academia','dissertation'],
};

// Pick the right fallback based on difficulty
function getAssocFallback(word, difficulty) {
  if (difficulty === 'hard' && ASSOC_HARD[word]) return ASSOC_HARD[word];
  if (difficulty === 'medium' && ASSOC_MEDIUM[word]) return ASSOC_MEDIUM[word];
  if (ASSOC_EASY[word]) return ASSOC_EASY[word];
  // Try medium as fallback for hard if no hard entry
  if (difficulty === 'hard' && ASSOC_MEDIUM[word]) return ASSOC_MEDIUM[word];
  return null;
}

// Keep for backwards compatibility
const ASSOC_FALLBACKS = ASSOC_EASY;

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
  const fallback = getAssocFallback(lower, difficulty);
  if (difficulty==='easy' && fallback) return fallback;
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
    const fb = getAssocFallback(lower, difficulty);
    if (fb) return fb;
    return ['linked','nearby','grouped'];
  } catch(e) {
    return getAssocFallback(lower, difficulty) || ['linked','nearby','grouped'];
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
    // Dictionary API failed or word not found (e.g. proper nouns like "Gotti")
    // Show a clean context-based explanation instead of a generic message
    const reason = getContextReason(lower, topic);
    const capitalised = word.charAt(0).toUpperCase() + word.slice(1);
    return `${capitalised} — ${reason}. This word appears in the context of "${topicWord}" because of this connection.`;
  }
}

// Generate a short reason why the word relates to the topic
function getContextReason(word, topic) {
  const reasons = {
    football: {
      lineman: 'linemen play on the offensive or defensive line in football',
      linebacker: 'linebackers defend against runs and passes in football',
      league: 'football is organised into professional leagues',
      referee: 'referees officiate and enforce the rules of football',
      stadium: 'football matches are played in large stadiums',
      goal: 'scoring goals or touchdowns is the aim of football',
    },
    doctor: {
      nurse: 'nurses work alongside doctors in hospitals and clinics',
      hospital: 'doctors work and treat patients in hospitals',
      medicine: 'doctors prescribe medicine to treat illness',
      surgery: 'doctors perform surgical operations on patients',
      stethoscope: 'doctors use stethoscopes to listen to heartbeats',
    },
    school: {
      teacher: 'teachers instruct and guide students at school',
      student: 'students attend school to learn and study',
      classroom: 'lessons take place in classrooms at school',
      homework: 'teachers assign homework for students to complete at home',
    },
    boss: {
      gotti: 'John Gotti was a famous mob boss of the Gambino crime family',
      genovese: 'the Genovese family is one of the most powerful organised crime families, led by a boss',
      gambino: 'the Gambino family is a major crime organisation headed by a powerful boss',
      employee: 'a boss is the person in charge of employees in a workplace',
      office: 'a boss typically has their own office and oversees the team',
      salary: 'a boss is responsible for approving and setting employee salaries',
      manager: 'a boss manages and directs the work of their team',
    },
    music: {
      guitar: 'the guitar is one of the most widely played musical instruments',
      singer: 'singers perform vocals as the central part of most music',
      concert: 'musicians perform live music at concerts for audiences',
      piano: 'the piano is a foundational instrument in many styles of music',
      rhythm: 'rhythm is the timing and beat that drives all music',
    },
    computer: {
      keyboard: 'keyboards are the primary input device used with computers',
      screen: 'screens display the visual output of a computer',
      mouse: 'a mouse is used to navigate and interact with a computer',
      software: 'software are the programs that run on a computer',
      internet: 'computers connect to the internet to access information',
    },
  };
  // Check if we have a specific reason
  if (reasons[topic]?.[word]) return reasons[topic][word];
  // Generic but slightly more specific fallback
  return `it is closely linked to the concept of "${topic}" and commonly appears in that context`;
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
