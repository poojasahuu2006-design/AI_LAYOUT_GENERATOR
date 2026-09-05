const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');
const { getInMemoryStore } = require('../config/db');

// @route   POST /api/projects
// @desc    Save a new house layout project
router.post('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { projectName, plotLength, plotWidth, unit, selectedFloors, floors, rooms, layout } = req.body;
    const { isInMemoryFallback, inMemoryProjects } = getInMemoryStore();
    const userIdStr = req.user ? (req.user.id || req.user._id) : 'guest';

    if (isInMemoryFallback) {
      const id = 'proj_' + Date.now();
      const newProj = {
        _id: id,
        id,
        userIdStr,
        projectName: projectName || 'My Dream House Layout',
        plotLength,
        plotWidth,
        unit: unit || 'ft',
        selectedFloors: selectedFloors || ['ground'],
        floors: floors || [],
        rooms: rooms || [],
        layout: layout || {},
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryProjects.set(id, newProj);
      return res.status(201).json({ success: true, project: newProj });
    }

    const project = new Project({
      userId: req.user ? req.user.id : null,
      userIdStr,
      projectName: projectName || 'My Dream House Layout',
      plotLength,
      plotWidth,
      unit: unit || 'ft',
      selectedFloors: selectedFloors || ['ground'],
      floors: floors || [],
      rooms: rooms || [],
      layout: layout || {},
      isFavorite: false
    });

    await project.save();
    return res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('[Create Project Error]', err);
    return res.status(500).json({ error: 'Failed to save project: ' + err.message });
  }
});

// @route   GET /api/projects
// @desc    Get all saved projects for current user
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { isInMemoryFallback, inMemoryProjects } = getInMemoryStore();
    const userIdStr = req.user ? (req.user.id || req.user._id) : 'guest';

    if (isInMemoryFallback) {
      const list = Array.from(inMemoryProjects.values()).filter(p => p.userIdStr === userIdStr || userIdStr === 'guest' || !p.userIdStr);
      return res.json({ success: true, projects: list });
    }

    const query = req.user ? { $or: [{ userId: req.user.id }, { userIdStr }] } : {};
    const projects = await Project.find(query).sort({ updatedAt: -1 });
    return res.json({ success: true, projects });
  } catch (err) {
    console.error('[Get Projects Error]', err);
    return res.status(500).json({ error: 'Failed to fetch projects: ' + err.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { isInMemoryFallback, inMemoryProjects } = getInMemoryStore();
    const id = req.params.id;

    if (isInMemoryFallback) {
      const proj = inMemoryProjects.get(id);
      if (!proj) return res.status(404).json({ error: 'Project not found' });
      return res.json({ success: true, project: proj });
    }

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json({ success: true, project });
  } catch (err) {
    console.error('[Get Project ID Error]', err);
    return res.status(500).json({ error: 'Failed to fetch project: ' + err.message });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update an existing project
router.put('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { isInMemoryFallback, inMemoryProjects } = getInMemoryStore();

    if (isInMemoryFallback) {
      const existing = inMemoryProjects.get(id);
      if (!existing) return res.status(404).json({ error: 'Project not found' });

      const updated = {
        ...existing,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      inMemoryProjects.set(id, updated);
      return res.json({ success: true, project: updated });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json({ success: true, project });
  } catch (err) {
    console.error('[Update Project Error]', err);
    return res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

// @route   PATCH /api/projects/:id/favorite
// @desc    Toggle favorite status of a project
router.patch('/:id/favorite', optionalAuthMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { isInMemoryFallback, inMemoryProjects } = getInMemoryStore();

    if (isInMemoryFallback) {
      const existing = inMemoryProjects.get(id);
      if (!existing) return res.status(404).json({ error: 'Project not found' });

      existing.isFavorite = !existing.isFavorite;
      existing.updatedAt = new Date().toISOString();
      inMemoryProjects.set(id, existing);
      return res.json({ success: true, project: existing });
    }

    const existing = await Project.findById(id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    existing.isFavorite = !existing.isFavorite;
    await existing.save();
    return res.json({ success: true, project: existing });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project by ID
router.delete('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { isInMemoryFallback, inMemoryProjects } = getInMemoryStore();

    if (isInMemoryFallback) {
      const deleted = inMemoryProjects.delete(id);
      if (!deleted) return res.status(404).json({ error: 'Project not found' });
      return res.json({ success: true, message: 'Project deleted successfully' });
    }

    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    console.error('[Delete Project Error]', err);
    return res.status(500).json({ error: 'Failed to delete project: ' + err.message });
  }
});

module.exports = router;
