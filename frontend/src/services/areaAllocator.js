/**
 * Area Allocator & Priority Budgeting Engine (Frontend ES Module)
 * Dynamic proportional area allocation based on architectural importance:
 * LIVING / HALL > BEDROOMS > KITCHEN > BATHROOM / SERVICE
 * 
 * Guarantees 100% full plot area utilization with realistic, practical room proportions.
 */

export const round1 = (val) => Math.round(Number(val) * 10) / 10;

export const AREA_RULES = {
  'Living Room': { priority: 'HIGH', baseWeight: 3.4, minArea: 120, maxArea: null, minW: 10, minH: 10 },
  'Hall': { priority: 'HIGH', baseWeight: 3.2, minArea: 120, maxArea: null, minW: 10, minH: 10 },
  'Foyer': { priority: 'HIGH', baseWeight: 1.2, minArea: 40, maxArea: 100, minW: 5, minH: 6 },
  'Master Bedroom': { priority: 'HIGH', baseWeight: 2.6, minArea: 110, maxArea: null, minW: 10, minH: 10 },
  'Bedroom': { priority: 'HIGH', baseWeight: 2.2, minArea: 90, maxArea: null, minW: 9, minH: 9 },
  'Dining Room': { priority: 'MEDIUM', baseWeight: 1.4, minArea: 70, maxArea: null, minW: 8, minH: 7 },
  'Kitchen': { priority: 'MEDIUM', baseWeight: 1.3, minArea: 55, maxArea: null, minW: 7, minH: 6 },
  'Study Room': { priority: 'MEDIUM', baseWeight: 1.2, minArea: 60, maxArea: null, minW: 7, minH: 7 },
  'Pooja Room': { priority: 'LOW_FIXED', baseWeight: 0.35, minArea: 20, maxArea: 40, minW: 4, minH: 4 },
  'Bathroom': { priority: 'LOW_FIXED', baseWeight: 0.35, minArea: 28, maxArea: 60, minW: 4.5, minH: 5.5 },
  'Washroom': { priority: 'LOW_FIXED', baseWeight: 0.3, minArea: 20, maxArea: 40, minW: 4, minH: 4.5 },
  'Balcony': { priority: 'LOW_FIXED', baseWeight: 0.4, minArea: 25, maxArea: 65, minW: 4, minH: 6 },
  'Staircase': { priority: 'LOW_FIXED', baseWeight: 0.7, minArea: 60, maxArea: 90, minW: 6.5, minH: 8.5 },
  'Utility Room': { priority: 'LOW_FILLER', baseWeight: 0.4, minArea: 20, maxArea: 50, minW: 4, minH: 5 },
  'Store Room': { priority: 'LOW_FILLER', baseWeight: 0.35, minArea: 20, maxArea: 50, minW: 4, minH: 5 },
  'Hallway': { priority: 'LOW_FIXED', baseWeight: 0.4, minArea: 25, maxArea: 60, minW: 3.5, minH: 6 },
  'Corridor': { priority: 'LOW_FIXED', baseWeight: 0.4, minArea: 25, maxArea: 60, minW: 3.5, minH: 6 }
};

export const HIGH = 'HIGH';
export const MEDIUM = 'MEDIUM';
export const LOW_FIXED = 'LOW_FIXED';
export const LOW_FILLER = 'LOW_FILLER';

export function getRule(type) {
  return AREA_RULES[type] || {
    priority: MEDIUM,
    baseWeight: 1.0,
    minArea: 50,
    maxArea: null,
    minW: 6,
    minH: 6
  };
}

export function isLowFixed(type) {
  return getRule(type).priority === LOW_FIXED;
}

export function isFiller(type) {
  return getRule(type).priority === LOW_FILLER;
}

export function maxAreaForType(type) {
  const rule = getRule(type);
  if (rule.maxArea == null || !Number.isFinite(rule.maxArea)) return null;
  return rule.maxArea;
}

/**
 * Allocate dynamic target areas to room instances for a given plot size.
 */
export function allocateRoomAreas(rooms, plotW, plotL, options = {}) {
  const W = Number(plotW) || 30;
  const L = Number(plotL) || 40;
  const totalPlotArea = round1(W * L);

  if (!rooms || rooms.length === 0) {
    return {
      rooms: [],
      checklist: [],
      remainingArea: 0,
      totalPlotArea,
      usableArea: totalPlotArea
    };
  }

  // If only 1 room, it gets the entire plot
  if (rooms.length === 1) {
    const list = [{
      ...rooms[0],
      priority: getRule(rooms[0].type).priority,
      targetArea: totalPlotArea,
      areaWeight: 1.0,
      allocatedArea: totalPlotArea
    }];
    return {
      rooms: list,
      checklist: [{ name: list[0].name || list[0].type, type: list[0].type, area: totalPlotArea, ok: true }],
      remainingArea: 0,
      totalPlotArea,
      usableArea: totalPlotArea
    };
  }

  const list = rooms.map((r) => {
    const rule = getRule(r.type);
    return {
      ...r,
      priority: rule.priority,
      minArea: rule.minArea,
      maxArea: rule.maxArea,
      baseWeight: rule.baseWeight,
      minW: rule.minW,
      minH: rule.minH
    };
  });

  const plotScaleFactor = Math.min(2.0, Math.max(0.7, totalPlotArea / 1200));

  let fixedAllocatedSum = 0;
  list.forEach((r) => {
    if (r.priority === LOW_FIXED || r.priority === LOW_FILLER) {
      if (r.type === 'Bathroom') {
        const base = Math.min(52, Math.max(30, 38 * Math.sqrt(plotScaleFactor)));
        r.targetArea = round1(Math.min(r.maxArea || 60, base));
      } else if (r.type === 'Washroom') {
        const base = Math.min(35, Math.max(22, 28 * Math.sqrt(plotScaleFactor)));
        r.targetArea = round1(Math.min(r.maxArea || 40, base));
      } else if (r.type === 'Pooja Room') {
        r.targetArea = round1(Math.min(r.maxArea || 40, 25 * Math.sqrt(plotScaleFactor)));
      } else if (r.type === 'Balcony') {
        r.targetArea = round1(Math.min(r.maxArea || 65, 35 * Math.sqrt(plotScaleFactor)));
      } else if (r.type === 'Staircase') {
        r.targetArea = round1(Math.min(r.maxArea || 90, Math.max(65, 75 * Math.min(1.2, plotScaleFactor))));
      } else {
        r.targetArea = round1(Math.min(r.maxArea || 50, 30 * Math.sqrt(plotScaleFactor)));
      }
      fixedAllocatedSum += r.targetArea;
    }
  });

  let flexibleRooms = list.filter((r) => r.priority === HIGH || r.priority === MEDIUM);

  if (flexibleRooms.length === 0) {
    const sumFixed = list.reduce((s, r) => s + r.targetArea, 0) || 1;
    const ratio = totalPlotArea / sumFixed;
    list.forEach((r) => {
      r.targetArea = round1(r.targetArea * ratio);
      r.areaWeight = r.targetArea / totalPlotArea;
    });
  } else {
    if (fixedAllocatedSum > totalPlotArea * 0.45) {
      const maxAllowedFixed = totalPlotArea * 0.40;
      const scale = maxAllowedFixed / fixedAllocatedSum;
      list.forEach((r) => {
        if (r.priority === LOW_FIXED || r.priority === LOW_FILLER) {
          r.targetArea = round1(Math.max(r.minArea * 0.8, r.targetArea * scale));
        }
      });
      fixedAllocatedSum = list
        .filter((r) => r.priority === LOW_FIXED || r.priority === LOW_FILLER)
        .reduce((s, r) => s + r.targetArea, 0);
    }

    const remainingForFlexible = Math.max(0, totalPlotArea - fixedAllocatedSum);
    const sumFlexWeights = flexibleRooms.reduce((s, r) => s + (r.baseWeight || 1.0), 0) || 1;

    flexibleRooms.forEach((r) => {
      const share = (r.baseWeight || 1.0) / sumFlexWeights;
      r.targetArea = round1(remainingForFlexible * share);
    });

    const living = flexibleRooms.find((r) => r.type === 'Living Room' || r.type === 'Hall');
    if (living) {
      flexibleRooms.forEach((r) => {
        if (r !== living && r.targetArea >= living.targetArea) {
          const targetCap = round1(living.targetArea * 0.85);
          const excess = r.targetArea - targetCap;
          if (excess > 0) {
            r.targetArea = targetCap;
            living.targetArea = round1(living.targetArea + excess);
          }
        }
      });
    }

    const beds = flexibleRooms.filter((r) => r.type === 'Bedroom' || r.type === 'Master Bedroom');
    const kitchens = flexibleRooms.filter((r) => r.type === 'Kitchen');
    if (beds.length && kitchens.length) {
      const smallestBed = beds.reduce((min, b) => b.targetArea < min.targetArea ? b : min, beds[0]);
      kitchens.forEach((k) => {
        if (k.targetArea >= smallestBed.targetArea) {
          const targetK = round1(smallestBed.targetArea * 0.75);
          const excess = k.targetArea - targetK;
          if (excess > 0) {
            k.targetArea = targetK;
            smallestBed.targetArea = round1(smallestBed.targetArea + excess);
          }
        }
      });
    }
  }

  let currentSum = list.reduce((s, r) => s + r.targetArea, 0);
  let diff = round1(totalPlotArea - currentSum);

  if (Math.abs(diff) > 0.05) {
    const primary = list.find((r) => r.type === 'Living Room' || r.type === 'Hall') ||
                    list.find((r) => r.type === 'Master Bedroom' || r.type === 'Bedroom') ||
                    list[0];
    if (primary) {
      primary.targetArea = round1(primary.targetArea + diff);
    }
  }

  list.forEach((r) => {
    r.targetArea = round1(Math.max(15, r.targetArea));
    r.areaWeight = round1(r.targetArea / totalPlotArea);
    r.allocatedArea = r.targetArea;
  });

  const checklist = list.map((r) => {
    const isBath = r.type === 'Bathroom' || r.type === 'Washroom';
    const ok = isBath ? r.targetArea <= 65 : true;
    return {
      name: r.name || r.type,
      type: r.type,
      area: r.targetArea,
      maxArea: r.maxArea,
      priority: r.priority,
      ok,
      label: `${r.name || r.type}: ${r.targetArea} sq.ft`
    };
  });

  return {
    rooms: list,
    checklist,
    remainingArea: 0,
    totalPlotArea,
    usableArea: totalPlotArea,
    fillerCreated: false
  };
}

export function validateAreaCaps(placedRooms, plotW, plotL) {
  const failures = [];
  const checklist = [];

  (placedRooms || []).forEach((room) => {
    const area = round1(room.width * room.height);
    let ok = true;
    let maxCap = maxAreaForType(room.type);

    if (room.type === 'Bathroom') {
      maxCap = 65;
      ok = area <= maxCap + 0.5;
      if (!ok) failures.push(`Bathroom "${room.name || room.type}" (${area} sq.ft) exceeds practical max ${maxCap} sq.ft`);
    } else if (room.type === 'Washroom') {
      maxCap = 45;
      ok = area <= maxCap + 0.5;
      if (!ok) failures.push(`Washroom "${room.name || room.type}" (${area} sq.ft) exceeds practical max ${maxCap} sq.ft`);
    } else if (room.type === 'Staircase') {
      maxCap = 95;
      ok = area <= maxCap + 0.5;
      if (!ok) failures.push(`Stairs "${room.name || room.type}" (${area} sq.ft) exceeds practical max ${maxCap} sq.ft`);
    }

    checklist.push({
      name: room.name || room.type,
      type: room.type,
      area,
      maxArea: maxCap,
      ok
    });
  });

  return {
    ok: failures.length === 0,
    failures,
    report: checklist
  };
}

export function validateExactRoomList(placedRooms, requestedInstances) {
  const reqCounts = {};
  (requestedInstances || []).forEach((r) => {
    reqCounts[r.type] = (reqCounts[r.type] || 0) + 1;
  });
  const gotCounts = {};
  (placedRooms || []).forEach((r) => {
    gotCounts[r.type] = (gotCounts[r.type] || 0) + 1;
  });

  const failures = [];
  const allTypes = new Set([...Object.keys(reqCounts), ...Object.keys(gotCounts)]);
  allTypes.forEach((type) => {
    const need = reqCounts[type] || 0;
    const got = gotCounts[type] || 0;
    if (need !== got) {
      failures.push(
        `Room type "${type}": requested ${need}, got ${got} ${got > need ? '(extra invented)' : '(under-generated)'}`
      );
    }
  });

  const reqTotal = (requestedInstances || []).length;
  const gotTotal = (placedRooms || []).length;
  if (reqTotal !== gotTotal) {
    failures.push(`Total instance count: requested ${reqTotal}, got ${gotTotal}`);
  }

  return { ok: failures.length === 0, failures, reqCounts, gotCounts };
}

export function findOverlappingPairs(placedRooms, eps = 0.05) {
  const pairs = [];
  const rooms = placedRooms || [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const overlaps =
        a.x < b.x + b.width - eps &&
        a.x + a.width > b.x + eps &&
        a.y < b.y + b.height - eps &&
        a.y + a.height > b.y + eps;
      if (overlaps) {
        pairs.push({
          a: a.name || a.id,
          b: b.name || b.id,
          aId: a.id,
          bId: b.id
        });
      }
    }
  }
  return pairs;
}

export function validateLayoutAgainstRoomList(placedRooms, requestedInstances, plotW, plotL) {
  const listCheck = validateExactRoomList(placedRooms, requestedInstances);
  const overlaps = findOverlappingPairs(placedRooms);
  const caps = validateAreaCaps(placedRooms, plotW, plotL);
  const failures = [...listCheck.failures];

  overlaps.forEach((p) => {
    failures.push(`Overlap collision between "${p.a}" and "${p.b}"`);
  });

  (caps.failures || []).forEach((f) => {
    failures.push(f);
  });

  return {
    ok: failures.length === 0,
    failures,
    overlaps,
    listCheck,
    caps
  };
}
