/**
 * Multi-Floor Space Validation Engine
 * Validates Ground Floor and First Floor constraints, boundary limits, room overlaps, and NBC 2016 / IS 3861 standards.
 */

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

  floors.forEach(floorObj => {
    const floorName = floorObj.floor === 'ground' ? 'Ground Floor' : 'First Floor';
    const rooms = floorObj.rooms || [];
    let floorRoomArea = 0;

    // 1. Boundary & NBC 2016 Minimum Dimension Checks
    rooms.forEach(room => {
      if (room.width <= 0 || room.height <= 0) {
        errors.push(`[${floorName}] Room "${room.name}" has invalid zero or negative dimensions.`);
      }

      if (room.x < -0.1 || room.y < -0.1 || (room.x + room.width) > (plotW + 0.1) || (room.y + room.height) > (plotL + 0.1)) {
        errors.push(`[${floorName}] Room "${room.name}" exceeds the plot boundary (${plotW} × ${plotL} ${layout.plot.unit || 'ft'}).`);
      }

      const roomArea = Math.round((room.width * room.height) * 10) / 10;
      floorRoomArea += roomArea;

      // NBC 2016 - Part 3 Minimum Room Area & Dimension Checks
      if (room.type === 'Bedroom' || room.type === 'Master Bedroom') {
        if (roomArea < 90 || room.width < 7.8 || room.height < 7.8) {
          warnings.push(`[NBC 2016 - Part 3 Warning] "${room.name}" (${room.width}×${room.height} ft, ${roomArea} sq.ft) is below NBC minimum 9.5 sq.m (approx 90 sq.ft) recommendation.`);
        }
      } else if (room.type === 'Kitchen') {
        if (roomArea < 50 || room.width < 5.8 || room.height < 5.8) {
          warnings.push(`[NBC 2016 - Part 3 Warning] Kitchen "${room.name}" (${room.width}×${room.height} ft) is below NBC minimum 5.0 sq.m (approx 50 sq.ft) recommendation.`);
        }
      } else if (room.type === 'Bathroom' || room.type === 'Washroom') {
        if (roomArea < 18 || room.width < 3.8 || room.height < 3.8) {
          warnings.push(`[NBC 2016 - Part 3 Warning] Bathroom "${room.name}" (${room.width}×${room.height} ft) is below NBC minimum 1.8 sq.m recommendation.`);
        }
      }
    });

    totalAllRoomsArea += floorRoomArea;

    // 2. Overlap check between room rectangles on the SAME floor
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
          errors.push(`[${floorName}] Overlapping collision detected between "${r1.name}" and "${r2.name}".`);
        }
      }
    }

    const totalPlotArea = plotW * plotL;
    if (floorRoomArea > totalPlotArea + 1) {
      errors.push(`Your requirements on ${floorName} cannot comfortably fit within the available ${plotW} × ${plotL} ${layout.plot.unit || 'ft'} space.`);
    }
  });

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    summary: {
      plotDimensions: `${plotW} × ${plotL} ${layout.plot.unit || 'ft'}`,
      floorsCount: floors.length,
      totalPlotArea: Math.round((plotW * plotL) * 10) / 10,
      totalBuiltUpArea: Math.round(totalAllRoomsArea * 10) / 10
    }
  };
}

module.exports = { validateLayout };
