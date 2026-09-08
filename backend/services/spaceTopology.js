/**
 * Space Topology & Adjacency Graph Engine
 * Determines residential circulation hierarchy based purely on user-selected rooms:
 * ENTRANCE -> LIVING/COMMON -> CIRCULATION/KITCHEN/DINING -> BEDROOMS -> BATHROOMS
 */

const ENTRY_TYPES = ['Living Room', 'Hall', 'Foyer'];
const PRIVATE_TYPES = ['Bedroom', 'Master Bedroom', 'Study Room', 'Bathroom', 'Washroom'];
const BED_TYPES = ['Bedroom', 'Master Bedroom', 'Study Room'];
const BATH_TYPES = ['Bathroom', 'Washroom'];

function isPrivate(type) {
  return PRIVATE_TYPES.includes(type);
}

function isEntry(type) {
  return ENTRY_TYPES.includes(type);
}

function buildAdjacencyGraph(instances, floorLevel) {
  const nodes = [];
  const edges = [];
  const rooms = (instances || []).map((r) => ({ ...r }));

  if (rooms.length === 0) {
    return { nodes: [], edges: [], meta: { entryRoomId: null } };
  }

  const addNode = (room, level, exteriorRequired = false) => {
    nodes.push({
      id: room.id,
      type: room.type,
      level,
      exterior_required: exteriorRequired,
      name: room.name
    });
  };

  const addEdge = (from, to, relation = 'door') => {
    if (!from || !to || from === to) return;
    const exists = edges.some(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
    if (!exists) edges.push({ from, to, relation });
  };

  // Determine Entry Room strictly from user-selected rooms
  let entryRoom =
    rooms.find((r) => r.type === 'Living Room') ||
    rooms.find((r) => r.type === 'Hall') ||
    rooms.find((r) => r.type === 'Foyer');

  // If no living/hall, pick next most logical public/common room
  if (!entryRoom) {
    entryRoom =
      rooms.find((r) => r.type === 'Dining Room') ||
      rooms.find((r) => r.type === 'Kitchen') ||
      rooms.find((r) => r.type === 'Study Room') ||
      rooms.find((r) => r.type === 'Bedroom') ||
      rooms[0];
  }

  // Register Main Entrance node (Ground floor only)
  if (floorLevel === 'ground' && entryRoom) {
    nodes.push({
      id: 'entrance',
      type: 'Entrance',
      level: 0,
      exterior_required: true,
      name: 'Main Entrance'
    });
    addEdge('entrance', entryRoom.id, 'main_entry');
  }

  // Assign hierarchy levels
  rooms.forEach((r) => {
    if (r.id === entryRoom.id) {
      addNode(r, 1, true);
    } else if (['Dining Room', 'Kitchen', 'Pooja Room', 'Staircase', 'Utility Room', 'Store Room'].includes(r.type)) {
      addNode(r, 2, r.type === 'Kitchen' || r.type === 'Dining Room');
    } else if (BED_TYPES.includes(r.type)) {
      addNode(r, 3, true);
    } else if (BATH_TYPES.includes(r.type)) {
      addNode(r, 4, false);
    } else if (r.type === 'Balcony') {
      addNode(r, 3, true);
    } else {
      addNode(r, 2, false);
    }
  });

  const dining = rooms.filter((r) => r.type === 'Dining Room' && r.id !== entryRoom.id);
  const kitchens = rooms.filter((r) => r.type === 'Kitchen' && r.id !== entryRoom.id);
  const beds = rooms.filter((r) => BED_TYPES.includes(r.type) && r.id !== entryRoom.id);
  const baths = rooms.filter((r) => BATH_TYPES.includes(r.type) && r.id !== entryRoom.id);
  const poojas = rooms.filter((r) => r.type === 'Pooja Room' && r.id !== entryRoom.id);
  const stairs = rooms.filter((r) => r.type === 'Staircase' && r.id !== entryRoom.id);
  const balconies = rooms.filter((r) => r.type === 'Balcony' && r.id !== entryRoom.id);

  // Link Entry Room to adjacent functional rooms
  dining.forEach((d) => addEdge(entryRoom.id, d.id, 'open'));
  kitchens.forEach((k) => addEdge(entryRoom.id, k.id, 'door'));
  poojas.forEach((p) => addEdge(entryRoom.id, p.id, 'door'));
  stairs.forEach((s) => addEdge(entryRoom.id, s.id, 'door'));

  // Link Bedrooms to Entry Room / Common Area
  beds.forEach((b) => addEdge(entryRoom.id, b.id, 'door'));

  // Link Bathrooms:
  // If multiple bedrooms, 1st bathroom can connect to Entry/Common, 2nd can attach to Master Bedroom
  if (baths.length > 0) {
    baths.forEach((bath, index) => {
      if (index === 0 || beds.length === 0) {
        addEdge(entryRoom.id, bath.id, 'door');
      } else {
        const master = beds.find((b) => b.type === 'Master Bedroom') || beds[0];
        addEdge(master.id, bath.id, 'door');
      }
    });
  }

  // Link Balconies to nearest bedroom or entry
  balconies.forEach((bal) => {
    const bed = beds[0];
    if (bed) addEdge(bed.id, bal.id, 'door');
    else addEdge(entryRoom.id, bal.id, 'door');
  });

  return {
    nodes,
    edges,
    meta: {
      entryRoomId: entryRoom?.id || null,
      entryRoomType: entryRoom?.type || null
    }
  };
}

module.exports = {
  buildAdjacencyGraph,
  isPrivate,
  isEntry,
  ENTRY_TYPES,
  PRIVATE_TYPES,
  BED_TYPES,
  BATH_TYPES
};
