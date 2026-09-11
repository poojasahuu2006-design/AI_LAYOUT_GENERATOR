import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Grid, Layers, Download, Printer, Eye, EyeOff, Move, Box, 
  Compass, Maximize2, Minimize2, Undo, Redo, Armchair, ChevronDown, Check
} from 'lucide-react';
import { exportSvgAsPng } from '../../utils/exportUtils';
import { formatDimension, formatRoomDimensions, formatArea, calculateSetbacks } from '../../utils/cadDimensionUtils';
import { 
  CadStaircase, 
  CadLivingFurniture, 
  CadDiningFurniture, 
  CadBedFurniture, 
  CadToiletFixtures, 
  CadKitchenFixtures, 
  CadPoojaAltar, 
  CadTrueNorthCompass, 
  CadTitleBlock, 
  CadDoorSymbol, 
  CadWindowSymbol, 
  CadVastuOverlay 
} from './cad2dSymbols';

export default function FloorPlan2DViewer({ 
  layout, 
  onLayoutChange, 
  onSwitchTo3D, 
  isEditMode, 
  setIsEditMode,
  selectedRoomId,
  setSelectedRoomId,
  projectName = "30×40 Standard 2BHK",
  clientName = "Shri Sharma"
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Floor Active View State: 'ground' | 'first' | 'combined'
  const [activeFloorView, setActiveFloorView] = useState('ground');

  // CAD Mode: 'technical_cad' | 'vastu_analysis'
  const [cadMode, setCadMode] = useState('technical_cad');

  // Unit Mode: 'ft-in' | 'ft' | 'm'
  const [unitMode, setUnitMode] = useState('ft-in');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  // Layers and Controls state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [showTitleBlock, setShowTitleBlock] = useState(true);
  const [showSetbacks, setShowSetbacks] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState(null);

  // Dragging Room State
  const [draggingRoom, setDraggingRoom] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const plot = layout?.plot || { width: 30, length: 40, unit: 'ft' };
  const plotW = plot.width;
  const plotL = plot.length;

  const floors = layout?.floors || [];
  const groundFloor = floors.find(f => f.floor === 'ground') || { rooms: layout?.rooms || [] };
  const firstFloor = floors.find(f => f.floor === 'first') || { rooms: [] };

  const isCombined = activeFloorView === 'combined';
  const separationGap = 30;

  // Setback calculations
  const setbacks = calculateSetbacks(plotW, plotL);

  // Canvas scaling math
  const paddingLeft = 14;
  const paddingRight = 36; // Space for Compass & Title block
  const paddingTop = 16;   // Space for North Road banner
  const paddingBottom = 20; // Space for Dimensions

  const singleSheetWidth = plotW + paddingLeft + paddingRight;
  const viewWidth = isCombined ? (plotW * 2 + separationGap + paddingLeft + paddingRight + 20) : singleSheetWidth;
  const viewHeight = plotL + paddingTop + paddingBottom + 12;

  // Auto Fit-To-Screen on mount or layout change
  useEffect(() => {
    handleFitToScreen();
  }, [plotW, plotL, activeFloorView]);

  const handleFitToScreen = () => {
    setZoom(isCombined ? 0.7 : 0.95);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(2.8, prev + 0.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.35, prev - 0.2));

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'rect' && isEditMode) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingRoom && isEditMode) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left - pan.x) / zoom) - paddingLeft;
      const mouseY = ((e.clientY - rect.top - pan.y) / zoom) - paddingTop;

      const newX = Math.max(0, Math.min(plotW - draggingRoom.width, Math.round(mouseX - dragOffset.x)));
      const newY = Math.max(0, Math.min(plotL - draggingRoom.height, Math.round(mouseY - dragOffset.y)));

      const updatedFloors = floors.map(f => {
        if (f.floor === draggingRoom.floor) {
          return {
            ...f,
            rooms: f.rooms.map(r => r.id === draggingRoom.id ? { ...r, x: newX, y: newY } : r)
          };
        }
        return f;
      });

      onLayoutChange && onLayoutChange({ ...layout, floors: updatedFloors });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingRoom(null);
  };

  // Room Click & Drag Start
  const handleRoomClick = (room, e) => {
    e.stopPropagation();
    setSelectedRoomId && setSelectedRoomId(room.id);

    if (isEditMode) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left - pan.x) / zoom) - paddingLeft;
      const mouseY = ((e.clientY - rect.top - pan.y) / zoom) - paddingTop;
      setDraggingRoom(room);
      setDragOffset({ x: mouseX - room.x, y: mouseY - room.y });
    }
  };

  /**
   * Professional Room Palette (Crisp CAD styling)
   */
  const getRoomFillColor = (room) => {
    const type = room.type;
    if (['Bedroom', 'Master Bedroom', 'Study Room'].includes(type)) return '#f8fafc';
    if (['Kitchen'].includes(type)) return '#fffbeb';
    if (['Bathroom', 'Washroom'].includes(type)) return '#f1f5f9';
    if (['Living Room', 'Hall', 'Dining Room'].includes(type)) return '#ffffff';
    if (['Balcony'].includes(type)) return '#f0fdf4';
    if (['Staircase'].includes(type)) return '#f5f3ff';
    if (['Pooja Room'].includes(type)) return '#fffdf0';
    return '#ffffff';
  };

  /**
   * Render Furniture & Fixtures inside a room based on its type
   */
  const renderRoomFurniture = (room) => {
    if (!showFurniture) return null;
    const type = room.type;
    const rx = room.x;
    const ry = room.y;
    const rw = room.width;
    const rh = room.height;

    if (type === 'Staircase') {
      return <CadStaircase key={`stair-${room.id}`} x={rx} y={ry} width={rw} height={rh} />;
    }
    if (type === 'Living Room' || type === 'Hall') {
      return <CadLivingFurniture key={`living-${room.id}`} x={rx} y={ry} width={rw} height={rh} />;
    }
    if (type === 'Dining Room') {
      return <CadDiningFurniture key={`dining-${room.id}`} x={rx} y={ry} width={rw} height={rh} />;
    }
    if (['Master Bedroom', 'Bedroom', 'Study Room'].includes(type)) {
      return <CadBedFurniture key={`bed-${room.id}`} x={rx} y={ry} width={rw} height={rh} />;
    }
    if (['Bathroom', 'Washroom'].includes(type)) {
      return <CadToiletFixtures key={`toilet-${room.id}`} x={rx} y={ry} width={rw} height={rh} />;
    }
    if (type === 'Kitchen') {
      return <CadKitchenFixtures key={`kitchen-${room.id}`} x={rx} y={ry} width={rw} height={rh} />;
    }
    if (type === 'Pooja Room') {
      return <CadPoojaAltar key={`pooja-${room.id}`} x={rx} y={ry} width={rw} height={rh} />;
    }
    return null;
  };

  /**
   * Render a Single Floor Plan Component at (offsetX, offsetY)
   */
  const renderFloorSheet = (floorType, floorRooms, offsetX, offsetY, floorTitle) => {
    const isGround = floorType === 'ground';

    // Calculate RCC Columns for this floor
    const columnPoints = [];
    const addedSet = new Set();
    floorRooms.forEach((r) => {
      const corners = [
        [r.x, r.y],
        [r.x + r.width, r.y],
        [r.x, r.y + r.height],
        [r.x + r.width, r.y + r.height]
      ];
      corners.forEach(([cx, cy]) => {
        const key = `${Math.round(cx * 10) / 10}_${Math.round(cy * 10) / 10}`;
        if (!addedSet.has(key)) {
          addedSet.add(key);
          columnPoints.push({ x: cx, y: cy });
        }
      });
    });

    return (
      <g transform={`translate(${offsetX}, ${offsetY})`} key={floorType}>
        
        {/* 1. MAIN ROAD INDICATOR BANNER (TOP) */}
        {isGround && (
          <g transform={`translate(0, -11)`} className="pointer-events-none select-none font-sans">
            <line x1="-6" y1="0" x2={plotW + 6} y2="0" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 1" />
            <line x1="-6" y1="4.5" x2={plotW + 6} y2="4.5" stroke="#94a3b8" strokeWidth="0.3" />
            
            <rect 
              x={plotW / 2 - 14} 
              y="0.8" 
              width="28" 
              height="3.2" 
              fill="#ffffff" 
              stroke="#0f172a" 
              strokeWidth="0.25"
              rx="0.4" 
              className="shadow-sm" 
            />
            <text 
              x={plotW / 2} 
              y="2.9" 
              fill="#0f172a" 
              fontSize="1.15" 
              fontWeight="900" 
              textAnchor="middle" 
              className="tracking-widest uppercase font-mono"
            >
              MAIN ROAD (NORTH)
            </text>
          </g>
        )}

        {/* 2. PLOT SETBACK ENVELOPE (DASHED BLUE BOUNDARY) */}
        {showSetbacks && (
          <g className="pointer-events-none select-none font-mono">
            <rect
              x={-setbacks.sideLeft}
              y={-setbacks.front}
              width={setbacks.envelopeWidth}
              height={setbacks.envelopeLength}
              fill="none"
              stroke="#0284c7"
              strokeWidth="0.35"
              strokeDasharray="1.2 0.8"
            />
            
            <text
              x={plotW / 2}
              y={-setbacks.front - 1.2}
              fill="#0369a1"
              fontSize="0.85"
              fontWeight="800"
              textAnchor="middle"
            >
              {formatDimension(setbacks.envelopeWidth, unitMode)} (FRONT SETBACK: {formatDimension(setbacks.front, unitMode)})
            </text>

            <text
              x={-setbacks.sideLeft - 1.2}
              y={plotL / 2}
              fill="#0369a1"
              fontSize="0.85"
              fontWeight="800"
              textAnchor="middle"
              transform={`rotate(-90, ${-setbacks.sideLeft - 1.2}, ${plotL / 2})`}
            >
              {formatDimension(setbacks.envelopeLength, unitMode)}
            </text>

            <text
              x={plotW / 2}
              y={plotL + setbacks.rear + 2.0}
              fill="#64748b"
              fontSize="0.75"
              fontWeight="700"
              textAnchor="middle"
            >
              REAR SETBACK: {formatDimension(setbacks.rear, unitMode)}
            </text>
          </g>
        )}

        {/* 3. OUTER ARCHITECTURAL PLOT BOUNDARY WALL (IS 962 CAD DOUBLE WALL) */}
        <rect
          x="0"
          y="0"
          width={plotW}
          height={plotL}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="0.8"
          className="shadow-xl"
        />

        {/* 4. VASTU 9-ZONE OVERLAY (IF ACTIVE) */}
        {cadMode === 'vastu_analysis' && (
          <CadVastuOverlay plotW={plotW} plotL={plotL} />
        )}

        {/* 5. RENDER ROOMS */}
        {floorRooms.map((room, rIdx) => {
          const rx = Math.round(room.x * 10) / 10;
          const ry = Math.round(room.y * 10) / 10;
          const rw = Math.round(room.width * 10) / 10;
          const rh = Math.round(room.height * 10) / 10;
          const roomArea = Math.round((rw * rh) * 100) / 100;
          const isSelected = selectedRoomId === room.id;

          const fillColor = getRoomFillColor(room);
          const isStairs = room.type === 'Staircase';

          const titleSize = Math.min(1.3, Math.max(0.75, rw / (room.name.length * 0.75)));
          const dimSize = Math.min(1.0, Math.max(0.65, rw / 11));
          const areaSize = Math.min(0.85, Math.max(0.55, rw / 13));

          const showArea = rh >= 4.0 && rw >= 4.5;
          const showDim = rh >= 3.0 && rw >= 3.5;

          return (
            <g 
              key={room.id || rIdx} 
              onClick={(e) => handleRoomClick(room, e)}
              onMouseEnter={() => setHoveredRoom(room)}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-all duration-150 group"
            >
              {/* Room Body */}
              <rect
                x={rx}
                y={ry}
                width={rw}
                height={rh}
                fill={isStairs ? '#faf5ff' : fillColor}
                stroke={isSelected ? '#0284c7' : '#0f172a'}
                strokeWidth={isSelected ? '0.9' : '0.45'}
              />

              {/* 2D Architectural Furniture & Fixtures */}
              {renderRoomFurniture(room)}

              {/* Room Text Label Group */}
              {!isStairs && (
                <g className="pointer-events-none select-none">
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 - (showDim ? (showArea ? 0.9 : 0.4) : 0)}
                    fill="#0f172a"
                    fontSize={titleSize}
                    fontWeight="900"
                    textAnchor="middle"
                    className="font-sans font-black tracking-wider uppercase"
                  >
                    {room.name}
                  </text>

                  {showDimensions && showDim && (
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 + 0.7}
                      fill="#334155"
                      fontSize={dimSize}
                      fontWeight="800"
                      textAnchor="middle"
                      className="font-mono font-bold"
                    >
                      {formatRoomDimensions(rw, rh, unitMode)}
                    </text>
                  )}

                  {showDimensions && showArea && (
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 + 1.9}
                      fill="#64748b"
                      fontSize={areaSize}
                      fontWeight="700"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {formatArea(roomArea, unitMode)}
                    </text>
                  )}
                </g>
              )}

              {/* Doors with Radial Dashed Swing Arcs */}
              {(room.doors || []).map((door, dIdx) => (
                <CadDoorSymbol
                  key={`door-${dIdx}`}
                  door={door}
                  roomX={rx}
                  roomY={ry}
                  roomW={rw}
                  roomH={rh}
                  index={dIdx + 1}
                />
              ))}

              {/* Windows with Double Sill Lines and Tags */}
              {(room.windows || []).map((win, wIdx) => (
                <CadWindowSymbol
                  key={`win-${wIdx}`}
                  win={win}
                  roomX={rx}
                  roomY={ry}
                  roomW={rw}
                  roomH={rh}
                  index={wIdx + 1}
                />
              ))}

            </g>
          );
        })}

        {/* 6. STRUCTURAL RCC COLUMNS */}
        <g className="pointer-events-none select-none">
          {columnPoints.map((col, i) => (
            <g key={i}>
              <rect
                x={col.x - 0.45}
                y={col.y - 0.45}
                width="0.9"
                height="0.9"
                fill="#0f172a"
                stroke="#0f172a"
                strokeWidth="0.1"
              />
              <line x1={col.x - 0.35} y1={col.y - 0.35} x2={col.x + 0.35} y2={col.y + 0.35} stroke="#ffffff" strokeWidth="0.08" />
              <line x1={col.x - 0.35} y1={col.y + 0.35} x2={col.x + 0.35} y2={col.y - 0.35} stroke="#ffffff" strokeWidth="0.08" />
            </g>
          ))}
        </g>

        {/* 7. OVERALL PLOT DIMENSION LINES */}
        {showDimensions && (
          <g className="font-mono select-none pointer-events-none">
            <line x1="0" y1={plotL + 5.5} x2={plotW} y2={plotL + 5.5} stroke="#0f172a" strokeWidth="0.25" />
            <line x1="0" y1={plotL + 4.0} x2="0" y2={plotL + 7.0} stroke="#0f172a" strokeWidth="0.25" />
            <line x1={plotW} y1={plotL + 4.0} x2={plotW} y2={plotL + 7.0} stroke="#0f172a" strokeWidth="0.25" />
            
            <rect x={plotW / 2 - 7} y={plotL + 4.0} width="14" height="2.8" fill="#ffffff" stroke="#0f172a" strokeWidth="0.18" rx="0.3" />
            <text x={plotW / 2} y={plotL + 5.8} fill="#0f172a" fontSize="1.1" fontWeight="900" textAnchor="middle">
              {formatDimension(plotW, unitMode)}
            </text>

            <line x1={plotW + 5.5} y1="0" x2={plotW + 5.5} y2={plotL} stroke="#0f172a" strokeWidth="0.25" />
            <line x1={plotW + 4.0} y1="0" x2={plotW + 7.0} y2="0" stroke="#0f172a" strokeWidth="0.25" />
            <line x1={plotW + 4.0} y1={plotL} x2={plotW + 7.0} y2={plotL} stroke="#0f172a" strokeWidth="0.25" />

            <g transform={`translate(${plotW + 5.5}, ${plotL / 2}) rotate(90)`}>
              <rect x="-7" y="-1.4" width="14" height="2.8" fill="#ffffff" stroke="#0f172a" strokeWidth="0.18" rx="0.3" />
              <text x="0" y="0.5" fill="#0f172a" fontSize="1.1" fontWeight="900" textAnchor="middle">
                {formatDimension(plotL, unitMode)}
              </text>
            </g>
          </g>
        )}

      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full bg-slate-100 border border-slate-200 overflow-hidden shadow-inner relative select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-900' : 'rounded-2xl'
      }`}
    >
      
      {/* 1. TOP CAD TOOLBAR & CONTROLS */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 shadow-sm rounded-t-xl">
        
        {/* Left Section: Rev, Undo, Redo, Units Selector */}
        <div className="flex items-center gap-2">
          {/* Revision Badge */}
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono font-bold rounded-lg">
            Rev: 00
          </span>

          {/* Units Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUnitDropdown(!showUnitDropdown)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <span>Units: <span className="text-sky-700">{unitMode === 'ft-in' ? "Ft-In (12'-6\")" : unitMode === 'm' ? "Meters (m)" : "Ft (12.5')"}</span></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showUnitDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 min-w-[160px] font-mono text-xs">
                <button
                  onClick={() => { setUnitMode('ft-in'); setShowUnitDropdown(false); }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 ${unitMode === 'ft-in' ? 'font-bold text-sky-700 bg-sky-50' : 'text-slate-700'}`}
                >
                  <span>Ft-In (12'-6")</span>
                  {unitMode === 'ft-in' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setUnitMode('ft'); setShowUnitDropdown(false); }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 ${unitMode === 'ft' ? 'font-bold text-sky-700 bg-sky-50' : 'text-slate-700'}`}
                >
                  <span>Decimal Ft (12.5')</span>
                  {unitMode === 'ft' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setUnitMode('m'); setShowUnitDropdown(false); }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 ${unitMode === 'm' ? 'font-bold text-sky-700 bg-sky-50' : 'text-slate-700'}`}
                >
                  <span>Meters (m)</span>
                  {unitMode === 'm' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Mode Pill Badges */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setCadMode('technical_cad')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                cadMode === 'technical_cad' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Technical CAD (IS 962)
            </button>
            <button
              onClick={() => setCadMode('vastu_analysis')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                cadMode === 'vastu_analysis' 
                  ? 'bg-teal-700 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Vastu Analysis
            </button>
          </div>
        </div>

        {/* Floor Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveFloorView('ground')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeFloorView === 'ground' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Ground Floor
          </button>

          {floors.some(f => f.floor === 'first') && (
            <button
              onClick={() => setActiveFloorView('first')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeFloorView === 'first' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> First Floor
            </button>
          )}

          {floors.length > 1 && (
            <button
              onClick={() => setActiveFloorView('combined')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeFloorView === 'combined' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Dual Sheet
            </button>
          )}
        </div>

        {/* Viewport & Export Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={handleZoomIn} 
              className="p-1 text-slate-700 hover:bg-white rounded-lg transition" 
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={handleZoomOut} 
              className="p-1 text-slate-700 hover:bg-white rounded-lg transition" 
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={handleFitToScreen} 
              className="p-1 text-slate-700 hover:bg-white rounded-lg transition ml-1 flex items-center gap-1 px-1.5" 
              title="Fit to Screen"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[10px] font-bold">Fit</span>
            </button>
          </div>

          {/* Toggle Furniture */}
          <button
            onClick={() => setShowFurniture(!showFurniture)}
            className={`p-1.5 rounded-xl text-xs font-semibold border transition ${
              showFurniture ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Toggle 2D CAD Furniture"
          >
            <Armchair className="w-4 h-4" />
          </button>

          {/* Toggle Grid */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-xl text-xs font-semibold border transition ${
              showGrid ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Toggle Dimensions */}
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-1.5 rounded-xl text-xs font-semibold border transition ${
              showDimensions ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Toggle Dimensions"
          >
            {showDimensions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Edit Mode Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
              isEditMode ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Move className="w-3.5 h-3.5" /> {isEditMode ? 'Exit Edit' : 'Edit Rooms'}
          </button>

          {/* Fullscreen Mode */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition"
            title="Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* High-Res PNG Export */}
          <button
            onClick={() => exportSvgAsPng(svgRef.current, `${layout.projectName || 'Architectural_FloorPlan'}-2D-CAD.png`, 2400, 1800)}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition"
            title="Export High-Res CAD PNG"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* 3D Switcher */}
          <button
            onClick={onSwitchTo3D}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <Box className="w-4 h-4" /> 3D View
          </button>
        </div>

      </div>

      {/* 2. MAIN CAD SVG CANVAS WORKSPACE */}
      <div 
        className="flex-1 w-full h-full overflow-hidden bg-slate-200/60 cursor-grab active:cursor-grabbing relative flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-full max-h-full max-w-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            <pattern id="cadGrid" width="2.5" height="2.5" patternUnits="userSpaceOnUse">
              <path d="M 2.5 0 L 0 0 0 2.5" fill="none" stroke="#e2e8f0" strokeWidth="0.08" />
            </pattern>
          </defs>

          {/* Background Drafting Sheet */}
          <rect 
            x="2" 
            y="2" 
            width={viewWidth - 4} 
            height={viewHeight - 4} 
            fill="#ffffff" 
            stroke="#cbd5e1" 
            strokeWidth="0.3"
            rx="0.5" 
          />

          {/* Blueprint Fine Coordinate Grid */}
          {showGrid && (
            <rect 
              x="2" 
              y="2" 
              width={viewWidth - 4} 
              height={viewHeight - 4} 
              fill="url(#cadGrid)" 
            />
          )}

          {/* TRUE NORTH DRAFTING COMPASS (TOP RIGHT CORNER) */}
          <CadTrueNorthCompass x={viewWidth - 20} y={4} />

          {/* RENDER ACTIVE FLOOR VIEWS */}
          {activeFloorView === 'ground' && (
            renderFloorSheet('ground', groundFloor.rooms || [], paddingLeft, paddingTop, 'GROUND FLOOR PLAN')
          )}

          {activeFloorView === 'first' && (
            renderFloorSheet('first', firstFloor.rooms || [], paddingLeft, paddingTop, 'FIRST FLOOR PLAN')
          )}

          {activeFloorView === 'combined' && (
            <>
              {renderFloorSheet('ground', groundFloor.rooms || [], paddingLeft, paddingTop, 'GROUND FLOOR PLAN')}
              {renderFloorSheet('first', firstFloor.rooms || [], paddingLeft + plotW + separationGap, paddingTop, 'FIRST FLOOR PLAN')}
            </>
          )}

          {/* IS 962 / NBC COMPLIANT TITLE BLOCK (BOTTOM RIGHT CORNER) */}
          {showTitleBlock && (
            <CadTitleBlock
              x={viewWidth - 32}
              y={viewHeight - 18}
              projectTitle={projectName || `${plotW}×${plotL} Standard Residential Plan`}
              clientName={clientName || "Shri Sharma"}
              drawingTitle={activeFloorView === 'ground' ? "GROUND FLOOR PLAN" : activeFloorView === 'first' ? "FIRST FLOOR PLAN" : "GROUND + FIRST FLOOR"}
              scale="1:100 / A3"
              rev="00"
              dwgNo="A-101"
            />
          )}

        </svg>

        {/* FLOATING HOVER TOOLTIP */}
        {hoveredRoom && (
          <div className="absolute top-4 left-4 bg-slate-900/90 text-white backdrop-blur-md px-3 py-2 rounded-xl shadow-xl text-xs font-mono border border-slate-700 pointer-events-none z-20 space-y-0.5">
            <div className="font-extrabold text-sky-300 uppercase tracking-wider">{hoveredRoom.name}</div>
            <div className="text-[11px] text-slate-300">Floor: <span className="capitalize font-bold text-white">{hoveredRoom.floor || 'Ground'}</span></div>
            <div className="text-[11px] text-slate-300">Dimensions: <span className="font-bold text-emerald-300">{formatRoomDimensions(hoveredRoom.width, hoveredRoom.height, unitMode)}</span></div>
            <div className="text-[10px] text-slate-400">Area: <span className="text-white font-bold">{formatArea(hoveredRoom.area || (hoveredRoom.width * hoveredRoom.height), unitMode)}</span></div>
          </div>
        )}

      </div>

      {/* 3. FOOTER CAD STATS BAR */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-mono shrink-0 rounded-b-xl">
        <div className="flex items-center gap-3">
          <span>Active Sheet: <strong className="text-slate-900 uppercase">{activeFloorView === 'combined' ? 'Ground + First' : `${activeFloorView} Floor`}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Standard: <strong className="text-sky-700">IS 962:1989 / NBC 2016</strong></span>
        </div>
        <div>
          Total Plot Area: <strong className="text-slate-900">{formatArea(plotW * plotL, unitMode)}</strong> ({formatDimension(plotW, unitMode)} × {formatDimension(plotL, unitMode)})
        </div>
      </div>

    </div>
  );
}
