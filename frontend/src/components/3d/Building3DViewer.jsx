import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Layers, Box, Eye, EyeOff, RotateCcw, Camera, Tag, Sun } from 'lucide-react';

export default function Building3DViewer({ layout, onSwitchTo2D, onSelectRoom }) {
  const mountRef = useRef(null);

  // 3D View Controls State
  const [floor3DView, setFloor3DView] = useState('both');
  const [showRoomLabels3D, setShowRoomLabels3D] = useState(true);
  const [selected3DRoomId, setSelected3DRoomId] = useState(null);

  const plot = layout?.plot || { width: 30, length: 40, unit: 'ft' };
  const plotW = plot.width;
  const plotL = plot.length;
  const wallHeight = 8; // Architectural floor height

  const floors = layout?.floors || [];
  const groundFloor = floors.find(f => f.floor === 'ground') || { rooms: layout?.rooms || [] };
  const firstFloor = floors.find(f => f.floor === 'first') || { rooms: [] };

  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Dynamic Room Labels positioning list for 3D Overlay
  const [roomLabelPositions, setRoomLabelPositions] = useState([]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc');

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(plotW * 1.4, Math.max(plotW, plotL) * 1.5, plotL * 1.7);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.set(plotW / 2, 4, plotL / 2);
    controlsRef.current = controls;

    // 5. Lighting (Architectural Daylight Studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(plotW * 2, 45, plotL * 2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    // 6. Exterior Land / Site Base
    const siteGeo = new THREE.BoxGeometry(plotW * 1.5, 0.4, plotL * 1.5);
    const siteMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.8 });
    const siteMesh = new THREE.Mesh(siteGeo, siteMat);
    siteMesh.position.set(plotW / 2, -0.2, plotL / 2);
    siteMesh.receiveShadow = true;
    scene.add(siteMesh);

    // Material Library for 3D Architectural Visualization
    const materials = {
      wallExt: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4, metalness: 0.05 }),
      wallInt: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }),
      doorWood: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.6 }),
      windowGlass: new THREE.MeshStandardMaterial({ color: '#38bdf8', opacity: 0.4, transparent: true, roughness: 0.1 }),
      windowFrame: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3 }),
      balconyRailing: new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.3, metalness: 0.5 }),
      stairStep: new THREE.MeshStandardMaterial({ color: '#6d28d9', roughness: 0.4 }),
      // Room Floors
      floorBedroom: new THREE.MeshStandardMaterial({ color: '#dbeafe', roughness: 0.5 }),
      floorKitchen: new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.4 }),
      floorBathroom: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.3 }),
      floorLiving: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
      floorBalcony: new THREE.MeshStandardMaterial({ color: '#d1fae5', roughness: 0.6 }),
      floorStair: new THREE.MeshStandardMaterial({ color: '#faf5ff', roughness: 0.5 })
    };

    const labelCoordsList = [];

    // Helper: Build 3D Floor Geometry Group
    const createFloor3DGroup = (floorRooms, yElevation, isGround) => {
      const group = new THREE.Group();

      // Floor Slab
      const slabGeo = new THREE.BoxGeometry(plotW, 0.4, plotL);
      const slabMat = new THREE.MeshStandardMaterial({ color: isGround ? '#cbd5e1' : '#e2e8f0', roughness: 0.4 });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(plotW / 2, yElevation + 0.2, plotL / 2);
      slabMesh.receiveShadow = true;
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

        const roomFloorGeo = new THREE.BoxGeometry(rw - 0.1, 0.1, rh - 0.1);
        const roomFloorMesh = new THREE.Mesh(roomFloorGeo, rFloorMat);
        roomFloorMesh.position.set(rx + rw / 2, yElevation + 0.45, ry + rh / 2);
        roomFloorMesh.receiveShadow = true;
        roomFloorMesh.userData = { roomId: room.id, roomObj: room };
        group.add(roomFloorMesh);

        // 2. Extruded Walls
        const wallThick = 0.3;

        // North Wall
        const nWallGeo = new THREE.BoxGeometry(rw, wallHeight, wallThick);
        const nWall = new THREE.Mesh(nWallGeo, materials.wallExt);
        nWall.position.set(rx + rw / 2, yElevation + 0.4 + wallHeight / 2, ry);
        nWall.castShadow = true;
        nWall.receiveShadow = true;
        group.add(nWall);

        // South Wall
        const sWallGeo = new THREE.BoxGeometry(rw, wallHeight, wallThick);
        const sWall = new THREE.Mesh(sWallGeo, materials.wallExt);
        sWall.position.set(rx + rw / 2, yElevation + 0.4 + wallHeight / 2, ry + rh);
        sWall.castShadow = true;
        sWall.receiveShadow = true;
        group.add(sWall);

        // West Wall
        const wWallGeo = new THREE.BoxGeometry(wallThick, wallHeight, rh);
        const wWall = new THREE.Mesh(wWallGeo, materials.wallInt);
        wWall.position.set(rx, yElevation + 0.4 + wallHeight / 2, ry + rh / 2);
        wWall.castShadow = true;
        wWall.receiveShadow = true;
        group.add(wWall);

        // East Wall
        const eWallGeo = new THREE.BoxGeometry(wallThick, wallHeight, rh);
        const eWall = new THREE.Mesh(eWallGeo, materials.wallInt);
        eWall.position.set(rx + rw, yElevation + 0.4 + wallHeight / 2, ry + rh / 2);
        eWall.castShadow = true;
        eWall.receiveShadow = true;
        group.add(eWall);

        // 3. Architectural 3D Staircase Geometry
        if (room.type === 'Staircase') {
          const stepCount = 8;
          const stepDepth = rh / stepCount;
          const stepHeight = wallHeight / stepCount;

          for (let i = 0; i < stepCount; i++) {
            const stepGeo = new THREE.BoxGeometry(rw - 0.8, stepHeight, stepDepth);
            const stepMesh = new THREE.Mesh(stepGeo, materials.stairStep);
            stepMesh.position.set(
              rx + rw / 2,
              yElevation + 0.45 + i * stepHeight + stepHeight / 2,
              ry + i * stepDepth + stepDepth / 2
            );
            stepMesh.castShadow = true;
            group.add(stepMesh);
          }
        }

        // 4. Architectural 3D Balcony Railing Geometry
        if (room.type === 'Balcony') {
          const railGeo = new THREE.BoxGeometry(rw, 2.5, 0.15);
          const railMesh = new THREE.Mesh(railGeo, materials.balconyRailing);
          railMesh.position.set(rx + rw / 2, yElevation + 0.45 + 1.25, ry + rh);
          group.add(railMesh);
        }

        // 5. Architectural 3D Doors
        (room.doors || []).forEach(d => {
          const dw = Math.min(d.width || 3, rw - 0.4);
          const doorGeo = new THREE.BoxGeometry(dw, 6.5, 0.15);
          const doorMesh = new THREE.Mesh(doorGeo, materials.doorWood);
          doorMesh.position.set(d.x + dw / 2, yElevation + 0.4 + 3.25, d.y);
          group.add(doorMesh);
        });

        // 6. Architectural 3D Windows
        (room.windows || []).forEach(w => {
          const ww = Math.min(w.width || 4, rw - 0.6);
          const winGeo = new THREE.BoxGeometry(ww, 4.0, 0.2);
          const winMesh = new THREE.Mesh(winGeo, materials.windowGlass);
          winMesh.position.set(w.x + ww / 2, yElevation + 0.4 + 4.5, w.y);
          group.add(winMesh);
        });

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
      const firstElevation = floor3DView === 'first' ? 0 : wallHeight + 0.4;
      const first3DGroup = createFloor3DGroup(firstFloor.rooms, firstElevation, false);
      scene.add(first3DGroup);
    }

    setRoomLabelPositions(labelCoordsList);

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
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [layout, floor3DView]);

  // Set Preset Camera Angles
  const setCameraAngle = (viewType) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (viewType === 'top') {
      camera.position.set(plotW / 2, Math.max(plotW, plotL) * 2.2, plotL / 2 + 0.1);
    } else if (viewType === 'front') {
      camera.position.set(plotW / 2, 8, plotL * 2.2);
    } else if (viewType === 'iso') {
      camera.position.set(plotW * 1.4, Math.max(plotW, plotL) * 1.5, plotL * 1.7);
    }
    controls.target.set(plotW / 2, 4, plotL / 2);
    controls.update();
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative select-none">
      
      {/* 3D TOP TOOLBAR */}
      <div className="bg-white border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 shadow-sm">
        
        {/* 3D FLOOR CARDS SELECTOR */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="px-2 text-xs font-bold text-slate-500 uppercase">3D Floor:</span>
          
          <button
            onClick={() => setFloor3DView('ground')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              floor3DView === 'ground' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Ground
          </button>

          {firstFloor.rooms && firstFloor.rooms.length > 0 && (
            <button
              onClick={() => setFloor3DView('first')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                floor3DView === 'first' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              First
            </button>
          )}

          {firstFloor.rooms && firstFloor.rooms.length > 0 && (
            <button
              onClick={() => setFloor3DView('both')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                floor3DView === 'both' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Both Floors
            </button>
          )}
        </div>

        {/* CAMERA PRESETS & CONTROLS */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setCameraAngle('iso')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition"
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraAngle('top')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition"
            >
              Top View
            </button>
            <button
              onClick={() => setCameraAngle('front')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition"
            >
              Front View
            </button>
          </div>

          <button
            onClick={() => setShowRoomLabels3D(!showRoomLabels3D)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              showRoomLabels3D ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Toggle 3D Floating Room Labels"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{showRoomLabels3D ? 'Hide Room Labels' : 'Show Room Labels'}</span>
          </button>

          <button
            onClick={onSwitchTo2D}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition"
          >
            Switch to 2D Plan
          </button>
        </div>

      </div>

      {/* 3D CANVAS MOUNT */}
      <div className="flex-1 w-full h-full relative">
        <div ref={mountRef} className="w-full h-full" />

        {/* Floating 3D Room Label Cards */}
        {showRoomLabels3D && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-4 left-4 bg-white/90 border border-slate-200 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md text-xs font-mono font-bold text-slate-800">
              Plot: {plotW} ft × {plotL} ft ({plotW * plotL} sq.ft)
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white backdrop-blur-md px-3 py-2 rounded-xl shadow-lg text-xs font-mono border border-slate-700 space-y-1">
              <div className="font-extrabold text-sky-300 uppercase tracking-wider">3D Building Legend</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 bg-white inline-block rounded-xs border border-slate-400"></span> Exterior Walls
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 bg-amber-800 inline-block rounded-xs"></span> Wood Doors
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 bg-sky-400 inline-block rounded-xs"></span> Glass Windows
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 bg-purple-600 inline-block rounded-xs"></span> 3D Staircase
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
