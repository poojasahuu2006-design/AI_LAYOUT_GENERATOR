import * as THREE from 'three';

/**
 * 3D Architectural Furniture & Fixtures Builder
 * Constructs lightweight 3D furniture models matching room dimensions and types.
 */

export function buildRoomFurniture(room, yElevation, materials) {
  const group = new THREE.Group();
  const rx = room.x;
  const ry = room.y;
  const rw = room.width;
  const rh = room.height;
  const base = yElevation + 0.45;

  const type = room.type;

  // 1. BEDROOM / MASTER BEDROOM: Bed + Pillows + Nightstands
  if (type === 'Bedroom' || type === 'Master Bedroom' || type === 'Guest Bedroom' || type === 'Kids Bedroom') {
    const isMaster = type === 'Master Bedroom';
    const bedW = isMaster ? 5.5 : 4.5;
    const bedL = 6.2;
    const bedH = 1.2;

    const bedGroup = new THREE.Group();
    // Wooden Bed Frame Base
    const frameGeo = new THREE.BoxGeometry(bedW, 0.6, bedL);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#5c3317', roughness: 0.6 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 0.3, 0);
    bedGroup.add(frameMesh);

    // Mattress with soft linen
    const mattGeo = new THREE.BoxGeometry(bedW - 0.2, 0.6, bedL - 0.2);
    const mattMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 });
    const mattMesh = new THREE.Mesh(mattGeo, mattMat);
    mattMesh.position.set(0, 0.8, 0);
    bedGroup.add(mattMesh);

    // Duvet / Bed Cover
    const duvetGeo = new THREE.BoxGeometry(bedW - 0.15, 0.3, bedL * 0.65);
    const duvetMat = new THREE.MeshStandardMaterial({ color: isMaster ? '#0284c7' : '#0d9488', roughness: 0.8 });
    const duvetMesh = new THREE.Mesh(duvetGeo, duvetMat);
    duvetMesh.position.set(0, 0.95, bedL * 0.15);
    bedGroup.add(duvetMesh);

    // Pillows
    const pillowGeo = new THREE.BoxGeometry(bedW * 0.38, 0.25, 1.2);
    const pillowMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
    const p1 = new THREE.Mesh(pillowGeo, pillowMat);
    p1.position.set(-bedW * 0.22, 1.0, -bedL * 0.32);
    bedGroup.add(p1);

    const p2 = new THREE.Mesh(pillowGeo, pillowMat);
    p2.position.set(bedW * 0.22, 1.0, -bedL * 0.32);
    bedGroup.add(p2);

    // Headboard
    const headGeo = new THREE.BoxGeometry(bedW + 0.4, 2.5, 0.3);
    const headMat = new THREE.MeshStandardMaterial({ color: '#3d1e0a', roughness: 0.6 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.25, -bedL / 2);
    bedGroup.add(headMesh);

    // Side tables
    const sideTableGeo = new THREE.BoxGeometry(1.4, 1.1, 1.4);
    const sideTableMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.5 });
    const s1 = new THREE.Mesh(sideTableGeo, sideTableMat);
    s1.position.set(-bedW / 2 - 1.0, 0.55, -bedL * 0.3);
    bedGroup.add(s1);

    const s2 = new THREE.Mesh(sideTableGeo, sideTableMat);
    s2.position.set(bedW / 2 + 1.0, 0.55, -bedL * 0.3);
    bedGroup.add(s2);

    // Place Bed inside room
    bedGroup.position.set(rx + rw / 2, base, ry + rh * 0.45);
    group.add(bedGroup);
  }

  // 2. LIVING ROOM / HALL: L-Sofa + Coffee Table + Media Console
  else if (type === 'Living Room' || type === 'Hall') {
    const sofaGroup = new THREE.Group();
    const sofaMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 });

    // Main Sofa Section
    const mainSofaGeo = new THREE.BoxGeometry(Math.min(7.0, rw - 3), 1.4, 2.6);
    const mainSofa = new THREE.Mesh(mainSofaGeo, sofaMat);
    mainSofa.position.set(0, 0.7, 0);
    sofaGroup.add(mainSofa);

    // Sofa Backrest
    const backGeo = new THREE.BoxGeometry(Math.min(7.0, rw - 3), 1.2, 0.6);
    const backMesh = new THREE.Mesh(backGeo, cushionMat);
    backMesh.position.set(0, 1.5, -1.0);
    sofaGroup.add(backMesh);

    // L-Corner Extension (if room is wide)
    if (rw > 11) {
      const lExtGeo = new THREE.BoxGeometry(2.4, 1.4, 3.2);
      const lExt = new THREE.Mesh(lExtGeo, sofaMat);
      lExt.position.set(-Math.min(7.0, rw - 3) / 2 + 1.2, 0.7, 2.6);
      sofaGroup.add(lExt);
    }

    // Glass / Wood Coffee Table
    const tableGeo = new THREE.BoxGeometry(3.2, 0.8, 2.0);
    const tableMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.3 });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, 0.4, 3.2);
    sofaGroup.add(tableMesh);

    // Area Rug underneath
    const rugGeo = new THREE.BoxGeometry(Math.min(8.0, rw - 2), 0.05, 6.0);
    const rugMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 1.0 });
    const rugMesh = new THREE.Mesh(rugGeo, rugMat);
    rugMesh.position.set(0, 0.03, 1.8);
    sofaGroup.add(rugMesh);

    sofaGroup.position.set(rx + rw * 0.45, base, ry + rh * 0.35);
    group.add(sofaGroup);
  }

  // 3. KITCHEN: Granite Countertops + Cooktop Burners + Sink
  else if (type === 'Kitchen') {
    const kitchenGroup = new THREE.Group();
    const cabinetMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 });
    const graniteMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2, metalness: 0.1 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.2 });

    const counterLen = Math.max(3, rw - 1.2);
    const counterH = 2.8;
    const counterD = 2.0;

    // Base Cabinets
    const cabGeo = new THREE.BoxGeometry(counterLen, counterH - 0.2, counterD);
    const cabMesh = new THREE.Mesh(cabGeo, cabinetMat);
    cabMesh.position.set(counterLen / 2, (counterH - 0.2) / 2, counterD / 2);
    kitchenGroup.add(cabMesh);

    // Granite Countertop
    const topGeo = new THREE.BoxGeometry(counterLen + 0.2, 0.2, counterD + 0.2);
    const topMesh = new THREE.Mesh(topGeo, graniteMat);
    topMesh.position.set(counterLen / 2, counterH - 0.1, counterD / 2);
    kitchenGroup.add(topMesh);

    // Gas Stove Cooktop
    const stoveGeo = new THREE.BoxGeometry(2.0, 0.1, 1.4);
    const stoveMat = new THREE.MeshStandardMaterial({ color: '#000000', metalness: 0.5 });
    const stoveMesh = new THREE.Mesh(stoveGeo, stoveMat);
    stoveMesh.position.set(counterLen * 0.3, counterH + 0.05, counterD / 2);
    kitchenGroup.add(stoveMesh);

    // Burners
    for (let b = 0; b < 2; b++) {
      const burnerGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12);
      const burnerMesh = new THREE.Mesh(burnerGeo, chromeMat);
      burnerMesh.position.set(counterLen * 0.3 - 0.5 + b * 1.0, counterH + 0.12, counterD / 2);
      kitchenGroup.add(burnerMesh);
    }

    // Stainless Steel Sink
    const sinkGeo = new THREE.BoxGeometry(1.8, 0.05, 1.3);
    const sinkMesh = new THREE.Mesh(sinkGeo, chromeMat);
    sinkMesh.position.set(counterLen * 0.75, counterH + 0.02, counterD / 2);
    kitchenGroup.add(sinkMesh);

    kitchenGroup.position.set(rx + 0.6, base, ry + 0.6);
    group.add(kitchenGroup);
  }

  // 4. DINING ROOM: Dining Table with 4 Chairs
  else if (type === 'Dining Room') {
    const diningGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.4 });
    const chairMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7 });

    // Table Top
    const tableTopGeo = new THREE.BoxGeometry(4.5, 0.2, 3.0);
    const tableTop = new THREE.Mesh(tableTopGeo, woodMat);
    tableTop.position.set(0, 2.4, 0);
    diningGroup.add(tableTop);

    // Table Legs
    for (let lx = -2.0; lx <= 2.0; lx += 4.0) {
      for (let lz = -1.2; lz <= 1.2; lz += 2.4) {
        const legGeo = new THREE.BoxGeometry(0.2, 2.4, 0.2);
        const legMesh = new THREE.Mesh(legGeo, woodMat);
        legMesh.position.set(lx, 1.2, lz);
        diningGroup.add(legMesh);
      }
    }

    // 4 Chairs
    const chairOffsets = [
      { x: -1.2, z: -2.0, ry: 0 },
      { x: 1.2, z: -2.0, ry: 0 },
      { x: -1.2, z: 2.0, ry: Math.PI },
      { x: 1.2, z: 2.0, ry: Math.PI }
    ];

    chairOffsets.forEach(co => {
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.2), chairMat);
      chairSeat.position.set(co.x, 1.5, co.z);
      diningGroup.add(chairSeat);

      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.15), chairMat);
      chairBack.position.set(co.x, 2.2, co.z + (co.ry === 0 ? -0.5 : 0.5));
      diningGroup.add(chairBack);
    });

    diningGroup.position.set(rx + rw / 2, base, ry + rh / 2);
    group.add(diningGroup);
  }

  // 5. BATHROOM / WASHROOM: Ceramic WC Toilet & Vanity Sink
  else if (type === 'Bathroom' || type === 'Washroom') {
    const bathGroup = new THREE.Group();
    const porcelainMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.1 });

    // Toilet Commode Bowl
    const bowlGeo = new THREE.BoxGeometry(1.3, 1.3, 1.8);
    const bowl = new THREE.Mesh(bowlGeo, porcelainMat);
    bowl.position.set(0, 0.65, 0.9);
    bathGroup.add(bowl);

    // Water Tank (Cistern)
    const tankGeo = new THREE.BoxGeometry(1.3, 1.6, 0.7);
    const tank = new THREE.Mesh(tankGeo, porcelainMat);
    tank.position.set(0, 1.4, 0.35);
    bathGroup.add(tank);

    // Wash Basin Vanity
    if (rw >= 5) {
      const vanityGeo = new THREE.BoxGeometry(2.0, 2.4, 1.4);
      const vanityMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.3 });
      const vanity = new THREE.Mesh(vanityGeo, vanityMat);
      vanity.position.set(rw - 2.0, 1.2, 1.0);
      bathGroup.add(vanity);

      // Chrome Tap
      const tapGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
      const tap = new THREE.Mesh(tapGeo, chromeMat);
      tap.position.set(rw - 2.0, 2.6, 0.7);
      bathGroup.add(tap);
    }

    bathGroup.position.set(rx + 0.8, base, ry + 0.8);
    group.add(bathGroup);
  }

  // 6. STUDY ROOM: Modern Desk + Office Chair + Bookshelf
  else if (type === 'Study Room') {
    const studyGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 });

    // Desk
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 2.2), woodMat);
    deskTop.position.set(0, 2.3, 0);
    studyGroup.add(deskTop);

    // Desk Legs / Drawers
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 2.0), darkMat);
    legL.position.set(-1.8, 1.1, 0);
    studyGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 2.0), darkMat);
    legR.position.set(1.8, 1.1, 0);
    studyGroup.add(legR);

    // Chair
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.4), darkMat);
    chair.position.set(0, 1.4, 1.6);
    studyGroup.add(chair);

    studyGroup.position.set(rx + rw / 2, base, ry + rh * 0.4);
    group.add(studyGroup);
  }

  return group;
}
