/**
 * Multi-Floor Space Validation Engine
 * Validates boundaries, zero overlaps, NBC room sizes, entrance topology, and area proportions.
 */

const { findSharedWallSegment } = require('./geometrySolver');
const { validateAreaCaps } = require('./areaAllocator');

function validateLayout(layout) {
  const errors = [];
  const warnings = [];

  if (!layout || !layout.plot) {
    return {
      isValid: false,
      errors: ['Invalid layout object structure.'],
      warnings: []
    };
  }

  const { width: plotW, length: plotL } = layout.plot;
  const floors = layout.floors || [];

  if (floors.length === 0 && layout.rooms) {
    floors.push({ floor: 'ground', rooms: layout.rooms });
  }

  let totalAllRoomsArea = 0;
  const BED_TYPES = ['Bedroom', 'Master Bedroom', 'Study Room'];
  const ENTRY_TYPES = ['Living Room', 'Hall', 'Foyer', 'Dining Room', 'Kitchen'];
  const CORNER_OFFSET = 0.4;
  const areaChecklists = [];

  floors.forEach((floorObj) => {
    const floorName = floorObj.floor === 'ground' ? 'Ground Floor' : 'First Floor';
    const rooms = floorObj.rooms || [];
    let floorRoomArea = 0;

    // Hard area-cap validation
    const capResult = validateAreaCaps(rooms, plotW, plotL);
    areaChecklists.push({ floor: floorObj.floor, report: capResult.report });
    if (!capResult.ok) {
      capResult.failures.forEach((f) => {
        errors.push(`[${floorName}] Area allocation cap failed: ${f}`);
      });
    }

    rooms.forEach((room) => {
      if (room.width <= 0 || room.height <= 0) {
        errors.push(`[${floorName}] Room "${room.name}" has invalid zero or negative dimensions.`);
      }

      if (
        room.x < -0.1 ||
        room.y < -0.1 ||
        room.x + room.width > plotW + 0.1 ||
        room.y + room.height > plotL + 0.1
      ) {
        errors.push(
          `[${floorName}] Room "${room.name}" exceeds the plot boundary (${plotW} × ${plotL} ${layout.plot.unit || 'ft'}).`
        );
      }

      const roomArea = Math.round(room.width * room.height * 10) / 10;
      floorRoomArea += roomArea;

      if (room.type === 'Bathroom' && roomArea > 65.5) {
        errors.push(
          `[${floorName}] Bathroom "${room.name}" area ${roomArea} sq.ft exceeds practical max 65 sq.ft.`
        );
      }
      if (room.type === 'Washroom' && roomArea > 45.5) {
        errors.push(
          `[${floorName}] Washroom "${room.name}" area ${roomArea} sq.ft exceeds practical max 45 sq.ft.`
        );
      }
      const maxStairsCap = Math.max(160, Math.round(plotW * plotL * 0.15));
      if (room.type === 'Staircase' && roomArea > maxStairsCap + 0.5) {
        errors.push(
          `[${floorName}] Stairs "${room.name}" area ${roomArea} sq.ft exceeds max ${maxStairsCap} sq.ft.`
        );
      }

      if (room.exterior_required || BED_TYPES.includes(room.type) || ['Living Room', 'Hall'].includes(room.type)) {
        const touches =
          room.y <= 0.2 ||
          room.x <= 0.2 ||
          room.y + room.height >= plotL - 0.2 ||
          room.x + room.width >= plotW - 0.2;
        if (!touches) {
          warnings.push(
            `[${floorName}] "${room.name}" is positioned internally without an exterior wall.`
          );
        }
      }
    });

    totalAllRoomsArea += floorRoomArea;

    // Zero Overlap Check
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const r1 = rooms[i];
        const r2 = rooms[j];

        const isOverlapping = !(
          r1.x + r1.width - 0.05 <= r2.x ||
          r2.x + r2.width - 0.05 <= r1.x ||
          r1.y + r1.height - 0.05 <= r2.y ||
          r2.y + r2.height - 0.05 <= r1.y
        );

        if (isOverlapping) {
          errors.push(
            `[${floorName}] Overlapping collision detected between "${r1.name}" and "${r2.name}".`
          );
        }
      }
    }

    // Main Entrance Check on Ground Floor
    if (floorObj.floor === 'ground' && rooms.length > 0) {
      const mainDoors = rooms.flatMap((r) =>
        (r.doors || []).filter((d) => d.isMainEntry).map((d) => ({ room: r, door: d }))
      );
      if (mainDoors.length === 0) {
        warnings.push(`[${floorName}] No MAIN ENTRY door found on front entrance wall.`);
      } else {
        mainDoors.forEach(({ room }) => {
          if (room.type === 'Bathroom' || room.type === 'Washroom') {
            errors.push(
              `[${floorName}] Main entrance directly opens into "${room.name}". Must open into a common/habitable room.`
            );
          }
        });
      }
    }

    const totalPlotArea = plotW * plotL;
    if (floorRoomArea > totalPlotArea + 1) {
      errors.push(
        `Total room area on ${floorName} exceeds available plot size.`
      );
    }
  });

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    areaChecklists,
    summary: {
      plotDimensions: `${plotW} × ${plotL} ${layout.plot.unit || 'ft'}`,
      floorsCount: floors.length,
      totalPlotArea: Math.round(plotW * plotL * 10) / 10,
      totalBuiltUpArea: Math.round(totalAllRoomsArea * 10) / 10
    }
  };
}

module.exports = { validateLayout };
