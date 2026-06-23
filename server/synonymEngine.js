const axios = require('axios');

const DATAMUSE_URL = 'https://api.datamuse.com/words';

const FALLBACKS = {
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
    if (FALLBACKS[lower]) return FALLBACKS[lower];
    return ['similar', 'alike', 'related'];
  } catch (err) {
    console.warn(`Datamuse error for "${word}":`, err.message);
    return FALLBACKS[lower] || ['similar', 'alike', 'related'];
  }
}

module.exports = { getSynonyms };
