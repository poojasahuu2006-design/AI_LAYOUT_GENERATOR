/**
 * AI Layout Customization Engine
 * Applies incremental natural-language user feedback to modify multi-floor layouts.
 */

const { validateLayout } = require('./layoutValidator');

const FIXED_NO_EXPAND = ['Bathroom', 'Washroom', 'Staircase', 'Hallway', 'Corridor', 'Balcony'];
const HARD_MAX_AREA = {
  Bathroom: 65,
  Washroom: 45,
  Staircase: 95,
  Balcony: 65
};

function canExpandRoom(room, extraArea) {
  if (FIXED_NO_EXPAND.includes(room.type)) return false;
  const hard = HARD_MAX_AREA[room.type];
  if (hard != null && room.area + extraArea > hard + 0.5) return false;
  return true;
}

function fillSpaceAfterRemoval(floorObj, plotW, plotL, removedRoom) {
  const rooms = floorObj.rooms;
  if (!rooms || rooms.length === 0) return;

  const rx = removedRoom.x;
  const ry = removedRoom.y;
  const rw = removedRoom.width;
  const rh = removedRoom.height;
  const gapArea = rw * rh;

  const preferExpand = (r) =>
    canExpandRoom(r, gapArea) &&
    !FIXED_NO_EXPAND.includes(r.type);

  // 1. Try horizontal neighbor sharing same Y and height
  let neighbor = rooms.find(r => preferExpand(r) && Math.abs(r.y - ry) < 1 && Math.abs(r.height - rh) < 1 && (Math.abs(r.x + r.width - rx) < 1 || Math.abs(rx + rw - r.x) < 1));
  if (neighbor) {
    if (neighbor.x + neighbor.width <= rx + 1) {
      neighbor.width = Math.round((neighbor.width + rw) * 10) / 10;
    } else {
      const rightX = neighbor.x + neighbor.width;
      neighbor.x = rx;
      neighbor.width = Math.round((rightX - rx) * 10) / 10;
    }
    neighbor.area = Math.round(neighbor.width * neighbor.height * 10) / 10;
    updateRoomDoorsAndWindows(neighbor, plotW, plotL);
    return;
  }

  // 2. Try vertical neighbor sharing same X and width
  neighbor = rooms.find(r => preferExpand(r) && Math.abs(r.x - rx) < 1 && Math.abs(r.width - rw) < 1 && (Math.abs(r.y + r.height - ry) < 1 || Math.abs(ry + rh - r.y) < 1));
  if (neighbor) {
    if (neighbor.y + neighbor.height <= ry + 1) {
      neighbor.height = Math.round((neighbor.height + rh) * 10) / 10;
    } else {
      const bottomY = neighbor.y + neighbor.height;
      neighbor.y = ry;
      neighbor.height = Math.round((bottomY - ry) * 10) / 10;
    }
    neighbor.area = Math.round(neighbor.width * neighbor.height * 10) / 10;
    updateRoomDoorsAndWindows(neighbor, plotW, plotL);
    return;
  }

  // 3. Fallback: expand adjacent HIGH/MEDIUM room, else create Storage
  let adjRoom = rooms.find(r => preferExpand(r) && ((
    r.x < rx + rw && r.x + r.width > rx && (Math.abs(r.y + r.height - ry) < 1 || Math.abs(r.y - (ry + rh)) < 1)
  ) || (
    r.y < ry + rh && r.y + r.height > ry && (Math.abs(r.x + r.width - rx) < 1 || Math.abs(r.x - (rx + rw)) < 1)
  )));

  if (!adjRoom) {
    const flex = rooms.filter(preferExpand);
    if (flex.length) {
      adjRoom = flex.reduce((max, r) => (r.area > max.area ? r : max), flex[0]);
    }
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
    updateRoomDoorsAndWindows(adjRoom, plotW, plotL);
    return;
  }

  // Never dump into bathroom — expand HIGH/MEDIUM neighbor only (no invented Storage)
  const HIGH_MED = ['Living Room', 'Hall', 'Foyer', 'Master Bedroom', 'Bedroom', 'Dining Room', 'Kitchen', 'Study Room'];
  const flex = rooms.filter((r) => HIGH_MED.includes(r.type));
  if (flex.length) {
    const grow = flex.reduce((max, r) => (r.area > max.area ? r : max), flex[0]);
    if (rx >= grow.x + grow.width - 1) {
      grow.width = Math.min(plotW - grow.x, Math.round((grow.width + rw) * 10) / 10);
    } else if (ry >= grow.y + grow.height - 1) {
      grow.height = Math.min(plotL - grow.y, Math.round((grow.height + rh) * 10) / 10);
    } else {
      grow.width = Math.min(plotW - grow.x, Math.round((grow.width + rw * 0.5) * 10) / 10);
      grow.height = Math.min(plotL - grow.y, Math.round((grow.height + rh * 0.5) * 10) / 10);
    }
    grow.area = Math.round(grow.width * grow.height * 10) / 10;
    updateRoomDoorsAndWindows(grow, plotW, plotL);
  }
}

function updateRoomDoorsAndWindows(room, plotW, plotL) {
  const CORNER = 0.5;
  (room.doors || []).forEach((door) => {
    if (door.isMainEntry) {
      door.y = 0;
      door.wall = 'south';
      const dw = door.width || 3.5;
      door.x = Math.max(
        room.x + CORNER,
        Math.min(room.x + room.width - CORNER - dw, room.x + room.width / 2 - dw / 2)
      );
      return;
    }
    const dw = door.width || 3;
    if (door.wall === 'east' || door.wall === 'west') {
      door.x = door.wall === 'west' ? room.x : room.x + room.width;
      door.y = Math.max(
        room.y + CORNER,
        Math.min(room.y + room.height - CORNER - dw, room.y + room.height / 2 - dw / 2)
      );
    } else {
      door.y = door.wall === 'north' ? room.y : room.y + room.height;
      if (door.wall === 'south' && room.y < 0.5) door.y = room.y + room.height;
      door.x = Math.max(
        room.x + CORNER,
        Math.min(room.x + room.width - CORNER - dw, room.x + room.width / 2 - dw / 2)
      );
    }
  });
  if (room.windows && room.windows.length > 0) {
    room.windows[0].x = Math.max(room.x + CORNER, Math.min(room.x + room.width - 3, room.x + Math.floor(room.width / 2) - 1));
    if (room.y <= 1) room.windows[0].y = 0;
    else if (room.y + room.height >= plotL - 1) room.windows[0].y = plotL;
    else room.windows[0].y = room.y + room.height;
  }
}

function customizeLayout(existingLayout, commandText) {
  if (!existingLayout || !existingLayout.floors) {
    return { success: false, reason: 'Valid existing layout is required for customization.', layout: existingLayout };
  }

  const command = (commandText || '').toLowerCase().trim();
  if (!command) {
    return { success: false, reason: 'Command text cannot be empty.', layout: existingLayout };
  }

  const updatedLayout = JSON.parse(JSON.stringify(existingLayout));
  const plotW = updatedLayout.plot.width;
  const plotL = updatedLayout.plot.length;

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
    fillSpaceAfterRemoval(updatedLayout.floors[fIdx], plotW, plotL, removedRoomObj);

    recalculateBuiltUpAndSpace(updatedLayout);

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

      recalculateBuiltUpAndSpace(updatedLayout);
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

      recalculateBuiltUpAndSpace(updatedLayout);
      return {
        success: true,
        message: `Relocated ${targetRoom.name} by swapping position with ${overlappingRoom.name}.`,
        layout: updatedLayout
      };
    }

    updatedLayout.floors[fIdx].rooms[rIdx].x = newX;
    updatedLayout.floors[fIdx].rooms[rIdx].y = newY;

    recalculateBuiltUpAndSpace(updatedLayout);
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
    updatedLayout.floors[fIdx].rooms[rIdx].area = Math.round(newW * newH * 10) / 10;

    recalculateBuiltUpAndSpace(updatedLayout);
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
    updatedLayout.floors[fIdx].rooms[rIdx].area = Math.round(newW * newH * 10) / 10;

    recalculateBuiltUpAndSpace(updatedLayout);
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
      area: Math.round(newW * newH * 10) / 10,
      color: roomType === 'Bathroom' ? '#cbd5e1' : roomType === 'Balcony' ? '#d1fae5' : '#dbeafe',
      doors: [{ wall: 'north', x: candidateX + 1, y: candidateY, width: 3 }],
      windows: [{ wall: 'south', x: candidateX + 1, y: candidateY + newH, width: 3 }]
    };

    updatedLayout.floors[fIdx].rooms.push(newRoomObj);
    recalculateBuiltUpAndSpace(updatedLayout);

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

function recalculateBuiltUpAndSpace(layout) {
  let totalBuiltUp = 0;
  (layout.floors || []).forEach(f => {
    f.builtUpArea = Math.round((f.rooms || []).reduce((sum, r) => sum + r.area, 0) * 10) / 10;
    totalBuiltUp += f.builtUpArea;
  });

  layout.builtUpArea = Math.round(totalBuiltUp * 10) / 10;
  layout.usedArea = layout.builtUpArea;
  const totalPlotArea = (layout.plot.width * layout.plot.length) * (layout.floors.length || 1);
  layout.spaceUtilization = Math.min(100, Math.round((totalBuiltUp / totalPlotArea) * 100));
}

module.exports = { customizeLayout };
