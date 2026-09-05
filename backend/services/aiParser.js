/**
 * AI Requirement Parser
 * Parses natural language input into structured architectural requirements for Ground & First Floor.
 */

const parseRequirements = async (inputText) => {
  const text = (inputText || '').trim();
  if (!text) {
    return {
      error: 'Empty input text provided',
      missingInfo: ['plot', 'rooms']
    };
  }

  // 1. Check for AI API Key if configured
  if (process.env.AI_API_KEY) {
    try {
      const parsedWithAI = await callLLMApi(text);
      if (parsedWithAI && (parsedWithAI.floors || parsedWithAI.rooms)) {
        return parsedWithAI;
      }
    } catch (e) {
      console.warn('[AI Parser] LLM API call failed, using rule-based parser:', e.message);
    }
  }

  // 2. Rule-Based Heuristic NLP Parser
  return parseHeuristically(text);
};

function parseHeuristically(text) {
  const lower = text.toLowerCase();

  let plot = { length: 40, width: 30, unit: 'ft' };
  let plotDetected = false;

  const dimRegex = /(\d+(?:\.\d+)?)\s*(?:x|×|by|\*|ft|m|'|meters?|feet)?\s*(\d+(?:\.\d+)?)\s*(ft|feet|meter|meters|m|'|")?/i;
  const matchDim = lower.match(dimRegex);

  if (matchDim) {
    const val1 = parseFloat(matchDim[1]);
    const val2 = parseFloat(matchDim[2]);
    const unitStr = matchDim[3] || '';

    if (!isNaN(val1) && !isNaN(val2) && val1 > 0 && val2 > 0) {
      plot.width = Math.min(val1, val2);
      plot.length = Math.max(val1, val2);
      plot.unit = (unitStr.includes('m') || lower.includes('meter')) ? 'm' : 'ft';
      plotDetected = true;
    }
  }

  // Detect Floor Selection
  let selectedFloors = ['ground'];
  if (lower.includes('ground + first') || lower.includes('ground and first') || lower.includes('both floors') || lower.includes('2 floor') || lower.includes('two floor') || lower.includes('2-story') || lower.includes('two story')) {
    selectedFloors = ['ground', 'first'];
  } else if (lower.includes('first floor only') || lower.includes('first floor')) {
    selectedFloors = ['first'];
  }

  // Room Extraction
  const roomTypesMap = [
    { type: 'Bedroom', synonyms: ['bedroom', 'bedrooms', 'bed room', 'bed rooms', 'bed'] },
    { type: 'Master Bedroom', synonyms: ['master bedroom', 'master bed'] },
    { type: 'Living Room', synonyms: ['living room', 'living', 'drawing room', 'lounge'] },
    { type: 'Hall', synonyms: ['hall', 'main hall'] },
    { type: 'Kitchen', synonyms: ['kitchen', 'kitchenette'] },
    { type: 'Dining Room', synonyms: ['dining room', 'dining area', 'dining'] },
    { type: 'Bathroom', synonyms: ['bathroom', 'bathrooms', 'bath', 'baths', 'ensuite'] },
    { type: 'Washroom', synonyms: ['washroom', 'toilet', 'toilets', 'wc', 'powder room'] },
    { type: 'Balcony', synonyms: ['balcony', 'balconies', 'terrace', 'verandah'] },
    { type: 'Utility Room', synonyms: ['utility room', 'utility', 'wash area', 'laundry'] },
    { type: 'Store Room', synonyms: ['store room', 'storeroom', 'pantry', 'store'] },
    { type: 'Staircase', synonyms: ['staircase', 'stairs', 'stairway'] },
    { type: 'Study Room', synonyms: ['study room', 'study'] },
    { type: 'Pooja Room', synonyms: ['pooja room', 'pooja', 'puja'] }
  ];

  const numberWords = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'a': 1, 'an': 1 };
  const extractedRoomsMap = new Map();

  // BHK Matcher
  const bhkMatch = lower.match(/(\d+)\s*bhk/i);
  if (bhkMatch) {
    const beds = parseInt(bhkMatch[1], 10);
    extractedRoomsMap.set('Bedroom', beds);
    extractedRoomsMap.set('Living Room', 1);
    extractedRoomsMap.set('Kitchen', 1);
    extractedRoomsMap.set('Bathroom', Math.max(1, beds - 1));
  }

  roomTypesMap.forEach(({ type, synonyms }) => {
    synonyms.forEach(synonym => {
      const regex1 = new RegExp(`(\\d+|one|two|three|four|five|a|an)\\s+(?:${synonym})`, 'gi');
      let m;
      while ((m = regex1.exec(lower)) !== null) {
        let qStr = m[1].toLowerCase();
        let qty = numberWords[qStr] || parseInt(qStr, 10) || 1;
        extractedRoomsMap.set(type, Math.max(extractedRoomsMap.get(type) || 0, qty));
      }

      if (!extractedRoomsMap.has(type) && lower.includes(synonym)) {
        extractedRoomsMap.set(type, 1);
      }
    });
  });

  if (extractedRoomsMap.size === 0) {
    extractedRoomsMap.set('Bedroom', 2);
    extractedRoomsMap.set('Living Room', 1);
    extractedRoomsMap.set('Kitchen', 1);
    extractedRoomsMap.set('Bathroom', 2);
    extractedRoomsMap.set('Balcony', 1);
  }

  const roomsList = [];
  for (const [type, quantity] of extractedRoomsMap.entries()) {
    roomsList.push({ type, quantity });
  }

  const warnings = [];
  if (!plotDetected) {
    warnings.push('Plot dimensions were not explicitly found in text. Defaulting to 30 × 40 ft.');
  }

  return {
    plot,
    selectedFloors,
    rooms: roomsList,
    supportedFloorsText: "Supported Floors: Ground Floor + First Floor",
    rawInput: text,
    warnings
  };
}

async function callLLMApi(text) {
  const apiKey = process.env.AI_API_KEY;
  const prompt = `Extract house floor plan requirements from: "${text}".
Return JSON object: { "plot": {"length": number, "width": number, "unit": "ft"|"m"}, "selectedFloors": ["ground"|"first"], "rooms": [{"type": string, "quantity": number}] }`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return null;
}

module.exports = { parseRequirements };
