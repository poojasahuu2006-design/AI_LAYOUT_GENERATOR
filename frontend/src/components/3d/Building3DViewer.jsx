import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { 
  Box, Eye, Layers, Maximize2, RotateCcw, Compass, Camera, 
  Sliders, ChevronRight, X, Sparkles, Ruler, Download, Scissors, 
  Sun, Check, AlertCircle, Info, ChevronDown, SplitSquareVertical
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
import { buildBimModel } from '../../services/bimModelEngine';
import { exportThreeSceneToObj, exportBimJson, capture3DScreenshot } from '../../utils/bimExportUtils';

export default function Building3DViewer({ 
  layout, 
  onSwitchTo2D, 
  onSelectRoom,
  bimSettings = {},
  onUpdateBimSettings
}) {
  const mountRef = useRef(null);

  // 1. BIM Model Generation from Synchronized 2D Layout Geometry
  const bimModel = useMemo(() => {
    return buildBimModel(layout, bimSettings);
  }, [layout, bimSettings]);

  // 2. View Navigation & Level Selection State
  const [activeLevelView, setActiveLevelView] = useState('all'); // 'all' | 'level_0' | 'level_1'
  const [viewStyle, setViewStyle] = useState('cutaway'); // 'cutaway' (3D Floor Plan) | 'full' (Full Facade)
  const [displayMode, setDisplayMode] = useState('presentation'); // 'presentation' | 'technical'
  const [showRoof, setShowRoof] = useState(false); // Default false in cutaway, true in full
  const [showFurniture, setShowFurniture] = useState(true);
  const [showRoomLabels, setShowRoomLabels] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('noon'); // 'morning' | 'noon' | 'sunset'
  const [explodedDistance, setExplodedDistance] = useState(0); // 0 to 20 ft
  const [isSectionActive, setIsSectionActive] = useState(false);
  const [sectionHeight, setSectionHeight] = useState(12); // ft

  // Automatically adjust roof & view style when switching levels
  const handleLevelChange = (newLevel) => {
    setActiveLevelView(newLevel);
    if (newLevel !== 'all') {
      // In isolated floor mode, show as 3D floor plan so user can see inside rooms!
      setViewStyle('cutaway');
      setShowRoof(false);
    }
  };

  // Selected BIM Element Inspector State
  const [selectedBimObject, setSelectedBimObject] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Three.js Scene References
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const buildingGroupRef = useRef(null);
  const clippingPlaneRef = useRef(null);
  const selectionBoxRef = useRef(null);

  const plotW = bimModel.plot.width;
  const plotL = bimModel.plot.length;
  const unit = bimModel.settings.unit;

  // Sync selected room from external parent
  useEffect(() => {
    if (selectedBimObject && selectedBimObject.type === 'room' && onSelectRoom) {
      onSelectRoom(selectedBimObject.id);
    }
  }, [selectedBimObject]);

  // 3. Initialize Three.js Scene & Render Engine
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const bgColors = {
      morning: 0xf0f9ff,
      noon: 0xf8fafc,
      sunset: 0xfef3c7
    };
    scene.background = new THREE.Color(bgColors[timeOfDay] || 0xf8fafc);
    scene.fog = new THREE.FogExp2(scene.background.getHex(), 0.003);

    // --- Camera Setup: Elevated 45° Architectural Perspective ---
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 1000);
    const camDist = Math.max(plotW, plotL) * 1.5;
    const isSingleFloor = activeLevelView !== 'all';
    
    camera.position.set(plotW * 1.35, camDist * 1.1, plotL * 1.4);
    cameraRef.current = camera;

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = timeOfDay === 'noon' ? 1.05 : 0.95;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Orbit Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep camera above ground
    controls.minDistance = 5;
    controls.maxDistance = 250;
    
    const targetY = isSingleFloor ? 2.5 : (bimModel.levels.length * bimModel.settings.floorHeight * 0.35);
    controls.target.set(plotW / 2, targetY, plotL / 2);
    controlsRef.current = controls;

    // --- Lighting Rig ---
    const ambientLight = new THREE.AmbientLight(0xffffff, timeOfDay === 'noon' ? 0.75 : 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.45);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    const sunDist = Math.max(plotW, plotL) * 2;
    if (timeOfDay === 'morning') {
      dirLight.position.set(-sunDist, sunDist * 0.9, sunDist * 0.6);
      dirLight.color.setHex(0xffedd5);
    } else if (timeOfDay === 'sunset') {
      dirLight.position.set(sunDist * 1.2, sunDist * 0.5, -sunDist * 0.4);
      dirLight.color.setHex(0xf97316);
    } else {
      dirLight.position.set(sunDist * 0.8, sunDist * 1.3, sunDist);
      dirLight.color.setHex(0xffffff);
    }
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = sunDist * 3;
    const shadowSize = Math.max(plotW, plotL) * 1.4;
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    dirLight.shadow.bias = -0.00015;
    scene.add(dirLight);

    // --- Section Clipping Plane ---
    const clippingPlanes = [];
    if (isSectionActive) {
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionHeight);
      clippingPlanes.push(plane);
      clippingPlaneRef.current = plane;
    } else {
      clippingPlaneRef.current = null;
    }

    // --- Textures & Architectural Materials ---
    const isTech = displayMode === 'technical';
    const isCutaway = viewStyle === 'cutaway';
    const wallHeightEffective = isCutaway ? 4.5 : bimModel.settings.floorHeight;

    const concreteTex = createConcreteTexture();
    const stuccoExtTex = createStuccoWallTexture('#f3efe6');
    const stuccoIntTex = createStuccoWallTexture('#faf8f5');
    const teakWoodTex = createTeakWoodTexture();
    const grassTex = createGrassTexture();

    const materials = {
      // Exterior Wall with warm modern plaster
      wallExt: new THREE.MeshStandardMaterial({ 
        map: stuccoExtTex, 
        color: isTech ? '#cbd5e1' : '#f8fafc',
        roughness: 0.85, 
        clippingPlanes, 
        clipShadows: true 
      }),
      
      // Interior Partition Wall
      wallInt: new THREE.MeshStandardMaterial({ 
        map: stuccoIntTex, 
        color: isTech ? '#e2e8f0' : '#ffffff',
        roughness: 0.9, 
        clippingPlanes, 
        clipShadows: true 
      }),

      // Dark Poche / Cut Cap for top of cut walls (Iconic Revit architectural section look)
      wallCutCap: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.5,
        clippingPlanes
      }),

      // Concrete Plinth & Foundation Beam
      plinthBeam: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.7,
        clippingPlanes
      }),

      // Intermediate Slabs & Ceilings
      slabConcrete: new THREE.MeshStandardMaterial({ 
        map: concreteTex, 
        color: '#e2e8f0',
        roughness: 0.7, 
        clippingPlanes, 
        clipShadows: true 
      }),

      // Doors & Openings
      doorWood: new THREE.MeshStandardMaterial({ map: teakWoodTex, roughness: 0.45, clippingPlanes }),
      doorFrame: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, clippingPlanes }),
      doorHandle: new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.9, roughness: 0.2, clippingPlanes }),

      // Windows
      windowFrame: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, clippingPlanes }),
      windowSill: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6, clippingPlanes }),
      windowGlass: new THREE.MeshPhysicalMaterial({ 
        color: '#bae6fd', 
        transmission: 0.85, 
        opacity: 0.35, 
        transparent: true, 
        roughness: 0.05, 
        metalness: 0.1,
        ior: 1.5,
        clippingPlanes 
      }),

      // Balcony Tempered Glass Railing
      glassRailing: new THREE.MeshPhysicalMaterial({
        color: '#93c5fd',
        transmission: 0.9,
        opacity: 0.45,
        transparent: true,
        roughness: 0.1,
        metalness: 0.1,
        clippingPlanes
      }),
      railingPost: new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8, roughness: 0.2 }),

      // Stairs
      stairTread: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.4, clippingPlanes }),
      stairWaist: new THREE.MeshStandardMaterial({ map: concreteTex, color: '#94a3b8', roughness: 0.7, clippingPlanes }),
      stairRailing: new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8, roughness: 0.2, clippingPlanes }),

      // Roof
      roofSlab: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8, clippingPlanes }),
      roofParapet: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.85, clippingPlanes }),
      roofCoping: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, clippingPlanes }),
      roofTile: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.65, clippingPlanes }),

      // Site Landscape
      grassLawn: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95 }),
      curbStone: new THREE.MeshStandardMaterial({ map: concreteTex, color: '#94a3b8', roughness: 0.75 })
    };

    // --- Master Building Geometry Group ---
    const masterBuildingGroup = new THREE.Group();
    buildingGroupRef.current = masterBuildingGroup;
    scene.add(masterBuildingGroup);

    // 1. Exterior Site Ground & Curb
    const siteMargin = Math.max(plotW, plotL) * 0.35;
    const siteMesh = new THREE.Mesh(
      new THREE.BoxGeometry(plotW + siteMargin * 2, 0.4, plotL + siteMargin * 2),
      materials.grassLawn
    );
    siteMesh.position.set(plotW / 2, -0.2, plotL / 2);
    siteMesh.receiveShadow = true;
    masterBuildingGroup.add(siteMesh);

    // Plot Foundation Curb
    const curbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(plotW + 3, 0.25, plotL + 3),
      materials.curbStone
    );
    curbMesh.position.set(plotW / 2, -0.05, plotL / 2);
    curbMesh.receiveShadow = true;
    masterBuildingGroup.add(curbMesh);

    // 2. Build Each BIM Level Geometry
    bimModel.levelData.forEach((ld, levelIdx) => {
      const level = ld.level;
      if (level.floorType === 'roof') return;

      // Filter level visibility
      if (activeLevelView !== 'all' && activeLevelView !== level.id) {
        return;
      }

      // CRITICAL FIX: In isolated single-floor view, normalize elevation so floor rests on ground!
      const isIsolated = activeLevelView !== 'all';
      const groundElevationOffset = isIsolated ? -level.elevation : 0;
      const explodeY = explodedDistance * levelIdx;

      const levelGroup = new THREE.Group();
      levelGroup.name = `Level_${level.name}`;
      levelGroup.position.y = groundElevationOffset + explodeY;

      // A. Ground Plinth Slab or Intermediate Floor Slab
      (ld.floors || []).forEach(slab => {
        const slabMesh = buildBimSlabMesh(slab, materials, isTech);
        slabMesh.userData = { bimType: 'slab', data: slab, level };
        levelGroup.add(slabMesh);
      });

      // B. Room Floor Finishes (Tile, Wood, Marble per room)
      ld.rooms.forEach(room => {
        const roomFloorMesh = buildRoomFloorMesh(room, level.elevation, materials);
        roomFloorMesh.userData = { bimType: 'room', data: room, level };
        levelGroup.add(roomFloorMesh);

        // Balcony Glass Railing
        if (room.type === 'Balcony') {
          const balconyRail = buildBalconyGlassRailing(room, level.elevation, materials);
          levelGroup.add(balconyRail);
        }

        // Optional 3D Furniture
        if (showFurniture) {
          const furn = buildRoomFurniture(room, level.elevation, materials);
          furn.userData = { bimType: 'furniture', roomId: room.id };
          levelGroup.add(furn);
        }

        // Optional 3D Room Badges (Tags with Name and Dimensions)
        if (showRoomLabels && isCutaway) {
          const badge = createRoomLabelSprite(room, level.elevation + wallHeightEffective + 1.2);
          levelGroup.add(badge);
        }
      });

      // C. Parametric Architectural Walls with True Openings
      ld.walls.forEach(wall => {
        const wallGroup = buildParametricWallWithOpenings(
          wall, 
          materials, 
          isTech, 
          wallHeightEffective,
          isCutaway
        );
        wallGroup.userData = { bimType: 'wall', data: wall, level };
        levelGroup.add(wallGroup);
      });

      // D. Architectural 3D Staircases (Only connects Ground to First Floor)
      ld.stairs.forEach(stair => {
        const stairGroup = buildArchitecturalStair(stair, materials);
        stairGroup.userData = { bimType: 'stair', data: stair, level };
        levelGroup.add(stairGroup);
      });

      masterBuildingGroup.add(levelGroup);
    });

    // 3. Build Parametric Roof System (Only in Full Facade mode or when roof explicitly toggled)
    const shouldRenderRoof = showRoof && (activeLevelView === 'all' || activeLevelView === 'roof');
    if (shouldRenderRoof) {
      const roofLevel = bimModel.levels.find(l => l.floorType === 'roof') || bimModel.levels[bimModel.levels.length - 1];
      const roofExplodeY = explodedDistance * (bimModel.levels.length - 1);
      const roofGroup = buildBimRoofSystem(bimModel.roof, roofLevel, materials, isTech);
      roofGroup.position.y = roofExplodeY;
      roofGroup.userData = { bimType: 'roof', data: bimModel.roof, level: roofLevel };
      masterBuildingGroup.add(roofGroup);
    }

    // 4. Technical Mode: Level Datum Lines & Elevation Markers
    if (isTech) {
      const datumGroup = buildBimLevelDatums(bimModel.levels, plotW, plotL, unit);
      masterBuildingGroup.add(datumGroup);
    }

    // --- Interactive Raycasting for Object Selection ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(masterBuildingGroup.children, true);

      if (intersects.length > 0) {
        let target = intersects[0].object;
        while (target && target !== masterBuildingGroup && !target.userData?.bimType) {
          target = target.parent;
        }

        if (target && target.userData?.bimType) {
          const { bimType, data, level } = target.userData;
          setSelectedBimObject({
            type: bimType,
            data,
            level,
            object3d: target
          });
          setInspectorOpen(true);

          if (selectionBoxRef.current) {
            scene.remove(selectionBoxRef.current);
          }
          const boxHelper = new THREE.BoxHelper(target, 0x06b6d4);
          boxHelper.material.depthTest = false;
          boxHelper.material.transparent = true;
          boxHelper.material.opacity = 0.9;
          selectionBoxRef.current = boxHelper;
          scene.add(boxHelper);
          return;
        }
      }

      if (selectionBoxRef.current) {
        scene.remove(selectionBoxRef.current);
        selectionBoxRef.current = null;
      }
      setSelectedBimObject(null);
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // --- Resize Observer ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      if (selectionBoxRef.current) {
        selectionBoxRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
    };
  }, [
    bimModel, 
    activeLevelView, 
    viewStyle, 
    displayMode, 
    showRoof, 
    showFurniture, 
    showRoomLabels, 
    timeOfDay, 
    explodedDistance, 
    isSectionActive, 
    sectionHeight
  ]);

  // --- Camera View Presets ---
  const setCameraPreset = (preset) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const midX = plotW / 2;
    const midZ = plotL / 2;
    const dist = Math.max(plotW, plotL) * 1.5;
    const isSingleFloor = activeLevelView !== 'all';
    const targetY = isSingleFloor ? 2.5 : (bimModel.levels.length * bimModel.settings.floorHeight * 0.35);

    controls.target.set(midX, targetY, midZ);

    switch (preset) {
      case 'top':
        camera.position.set(midX, dist * 1.6, midZ + 0.01);
        break;
      case 'front':
        camera.position.set(midX, targetY + dist * 0.3, midZ + dist);
        break;
      case 'side':
        camera.position.set(midX - dist, targetY + dist * 0.3, midZ);
        break;
      case 'iso':
      default:
        camera.position.set(plotW * 1.35, dist * 1.1, plotL * 1.4);
        break;
    }
    controls.update();
  };

  const handleFitToScreen = () => {
    setCameraPreset('iso');
  };

  // --- Export Handlers ---
  const handleExportObj = () => {
    if (buildingGroupRef.current) {
      exportThreeSceneToObj(buildingGroupRef.current, `${bimModel.name.replace(/\s+/g, '_')}_BIM.obj`);
    }
  };

  const handleScreenshot = () => {
    if (rendererRef.current) {
      capture3DScreenshot(rendererRef.current, `${bimModel.name.replace(/\s+/g, '_')}_3D.png`);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 overflow-hidden select-none font-sans">
      
      {/* 1. TOP COMPACT ARCHITECTURAL CONTROL BAR */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Island: Level Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg pointer-events-auto">
          <button
            onClick={() => handleLevelChange('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeLevelView === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> 3D Building
          </button>

          {bimModel.levels.filter(l => l.floorType !== 'roof').map(lvl => (
            <button
              key={lvl.id}
              onClick={() => handleLevelChange(lvl.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLevelView === lvl.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> {lvl.name}
            </button>
          ))}
        </div>

        {/* Right Island: View Style + Camera Presets + Export */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg pointer-events-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => { setViewStyle('cutaway'); setShowRoof(false); }}
              className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 text-[11px] ${
                viewStyle === 'cutaway' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show 3D Floor Plan Interior with cut walls & furniture"
            >
              <SplitSquareVertical className="w-3 h-3 text-amber-300" /> 3D Plan
            </button>
            <button
              onClick={() => { setViewStyle('full'); setShowRoof(true); }}
              className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 text-[11px] ${
                viewStyle === 'full' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show Full Building Exterior Facade"
            >
              <Box className="w-3 h-3" /> Facade
            </button>
          </div>

          <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

          {/* Camera Presets */}
          <div className="flex items-center gap-0.5">
            <button 
              onClick={() => setCameraPreset('iso')} 
              title="Isometric 3D View"
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-medium"
            >
              Iso
            </button>
            <button 
              onClick={() => setCameraPreset('top')} 
              title="Plan / Top View"
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-medium"
            >
              Top
            </button>
            <button 
              onClick={() => setCameraPreset('front')} 
              title="Front Elevation"
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-medium"
            >
              Front
            </button>
            <button 
              onClick={handleFitToScreen} 
              title="Fit to Screen"
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

          {/* Quick Exports */}
          <button
            onClick={handleScreenshot}
            title="Download Screenshot"
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
          </button>

          <button
            onClick={handleExportObj}
            title="Export OBJ 3D Model"
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-md text-[11px] font-bold flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> OBJ
          </button>
        </div>
      </div>

      {/* 2. THREE.JS 3D VIEWPORT CANVAS */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing outline-hidden" />

      {/* 3. BOTTOM CENTERED ARCHITECTURAL TOOLBAR */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl text-xs text-slate-200">
          
          {/* Roof Toggle */}
          <button
            onClick={() => setShowRoof(prev => !prev)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              showRoof ? 'bg-slate-800 text-sky-400 border border-sky-500/30' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Eye className="w-3 h-3" /> {showRoof ? 'Roof: ON' : 'Roof: OFF'}
          </button>

          {/* Furniture Toggle */}
          <button
            onClick={() => setShowFurniture(prev => !prev)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              showFurniture ? 'bg-slate-800 text-sky-400 border border-sky-500/30' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            {showFurniture ? 'Furniture: ON' : 'Furniture: OFF'}
          </button>

          {/* Room Labels Toggle */}
          <button
            onClick={() => setShowRoomLabels(prev => !prev)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              showRoomLabels ? 'bg-slate-800 text-sky-400 border border-sky-500/30' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            {showRoomLabels ? 'Tags: ON' : 'Tags: OFF'}
          </button>

          <div className="h-3.5 w-px bg-slate-700" />

          {/* Exploded Axonometric Slider */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/80 rounded-lg">
            <span className="font-semibold text-slate-400 text-[10px]">Explode:</span>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={explodedDistance}
              onChange={(e) => setExplodedDistance(Number(e.target.value))}
              className="w-16 accent-sky-500 cursor-pointer"
            />
            <span className="font-mono text-sky-400 text-[10px] w-5">{explodedDistance}'</span>
          </div>

          <div className="h-3.5 w-px bg-slate-700" />

          {/* Revit Section Cut */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSectionActive(prev => !prev)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                isSectionActive ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Scissors className="w-3 h-3" /> Section
            </button>

            {isSectionActive && (
              <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-lg">
                <input
                  type="range"
                  min="2"
                  max={Math.max(20, bimModel.levels.length * bimModel.settings.floorHeight)}
                  step="0.5"
                  value={sectionHeight}
                  onChange={(e) => setSectionHeight(Number(e.target.value))}
                  className="w-16 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-amber-400 text-[10px]">{sectionHeight} {unit}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. REVIT-STYLE BIM PROPERTIES INSPECTOR PANEL (Right Sidebar) */}
      {inspectorOpen && selectedBimObject && (
        <div className="absolute top-20 right-4 z-30 w-80 max-h-[80vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-200 transition-all animate-in slide-in-from-right-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="font-black text-sm uppercase tracking-wider text-cyan-300">
                BIM Element Inspector
              </h3>
            </div>
            <button 
              onClick={() => setInspectorOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            {/* Category / Family */}
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category / Family</span>
              <p className="text-sm font-extrabold text-white mt-0.5">
                {selectedBimObject.type === 'wall' && `${selectedBimObject.data.type === 'exterior' ? 'Exterior Masonry Wall' : 'Interior Partition Wall'}`}
                {selectedBimObject.type === 'door' && (selectedBimObject.data.type || 'Single Flush Door')}
                {selectedBimObject.type === 'window' && (selectedBimObject.data.type || 'Glazed Casement Window')}
                {selectedBimObject.type === 'room' && `Room: ${selectedBimObject.data.name}`}
                {selectedBimObject.type === 'stair' && 'Monolithic Architectural Stair'}
                {selectedBimObject.type === 'slab' && 'Cast-in-Place Concrete Slab'}
                {selectedBimObject.type === 'roof' && 'Building Roof System'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-800 text-cyan-400 text-[10px] font-mono">
                ID: {selectedBimObject.data.id || 'BIM_EL_01'}
              </span>
            </div>

            {/* Base Level Constraint */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Base Constraint:</span>
              <span className="font-bold text-white">{selectedBimObject.level?.name || 'Ground Floor'}</span>
            </div>

            {/* Parametric Dimensions */}
            {selectedBimObject.type === 'wall' && (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Wall Length:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.length} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Height:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.height} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Thickness:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.thickness} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Wall Area:</span>
                  <span className="font-mono font-bold text-cyan-400">{Math.round(selectedBimObject.data.length * selectedBimObject.data.height)} sq.{unit}</span>
                </div>
              </>
            )}

            {selectedBimObject.type === 'room' && (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Dimensions (W × L):</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.width}' × {selectedBimObject.data.height}'</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Calculated Area:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedBimObject.data.area} sq.{unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Carpet Area:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedBimObject.data.carpetArea} sq.{unit}</span>
                </div>
              </>
            )}

            {selectedBimObject.type === 'door' && (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Door Width:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.width} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Door Height:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.height} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Connected Room:</span>
                  <span className="font-bold text-white">{selectedBimObject.data.roomName}</span>
                </div>
              </>
            )}

            {selectedBimObject.type === 'window' && (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Window Width:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.width} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Window Height:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.height} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Sill Height:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedBimObject.data.sillHeight} {unit}</span>
                </div>
              </>
            )}

            <div className="p-3 bg-sky-950/40 border border-sky-800/40 rounded-2xl text-[11px] text-sky-300">
              <span className="font-bold flex items-center gap-1 mb-1">
                <Info className="w-3.5 h-3.5" /> NBC 2016 Compliant
              </span>
              Parametric BIM component linked synchronously with 2D plan geometry.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// THREE.JS 3D MESH GENERATION HELPERS
// ============================================================================

/**
 * Builds a parametric wall segment with clean openings.
 * Supports Cutaway 3D Floor Plan mode (4.5 ft walls with dark cut cap)
 * and Full Building Facade mode (10 ft walls).
 */
function buildParametricWallWithOpenings(wall, materials, isTech, targetHeight, isCutaway) {
  const group = new THREE.Group();
  group.name = wall.id;

  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const height = targetHeight;
  const thickness = wall.thickness;
  const wallMat = wall.type === 'exterior' ? materials.wallExt : materials.wallInt;

  group.position.set(wall.start.x, wall.baseElevation, wall.start.y);
  group.rotation.y = -angle;

  const openings = [...(wall.openings || [])].sort((a, b) => a.offset - b.offset);

  let currentU = 0;

  openings.forEach((op) => {
    const opStart = Math.max(0, Math.min(length, op.offset));
    const opEnd = Math.max(0, Math.min(length, opStart + op.width));
    const opW = opEnd - opStart;

    // 1. Solid wall section before opening
    if (opStart > currentU + 0.05) {
      const segLen = opStart - currentU;
      const segMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen, height, thickness), wallMat);
      segMesh.position.set(currentU + segLen / 2, height / 2, 0);
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      group.add(segMesh);

      // Dark Poche Top Cap in Cutaway Mode
      if (isCutaway) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.06, thickness + 0.02), materials.wallCutCap);
        cap.position.set(currentU + segLen / 2, height + 0.03, 0);
        group.add(cap);
      }
    }

    // 2. Wall section at opening
    if (opW > 0.1) {
      // Sill wall below window
      if (op.sillHeight > 0.05 && op.sillHeight < height) {
        const actualSillH = Math.min(op.sillHeight, height);
        const sillMesh = new THREE.Mesh(new THREE.BoxGeometry(opW, actualSillH, thickness), wallMat);
        sillMesh.position.set(opStart + opW / 2, actualSillH / 2, 0);
        sillMesh.castShadow = true;
        sillMesh.receiveShadow = true;
        group.add(sillMesh);
      }

      // Lintel wall above opening (only in Full Facade mode)
      if (!isCutaway) {
        const lintelY = op.sillHeight + op.height;
        if (height > lintelY + 0.05) {
          const lintelH = height - lintelY;
          const lintelMesh = new THREE.Mesh(new THREE.BoxGeometry(opW, lintelH, thickness), wallMat);
          lintelMesh.position.set(opStart + opW / 2, lintelY + lintelH / 2, 0);
          lintelMesh.castShadow = true;
          lintelMesh.receiveShadow = true;
          group.add(lintelMesh);
        }
      }

      // Insert 3D Architectural Component (Door or Window)
      const compH = isCutaway ? Math.min(op.height, height) : op.height;
      if (op.type === 'door') {
        const doorComp = build3DDoorComponent(opW, compH, thickness, materials);
        doorComp.position.set(opStart, 0, 0);
        group.add(doorComp);
      } else if (op.type === 'window' && op.sillHeight < height) {
        const winCompH = Math.min(op.height, height - op.sillHeight);
        if (winCompH > 0.5) {
          const winComp = build3DWindowComponent(opW, winCompH, thickness, materials);
          winComp.position.set(opStart, op.sillHeight, 0);
          group.add(winComp);
        }
      }
    }

    currentU = opEnd;
  });

  // 3. Final solid wall section after last opening
  if (length > currentU + 0.05) {
    const segLen = length - currentU;
    const segMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen, height, thickness), wallMat);
    segMesh.position.set(currentU + segLen / 2, height / 2, 0);
    segMesh.castShadow = true;
    segMesh.receiveShadow = true;
    group.add(segMesh);

    // Dark Poche Top Cap
    if (isCutaway) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.06, thickness + 0.02), materials.wallCutCap);
      cap.position.set(currentU + segLen / 2, height + 0.03, 0);
      group.add(cap);
    }
  }

  return group;
}

/**
 * Builds realistic 3D Door Component with frame, swinging panel, and handle
 */
function build3DDoorComponent(width, height, wallThick, materials) {
  const group = new THREE.Group();

  const frameThick = 0.14;
  const frameMat = materials.doorFrame;
  const leafMat = materials.doorWood;

  // Left Jamb
  const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, wallThick + 0.04), frameMat);
  leftJamb.position.set(frameThick / 2, height / 2, 0);
  group.add(leftJamb);

  // Right Jamb
  const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, wallThick + 0.04), frameMat);
  rightJamb.position.set(width - frameThick / 2, height / 2, 0);
  group.add(rightJamb);

  // Door Leaf swinging open 35° into the room
  const leafW = width - frameThick * 2;
  const leafH = height - frameThick * 0.5;
  const leafThick = 0.12;

  const leafGroup = new THREE.Group();
  leafGroup.position.set(frameThick, 0, 0); // Hinge pivot

  const leafMesh = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafThick), leafMat);
  leafMesh.position.set(leafW / 2, leafH / 2, 0);
  leafMesh.castShadow = true;
  leafGroup.add(leafMesh);

  // Lever Handle
  const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
  const handle = new THREE.Mesh(handleGeo, materials.doorHandle);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(leafW * 0.85, Math.min(3.2, leafH * 0.5), leafThick / 2 + 0.08);
  leafGroup.add(handle);

  leafGroup.rotation.y = Math.PI / 5.5; // ~33° swing
  group.add(leafGroup);

  return group;
}

/**
 * Builds 3D Window Component with outer frame, glazed pane, and exterior sill
 */
function build3DWindowComponent(width, height, wallThick, materials) {
  const group = new THREE.Group();

  const frameThick = 0.12;
  const frameMat = materials.windowFrame;
  const glassMat = materials.windowGlass;

  // Glass Pane
  const glassGeo = new THREE.BoxGeometry(width - frameThick * 2, height - frameThick * 2, 0.04);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(width / 2, height / 2, 0);
  group.add(glassMesh);

  // Vertical Central Mullion
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height - frameThick * 2, wallThick * 0.8), frameMat);
  mullion.position.set(width / 2, height / 2, 0);
  group.add(mullion);

  // Outer Frame Perimeter
  const bLeft = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, wallThick * 0.85), frameMat);
  bLeft.position.set(frameThick / 2, height / 2, 0);
  group.add(bLeft);

  const bRight = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, wallThick * 0.85), frameMat);
  bRight.position.set(width - frameThick / 2, height / 2, 0);
  group.add(bRight);

  // Exterior Sill Ledge
  const bBottom = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.15, wallThick + 0.2), materials.windowSill);
  bBottom.position.set(width / 2, 0.08, 0);
  group.add(bBottom);

  return group;
}

/**
 * Builds Balcony Railing with tinted tempered glass panels and metal posts
 */
function buildBalconyGlassRailing(room, elevation, materials) {
  const group = new THREE.Group();
  const rw = room.width;
  const rh = room.height;
  const railH = 3.2;

  // Front glass panel
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(rw, railH, 0.08), materials.glassRailing);
  frontGlass.position.set(room.x + rw / 2, elevation + 0.5 + railH / 2, room.y + rh);
  group.add(frontGlass);

  // Top handrail bar
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.12, 0.16), materials.railingPost);
  topRail.position.set(room.x + rw / 2, elevation + 0.5 + railH + 0.06, room.y + rh);
  group.add(topRail);

  // Metal corner posts
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, railH + 0.1, 0.15), materials.railingPost);
  p1.position.set(room.x + 0.1, elevation + 0.5 + railH / 2, room.y + rh);
  group.add(p1);

  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, railH + 0.1, 0.15), materials.railingPost);
  p2.position.set(room.x + rw - 0.1, elevation + 0.5 + railH / 2, room.y + rh);
  group.add(p2);

  return group;
}

/**
 * Builds architectural concrete floor slab with plinth beam band
 */
function buildBimSlabMesh(slab, materials, isTech) {
  const thick = slab.thickness || 0.5;
  const w = slab.width;
  const l = slab.length;

  const group = new THREE.Group();

  // If upper floor slab has staircase void hole, extrude with hole
  if (slab.voids && slab.voids.length > 0) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w, l);
    shape.lineTo(0, l);
    shape.closePath();

    slab.voids.forEach(v => {
      const hole = new THREE.Path();
      const vx = Math.max(0, v.x - slab.x);
      const vy = Math.max(0, v.y - slab.y);
      hole.moveTo(vx, vy);
      hole.lineTo(vx + v.width, vy);
      hole.lineTo(vx + v.width, vy + v.length);
      hole.lineTo(vx, vy + v.length);
      hole.closePath();
      shape.holes.push(hole);
    });

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
    extrudeGeo.rotateX(Math.PI / 2);

    const slabMesh = new THREE.Mesh(extrudeGeo, materials.slabConcrete);
    slabMesh.position.set(slab.x, slab.elevation + thick, slab.y);
    slabMesh.receiveShadow = true;
    slabMesh.castShadow = true;
    group.add(slabMesh);
    return group;
  }

  // Ground plinth base band (1.5 ft foundation plinth)
  if (slab.elevation < 0.1) {
    const plinthGeo = new THREE.BoxGeometry(w + 0.4, 1.2, l + 0.4);
    const plinthMesh = new THREE.Mesh(plinthGeo, materials.plinthBeam);
    plinthMesh.position.set(slab.x + w / 2, 0.6, slab.y + l / 2);
    plinthMesh.receiveShadow = true;
    group.add(plinthMesh);
  }

  // Slab with Staircase Void Cutout support
  if (slab.voids && slab.voids.length > 0) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w, l);
    shape.lineTo(0, l);
    shape.closePath();

    slab.voids.forEach(v => {
      const hole = new THREE.Path();
      const hx = Math.max(0, v.x - slab.x);
      const hy = Math.max(0, v.y - slab.y);
      const hw = Math.min(w - hx, v.width);
      const hl = Math.min(l - hy, v.length);
      hole.moveTo(hx, hy);
      hole.lineTo(hx + hw, hy);
      hole.lineTo(hx + hw, hy + hl);
      hole.lineTo(hx, hy + hl);
      hole.closePath();
      shape.holes.push(hole);
    });

    const extrudeSettings = { depth: thick, bevelEnabled: false };
    const slabGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    slabGeo.rotateX(Math.PI / 2);
    const slabMesh = new THREE.Mesh(slabGeo, materials.slabConcrete);
    slabMesh.position.set(slab.x, slab.elevation + thick, slab.y);
    slabMesh.receiveShadow = true;
    slabMesh.castShadow = true;
    group.add(slabMesh);

    // Safety Guardrail around the upper floor void opening
    slab.voids.forEach(v => {
      const guardH = 2.8;
      const gGlassMat = materials.glassRailing || materials.stairRailing;

      // Outer side of void (east side facing rooms)
      const railEast = new THREE.Mesh(new THREE.BoxGeometry(0.12, guardH, v.length), gGlassMat);
      railEast.position.set(v.x + v.width, slab.elevation + thick + guardH / 2, v.y + v.length / 2);
      group.add(railEast);
    });
  } else {
    const slabGeo = new THREE.BoxGeometry(w, thick, l);
    const slabMesh = new THREE.Mesh(slabGeo, materials.slabConcrete);
    slabMesh.position.set(slab.x + w / 2, slab.elevation + thick / 2, slab.y + l / 2);
    slabMesh.receiveShadow = true;
    slabMesh.castShadow = true;
    group.add(slabMesh);
  }

  return group;
}

/**
 * Builds Room Floor Surface with appropriate material finish (wood, marble, tile)
 */
function buildRoomFloorMesh(room, elevation, materials) {
  // If it's the staircase well on the upper floor, do NOT cover the void!
  if (room.type === 'Staircase' && elevation > 0.1) {
    return new THREE.Group();
  }

  const rw = room.width - 0.08;
  const rh = room.height - 0.08;
  const geo = new THREE.BoxGeometry(rw, 0.08, rh);

  let mat = materials.slabConcrete;
  if (['Bedroom', 'Master Bedroom'].includes(room.type)) {
    mat = new THREE.MeshStandardMaterial({ color: '#c49a6c', roughness: 0.45 }); // Oak Hardwood
  } else if (room.type === 'Kitchen') {
    mat = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.3 }); // Polished Ceramic Tile
  } else if (['Bathroom', 'Washroom'].includes(room.type)) {
    mat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6 }); // Anti-skid Mosaic
  } else if (room.type === 'Living Room' || room.type === 'Hall') {
    mat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 }); // Italian White Marble
  } else if (room.type === 'Balcony') {
    mat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.7 }); // Paver Tiles
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(room.x + room.width / 2, elevation + 0.54, room.y + room.height / 2);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Creates 3D Floating Room Label Sprite
 */
function createRoomLabelSprite(room, yPos) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');

  // Background rounded pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 64, 16);
  ctx.fill();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Room Name
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(room.name, 128, 36);

  // Dimensions
  ctx.font = '16px monospace';
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(`${room.width}' × ${room.height}' (${room.area} sq.ft)`, 128, 58);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(room.x + room.width / 2, yPos, room.y + room.height / 2);
  sprite.scale.set(6, 2, 1);
  return sprite;
}

/**
 * Builds authentic Architectural Dog-Legged 3D Staircase
 */
function buildArchitecturalStair(stair, materials) {
  const group = new THREE.Group();
  group.name = stair.id;

  const totalRise = (stair.topElevation - stair.baseElevation) || 10.0;
  const stairW = stair.width;
  const stairL = stair.length;
  const isDogLegged = stair.isDogLegged !== false && stairW >= 5.5;

  if (isDogLegged) {
    // Two parallel flights with mid-landing (Standard Indian & International residential stair)
    const wellGap = 0.4;
    const flightW = Math.min((stairW - wellGap) / 2, 3.4);
    const landingD = Math.max(3.0, Math.min(3.6, stairL * 0.32));
    const runL = stairL - landingD;

    const riserCount1 = 8;
    const riserCount2 = 8;
    const riserH = totalRise / (riserCount1 + riserCount2);
    const treadD = runL / (riserCount1 - 1);

    // --- Flight 1 (Left flight, starts at entry Y, climbs towards landing at Y+runL) ---
    const f1X = stair.x + flightW / 2;
    for (let i = 0; i < riserCount1; i++) {
      const stepGeo = new THREE.BoxGeometry(flightW - 0.05, riserH, treadD);
      const stepMesh = new THREE.Mesh(stepGeo, materials.stairTread);
      stepMesh.position.set(
        f1X,
        stair.baseElevation + 0.5 + i * riserH + riserH / 2,
        stair.y + i * treadD + treadD / 2
      );
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      group.add(stepMesh);
    }

    // Flight 1 Structural Waist Slab
    const f1Len = Math.hypot(riserCount1 * riserH, runL);
    const f1Angle = Math.atan2(riserCount1 * riserH, runL);
    const waist1 = new THREE.Mesh(
      new THREE.BoxGeometry(flightW - 0.1, 0.4, f1Len),
      materials.stairWaist
    );
    waist1.position.set(
      f1X,
      stair.baseElevation + 0.5 + (riserCount1 * riserH) / 2 - 0.2,
      stair.y + runL / 2
    );
    waist1.rotation.x = f1Angle;
    group.add(waist1);

    // --- Mid-Landing Platform ---
    const landingElev = stair.baseElevation + 0.5 + riserCount1 * riserH;
    const landingGeo = new THREE.BoxGeometry(stairW - 0.1, 0.4, landingD);
    const landingMesh = new THREE.Mesh(landingGeo, materials.stairTread);
    landingMesh.position.set(
      stair.x + stairW / 2,
      landingElev - 0.2,
      stair.y + stairL - landingD / 2
    );
    landingMesh.castShadow = true;
    landingMesh.receiveShadow = true;
    group.add(landingMesh);

    // Landing Support Beam underneath
    const landBeam = new THREE.Mesh(
      new THREE.BoxGeometry(stairW - 0.1, 0.35, landingD),
      materials.stairWaist
    );
    landBeam.position.set(stair.x + stairW / 2, landingElev - 0.55, stair.y + stairL - landingD / 2);
    group.add(landBeam);

    // --- Flight 2 (Right flight, starts at landing, climbs back towards upper floor entry) ---
    const f2X = stair.x + stairW - flightW / 2;
    for (let i = 0; i < riserCount2; i++) {
      const stepGeo = new THREE.BoxGeometry(flightW - 0.05, riserH, treadD);
      const stepMesh = new THREE.Mesh(stepGeo, materials.stairTread);
      stepMesh.position.set(
        f2X,
        landingElev + i * riserH + riserH / 2,
        (stair.y + runL) - i * treadD - treadD / 2
      );
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      group.add(stepMesh);
    }

    // Flight 2 Structural Waist Slab
    const f2Len = Math.hypot(riserCount2 * riserH, runL);
    const f2Angle = -Math.atan2(riserCount2 * riserH, runL);
    const waist2 = new THREE.Mesh(
      new THREE.BoxGeometry(flightW - 0.1, 0.4, f2Len),
      materials.stairWaist
    );
    waist2.position.set(
      f2X,
      landingElev + (riserCount2 * riserH) / 2 - 0.2,
      stair.y + runL / 2
    );
    waist2.rotation.x = f2Angle;
    group.add(waist2);

    // --- Modern Railings along Central Stair Well ---
    const railH = 2.8;
    const rail1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, f1Len, 8),
      materials.stairRailing
    );
    rail1.position.set(
      stair.x + flightW + 0.05,
      stair.baseElevation + 0.5 + (riserCount1 * riserH) / 2 + railH,
      stair.y + runL / 2
    );
    rail1.rotation.x = -f1Angle + Math.PI / 2;
    group.add(rail1);

    const rail2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, f2Len, 8),
      materials.stairRailing
    );
    rail2.position.set(
      stair.x + stairW - flightW - 0.05,
      landingElev + (riserCount2 * riserH) / 2 + railH,
      stair.y + runL / 2
    );
    rail2.rotation.x = f1Angle + Math.PI / 2;
    group.add(rail2);

    const crossRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, stairW - 0.4, 8),
      materials.stairRailing
    );
    crossRail.position.set(stair.x + stairW / 2, landingElev + railH, stair.y + stairL - 0.15);
    crossRail.rotation.z = Math.PI / 2;
    group.add(crossRail);

  } else {
    // Straight Flight
    const riserCount = stair.riserCount || 16;
    const riserH = totalRise / riserCount;
    const treadD = (stairL - 0.5) / (riserCount - 1);
    const flightW = Math.min(stairW - 0.2, 3.4);

    for (let i = 0; i < riserCount; i++) {
      const stepGeo = new THREE.BoxGeometry(flightW, riserH, treadD);
      const stepMesh = new THREE.Mesh(stepGeo, materials.stairTread);
      stepMesh.position.set(
        stair.x + stairW / 2,
        stair.baseElevation + 0.5 + i * riserH + riserH / 2,
        stair.y + i * treadD + treadD / 2
      );
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      group.add(stepMesh);
    }

    const railLen = Math.hypot(riserCount * riserH, riserCount * treadD);
    const railGeo = new THREE.CylinderGeometry(0.05, 0.05, railLen, 8);
    const rail = new THREE.Mesh(railGeo, materials.stairRailing);
    rail.position.set(
      stair.x + stairW / 2 + flightW / 2 - 0.1,
      stair.baseElevation + 0.5 + (riserCount * riserH) / 2 + 2.8,
      stair.y + (riserCount * treadD) / 2
    );
    rail.rotation.x = -Math.atan2(riserCount * riserH, riserCount * treadD) + Math.PI / 2;
    group.add(rail);
  }

  return group;
}

/**
 * Builds Parametric Building Roof System (Flat Parapet / Hip / Gable)
 */
function buildBimRoofSystem(roof, roofLevel, materials, isTech) {
  const group = new THREE.Group();
  group.name = 'BIM_Roof_System';

  const w = roof.width;
  const l = roof.length;
  const overhang = roof.overhang;
  const elev = roof.elevation;

  if (roof.type === 'sloped_hip' || roof.type === 'sloped_gable') {
    const roofH = (w / 2) * Math.tan((roof.pitchAngle * Math.PI) / 180);
    const roofGeo = new THREE.ConeGeometry((w + overhang * 2) * 0.7, roofH, 4);
    roofGeo.rotateY(Math.PI / 4);

    const roofMesh = new THREE.Mesh(roofGeo, materials.roofTile);
    roofMesh.position.set(roof.x + w / 2, elev + roofH / 2 + 0.3, roof.y + l / 2);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);
  } else {
    // RC Roof Slab
    const slabGeo = new THREE.BoxGeometry(w + overhang * 2, 0.5, l + overhang * 2);
    const slabMesh = new THREE.Mesh(slabGeo, materials.roofSlab);
    slabMesh.position.set(roof.x + w / 2, elev + 0.25, roof.y + l / 2);
    slabMesh.castShadow = true;
    slabMesh.receiveShadow = true;
    group.add(slabMesh);

    // Parapet Wall (3ft / 0.9m) with Coping Cap along perimeter
    const pHeight = roof.parapetHeight || 3.0;
    const pThick = 0.5;

    // Parapet North & South
    const nParapet = new THREE.Mesh(new THREE.BoxGeometry(w + overhang * 2, pHeight, pThick), materials.roofParapet);
    nParapet.position.set(roof.x + w / 2, elev + 0.5 + pHeight / 2, roof.y - overhang + pThick / 2);
    group.add(nParapet);

    const sParapet = new THREE.Mesh(new THREE.BoxGeometry(w + overhang * 2, pHeight, pThick), materials.roofParapet);
    sParapet.position.set(roof.x + w / 2, elev + 0.5 + pHeight / 2, roof.y + l + overhang - pThick / 2);
    group.add(sParapet);

    // Parapet West & East
    const wParapet = new THREE.Mesh(new THREE.BoxGeometry(pThick, pHeight, l + overhang * 2), materials.roofParapet);
    wParapet.position.set(roof.x - overhang + pThick / 2, elev + 0.5 + pHeight / 2, roof.y + l / 2);
    group.add(wParapet);

    const eParapet = new THREE.Mesh(new THREE.BoxGeometry(pThick, pHeight, l + overhang * 2), materials.roofParapet);
    eParapet.position.set(roof.x + w + overhang - pThick / 2, elev + 0.5 + pHeight / 2, roof.y + l / 2);
    group.add(eParapet);

    // Parapet Coping Stones (Dark Cap Stone along Top Edge)
    const nCoping = new THREE.Mesh(new THREE.BoxGeometry(w + overhang * 2 + 0.2, 0.15, pThick + 0.15), materials.roofCoping);
    nCoping.position.set(roof.x + w / 2, elev + 0.5 + pHeight + 0.08, roof.y - overhang + pThick / 2);
    group.add(nCoping);

    const sCoping = new THREE.Mesh(new THREE.BoxGeometry(w + overhang * 2 + 0.2, 0.15, pThick + 0.15), materials.roofCoping);
    sCoping.position.set(roof.x + w / 2, elev + 0.5 + pHeight + 0.08, roof.y + l + overhang - pThick / 2);
    group.add(sCoping);

    // Mumty / Stair Headroom Cabin
    if (roof.hasMumty) {
      const mumtyW = 8;
      const mumtyL = 10;
      const mumtyH = 8.5;
      const mumtyMesh = new THREE.Mesh(new THREE.BoxGeometry(mumtyW, mumtyH, mumtyL), materials.roofParapet);
      mumtyMesh.position.set(roof.x + w * 0.3, elev + 0.5 + mumtyH / 2, roof.y + l * 0.3);
      mumtyMesh.castShadow = true;
      group.add(mumtyMesh);
    }
  }

  return group;
}

/**
 * Builds Revit-style Level Datum lines and elevation markers in Technical Mode
 */
function buildBimLevelDatums(levels, plotW, plotL, unit) {
  const group = new THREE.Group();
  group.name = 'BIM_Level_Datums';

  const datumX = plotW + 4;
  const lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 2 });

  levels.forEach(lvl => {
    const points = [
      new THREE.Vector3(-2, lvl.elevation, plotL / 2),
      new THREE.Vector3(datumX, lvl.elevation, plotL / 2)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, lineMat);
    group.add(line);

    const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 16), new THREE.MeshBasicMaterial({ color: '#0284c7' }));
    marker.position.set(datumX, lvl.elevation, plotL / 2);
    marker.rotation.x = Math.PI / 2;
    group.add(marker);
  });

  return group;
}
