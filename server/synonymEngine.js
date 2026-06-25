const axios = require('axios');

const DATAMUSE_URL = 'https://api.datamuse.com/words';
const CONCEPTNET_URL = 'https://api.conceptnet.io/related';

// ─── Fallbacks ────────────────────────────────────────────────────────────────
const SYNONYM_FALLBACKS = {
  happy:   ['joyful', 'elated', 'content'],
  sad:     ['sorrowful', 'melancholy', 'dejected'],
  fast:    ['swift', 'rapid', 'brisk'],
  slow:    ['sluggish', 'unhurried', 'leisurely'],
  big:     ['enormous', 'vast', 'immense'],
  small:   ['tiny', 'petite', 'compact'],
  smart:   ['astute', 'clever', 'shrewd'],
  angry:   ['furious', 'irate', 'livid'],
  brave:   ['courageous', 'valiant', 'bold'],
  tired:   ['weary', 'exhausted', 'fatigued'],
  funny:   ['hilarious', 'comical', 'amusing'],
  kind:    ['benevolent', 'gracious', 'compassionate'],
  old:     ['ancient', 'aged', 'venerable'],
  new:     ['novel', 'fresh', 'modern'],
  pretty:  ['beautiful', 'gorgeous', 'stunning'],
  strong:  ['powerful', 'robust', 'sturdy'],
  weak:    ['feeble', 'frail', 'fragile'],
  rich:    ['wealthy', 'affluent', 'prosperous'],
  cold:    ['frigid', 'icy', 'frosty'],
  hot:     ['scorching', 'blazing', 'sweltering'],
};

const ASSOCIATION_FALLBACKS = {
  doctor:     ['nurse', 'hospital', 'medicine'],
  school:     ['teacher', 'student', 'classroom'],
  football:   ['goal', 'stadium', 'referee'],
  pizza:      ['cheese', 'oven', 'italy'],
  ocean:      ['waves', 'fish', 'ship'],
  music:      ['guitar', 'singer', 'concert'],
  computer:   ['keyboard', 'screen', 'software'],
  kitchen:    ['stove', 'chef', 'recipe'],
  garden:     ['flowers', 'soil', 'sunlight'],
  wedding:    ['bride', 'cake', 'ring'],
  space:      ['rocket', 'astronaut', 'planet'],
  library:    ['books', 'shelf', 'reading'],
  hospital:   ['doctor', 'nurse', 'medicine'],
  restaurant: ['menu', 'waiter', 'food'],
  birthday:   ['cake', 'candles', 'party'],
};

// ─── Education Mode — Datamuse synonyms ──────────────────────────────────────
async function getSynonyms(word) {
  const lower = word.toLowerCase().trim();
  try {
    const r1 = await axios.get(DATAMUSE_URL, { params: { ml: lower, max: 20 }, timeout: 5000 });
    const r2 = await axios.get(DATAMUSE_URL, { params: { rel_syn: lower, max: 10 }, timeout: 5000 });
    const combined = [
      ...(r1.data || []).map(r => r.word.toLowerCase()),
      ...(r2.data || []).map(r => r.word.toLowerCase()),
    ]
      .filter(w => w !== lower && /^[a-z]+$/.test(w) && w.length >= 4)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    if (combined.length >= 3) return combined;
    if (SYNONYM_FALLBACKS[lower]) return SYNONYM_FALLBACKS[lower];
    return ['similar', 'alike', 'related'];
  } catch (err) {
    console.warn(`Datamuse error for "${word}":`, err.message);
    return SYNONYM_FALLBACKS[lower] || ['similar', 'alike', 'related'];
  }
}

// ─── Fun Mode — ConceptNet associations ──────────────────────────────────────
async function getAssociations(word) {
  const lower = word.toLowerCase().trim();
  try {
    const response = await axios.get(`${CONCEPTNET_URL}/c/en/${lower}`, {
      params: { filter: '/c/en', limit: 20 },
      timeout: 6000
    });

    const results = response.data?.related || [];
    const filtered = results
      .map(r => {
        // Extract just the word from the concept URI e.g. /c/en/nurse -> nurse
        const parts = r['@id'].split('/');
        return parts[parts.length - 1].replace(/_/g, ' ').toLowerCase();
      })
      .filter(w => w !== lower && /^[a-z][a-z ]+$/.test(w) && w.length >= 3 && w.length <= 15)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    if (filtered.length >= 3) return filtered;

    // Fallback to Datamuse trigger words if ConceptNet doesn't return enough
    const r2 = await axios.get(DATAMUSE_URL, {
      params: { rel_trg: lower, max: 10 },
      timeout: 5000
    });
    const trigger = (r2.data || [])
      .map(r => r.word.toLowerCase())
      .filter(w => w !== lower && /^[a-z]+$/.test(w) && w.length >= 3)
      .slice(0, 3);

    const combined = [...new Set([...filtered, ...trigger])].slice(0, 3);
    if (combined.length >= 3) return combined;
    if (ASSOCIATION_FALLBACKS[lower]) return ASSOCIATION_FALLBACKS[lower];
    return ['related', 'connected', 'associated'];
  } catch (err) {
    console.warn(`ConceptNet error for "${word}":`, err.message);
    // Fallback to Datamuse trigger words
    try {
      const r = await axios.get(DATAMUSE_URL, { params: { rel_trg: lower, max: 5 }, timeout: 4000 });
      const words = (r.data || []).map(x => x.word.toLowerCase()).filter(w => w.length >= 3).slice(0, 3);
      if (words.length >= 3) return words;
    } catch (e) {}
    return ASSOCIATION_FALLBACKS[lower] || ['related', 'connected', 'associated'];
  }
}

module.exports = { getSynonyms, getAssociations };
