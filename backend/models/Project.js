const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  floor: { type: String, enum: ['ground', 'first'], default: 'ground' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  area: { type: Number, required: true },
  rotation: { type: Number, default: 0 },
  color: { type: String },
  doors: [{
    wall: String,
    x: Number,
    y: Number,
    width: Number
  }],
  windows: [{
    wall: String,
    x: Number,
    y: Number,
    width: Number
  }]
}, { _id: false });

const FloorLayoutSchema = new mongoose.Schema({
  floor: { type: String, enum: ['ground', 'first'], required: true },
  rooms: [RoomSchema],
  builtUpArea: Number,
  efficiencyRatio: Number
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userIdStr: { type: String }, // For string matching & in-memory store
  isFavorite: { type: Boolean, default: false },
  projectName: {
    type: String,
    required: true,
    default: 'My Dream House Layout'
  },
  plotLength: { type: Number, required: true },
  plotWidth: { type: Number, required: true },
  unit: { type: String, enum: ['ft', 'm'], default: 'ft' },
  frontDirection: { type: String, default: 'North' },
  roadSide: { type: String, default: 'Front' },
  selectedFloors: [{ type: String, enum: ['ground', 'first'] }],
  floors: [FloorLayoutSchema],
  insights: [String],
  totalPlotArea: Number,
  totalBuiltUpArea: Number,
  layout: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
