/**
 * Parametric Architectural BIM Model Engine
 * 
 * Inspired by Autodesk Revit BIM architectural workflows:
 * - Level-based building hierarchy (Level 0 GF, Level 1 FF, Level 2 Roof)
 * - Parametric wall extraction (Clean, non-overlapping exterior & interior walls)
 * - True wall openings (Doors and windows cut into walls with lintels and sills)
 * - Structural floor slabs with stair void cutouts
 * - Parametric staircase with treads, risers, landing, and handrails
 * - Configurable roof systems (Flat with Parapet, Sloped Hip, Sloped Gable)
 * - Bi-directional 2D & 3D synchronized geometric model
 */

export const DEFAULT_BIM_SETTINGS = {
  unit: 'ft', // 'ft' or 'm'
  floorHeight: 10.0, // 10 ft / 3.0 m
  exteriorWallThickness: 0.75, // 9 inches in ft (0.23m)
  interiorWallThickness: 0.375, // 4.5 inches in ft (0.115m)
  slabThickness: 0.5, // 6 inches in ft (0.15m)
  plinthHeight: 1.5, // 1.5 ft (0.45m)
  roofType: 'flat', // 'flat' | 'sloped_hip' | 'sloped_gable'
  roofPitch: 22, // degrees
  parapetHeight: 3.0, // 3 ft / 0.9m
  doorHeight: 7.0, // 7 ft / 2.1m
  windowHeight: 4.5, // 4.5 ft / 1.35m
  windowSillHeight: 2.5, // 2.5 ft / 0.75m
  ventilatorSillHeight: 5.5, // 5.5 ft / 1.65m
  ventilatorHeight: 2.0 // 2 ft / 0.6m
};

const EPS = 0.05;

/**
 * Normalizes a number to 2 decimal places
 */
export const round2 = (val) => Math.round(Number(val) * 100) / 100;

/**
 * Builds a complete Parametric Architectural BIM Model from a 2D floorplan layout
 */
export function buildBimModel(layout, userSettings = {}) {
  const plot = layout?.plot || { width: 30, length: 40, unit: 'ft' };
  const unit = userSettings.unit || plot.unit || 'ft';

  // Unit-aware default scaling
  const isMetric = unit === 'm';
  const defaultExtWall = isMetric ? 0.23 : 0.75;
  const defaultIntWall = isMetric ? 0.115 : 0.375;
  const defaultFloorHeight = isMetric ? 3.0 : 10.0;
  const defaultSlabThick = isMetric ? 0.15 : 0.5;
  const defaultParapet = isMetric ? 0.9 : 3.0;

  const settings = {
    ...DEFAULT_BIM_SETTINGS,
    unit,
    floorHeight: userSettings.floorHeight ?? (plot.floorHeight || defaultFloorHeight),
    exteriorWallThickness: userSettings.exteriorWallThickness ?? (plot.exteriorWallThickness || defaultExtWall),
    interiorWallThickness: userSettings.interiorWallThickness ?? (plot.interiorWallThickness || defaultIntWall),
    slabThickness: userSettings.slabThickness ?? defaultSlabThick,
    plinthHeight: userSettings.plinthHeight ?? (isMetric ? 0.45 : 1.5),
    roofType: userSettings.roofType || plot.roofType || 'flat',
    roofPitch: userSettings.roofPitch || 22,
    parapetHeight: userSettings.parapetHeight ?? defaultParapet,
    doorHeight: isMetric ? 2.1 : 7.0,
    windowHeight: isMetric ? 1.35 : 4.5,
    windowSillHeight: isMetric ? 0.8 : 2.5,
    ...userSettings
  };

  const floors = layout?.floors || [];
  const selectedFloors = layout?.selectedFloors || (floors.length > 0 ? floors.map(f => f.floor) : ['ground']);

  // 1. Build Level Hierarchy (BIM Levels)
  const levels = [];
  let currentElevation = 0;

  if (selectedFloors.includes('ground')) {
    levels.push({
      id: 'level_0',
      name: 'Ground Floor',
      code: 'GF',
      index: 0,
      elevation: round2(currentElevation),
      height: round2(settings.floorHeight),
      floorType: 'ground'
    });
    currentElevation += settings.floorHeight;
  }

  if (selectedFloors.includes('first')) {
    levels.push({
      id: 'level_1',
      name: 'First Floor',
      code: 'FF',
      index: levels.length,
      elevation: round2(currentElevation),
      height: round2(settings.floorHeight),
      floorType: 'first'
    });
    currentElevation += settings.floorHeight;
  }

  // Roof Level Datum
  levels.push({
    id: `level_${levels.length}`,
    name: 'Roof Level',
    code: 'RF',
    index: levels.length,
    elevation: round2(currentElevation),
    height: round2(settings.roofType === 'flat' ? settings.parapetHeight : (plot.width * 0.25)),
    floorType: 'roof'
  });

  // 2. Extract Parametric Geometry for each Level
  const bimLevelsData = levels.map(level => {
    if (level.floorType === 'roof') {
      return {
        level,
        walls: [],
        doors: [],
        windows: [],
        rooms: [],
        floors: [],
        stairs: []
      };
    }

    const floorObj = floors.find(f => f.floor === level.floorType) || { rooms: [] };
    const rawRooms = floorObj.rooms || [];

    // Process and enrich rooms
    const enrichedRooms = rawRooms.map(r => ({
      id: r.id,
      name: r.name || r.type,
      type: r.type,
      levelId: level.id,
      floorType: level.floorType,
      x: round2(r.x),
      y: round2(r.y),
      width: round2(r.width),
      height: round2(r.height),
      area: round2(r.width * r.height),
      carpetArea: round2(r.width * r.height * 0.92),
      doors: r.doors || [],
      windows: r.windows || [],
      color: r.color || '#f8fafc'
    }));

    // Extract non-overlapping walls
    const walls = extractParametricWalls(enrichedRooms, plot.width, plot.length, level, settings);

    // Extract doors and windows linked to host walls
    const { doors, windows } = extractOpenings(enrichedRooms, walls, level, settings);

    // Extract floor slabs (including stair cutout)
    const floorSlabs = extractFloorSlabs(enrichedRooms, plot.width, plot.length, level, settings);

    // Extract staircase
    const stairs = extractStaircases(enrichedRooms, level, settings);

    return {
      level,
      rooms: enrichedRooms,
      walls,
      doors,
      windows,
      floors: floorSlabs,
      stairs
    };
  });

  // 3. Extract Building Roof
  const roof = extractRoof(bimLevelsData, plot.width, plot.length, levels[levels.length - 1], settings);

  // 4. Run Building Rule Validation
  const validation = validateBimModel({
    plot,
    settings,
    levels,
    levelData: bimLevelsData,
    roof
  });

  return {
    id: `bldg_${Date.now()}`,
    name: layout?.projectName || 'Architectural BIM Residential Project',
    plot: {
      width: round2(plot.width),
      length: round2(plot.length),
      unit: settings.unit,
      area: round2(plot.width * plot.length)
    },
    settings,
    levels,
    levelData: bimLevelsData,
    roof,
    validation
  };
}

/**
 * Extracts clean, non-overlapping architectural wall segments from rooms.
 * Resolves shared boundaries so there are NO duplicate or overlapping walls.
 */
function extractParametricWalls(rooms, plotW, plotL, level, settings) {
  if (!rooms || rooms.length === 0) return [];

  const extThick = settings.exteriorWallThickness;
  const intThick = settings.interiorWallThickness;
  const wallHeight = settings.floorHeight;

  // Collect all horizontal and vertical edge candidates
  // Horizontal edges: [y, xStart, xEnd, roomRef, isNorthOrSouth]
  // Vertical edges: [x, yStart, yEnd, roomRef, isWestOrEast]

  const rawH = [];
  const rawV = [];

  rooms.forEach(r => {
    // North edge
    rawH.push({ y: round2(r.y), x0: round2(r.x), x1: round2(r.x + r.width), roomId: r.id, side: 'north' });
    // South edge
    rawH.push({ y: round2(r.y + r.height), x0: round2(r.x), x1: round2(r.x + r.width), roomId: r.id, side: 'south' });
    // West edge
    rawV.push({ x: round2(r.x), y0: round2(r.y), y1: round2(r.y + r.height), roomId: r.id, side: 'west' });
    // East edge
    rawV.push({ x: round2(r.x + r.width), y0: round2(r.y), y1: round2(r.y + r.height), roomId: r.id, side: 'east' });
  });

  const walls = [];
  let wallCounter = 1;

  // Group horizontal segments by Y coordinate
  const hGroups = groupByCoordinate(rawH, 'y');
  Object.keys(hGroups).forEach(yStr => {
    const y = Number(yStr);
    const intervals = mergeIntervals(hGroups[yStr], 'x0', 'x1');

    intervals.forEach(inv => {
      // Check if this segment is exterior or interior
      const isExt = Math.abs(y - 0) < EPS || Math.abs(y - plotL) < EPS;
      const thickness = isExt ? extThick : intThick;

      walls.push({
        id: `wall_${level.code.toLowerCase()}_h_${wallCounter++}`,
        levelId: level.id,
        levelCode: level.code,
        orientation: 'horizontal',
        type: isExt ? 'exterior' : 'interior',
        start: { x: round2(inv.start), y: round2(y) },
        end: { x: round2(inv.end), y: round2(y) },
        length: round2(inv.end - inv.start),
        height: round2(wallHeight),
        thickness: round2(thickness),
        baseElevation: round2(level.elevation),
        topElevation: round2(level.elevation + wallHeight),
        adjacentRoomIds: inv.roomIds,
        openings: [] // Will be populated by extractOpenings
      });
    });
  });

  // Group vertical segments by X coordinate
  const vGroups = groupByCoordinate(rawV, 'x');
  Object.keys(vGroups).forEach(xStr => {
    const x = Number(xStr);
    const intervals = mergeIntervals(vGroups[xStr], 'y0', 'y1');

    intervals.forEach(inv => {
      const isExt = Math.abs(x - 0) < EPS || Math.abs(x - plotW) < EPS;
      const thickness = isExt ? extThick : intThick;

      walls.push({
        id: `wall_${level.code.toLowerCase()}_v_${wallCounter++}`,
        levelId: level.id,
        levelCode: level.code,
        orientation: 'vertical',
        type: isExt ? 'exterior' : 'interior',
        start: { x: round2(x), y: round2(inv.start) },
        end: { x: round2(x), y: round2(inv.end) },
        length: round2(inv.end - inv.start),
        height: round2(wallHeight),
        thickness: round2(thickness),
        baseElevation: round2(level.elevation),
        topElevation: round2(level.elevation + wallHeight),
        adjacentRoomIds: inv.roomIds,
        openings: []
      });
    });
  });

  return walls;
}

/**
 * Helper to group edge items by their alignment coordinate
 */
function groupByCoordinate(items, key) {
  const groups = {};
  items.forEach(item => {
    const coord = round2(item[key]);
    // Find matching group within EPS
    const existingKey = Object.keys(groups).find(k => Math.abs(Number(k) - coord) < EPS);
    if (existingKey) {
      groups[existingKey].push(item);
    } else {
      groups[coord] = [item];
    }
  });
  return groups;
}

/**
 * Merges overlapping and abutting line segments along a single collinear line
 */
function mergeIntervals(items, startKey, endKey) {
  if (!items || items.length === 0) return [];

  // Sort by start point
  const sorted = [...items].sort((a, b) => a[startKey] - b[startKey]);
  const result = [];

  let currentStart = sorted[0][startKey];
  let currentEnd = sorted[0][endKey];
  let currentRooms = [sorted[0].roomId];

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (item[startKey] <= currentEnd + EPS) {
      // Overlapping or abutting
      currentEnd = Math.max(currentEnd, item[endKey]);
      if (!currentRooms.includes(item.roomId)) currentRooms.push(item.roomId);
    } else {
      // Disjoint interval
      result.push({
        start: currentStart,
        end: currentEnd,
        roomIds: currentRooms
      });
      currentStart = item[startKey];
      currentEnd = item[endKey];
      currentRooms = [item.roomId];
    }
  }

  result.push({
    start: currentStart,
    end: currentEnd,
    roomIds: currentRooms
  });

  return result;
}

/**
 * Extracts and maps Doors and Windows to their corresponding host walls.
 */
function extractOpenings(rooms, walls, level, settings) {
  const doors = [];
  const windows = [];
  let dCounter = 1;
  let wCounter = 1;

  rooms.forEach(room => {
    // 1. Process Doors
    (room.doors || []).forEach(d => {
      const width = round2(d.width || (d.isMainEntry ? 3.5 : 3.0));
      const height = round2(settings.doorHeight);
      const isMain = !!d.isMainEntry;
      const tag = isMain ? 'D1 (Main Entry)' : (width <= 2.6 ? 'D3 (Bath/Balcony)' : 'D2 (Internal)');

      // Find host wall
      const hostWall = findHostWallForOpening(d.x, d.y, width, walls);

      const doorObj = {
        id: `door_${level.code.toLowerCase()}_${dCounter++}`,
        tag,
        type: isMain ? 'Main Entrance Door' : 'Internal Flush Door',
        levelId: level.id,
        levelCode: level.code,
        hostWallId: hostWall ? hostWall.id : null,
        roomId: room.id,
        roomName: room.name,
        width,
        height,
        sillHeight: 0,
        x: round2(d.x),
        y: round2(d.y),
        swingDirection: d.swing_direction || 'in_bottom',
        isMainEntry: isMain
      };

      doors.push(doorObj);

      if (hostWall) {
        // Calculate offset along wall
        const alongOffset = hostWall.orientation === 'horizontal'
          ? Math.max(0, d.x - hostWall.start.x)
          : Math.max(0, d.y - hostWall.start.y);

        hostWall.openings.push({
          openingId: doorObj.id,
          type: 'door',
          offset: round2(alongOffset),
          width,
          height,
          sillHeight: 0,
          lintelHeight: height
        });
      }
    });

    // 2. Process Windows
    (room.windows || []).forEach(w => {
      const width = round2(w.width || 3.5);
      const isVentilator = ['Bathroom', 'Washroom'].includes(room.type);
      const height = round2(isVentilator ? settings.ventilatorHeight : settings.windowHeight);
      const sillHeight = round2(isVentilator ? settings.ventilatorSillHeight : settings.windowSillHeight);
      const tag = isVentilator ? 'V1 (Ventilator)' : (width >= 4 ? 'W1 (Large Glazed)' : 'W2 (Standard Casement)');

      const hostWall = findHostWallForOpening(w.x, w.y, width, walls);

      const winObj = {
        id: `win_${level.code.toLowerCase()}_${wCounter++}`,
        tag,
        type: isVentilator ? 'Louvered Ventilator' : 'UPVC Glazed Window',
        levelId: level.id,
        levelCode: level.code,
        hostWallId: hostWall ? hostWall.id : null,
        roomId: room.id,
        roomName: room.name,
        width,
        height,
        sillHeight,
        lintelHeight: round2(sillHeight + height),
        x: round2(w.x),
        y: round2(w.y),
        isVentilator
      };

      windows.push(winObj);

      if (hostWall) {
        const alongOffset = hostWall.orientation === 'horizontal'
          ? Math.max(0, w.x - hostWall.start.x)
          : Math.max(0, w.y - hostWall.start.y);

        hostWall.openings.push({
          openingId: winObj.id,
          type: 'window',
          offset: round2(alongOffset),
          width,
          height,
          sillHeight,
          lintelHeight: round2(sillHeight + height)
        });
      }
    });
  });

  return { doors, windows };
}

/**
 * Finds the closest collinear wall segment hosting an opening
 */
function findHostWallForOpening(ox, oy, oWidth, walls) {
  let bestWall = null;
  let minDistance = 1.0; // max 1 ft search tolerance

  walls.forEach(wall => {
    if (wall.orientation === 'horizontal') {
      const distY = Math.abs(wall.start.y - oy);
      if (distY < minDistance) {
        // Check if opening falls within or very near X range
        const minX = Math.min(wall.start.x, wall.end.x) - 0.5;
        const maxX = Math.max(wall.start.x, wall.end.x) + 0.5;
        if (ox >= minX && ox + oWidth * 0.5 <= maxX) {
          minDistance = distY;
          bestWall = wall;
        }
      }
    } else {
      const distX = Math.abs(wall.start.x - ox);
      if (distX < minDistance) {
        const minY = Math.min(wall.start.y, wall.end.y) - 0.5;
        const maxY = Math.max(wall.start.y, wall.end.y) + 0.5;
        if (oy >= minY && oy + oWidth * 0.5 <= maxY) {
          minDistance = distX;
          bestWall = wall;
        }
      }
    }
  });

  return bestWall;
}

/**
 * Extracts floor slab boundary and stair void cutouts
 */
function extractFloorSlabs(rooms, plotW, plotL, level, settings) {
  if (!rooms || rooms.length === 0) return [];

  // Find staircase room on this floor (if applicable) for void cutout on upper floor
  const stairRoom = rooms.find(r => r.type === 'Staircase');

  // Compute building footprint bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rooms.forEach(r => {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  });

  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = plotW; maxY = plotL;
  }

  const footprintW = round2(maxX - minX);
  const footprintL = round2(maxY - minY);

  const voids = [];
  // For First Floor / upper levels, the staircase needs an open floor void
  if (level.floorType === 'first' && stairRoom) {
    voids.push({
      id: `void_stair_${level.code.toLowerCase()}`,
      x: round2(stairRoom.x),
      y: round2(stairRoom.y),
      width: round2(stairRoom.width),
      length: round2(stairRoom.height),
      description: 'Staircase Architectural Floor Opening'
    });
  }

  return [
    {
      id: `slab_${level.code.toLowerCase()}`,
      levelId: level.id,
      levelCode: level.code,
      x: round2(minX),
      y: round2(minY),
      width: footprintW,
      length: footprintL,
      thickness: round2(settings.slabThickness),
      elevation: round2(level.elevation),
      area: round2(footprintW * footprintL),
      voids
    }
  ];
}

/**
 * Extracts architectural 3D staircase parameters
 */
function extractStaircases(rooms, level, settings) {
  // Only generate the stair flight on Ground Floor connecting to First Floor
  if (level.floorType !== 'ground') return [];

  const stairRooms = rooms.filter(r => r.type === 'Staircase');
  if (stairRooms.length === 0) return [];

  return stairRooms.map((sr, idx) => {
    const totalRise = settings.floorHeight;
    const isMetric = settings.unit === 'm';
    const idealRiser = isMetric ? 0.175 : 0.583;
    const riserCount = Math.max(14, Math.round(totalRise / idealRiser));
    const actualRiser = round2(totalRise / riserCount);
    const stairW = round2(sr.width);
    const stairL = round2(sr.height);
    const isDogLegged = stairW >= 5.5;

    return {
      id: `stair_${level.code.toLowerCase()}_${idx + 1}`,
      levelId: level.id,
      baseElevation: round2(level.elevation),
      topElevation: round2(level.elevation + totalRise),
      x: round2(sr.x),
      y: round2(sr.y),
      width: stairW,
      length: stairL,
      riserCount,
      riserHeight: actualRiser,
      isDogLegged,
      flightWidth: isDogLegged ? round2(Math.min((stairW - 0.4) / 2, 3.5)) : stairW,
      landingDepth: isDogLegged ? round2(Math.min(3.5, stairL * 0.32)) : 0,
      hasHandrail: true,
      handrailHeight: isMetric ? 0.9 : 2.8,
      stairType: isDogLegged ? 'Dog-legged Architectural Stair' : 'Straight Flight Stair'
    };
  });
}

/**
 * Extracts roof parameters and geometry description
 */
function extractRoof(levelData, plotW, plotL, roofLevel, settings) {
  // Find highest occupied level
  const occupiedLevels = levelData.filter(ld => ld.rooms && ld.rooms.length > 0);
  const topOccupied = occupiedLevels[occupiedLevels.length - 1];

  let minX = 0, minY = 0, maxX = plotW, maxY = plotL;
  if (topOccupied && topOccupied.rooms.length > 0) {
    minX = Math.min(...topOccupied.rooms.map(r => r.x));
    minY = Math.min(...topOccupied.rooms.map(r => r.y));
    maxX = Math.max(...topOccupied.rooms.map(r => r.x + r.width));
    maxY = Math.max(...topOccupied.rooms.map(r => r.y + r.height));
  }

  const width = round2(maxX - minX);
  const length = round2(maxY - minY);
  const elevation = round2(roofLevel.elevation);
  const isMetric = settings.unit === 'm';
  const overhang = isMetric ? 0.3 : 1.0;

  return {
    id: 'roof_structure_01',
    type: settings.roofType || 'flat', // 'flat' | 'sloped_hip' | 'sloped_gable'
    levelId: roofLevel.id,
    elevation,
    x: round2(minX),
    y: round2(minY),
    width,
    length,
    overhang,
    pitchAngle: settings.roofPitch || 22,
    parapetHeight: settings.roofType === 'flat' ? settings.parapetHeight : 0,
    area: round2((width + overhang * 2) * (length + overhang * 2)),
    hasMumty: true // Staircase headroom structure
  };
}

/**
 * Validates the generated BIM Model against standard architectural constraints
 */
function validateBimModel({ plot, settings, levels, levelData, roof }) {
  const warnings = [];
  const suggestions = [];

  const isMetric = settings.unit === 'm';
  const minBedArea = isMetric ? 9.0 : 90; // 90 sq.ft
  const minBathArea = isMetric ? 1.8 : 18; // 18 sq.ft
  const minClearance = isMetric ? 2.6 : 8.5; // 8.5 ft

  // 1. Floor Height Check
  if (settings.floorHeight < minClearance) {
    warnings.push(`Floor-to-floor height (${settings.floorHeight} ${settings.unit}) is below standard clearance (${minClearance} ${settings.unit}).`);
    suggestions.push(`Increase floor height to at least ${isMetric ? '2.8m' : '9.5ft'} for optimal architectural comfort and ventilation.`);
  }

  // 2. Room Dimensions Check
  levelData.forEach(ld => {
    ld.rooms.forEach(r => {
      if (['Bedroom', 'Master Bedroom'].includes(r.type) && r.area < minBedArea) {
        warnings.push(`${r.name} area (${r.area} sq.${settings.unit}) is below standard residential minimum (${minBedArea} sq.${settings.unit}).`);
        suggestions.push(`Adjust ${r.name} dimensions to at least ${isMetric ? '3.0m × 3.0m' : '10ft × 10ft'}.`);
      }
      if (['Bathroom', 'Washroom'].includes(r.type) && r.area < minBathArea) {
        warnings.push(`${r.name} area (${r.area} sq.${settings.unit}) is tight.`);
      }

      // Check door access
      const hasDoorAccess = (r.doors && r.doors.length > 0) || 
        ld.doors.some(d => d.roomId === r.id || (d.connects && d.connects.includes(r.id)));
      if (!hasDoorAccess && r.type !== 'Balcony') {
        warnings.push(`${r.name} on ${ld.level.name} lacks an entrance door connection.`);
        suggestions.push(`Add an internal door connecting ${r.name} to circulation.`);
      }
    });
  });

  // 3. Staircase Connectivity Check
  const hasMultipleLevels = levelData.filter(ld => ld.rooms.length > 0).length > 1;
  const hasStairs = levelData.some(ld => ld.stairs.length > 0);
  if (hasMultipleLevels && !hasStairs) {
    warnings.push('Multi-storey layout detected without an architectural staircase connecting levels.');
    suggestions.push('Include a staircase in room requirements for multi-storey circulation.');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}
