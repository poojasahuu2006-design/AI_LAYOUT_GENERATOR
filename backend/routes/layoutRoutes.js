const express = require('express');
const router = express.Router();
const { generateLayout } = require('../services/layoutEngine');
const { validateLayout } = require('../services/layoutValidator');
const { customizeLayout } = require('../services/layoutCustomizer');
const { parseRequirements } = require('../services/aiParser');

// @route   POST /api/ai/parse-requirements
// @desc    Parse natural language requirement string into structured JSON
router.post('/parse-requirements', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text string is required for NLP parsing.' });
    }
    const result = await parseRequirements(text);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[API Parse Error]', err);
    return res.status(500).json({ error: 'Failed to parse natural language requirements: ' + err.message });
  }
});

// @route   POST /api/layout/generate
// @desc    Generate constraint-based layout from plot & room specs
router.post('/generate', (req, res) => {
  try {
    const { plot, selectedFloors, floorRequirements, rooms } = req.body;
    
    if (!plot || !plot.width || !plot.length) {
      return res.status(400).json({ error: 'Plot dimensions (width and length) are required.' });
    }

    const layout = generateLayout({ plot, selectedFloors, floorRequirements, rooms });
    return res.json({ success: true, layout });
  } catch (err) {
    console.error('[API Generate Error]', err);
    return res.status(500).json({ error: 'Layout generation failed: ' + err.message });
  }
});

// @route   POST /api/layout/validate
// @desc    Validate spatial layout constraints & overlaps
router.post('/validate', (req, res) => {
  try {
    const { layout } = req.body;
    if (!layout) {
      return res.status(400).json({ error: 'Layout data is required for validation.' });
    }

    const validation = validateLayout(layout);
    return res.json({ success: true, validation });
  } catch (err) {
    console.error('[API Validate Error]', err);
    return res.status(500).json({ error: 'Validation failed: ' + err.message });
  }
});

// @route   POST /api/layout/customize
// @desc    Modify existing layout with natural language commands
router.post('/customize', (req, res) => {
  try {
    const { layout, command } = req.body;
    if (!layout || !command) {
      return res.status(400).json({ error: 'Existing layout and customization command are required.' });
    }

    const result = customizeLayout(layout, command);
    return res.json({ success: true, result, layout: result.layout });
  } catch (err) {
    console.error('[API Customize Error]', err);
    return res.status(500).json({ error: 'Customization failed: ' + err.message });
  }
});

module.exports = router;
