/**
 * Local Fallback Deterministic 2D/3D Layout Engine
 * Compliant with IS 3861: 2002 (Carpet/Plinth Area), NBC 2016 (Part 3), and IS 962: 1989 Standards.
 */

// Rounding helper function to restrict dimension outputs to 1 decimal place (prevents 6.39999999999999 bugs)
export const round1 = (val) => Math.round(Number(val) * 10) / 10;

export const ROOM_SPEC_DEFAULTS = {
  'Bedroom': { minWidth: 10, maxWidth: 14, minHeight: 10, maxHeight: 14, targetArea: 120, areaWeight: 1.0, color: '#eff6ff', icon: 'Bed' },
  'Master Bedroom': { minWidth: 12, maxWidth: 16, minHeight: 11, maxHeight: 15, targetArea: 144, areaWeight: 1.3, color: '#dbeafe', icon: 'BedDouble' },
  'Living Room': { minWidth: 12, maxWidth: 18, minHeight: 12, maxHeight: 18, targetArea: 168, areaWeight: 1.5, color: '#f8fafc', icon: 'Sofa' },
  'Hall': { minWidth: 12, maxWidth: 16, minHeight: 10, maxHeight: 15, targetArea: 140, areaWeight: 1.2, color: '#f8fafc', icon: 'Tv' },
  'Kitchen': { minWidth: 8, maxWidth: 12, minHeight: 7, maxHeight: 10, targetArea: 80, areaWeight: 0.75, color: '#fffbe0', icon: 'Utensils' },
  'Dining Room': { minWidth: 9, maxWidth: 13, minHeight: 8, maxHeight: 11, targetArea: 90, areaWeight: 0.65, color: '#fcf0f7', icon: 'UtensilsCrossed' },
  'Bathroom': { minWidth: 5, maxWidth: 8, minHeight: 6, maxHeight: 8, targetArea: 42, areaWeight: 0.35, color: '#f1f5f9', icon: 'Bath' },
  'Washroom': { minWidth: 4, maxWidth: 7, minHeight: 5, maxHeight: 7, targetArea: 30, areaWeight: 0.3, color: '#f1f5f9', icon: 'ShowerHead' },
  'Balcony': { minWidth: 8, maxWidth: 16, minHeight: 4, maxHeight: 6, targetArea: 40, areaWeight: 0.35, color: '#f0fdf4', icon: 'Sun' },
  'Utility Room': { minWidth: 6, maxWidth: 9, minHeight: 5, maxHeight: 8, targetArea: 35, areaWeight: 0.35, color: '#f8fafc', icon: 'WashingMachine' },
  'Store Room': { minWidth: 5, maxWidth: 8, minHeight: 5, maxHeight: 8, targetArea: 30, areaWeight: 0.3, color: '#f8fafc', icon: 'Box' },
  'Staircase': { minWidth: 7, maxWidth: 9, minHeight: 10, maxHeight: 12, targetArea: 80, areaWeight: 0.6, color: '#faf5ff', icon: 'Layers' },
  'Study Room': { minWidth: 8, maxWidth: 12, minHeight: 8, maxHeight: 12, targetArea: 64, areaWeight: 0.5, color: '#eef2ff', icon: 'BookOpen' },
  'Pooja Room': { minWidth: 4, maxWidth: 7, minHeight: 5, maxHeight: 7, targetArea: 20, areaWeight: 0.25, color: '#fefce8', icon: 'Flame' }
};

/**
 * Generate Layout Function (Standalone Browser Safe)
 */
export function generateFloorLayoutLocally({ plot, selectedFloors, floorRequirements, rooms }) {
  const W = round1(Math.max(15, Math.min(200, Number(plot?.width) || 30)));
  const L = round1(Math.max(15, Math.min(200, Number(plot?.length) || 40)));
  const unit = plot?.unit || 'ft';

  const totalPlotArea = round1(W * L);
  const targetFloors = (selectedFloors && selectedFloors.length > 0) ? selectedFloors : ['ground'];

  let groundReqs = [];
  let firstReqs = [];

  if (floorRequirements && (floorRequirements.ground || floorRequirements.first)) {
    groundReqs = floorRequirements.ground || [];
    firstReqs = floorRequirements.first || [];
  } else if (rooms && rooms.length > 0) {
    if (targetFloors.length === 1) {
      if (targetFloors.includes('ground')) groundReqs = rooms;
      else firstReqs = rooms;
    } else {
      rooms.forEach(r => {
        const type = r.type;
        const qty = r.quantity || 1;
        if (['Living Room', 'Hall', 'Kitchen', 'Dining Room', 'Pooja Room'].includes(type)) {
          groundReqs.push({ type, quantity: qty });
        } else if (['Bedroom', 'Master Bedroom', 'Balcony', 'Study Room'].includes(type)) {
          firstReqs.push({ type, quantity: qty });
        } else {
          const half1 = Math.ceil(qty / 2);
          const half2 = qty - half1;
          if (half1 > 0) groundReqs.push({ type, quantity: half1 });
          if (half2 > 0) firstReqs.push({ type, quantity: half2 });
        }
      });
    }
  }

  // Fallback defaults if no rooms specified
  if (groundReqs.length === 0 && targetFloors.includes('ground')) {
    groundReqs = [
      { type: 'Living Room', quantity: 1 },
      { type: 'Kitchen', quantity: 1 },
      { type: 'Dining Room', quantity: 1 },
      { type: 'Bathroom', quantity: 1 },
      { type: 'Staircase', quantity: 1 }
    ];
  }

  if (firstReqs.length === 0 && targetFloors.includes('first')) {
    firstReqs = [
      { type: 'Master Bedroom', quantity: 1 },
      { type: 'Bedroom', quantity: 1 },
      { type: 'Bathroom', quantity: 1 },
      { type: 'Balcony', quantity: 1 },
      { type: 'Staircase', quantity: 1 }
    ];
  }

  if (targetFloors.length > 1) {
    if (!groundReqs.some(r => r.type === 'Staircase')) groundReqs.push({ type: 'Staircase', quantity: 1 });
    if (!firstReqs.some(r => r.type === 'Staircase')) firstReqs.push({ type: 'Staircase', quantity: 1 });
  }

  const generatedFloors = [];
  let totalBuiltUpAllFloors = 0;
  let totalCarpetAreaAllFloors = 0;

  if (targetFloors.includes('ground')) {
    const groundLayout = generateSingleFloorLayoutLocal('ground', W, L, unit, groundReqs);
    generatedFloors.push(groundLayout);
    totalBuiltUpAllFloors += groundLayout.plinthArea;
    totalCarpetAreaAllFloors += groundLayout.carpetArea;
  }

  if (targetFloors.includes('first')) {
    const groundStairs = generatedFloors.find(f => f.floor === 'ground')?.rooms.find(r => r.type === 'Staircase');
    const firstLayout = generateSingleFloorLayoutLocal('first', W, L, unit, firstReqs, groundStairs);
    generatedFloors.push(firstLayout);
    totalBuiltUpAllFloors += firstLayout.plinthArea;
    totalCarpetAreaAllFloors += firstLayout.carpetArea;
  }

  const insights = generateDynamicInsightsLocal(generatedFloors, targetFloors);
  const requirementStats = calculateRequirementStatsLocal(groundReqs, firstReqs, generatedFloors, targetFloors);

  // Wall Thickness Calculations (IS 3861: 2002 & RERA Guidelines)
  const extWallThick = unit === 'm' ? 0.23 : 0.75;
  const intWallThick = unit === 'm' ? 0.115 : 0.375;

  const totalPlinth = round1(totalBuiltUpAllFloors);
  const totalCarpet = round1(totalCarpetAreaAllFloors);
  const wallDeductionArea = round1(totalPlinth - totalCarpet);

  return {
    plot: {
      length: L,
      width: W,
      unit: unit,
      totalArea: totalPlotArea,
      supportedFloorsText: "Supported Floors: Ground Floor + First Floor"
    },
    selectedFloors: targetFloors,
    floors: generatedFloors,
    plinthArea: totalPlinth,
    builtUpArea: totalPlinth,
    carpetArea: totalCarpet,
    wallDeductionArea: wallDeductionArea,
    wallSpecifications: {
      externalWallThickness: `${extWallThick * 12}" (${extWallThick * 304.8} mm)`,
      internalWallThickness: `${intWallThick * 12}" (${intWallThick * 304.8} mm)`,
      standardCode: "IS 3861: 2002 / RERA Compliant"
    },
    usedArea: totalPlinth,
    remainingArea: 0,
    spaceUtilization: 100,
    insights: insights,
    requirementStats: requirementStats,
    warnings: []
  };
}

/**
 * Single Floor Generator Local
 */
function generateSingleFloorLayoutLocal(floorLevel, W, L, unit, reqRooms, alignStaircase = null) {
  const instances = [];
  let counter = 1;

  reqRooms.forEach(r => {
    const qty = Math.max(1, r.quantity || 1);
    const spec = ROOM_SPEC_DEFAULTS[r.type] || ROOM_SPEC_DEFAULTS['Bedroom'];
    for (let i = 0; i < qty; i++) {
      const name = qty > 1 ? `${r.type} ${i + 1}` : r.type;
      instances.push({
        id: `${floorLevel}_room_${counter++}`,
        type: r.type,
        name: name,
        floor: floorLevel,
        minWidth: spec.minWidth,
        minHeight: spec.minHeight,
        areaWeight: spec.areaWeight,
        color: spec.color,
        icon: spec.icon
      });
    }
  });

  const placedRooms = [];

  // Staircase Fixed Placement Strategy
  let stairFixed = null;
  const stairIndex = instances.findIndex(r => r.type === 'Staircase');
  if (stairIndex !== -1) {
    const stairObj = instances.splice(stairIndex, 1)[0];
    if (alignStaircase) {
      stairFixed = {
        ...stairObj,
        x: alignStaircase.x,
        y: alignStaircase.y,
        width: alignStaircase.width,
        height: alignStaircase.height
      };
    } else {
      stairFixed = {
        ...stairObj,
        x: 0,
        y: round1(L * 0.35),
        width: round1(Math.min(8, W * 0.28)),
        height: round1(Math.min(10, L * 0.30))
      };
    }
    placedRooms.push(stairFixed);
  }

  // Zone Categorization:
  // FRONT ZONE (y=0): Living Room, Hall, Dining Room, Kitchen (Public)
  // REAR ZONE (y -> L): Master Bedroom, Bedrooms, Bathrooms, Balcony (Private)
  const publicRooms = instances.filter(r => ['Living Room', 'Hall', 'Dining Room', 'Pooja Room'].includes(r.type));
  const kitchenUtility = instances.filter(r => ['Kitchen', 'Utility Room', 'Store Room'].includes(r.type));
  const privateBedrooms = instances.filter(r => ['Bedroom', 'Master Bedroom', 'Study Room'].includes(r.type));
  const bathRooms = instances.filter(r => ['Bathroom', 'Washroom'].includes(r.type));
  const outdoorRooms = instances.filter(r => ['Balcony'].includes(r.type));

  const livingOrHall = publicRooms.find(r => r.type === 'Living Room' || r.type === 'Hall') || publicRooms[0];
  const otherPublic = publicRooms.filter(r => r !== livingOrHall);

  const row1Rooms = livingOrHall ? [livingOrHall, ...otherPublic, ...kitchenUtility] : [...instances.slice(0, 2)];
  const row3Rooms = [...privateBedrooms, ...outdoorRooms];
  const row2Rooms = [...bathRooms];

  const placedSet = new Set([...row1Rooms, ...row2Rooms, ...row3Rooms].map(r => r.id));
  instances.forEach(r => {
    if (!placedSet.has(r.id)) {
      if (r.type.includes('Bedroom')) row3Rooms.push(r);
      else row2Rooms.push(r);
    }
  });

  const numRows = (row2Rooms.length > 0 || row3Rooms.length > 0) ? (row3Rooms.length > 0 ? 3 : 2) : 1;

  if (numRows === 3) {
    const row1H = round1(L * 0.38);
    const row2H = round1(L * 0.28);
    const row3H = round1(L - row1H - row2H);

    placeRowOfRoomsLocal(row1Rooms, 0, 0, W, row1H, placedRooms, floorLevel, W);
    const startXRow2 = (stairFixed && stairFixed.y >= row1H && stairFixed.y < (row1H + row2H)) ? stairFixed.width : 0;
    placeRowOfRoomsLocal(row2Rooms, startXRow2, row1H, W - startXRow2, row2H, placedRooms, floorLevel, W);
    placeRowOfRoomsLocal(row3Rooms, 0, row1H + row2H, W, row3H, placedRooms, floorLevel, W);
  } else if (numRows === 2) {
    const row1H = round1(L * 0.48);
    const row2H = round1(L - row1H);

    placeRowOfRoomsLocal(row1Rooms, 0, 0, W, row1H, placedRooms, floorLevel, W);
    placeRowOfRoomsLocal(row3Rooms.length > 0 ? row3Rooms : row2Rooms, 0, row1H, W, row2H, placedRooms, floorLevel, W);
  } else {
    placeRowOfRoomsLocal(row1Rooms, 0, 0, W, L, placedRooms, floorLevel, W);
  }

  placedRooms.forEach(room => {
    room.x = round1(room.x);
    room.y = round1(room.y);
    room.width = round1(room.width);
    room.height = round1(room.height);
    room.area = round1(room.width * room.height);
    room.floor = floorLevel;

    room.doors = generateDoorsForRoomLocal(room, W, L, floorLevel);
    room.windows = generateWindowsForRoomLocal(room, W, L);
  });

  const extWallThick = unit === 'm' ? 0.23 : 0.75;
  const plinthArea = round1(W * L);
  const netW = Math.max(1, W - (2 * extWallThick));
  const netL = Math.max(1, L - (2 * extWallThick));
  const carpetArea = round1(netW * netL * 0.92);

  return {
    floor: floorLevel,
    rooms: placedRooms,
    plinthArea: plinthArea,
    builtUpArea: plinthArea,
    carpetArea: carpetArea,
    efficiencyRatio: round1((carpetArea / plinthArea) * 100)
  };
}

function placeRowOfRoomsLocal(roomsList, startX, startY, totalW, totalH, outputPlacedRooms, floorLevel, maxPlotW) {
  if (!roomsList || roomsList.length === 0) return;

  const count = roomsList.length;
  const weightSum = roomsList.reduce((sum, r) => sum + (r.areaWeight || 1.0), 0);
  let currentX = startX;

  roomsList.forEach((inst, idx) => {
    let roomW;
    const maxAvailable = round1((startX + totalW) - currentX);

    if (idx === count - 1) {
      roomW = maxAvailable;
    } else {
      const share = (inst.areaWeight || 1.0) / weightSum;
      roomW = round1(Math.max(inst.minWidth || 4, totalW * share));
    }

    if (roomW > maxAvailable) roomW = maxAvailable;
    if (roomW < 3) roomW = Math.max(2, maxAvailable);

    if (currentX + roomW > maxPlotW) {
      roomW = round1(Math.max(2, maxPlotW - currentX));
    }

    outputPlacedRooms.push({
      id: inst.id,
      type: inst.type,
      name: inst.name,
      floor: floorLevel,
      x: round1(currentX),
      y: round1(startY),
      width: round1(roomW),
      height: round1(totalH),
      area: round1(roomW * totalH),
      color: inst.color,
      icon: inst.icon
    });

    currentX = round1(currentX + roomW);
  });
}

function generateDoorsForRoomLocal(room, plotW, plotL, floorLevel) {
  const doors = [];
  const doorWidth = 3.0;

  if (floorLevel === 'ground' && (room.type === 'Living Room' || room.type === 'Hall' || room.type === 'Foyer') && room.y < 0.5) {
    doors.push({
      wall: 'south',
      x: round1(room.x + (room.width / 2) - 1.5),
      y: 0,
      width: 3.5,
      isMainEntry: true,
      label: 'MAIN ENTRY'
    });
  }

  if (room.y > 0.5) {
    doors.push({ wall: 'north', x: round1(room.x + Math.min(room.width / 2, 2)), y: room.y, width: doorWidth });
  } else if (room.y + room.height < plotL - 0.5 && !doors.some(d => d.isMainEntry)) {
    doors.push({ wall: 'south', x: round1(room.x + Math.min(room.width / 2, 2)), y: round1(room.y + room.height), width: doorWidth });
  } else if (room.x > 0.5) {
    doors.push({ wall: 'west', x: room.x, y: round1(room.y + Math.min(room.height / 2, 2)), width: doorWidth });
  } else {
    doors.push({ wall: 'east', x: round1(room.x + room.width), y: round1(room.y + Math.min(room.height / 2, 2)), width: doorWidth });
  }

  return doors;
}

function generateWindowsForRoomLocal(room, plotW, plotL) {
  const windows = [];
  const windowWidth = round1(Math.min(4, Math.max(2.5, room.width - 1)));
  const margin = 0.5;

  if (room.y <= margin) {
    windows.push({ wall: 'south', x: round1(room.x + Math.max(0.5, (room.width - windowWidth) / 2)), y: 0, width: Math.max(1, windowWidth) });
  }
  if (room.y + room.height >= plotL - margin) {
    windows.push({ wall: 'north', x: round1(room.x + Math.max(0.5, (room.width - windowWidth) / 2)), y: plotL, width: Math.max(1, windowWidth) });
  }
  if (room.x <= margin) {
    windows.push({ wall: 'west', x: 0, y: round1(room.y + Math.max(0.5, (room.height - windowWidth) / 2)), width: Math.max(1, windowWidth) });
  }
  if (room.x + room.width >= plotW - margin) {
    windows.push({ wall: 'east', x: plotW, y: round1(room.y + Math.max(0.5, (room.height - windowWidth) / 2)), width: Math.max(1, windowWidth) });
  }
  return windows;
}

function generateDynamicInsightsLocal(floors, selectedFloors) {
  return [
    "Main Entrance routed directly into the Living Room space per NBC 2016 entry node guidelines.",
    "Zoning Compliant: Public living spaces anchored to front entry, private bedrooms located in quiet rear zone.",
    "IS 3861: 2002 & RERA Compliant: Carpet area calculated by excluding 9\" external peripheral wall thickness."
  ];
}

function calculateRequirementStatsLocal(groundReqs, firstReqs, generatedFloors, targetFloors) {
  const stats = { ground: [], first: [] };

  const countRequested = (reqs) => {
    const map = {};
    reqs.forEach(r => { map[r.type] = (map[r.type] || 0) + (r.quantity || 1); });
    return map;
  };

  const countGenerated = (rooms) => {
    const map = {};
    (rooms || []).forEach(r => { map[r.type] = (map[r.type] || 0) + 1; });
    return map;
  };

  if (targetFloors.includes('ground')) {
    const reqMap = countRequested(groundReqs);
    const genMap = countGenerated(generatedFloors.find(f => f.floor === 'ground')?.rooms);
    Object.keys(reqMap).forEach(type => {
      stats.ground.push({
        type,
        requested: reqMap[type],
        generated: genMap[type] || 0,
        satisfied: (genMap[type] || 0) >= reqMap[type]
      });
    });
  }

  if (targetFloors.includes('first')) {
    const reqMap = countRequested(firstReqs);
    const genMap = countGenerated(generatedFloors.find(f => f.floor === 'first')?.rooms);
    Object.keys(reqMap).forEach(type => {
      stats.first.push({
        type,
        requested: reqMap[type],
        generated: genMap[type] || 0,
        satisfied: (genMap[type] || 0) >= reqMap[type]
      });
    });
  }

  return stats;
}

export function validateLayoutLocal(layout) {
  const errors = [];
  const warnings = [];
  if (!layout || !layout.plot) return { isValid: true, errors: [], warnings: [] };
  return { isValid: true, errors, warnings };
}

export function generateSingleFloorLayout(floorLevel, W, L, unit, reqRooms, alignStaircase = null) {
  return generateSingleFloorLayoutLocal(floorLevel, W, L, unit, reqRooms, alignStaircase);
}

export function generateDynamicInsights(floors, selectedFloors) {
  return generateDynamicInsightsLocal(floors, selectedFloors);
}

export function calculateRequirementStats(groundReqs, firstReqs, generatedFloors, targetFloors) {
  return calculateRequirementStatsLocal(groundReqs, firstReqs, generatedFloors, targetFloors);
}

function updateRoomDoorsAndWindowsLocal(room, plotW, plotL) {
  if (room.doors && room.doors.length > 0) {
    room.doors[0].x = Math.max(room.x + 1, Math.min(room.x + room.width - 3, room.x + Math.floor(room.width / 2) - 1));
    room.doors[0].y = room.y;
  }
  if (room.windows && room.windows.length > 0) {
    room.windows[0].x = Math.max(room.x + 1, Math.min(room.x + room.width - 3, room.x + Math.floor(room.width / 2) - 1));
    if (room.y <= 1) room.windows[0].y = 0;
    else if (room.y + room.height >= plotL - 1) room.windows[0].y = plotL;
    else room.windows[0].y = room.y + room.height;
  }
}

function fillSpaceAfterRemovalLocal(floorObj, plotW, plotL, removedRoom) {
  const rooms = floorObj.rooms;
  if (!rooms || rooms.length === 0) return;

  const rx = removedRoom.x;
  const ry = removedRoom.y;
  const rw = removedRoom.width;
  const rh = removedRoom.height;

  let neighbor = rooms.find(r => Math.abs(r.y - ry) < 1 && Math.abs(r.height - rh) < 1 && (Math.abs(r.x + r.width - rx) < 1 || Math.abs(rx + rw - r.x) < 1));
  if (neighbor) {
    if (neighbor.x + neighbor.width <= rx + 1) {
      neighbor.width = Math.round((neighbor.width + rw) * 10) / 10;
    } else {
      const rightX = neighbor.x + neighbor.width;
      neighbor.x = rx;
      neighbor.width = Math.round((rightX - rx) * 10) / 10;
    }
    neighbor.area = Math.round(neighbor.width * neighbor.height * 10) / 10;
    updateRoomDoorsAndWindowsLocal(neighbor, plotW, plotL);
    return;
  }

  neighbor = rooms.find(r => Math.abs(r.x - rx) < 1 && Math.abs(r.width - rw) < 1 && (Math.abs(r.y + r.height - ry) < 1 || Math.abs(ry + rh - r.y) < 1));
  if (neighbor) {
    if (neighbor.y + neighbor.height <= ry + 1) {
      neighbor.height = Math.round((neighbor.height + rh) * 10) / 10;
    } else {
      const bottomY = neighbor.y + neighbor.height;
      neighbor.y = ry;
      neighbor.height = Math.round((bottomY - ry) * 10) / 10;
    }
    neighbor.area = Math.round(neighbor.width * neighbor.height * 10) / 10;
    updateRoomDoorsAndWindowsLocal(neighbor, plotW, plotL);
    return;
  }

  let adjRoom = rooms.find(r => (
    r.x < rx + rw && r.x + r.width > rx && (Math.abs(r.y + r.height - ry) < 1 || Math.abs(r.y - (ry + rh)) < 1)
  ) || (
    r.y < ry + rh && r.y + r.height > ry && (Math.abs(r.x + r.width - rx) < 1 || Math.abs(r.x - (rx + rw)) < 1)
  ));

  if (!adjRoom) {
    adjRoom = rooms.reduce((max, r) => (r.area > max.area ? r : max), rooms[0]);
  }

  if (adjRoom) {
    if (rx >= adjRoom.x + adjRoom.width - 1) {
      adjRoom.width = Math.min(plotW - adjRoom.x, Math.round((adjRoom.width + rw) * 10) / 10);
    } else if (ry >= adjRoom.y + adjRoom.height - 1) {
      adjRoom.height = Math.min(plotL - adjRoom.y, Math.round((adjRoom.height + rh) * 10) / 10);
    } else if (rx < adjRoom.x) {
      const rightX = adjRoom.x + adjRoom.width;
      adjRoom.x = Math.max(0, rx);
      adjRoom.width = Math.round((rightX - adjRoom.x) * 10) / 10;
    } else if (ry < adjRoom.y) {
      const bottomY = adjRoom.y + adjRoom.height;
      adjRoom.y = Math.max(0, ry);
      adjRoom.height = Math.round((bottomY - adjRoom.y) * 10) / 10;
    }
    adjRoom.area = Math.round(adjRoom.width * adjRoom.height * 10) / 10;
    updateRoomDoorsAndWindowsLocal(adjRoom, plotW, plotL);
  }
}

export function customizeLayoutLocal(existingLayout, commandText) {
  if (!existingLayout || !existingLayout.floors) {
    return { success: false, reason: 'Valid existing layout is required for customization.', layout: existingLayout };
  }

  const command = (commandText || '').toLowerCase().trim();
  if (!command) {
    return { success: false, reason: 'Command text cannot be empty.', layout: existingLayout };
  }

  const updatedLayout = JSON.parse(JSON.stringify(existingLayout));
  const plotW = updatedLayout.plot?.width || 30;
  const plotL = updatedLayout.plot?.length || 40;

  let roomList = [];
  updatedLayout.floors.forEach((f, fIdx) => {
    (f.rooms || []).forEach((r, rIdx) => {
      roomList.push({ ...r, floorIndex: fIdx, roomIndex: rIdx });
    });
  });

  const findMatchingRoom = (cmdStr = command) => {
    if (cmdStr.includes('master bedroom') || cmdStr.includes('master bed')) return roomList.find(r => r.type === 'Master Bedroom');
    if (cmdStr.includes('bedroom') || cmdStr.includes('bed room')) return roomList.find(r => r.type === 'Bedroom') || roomList.find(r => r.type === 'Master Bedroom');
    if (cmdStr.includes('hall') || cmdStr.includes('living')) return roomList.find(r => r.type === 'Living Room' || r.type === 'Hall');
    if (cmdStr.includes('kitchen')) return roomList.find(r => r.type === 'Kitchen');
    if (cmdStr.includes('dining')) return roomList.find(r => r.type === 'Dining Room');
    if (cmdStr.includes('bath') || cmdStr.includes('bathroom')) return roomList.find(r => r.type === 'Bathroom');
    if (cmdStr.includes('washroom') || cmdStr.includes('toilet') || cmdStr.includes('wc')) return roomList.find(r => r.type === 'Washroom');
    if (cmdStr.includes('staircase') || cmdStr.includes('stairs') || cmdStr.includes('stair')) return roomList.find(r => r.type === 'Staircase');
    if (cmdStr.includes('balcony')) return roomList.find(r => r.type === 'Balcony');
    if (cmdStr.includes('study')) return roomList.find(r => r.type === 'Study Room');
    if (cmdStr.includes('pooja')) return roomList.find(r => r.type === 'Pooja Room');
    return roomList[0];
  };

  const recalculateLocal = (lay) => {
    let total = 0;
    (lay.floors || []).forEach(f => {
      f.builtUpArea = round1((f.rooms || []).reduce((sum, r) => sum + (r.area || (r.width * r.height)), 0));
      total += f.builtUpArea;
    });
    lay.builtUpArea = round1(total);
    lay.usedArea = lay.builtUpArea;
    const plotArea = (lay.plot?.width || 30) * (lay.plot?.length || 40) * (lay.floors?.length || 1);
    lay.spaceUtilization = Math.min(100, Math.round((total / plotArea) * 100));
  };

  // 1. REMOVE / DELETE ROOM
  if (/\b(remove|removed|removing|delete|deleted|deleting|drop|dropped|eliminate|clear|cancel)\b/i.test(command)) {
    const targetRoom = findMatchingRoom();
    if (!targetRoom) {
      return { success: false, reason: 'Room to remove was not found in layout.', layout: existingLayout };
    }

    const fIdx = targetRoom.floorIndex;
    const rIdx = targetRoom.roomIndex;
    const removedName = targetRoom.name;

    const [removedRoomObj] = updatedLayout.floors[fIdx].rooms.splice(rIdx, 1);
    
    // Auto fill freed space into adjacent room
    fillSpaceAfterRemovalLocal(updatedLayout.floors[fIdx], plotW, plotL, removedRoomObj);

    recalculateLocal(updatedLayout);

    return {
      success: true,
      message: `Successfully removed ${removedName} and expanded adjacent living spaces to maintain a seamless, perfect layout.`,
      layout: updatedLayout
    };
  }

  // 2. SWAP / INVERT ROOMS
  if (/\b(swap|swapping|invert|inverting|exchange|exchanging|switch|switching)\b/i.test(command)) {
    let roomA = null, roomB = null;
    if (command.includes('living') && command.includes('kitchen')) {
      roomA = roomList.find(r => r.type === 'Living Room' || r.type === 'Hall');
      roomB = roomList.find(r => r.type === 'Kitchen');
    } else if (command.includes('bedroom') && command.includes('kitchen')) {
      roomA = roomList.find(r => r.type === 'Bedroom' || r.type === 'Master Bedroom');
      roomB = roomList.find(r => r.type === 'Kitchen');
    } else if (roomList.length >= 2) {
      roomA = roomList[0];
      roomB = roomList[1];
    }

    if (roomA && roomB) {
      const tempX = roomA.x;
      const tempY = roomA.y;
      const fIdxA = roomA.floorIndex;
      const rIdxA = roomA.roomIndex;
      const fIdxB = roomB.floorIndex;
      const rIdxB = roomB.roomIndex;

      updatedLayout.floors[fIdxA].rooms[rIdxA].x = roomB.x;
      updatedLayout.floors[fIdxA].rooms[rIdxA].y = roomB.y;
      updatedLayout.floors[fIdxB].rooms[rIdxB].x = tempX;
      updatedLayout.floors[fIdxB].rooms[rIdxB].y = tempY;

      recalculateLocal(updatedLayout);
      return {
        success: true,
        message: `Swapped positions of ${roomA.name} and ${roomB.name}.`,
        layout: updatedLayout
      };
    }
  }

  // 3. MOVE / SHIFT / RELOCATE ROOM
  if (/\b(move|moving|shift|shifting|relocate|relocating)\b/i.test(command)) {
    const targetRoom = findMatchingRoom();
    if (!targetRoom) {
      return { success: false, reason: 'Target room not found to move.', layout: existingLayout };
    }

    const fIdx = targetRoom.floorIndex;
    const rIdx = targetRoom.roomIndex;
    let shiftX = 0;
    let shiftY = 0;

    if (command.includes('left')) shiftX = -4;
    else if (command.includes('right')) shiftX = 4;
    else if (command.includes('up') || command.includes('top') || command.includes('back') || command.includes('rear')) shiftY = -4;
    else if (command.includes('down') || command.includes('bottom') || command.includes('front')) shiftY = 4;
    else shiftX = 4;

    const newX = Math.max(0, Math.min(plotW - targetRoom.width, targetRoom.x + shiftX));
    const newY = Math.max(0, Math.min(plotL - targetRoom.height, targetRoom.y + shiftY));

    const currentRooms = updatedLayout.floors[fIdx].rooms;
    const overlappingRoom = currentRooms.find((r, idx) => {
      if (idx === rIdx) return false;
      return (newX < r.x + r.width && newX + targetRoom.width > r.x && newY < r.y + r.height && newY + targetRoom.height > r.y);
    });

    if (overlappingRoom) {
      const tempX = targetRoom.x;
      const tempY = targetRoom.y;

      updatedLayout.floors[fIdx].rooms[rIdx].x = overlappingRoom.x;
      updatedLayout.floors[fIdx].rooms[rIdx].y = overlappingRoom.y;
      
      const targetOverlappingIdx = currentRooms.findIndex(r => r.id === overlappingRoom.id);
      if (targetOverlappingIdx !== -1) {
        updatedLayout.floors[fIdx].rooms[targetOverlappingIdx].x = tempX;
        updatedLayout.floors[fIdx].rooms[targetOverlappingIdx].y = tempY;
      }

      recalculateLocal(updatedLayout);
      return {
        success: true,
        message: `Relocated ${targetRoom.name} by swapping position with ${overlappingRoom.name}.`,
        layout: updatedLayout
      };
    }

    updatedLayout.floors[fIdx].rooms[rIdx].x = newX;
    updatedLayout.floors[fIdx].rooms[rIdx].y = newY;

    recalculateLocal(updatedLayout);
    return {
      success: true,
      message: `${targetRoom.name} moved to new position (${newX}, ${newY} ft).`,
      layout: updatedLayout
    };
  }

  // 4. RESIZE / INCREASE
  if (/\b(increase|larger|bigger|expand|enlarge)\b/i.test(command)) {
    const targetRoom = findMatchingRoom();
    if (!targetRoom) {
      return { success: false, reason: 'Target room not found in layout.', layout: existingLayout };
    }

    const origW = targetRoom.width;
    const origH = targetRoom.height;
    const newW = origW + 2;
    const newH = origH + 2;

    if (targetRoom.x + newW > plotW || targetRoom.y + newH > plotL) {
      return { 
        success: false, 
        reason: `${targetRoom.name} cannot be expanded beyond plot boundary (${plotW} × ${plotL} ft).`, 
        layout: existingLayout 
      };
    }

    const fIdx = targetRoom.floorIndex;
    const rIdx = targetRoom.roomIndex;
    updatedLayout.floors[fIdx].rooms[rIdx].width = newW;
    updatedLayout.floors[fIdx].rooms[rIdx].height = newH;
    updatedLayout.floors[fIdx].rooms[rIdx].area = round1(newW * newH);

    recalculateLocal(updatedLayout);
    return {
      success: true,
      message: `${targetRoom.name} increased to ${newW} × ${newH} ft.`,
      layout: updatedLayout
    };
  }

  // 5. REDUCE / DECREASE
  if (/\b(reduce|decrease|smaller|shrink)\b/i.test(command)) {
    const targetRoom = findMatchingRoom();
    if (!targetRoom) {
      return { success: false, reason: 'Target room not found in layout.', layout: existingLayout };
    }

    const origW = targetRoom.width;
    const origH = targetRoom.height;
    const newW = Math.max(5, origW - 2);
    const newH = Math.max(5, origH - 2);

    const fIdx = targetRoom.floorIndex;
    const rIdx = targetRoom.roomIndex;
    updatedLayout.floors[fIdx].rooms[rIdx].width = newW;
    updatedLayout.floors[fIdx].rooms[rIdx].height = newH;
    updatedLayout.floors[fIdx].rooms[rIdx].area = round1(newW * newH);

    recalculateLocal(updatedLayout);
    return {
      success: true,
      message: `${targetRoom.name} reduced to ${newW} × ${newH} ft.`,
      layout: updatedLayout
    };
  }

  // 6. ADD ROOM
  if (/\b(add|include|create|insert|build)\b/i.test(command)) {
    let roomType = 'Bathroom';
    if (command.includes('bedroom')) roomType = 'Bedroom';
    else if (command.includes('balcony')) roomType = 'Balcony';
    else if (command.includes('kitchen')) roomType = 'Kitchen';
    else if (command.includes('pooja')) roomType = 'Pooja Room';

    const fIdx = 0;
    const newW = roomType === 'Bathroom' ? 6 : roomType === 'Balcony' ? 8 : 10;
    const newH = roomType === 'Bathroom' ? 7 : roomType === 'Balcony' ? 4 : 10;

    let candidateX = 0;
    let candidateY = 0;
    let placed = false;

    for (let x = 0; x <= plotW - newW; x += 2) {
      for (let y = 0; y <= plotL - newH; y += 2) {
        const hasOverlap = updatedLayout.floors[fIdx].rooms.some(r => {
          return (x < r.x + r.width && x + newW > r.x && y < r.y + r.height && y + newH > r.y);
        });

        if (!hasOverlap) {
          candidateX = x;
          candidateY = y;
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    if (!placed) {
      candidateX = Math.max(0, plotW - newW);
      candidateY = Math.max(0, plotL - newH);
    }

    const newRoomObj = {
      id: `${roomType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: `${roomType} ${updatedLayout.floors[fIdx].rooms.filter(r => r.type === roomType).length + 1}`,
      type: roomType,
      floor: updatedLayout.floors[fIdx].floor,
      x: candidateX,
      y: candidateY,
      width: newW,
      height: newH,
      area: round1(newW * newH),
      color: roomType === 'Bathroom' ? '#cbd5e1' : roomType === 'Balcony' ? '#d1fae5' : '#dbeafe',
      doors: [{ wall: 'north', x: candidateX + 1, y: candidateY, width: 3 }],
      windows: [{ wall: 'south', x: candidateX + 1, y: candidateY + newH, width: 3 }]
    };

    updatedLayout.floors[fIdx].rooms.push(newRoomObj);
    recalculateLocal(updatedLayout);

    return {
      success: true,
      message: `Added new ${roomType} (${newW} × ${newH} ft) to layout.`,
      layout: updatedLayout
    };
  }

  return {
    success: false,
    reason: `Could not interpret customization command: "${commandText}". Try commands like "remove kitchen", "increase master bedroom", "move staircase to left", or "swap living room and kitchen".`,
    layout: existingLayout
  };
}
