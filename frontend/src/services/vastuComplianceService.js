/**
 * Vastu Shastra & Directional Architectural Compliance Service
 * Evaluates room positions on the layout grid according to Indian Vastu principles.
 */

export function evaluateVastuCompliance(layout) {
  const plot = layout?.plot || { width: 30, length: 40 };
  const plotW = plot.width;
  const plotL = plot.length;

  const floors = layout?.floors || [];
  const groundFloor = floors.find(f => f.floor === 'ground') || { rooms: layout?.rooms || [] };
  const firstFloor = floors.find(f => f.floor === 'first') || { rooms: [] };
  const allRooms = [...(groundFloor.rooms || []), ...(firstFloor.rooms || [])];

  if (!allRooms.length) {
    return { overallScore: 85, ratings: [], recommendations: [] };
  }

  // Zone determination: Plot is divided into 3x3 grid (N at top Y=0, S at Y=plotL, W at X=0, E at X=plotW)
  const getRoomZone = (room) => {
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;

    const xRatio = cx / plotW;
    const yRatio = cy / plotL;

    let ns = 'Center';
    if (yRatio < 0.35) ns = 'North';
    else if (yRatio > 0.65) ns = 'South';

    let ew = 'Center';
    if (xRatio < 0.35) ew = 'West';
    else if (xRatio > 0.65) ew = 'East';

    if (ns === 'Center' && ew === 'Center') return 'Brahmasthan (Center)';
    if (ns === 'Center') return ew;
    if (ew === 'Center') return ns;
    return `${ns}-${ew}`;
  };

  const results = allRooms.map(room => {
    const zone = getRoomZone(room);
    let status = 'Good';
    let score = 80;
    let explanation = 'Fair placement according to directional orientation.';

    const type = room.type;

    if (type === 'Master Bedroom') {
      if (zone === 'South-West' || zone === 'South' || zone === 'West') {
        status = 'Optimal';
        score = 100;
        explanation = 'South-West brings stability, leadership, and prosperity for the master bedroom.';
      } else if (zone === 'North-East') {
        status = 'Needs Attention';
        score = 50;
        explanation = 'North-East for master bedroom can cause instability according to Vastu rules.';
      }
    } else if (type === 'Kitchen') {
      if (zone === 'South-East' || zone === 'East' || zone === 'North-West') {
        status = 'Optimal';
        score = 100;
        explanation = 'South-East (Agni corner) is the ideal fire element location for the cooking area.';
      } else if (zone === 'North-East' || zone === 'South-West') {
        status = 'Moderate';
        score = 65;
        explanation = 'Place cooktop facing East to balance fire energy.';
      }
    } else if (type === 'Living Room' || type === 'Hall') {
      if (zone === 'North-East' || zone === 'North' || zone === 'East' || zone === 'North-West') {
        status = 'Optimal';
        score = 95;
        explanation = 'North and East orientations invite positive daylight and morning energy.';
      }
    } else if (type === 'Pooja Room' || type === 'Study Room') {
      if (zone === 'North-East' || zone === 'North' || zone === 'East') {
        status = 'Optimal';
        score = 100;
        explanation = 'Ishanya (North-East) corner is the most sacred spiritual and cognitive zone.';
      }
    } else if (type === 'Bathroom' || type === 'Washroom') {
      if (zone === 'North-West' || zone === 'West' || zone === 'South') {
        status = 'Optimal';
        score = 95;
        explanation = 'North-West or West allows smooth drainage and elimination energy.';
      } else if (zone === 'North-East') {
        status = 'Needs Attention';
        score = 45;
        explanation = 'Avoid placing water closets directly in North-East.';
      }
    } else if (type === 'Staircase') {
      if (zone === 'South-West' || zone === 'South' || zone === 'West') {
        status = 'Optimal';
        score = 95;
        explanation = 'Heavy structural elements like stairs are best placed in South or West.';
      }
    }

    return {
      id: room.id,
      name: room.name,
      floor: room.floor,
      type: room.type,
      zone,
      status,
      score,
      explanation
    };
  });

  const totalScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

  const recommendations = [
    'Main entrance oriented towards East or North captures auspicious morning solar energy.',
    'Heavy furniture and wardrobes should ideally rest along South and West walls.',
    'Keep the central core (Brahmasthan) open and clutter-free for natural ventilation.'
  ];

  return {
    overallScore: Math.min(100, Math.max(60, totalScore)),
    ratings: results,
    recommendations
  };
}
