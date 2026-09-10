import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { 
  Armchair, Home, Download
} from 'lucide-react';
import { 
  createOakWoodTexture, 
  createCeramicTileTexture, 
  createMosaicTileTexture, 
  createStuccoWallTexture, 
  createConcreteTexture, 
  createGrassTexture, 
  createTeakWoodTexture,
  createBrickWallTexture
} from './textureGenerator';
import { buildRoomFurniture } from './furniture3DBuilder';

export default function Building3DViewer({ layout, onSwitchTo2D, onSelectRoom }) {
  const mountRef = useRef(null);

  // 3D View Controls State
  const [floor3DView, setFloor3DView] = useState('both'); // 'ground' | 'first' | 'both'
  const [renderMode, setRenderMode] = useState('realistic'); // 'realistic' | 'wireframe' | 'structural' | 'xray'
  const [timeOfDay, setTimeOfDay] = useState('noon'); // 'morning' | 'noon' | 'sunset' | 'night'
  const [showRoofSlab, setShowRoofSlab] = useState(false);
  const [showFurniture, setShowFurniture] = useState(true);
  const [explodedHeight, setExplodedHeight] = useState(0); // 0 to 15 ft separation
  const [selected3DRoom, setSelected3DRoom] = useState(null);

  const plot = layout?.plot || { width: 30, length: 40, unit: 'ft' };
  const plotW = plot.width;
  const plotL = plot.length;
  const wallHeight = 9; // Realistic architectural floor-to-ceiling clearance

  const floors = layout?.floors || [];
  const groundFloor = floors.find(f => f.floor === 'ground') || { rooms: layout?.rooms || [] };
  const firstFloor = floors.find(f => f.floor === 'first') || { rooms: [] };

  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Background color based on time of day
    if (timeOfDay === 'night') scene.background = new THREE.Color('#090d16');
    else if (timeOfDay === 'sunset') scene.background = new THREE.Color('#fde68a');
    else if (timeOfDay === 'morning') scene.background = new THREE.Color('#e0f2fe');
    else scene.background = new THREE.Color('#f1f5f9'); // Daytime neutral sky

    // Fog for depth realism
    if (timeOfDay !== 'wireframe') {
      scene.fog = new THREE.FogExp2(scene.background.getHex(), 0.005);
    }

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(plotW * 1.4, Math.max(plotW, plotL) * 1.5, plotL * 1.7);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = timeOfDay === 'night' ? 0.7 : 1.1;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.set(plotW / 2, 4 + explodedHeight / 2, plotL / 2);
    controlsRef.current = controls;

    // 5. Lighting Setup (Time of Day Simulation)
    let ambientIntensity = 0.65;
    let hemiSkyColor = 0xffffff;
    let hemiGroundColor = 0x94a3b8;
    let sunColor = 0xffffff;
    let sunIntensity = 1.0;
    let sunPos = new THREE.Vector3(plotW * 2, 45, plotL * 2);

    if (timeOfDay === 'morning') {
      ambientIntensity = 0.6;
      sunColor = 0xffedd5; // Soft warm morning glow
      sunIntensity = 0.9;
      sunPos.set(-plotW * 2, 25, plotL * 1.5);
    } else if (timeOfDay === 'sunset') {
      ambientIntensity = 0.5;
      sunColor = 0xf97316; // Warm amber sunset
      sunIntensity = 1.1;
      sunPos.set(plotW * 2.5, 18, -plotL * 0.5);
    } else if (timeOfDay === 'night') {
      ambientIntensity = 0.25;
      hemiSkyColor = 0x1e293b;
      hemiGroundColor = 0x020617;
      sunColor = 0x38bdf8; // Moonlight
      sunIntensity = 0.3;
      sunPos.set(plotW * 1.5, 40, plotL * 1.5);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(hemiSkyColor, hemiGroundColor, 0.45);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(sunColor, sunIntensity);
    dirLight.position.copy(sunPos);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    const d = Math.max(plotW, plotL) * 1.8;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0002;
    scene.add(dirLight);

    // 6. Natural Materials Library
    const isWire = renderMode === 'wireframe';
    const isStruct = renderMode === 'structural';
    const isXray = renderMode === 'xray';

    // Procedural Texture instances
    const oakWoodTex = createOakWoodTexture();
    const ceramicTileTex = createCeramicTileTexture('#faf5ee', '#b8af9f', 64);
    const mosaicTileTex = createMosaicTileTexture();
    const concreteTex = createConcreteTexture();
    const grassTex = createGrassTexture();
    const stuccoTex = createStuccoWallTexture('#f1ede6');
    const interiorStuccoTex = createStuccoWallTexture('#faf8f5');
    const brickTex = createBrickWallTexture();
    const teakWoodTex = createTeakWoodTexture();

    const materials = {
      // Natural Walls
      wallExt: isWire
        ? new THREE.MeshBasicMaterial({ color: '#0284c7', wireframe: true })
        : isXray
        ? new THREE.MeshStandardMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.25, roughness: 0.2 })
        : isStruct
        ? new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.8 })
        : new THREE.MeshStandardMaterial({ map: stuccoTex, roughness: 0.7, metalness: 0.02 }),

      wallInt: isWire
        ? new THREE.MeshBasicMaterial({ color: '#38bdf8', wireframe: true })
        : isXray
        ? new THREE.MeshStandardMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.2, roughness: 0.2 })
        : new THREE.MeshStandardMaterial({ map: interiorStuccoTex, roughness: 0.6 }),

      // Structural RCC Column Material
      rccColumn: new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.5 }),

      // Natural Doors & Windows
      doorWood: isWire
        ? new THREE.MeshBasicMaterial({ color: '#d97706', wireframe: true })
        : new THREE.MeshStandardMaterial({ map: teakWoodTex, roughness: 0.5 }),

      doorHandle: new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.9, roughness: 0.1 }),

      windowGlass: new THREE.MeshPhysicalMaterial({
        color: '#bae6fd',
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.85,
        transparent: true,
        opacity: 0.4
      }),

      windowFrame: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3 }),
      balconyRailing: new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 }),
      stairStep: new THREE.MeshStandardMaterial({ map: oakWoodTex, roughness: 0.4 }),

      // Natural Room Floors
      floorLiving: isWire
        ? new THREE.MeshBasicMaterial({ color: '#0284c7', wireframe: true })
        : new THREE.MeshStandardMaterial({ map: ceramicTileTex, roughness: 0.2 }),

      floorBedroom: isWire
        ? new THREE.MeshBasicMaterial({ color: '#38bdf8', wireframe: true })
        : new THREE.MeshStandardMaterial({ map: oakWoodTex, roughness: 0.4 }),

      floorKitchen: isWire
        ? new THREE.MeshBasicMaterial({ color: '#f59e0b', wireframe: true })
        : new THREE.MeshStandardMaterial({ map: ceramicTileTex, roughness: 0.25 }),

      floorBathroom: isWire
        ? new THREE.MeshBasicMaterial({ color: '#64748b', wireframe: true })
        : new THREE.MeshStandardMaterial({ map: mosaicTileTex, roughness: 0.6 }),

      floorBalcony: new THREE.MeshStandardMaterial({ map: ceramicTileTex, roughness: 0.5 }),
      floorStair: new THREE.MeshStandardMaterial({ map: oakWoodTex, roughness: 0.4 }),

      // Plinth & Roof Slab
      slabConcrete: isWire
        ? new THREE.MeshBasicMaterial({ color: '#94a3b8', wireframe: true })
        : new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.6 }),

      // Exterior Landscape Lawn
      grassLawn: isWire
        ? new THREE.MeshBasicMaterial({ color: '#10b981', wireframe: true })
        : new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 }),

      // Surrounding Curb / Driveway Pavers
      curbStone: new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.7 })
    };

    // 7. Exterior Landscaping / Site Base
    const siteMargin = Math.max(plotW, plotL) * 0.4;
    const siteGeo = new THREE.BoxGeometry(plotW + siteMargin * 2, 0.4, plotL + siteMargin * 2);
    const siteMesh = new THREE.Mesh(siteGeo, materials.grassLawn);
    siteMesh.position.set(plotW / 2, -0.2, plotL / 2);
    siteMesh.receiveShadow = true;
    scene.add(siteMesh);

    // Exterior Concrete Curb Border around Plot
    const curbGeo = new THREE.BoxGeometry(plotW + 4, 0.3, plotL + 4);
    const curbMesh = new THREE.Mesh(curbGeo, materials.curbStone);
    curbMesh.position.set(plotW / 2, -0.05, plotL / 2);
    curbMesh.receiveShadow = true;
    scene.add(curbMesh);

    const labelCoordsList = [];

    // Helper: Build 3D Floor Geometry Group
    const createFloor3DGroup = (floorRooms, yElevation, isGround) => {
      const group = new THREE.Group();

      // Plinth / Foundation Slab (0.5m / 1.5ft plinth height per NBC 2016)
      const slabGeo = new THREE.BoxGeometry(plotW, 0.5, plotL);
      const slabMesh = new THREE.Mesh(slabGeo, materials.slabConcrete);
      slabMesh.position.set(plotW / 2, yElevation + 0.25, plotL / 2);
      slabMesh.receiveShadow = true;
      slabMesh.castShadow = true;
      group.add(slabMesh);

      // Render Rooms
      floorRooms.forEach((room) => {
        const rx = room.x;
        const ry = room.y;
        const rw = room.width;
        const rh = room.height;

        // Store label coordinate for 3D Overlay
        labelCoordsList.push({
          id: room.id,
          name: room.name,
          dimensions: `${rw}' × ${rh}' (${room.area} sq.ft)`,
          floor: room.floor,
          worldPos: new THREE.Vector3(rx + rw / 2, yElevation + wallHeight + 1.2, ry + rh / 2)
        });

        // 1. Room Floor Surface
        let rFloorMat = materials.floorLiving;
        if (['Bedroom', 'Master Bedroom', 'Study Room'].includes(room.type)) rFloorMat = materials.floorBedroom;
        else if (room.type === 'Kitchen') rFloorMat = materials.floorKitchen;
        else if (['Bathroom', 'Washroom'].includes(room.type)) rFloorMat = materials.floorBathroom;
        else if (room.type === 'Balcony') rFloorMat = materials.floorBalcony;
        else if (room.type === 'Staircase') rFloorMat = materials.floorStair;

        const roomFloorGeo = new THREE.BoxGeometry(rw - 0.05, 0.1, rh - 0.05);
        const roomFloorMesh = new THREE.Mesh(roomFloorGeo, rFloorMat);
        roomFloorMesh.position.set(rx + rw / 2, yElevation + 0.55, ry + rh / 2);
        roomFloorMesh.receiveShadow = true;
        roomFloorMesh.userData = { roomId: room.id, roomObj: room };
        group.add(roomFloorMesh);

        // 2. Extruded Walls
        const wallThick = 0.4; // 9-inch outer masonry wall thickness

        // North Wall
        const nWallGeo = new THREE.BoxGeometry(rw, wallHeight, wallThick);
        const nWall = new THREE.Mesh(nWallGeo, materials.wallExt);
        nWall.position.set(rx + rw / 2, yElevation + 0.5 + wallHeight / 2, ry);
        nWall.castShadow = true;
        nWall.receiveShadow = true;
        group.add(nWall);

        // South Wall
        const sWallGeo = new THREE.BoxGeometry(rw, wallHeight, wallThick);
        const sWall = new THREE.Mesh(sWallGeo, materials.wallExt);
        sWall.position.set(rx + rw / 2, yElevation + 0.5 + wallHeight / 2, ry + rh);
        sWall.castShadow = true;
        sWall.receiveShadow = true;
        group.add(sWall);

        // West Wall
        const wWallGeo = new THREE.BoxGeometry(wallThick, wallHeight, rh);
        const wWall = new THREE.Mesh(wWallGeo, materials.wallInt);
        wWall.position.set(rx, yElevation + 0.5 + wallHeight / 2, ry + rh / 2);
        wWall.castShadow = true;
        wWall.receiveShadow = true;
        group.add(wWall);

        // East Wall
        const eWallGeo = new THREE.BoxGeometry(wallThick, wallHeight, rh);
        const eWall = new THREE.Mesh(eWallGeo, materials.wallInt);
        eWall.position.set(rx + rw, yElevation + 0.5 + wallHeight / 2, ry + rh / 2);
        eWall.castShadow = true;
        eWall.receiveShadow = true;
        group.add(eWall);

        // 3. Structural RCC Columns at Corners in Structural Mode
        if (isStruct) {
          const colGeo = new THREE.BoxGeometry(0.8, wallHeight, 0.8);
          const colPositions = [
            [rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]
          ];
          colPositions.forEach(([cx, cy]) => {
            const col = new THREE.Mesh(colGeo, materials.rccColumn);
            col.position.set(cx, yElevation + 0.5 + wallHeight / 2, cy);
            group.add(col);
          });
        }

        // 4. Architectural 3D Staircase Geometry
        if (room.type === 'Staircase') {
          const stepCount = 9;
          const stepDepth = rh / stepCount;
          const stepHeight = wallHeight / stepCount;

          for (let i = 0; i < stepCount; i++) {
            const stepGeo = new THREE.BoxGeometry(rw - 0.6, stepHeight, stepDepth);
            const stepMesh = new THREE.Mesh(stepGeo, materials.stairStep);
            stepMesh.position.set(
              rx + rw / 2,
              yElevation + 0.55 + i * stepHeight + stepHeight / 2,
              ry + i * stepDepth + stepDepth / 2
            );
            stepMesh.castShadow = true;
            stepMesh.receiveShadow = true;
            group.add(stepMesh);
          }
        }

        // 5. Architectural 3D Balcony Railing Geometry
        if (room.type === 'Balcony') {
          const railGeo = new THREE.BoxGeometry(rw, 3.0, 0.15);
          const railMesh = new THREE.Mesh(railGeo, materials.balconyRailing);
          railMesh.position.set(rx + rw / 2, yElevation + 0.55 + 1.5, ry + rh);
          railMesh.castShadow = true;
          group.add(railMesh);
        }

        // 6. Architectural 3D Doors with Frames & Handles
        (room.doors || []).forEach(d => {
          const dw = Math.min(d.width || 3.2, rw - 0.4);
          const doorGeo = new THREE.BoxGeometry(dw, 7.0, 0.2);
          const doorMesh = new THREE.Mesh(doorGeo, materials.doorWood);
          doorMesh.position.set(d.x + dw / 2, yElevation + 0.5 + 3.5, d.y);
          doorMesh.castShadow = true;
          group.add(doorMesh);

          // Brass/Chrome Handle
          const handleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
          const handleMesh = new THREE.Mesh(handleGeo, materials.doorHandle);
          handleMesh.position.set(d.x + dw * 0.85, yElevation + 0.5 + 3.2, d.y + 0.15);
          handleMesh.rotation.z = Math.PI / 2;
          group.add(handleMesh);
        });

        // 7. Architectural 3D Windows with Glass & Frames
        (room.windows || []).forEach(w => {
          const ww = Math.min(w.width || 4.0, rw - 0.6);
          // Glass Pane
          const winGeo = new THREE.BoxGeometry(ww, 4.2, 0.1);
          const winMesh = new THREE.Mesh(winGeo, materials.windowGlass);
          winMesh.position.set(w.x + ww / 2, yElevation + 0.5 + 4.8, w.y);
          group.add(winMesh);

          // Window Frame Surround
          const frameGeo = new THREE.BoxGeometry(ww + 0.2, 4.4, 0.25);
          const frameMesh = new THREE.Mesh(frameGeo, materials.windowFrame);
          frameMesh.position.set(w.x + ww / 2, yElevation + 0.5 + 4.8, w.y);
          group.add(frameMesh);
        });

        // 8. 3D Furniture Fixtures
        if (showFurniture && !isWire) {
          const furnitureMesh = buildRoomFurniture(room, yElevation, materials);
          group.add(furnitureMesh);
        }

        // 9. Night Interior Downlight per Room
        if (timeOfDay === 'night') {
          const roomLight = new THREE.PointLight(0xffedd5, 1.2, 20);
          roomLight.position.set(rx + rw / 2, yElevation + wallHeight - 0.5, ry + rh / 2);
          group.add(roomLight);
        }

      });

      return group;
    };

    // Render Ground Floor 3D
    if (floor3DView === 'both' || floor3DView === 'ground') {
      const ground3DGroup = createFloor3DGroup(groundFloor.rooms || [], 0, true);
      scene.add(ground3DGroup);
    }

    // Render First Floor 3D
    if ((floor3DView === 'both' || floor3DView === 'first') && firstFloor.rooms && firstFloor.rooms.length > 0) {
      const firstElevation = floor3DView === 'first' ? 0 : wallHeight + 0.5 + explodedHeight;
      const first3DGroup = createFloor3DGroup(firstFloor.rooms, firstElevation, false);
      scene.add(first3DGroup);
    }

    // Render Roof / Terrace Slab if enabled
    if (showRoofSlab) {
      const roofElevation = (firstFloor.rooms && firstFloor.rooms.length > 0 && floor3DView !== 'ground')
        ? (wallHeight + 0.5 + explodedHeight + wallHeight + 0.5)
        : (wallHeight + 0.5);

      const roofGroup = new THREE.Group();
      // Main Slab
      const roofGeo = new THREE.BoxGeometry(plotW + 0.5, 0.5, plotL + 0.5);
      const roofMesh = new THREE.Mesh(roofGeo, materials.slabConcrete);
      roofMesh.position.set(plotW / 2, roofElevation + 0.25, plotL / 2);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      roofGroup.add(roofMesh);

      // Parapet Wall (3ft safety height)
      const parapetHeight = 3.0;
      const pWallThick = 0.3;
      const nParapet = new THREE.Mesh(new THREE.BoxGeometry(plotW + 0.5, parapetHeight, pWallThick), materials.wallExt);
      nParapet.position.set(plotW / 2, roofElevation + 0.5 + parapetHeight / 2, 0);
      roofGroup.add(nParapet);

      const sParapet = new THREE.Mesh(new THREE.BoxGeometry(plotW + 0.5, parapetHeight, pWallThick), materials.wallExt);
      sParapet.position.set(plotW / 2, roofElevation + 0.5 + parapetHeight / 2, plotL);
      roofGroup.add(sParapet);

      scene.add(roofGroup);
    }

    // Click handler for 3D room selection
    const handleCanvasClick = (event) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      const hitRoomMesh = intersects.find(hit => hit.object.userData && hit.object.userData.roomId);
      if (hitRoomMesh) {
        setSelected3DRoom(hitRoomMesh.object.userData.roomObj);
        if (typeof onSelectRoom === 'function') {
          onSelectRoom(hitRoomMesh.object.userData.roomObj);
        }
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(renderer.domElement)) {
        renderer.domElement.removeEventListener('click', handleCanvasClick);
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [layout, floor3DView, renderMode, timeOfDay, showRoofSlab, showFurniture, explodedHeight]);

  // Set Preset Camera Angles
  const setCameraAngle = (viewType) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (viewType === 'top') {
      camera.position.set(plotW / 2, Math.max(plotW, plotL) * 2.2, plotL / 2 + 0.1);
    } else if (viewType === 'front') {
      camera.position.set(plotW / 2, 8, plotL * 2.2);
    } else if (viewType === 'side') {
      camera.position.set(plotW * 2.2, 8, plotL / 2);
    } else if (viewType === 'iso') {
      camera.position.set(plotW * 1.4, Math.max(plotW, plotL) * 1.5, plotL * 1.7);
    }
    controls.target.set(plotW / 2, 4 + explodedHeight / 2, plotL / 2);
    controls.update();
  };

  // High-Resolution 3D Snapshot Capture
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${layout.projectName || 'Building_Model'}_3D_Render.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative select-none font-sans">
      
      {/* 3D TOP TOOLBAR */}
      <div className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
        
        {/* FLOOR SELECTOR */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <span className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Elevation:</span>
          
          <button
            onClick={() => setFloor3DView('ground')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              floor3DView === 'ground' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Ground Floor
          </button>

          {firstFloor.rooms && firstFloor.rooms.length > 0 && (
            <button
              onClick={() => setFloor3DView('first')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                floor3DView === 'first' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              First Floor
            </button>
          )}

          {firstFloor.rooms && firstFloor.rooms.length > 0 && (
            <button
              onClick={() => setFloor3DView('both')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                floor3DView === 'both' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Both Floors
            </button>
          )}
        </div>

        {/* RENDER STYLE SELECTOR */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <span className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Style:</span>
          {[
            { id: 'realistic', label: '🌿 Realistic' },
            { id: 'wireframe', label: '📐 CAD Wire' },
            { id: 'structural', label: '🧱 Structural' },
            { id: 'xray', label: '🪟 X-Ray' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setRenderMode(mode.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition ${
                renderMode === mode.id ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* TIME OF DAY LIGHTING */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <span className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Sun:</span>
          {[
            { id: 'morning', label: '🌅 8 AM' },
            { id: 'noon', label: '☀️ 12 PM' },
            { id: 'sunset', label: '🌇 5 PM' },
            { id: 'night', label: '🌙 9 PM' }
          ].map(tod => (
            <button
              key={tod.id}
              onClick={() => setTimeOfDay(tod.id)}
              className={`px-2 py-1 text-xs font-bold rounded-xl transition ${
                timeOfDay === tod.id ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tod.label}
            </button>
          ))}
        </div>

        {/* CONTROLS & TOGGLES */}
        <div className="flex items-center gap-2">
          
          {/* Furniture Toggle */}
          <button
            onClick={() => setShowFurniture(!showFurniture)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              showFurniture ? 'bg-teal-950 border-teal-500 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle 3D Architectural Furniture"
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Furniture</span>
          </button>

          {/* Roof Slab Toggle */}
          <button
            onClick={() => setShowRoofSlab(!showRoofSlab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              showRoofSlab ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Concrete Terrace Roof"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Roof Slab</span>
          </button>

          {/* Snapshot Capture */}
          <button
            onClick={handleCaptureSnapshot}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl transition"
            title="Export 3D Snapshot"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onSwitchTo2D}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
          >
            2D CAD Plan
          </button>
        </div>

      </div>

      {/* SECONDARY TOOLBAR: EXPLODED VIEW & CAMERA PRESETS */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        
        {/* Exploded View Slider */}
        {firstFloor.rooms && firstFloor.rooms.length > 0 && floor3DView === 'both' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Floor Explosion:</span>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={explodedHeight}
              onChange={(e) => setExplodedHeight(Number(e.target.value))}
              className="w-28 accent-indigo-500 cursor-pointer"
            />
            <span className="text-indigo-400 font-bold">{explodedHeight} ft</span>
          </div>
        )}

        {/* Camera Angles */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-[10px] uppercase font-bold">Camera:</span>
          {['iso', 'top', 'front', 'side'].map(cam => (
            <button
              key={cam}
              onClick={() => setCameraAngle(cam)}
              className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white uppercase font-bold text-[10px] transition"
            >
              {cam}
            </button>
          ))}
        </div>

      </div>

      {/* 3D CANVAS MOUNT */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Selected Room 3D Live Inspector Badge */}
        {selected3DRoom && (
          <div className="absolute top-4 left-4 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 p-3.5 rounded-2xl shadow-2xl max-w-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wide">{selected3DRoom.name}</span>
              <button onClick={() => setSelected3DRoom(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
              <div>Dimensions: <strong className="text-white">{selected3DRoom.width}' × {selected3DRoom.height}'</strong></div>
              <div>Floor Area: <strong className="text-emerald-400">{selected3DRoom.area} sq.ft</strong></div>
              <div>Clearance Height: <strong className="text-white">{wallHeight} ft</strong> (NBC 2016)</div>
            </div>
          </div>
        )}

        {/* Architectural 3D Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-950/85 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-mono border border-slate-800 space-y-1.5">
          <div className="font-black text-amber-400 uppercase tracking-wider text-[10px]">Natural Material Legend</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#c89d7c] rounded-xs"></span> Oak Parquet</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#faf5ee] border border-slate-500 rounded-xs"></span> Ceramic Tile</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#f1ede6] rounded-xs"></span> Stucco Plaster</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#5c3317] rounded-xs"></span> Teak Doors</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#bae6fd] rounded-xs"></span> Physical Glass</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#4d7c38] rounded-xs"></span> Lawn Base</div>
          </div>
        </div>

      </div>

    </div>
  );
}
