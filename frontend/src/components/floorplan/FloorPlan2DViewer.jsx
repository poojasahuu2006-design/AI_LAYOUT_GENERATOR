import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize, Grid, Layers, Download, Printer, Eye, EyeOff, Move, Box, Check, RefreshCw, Maximize2, Minimize2, Info 
} from 'lucide-react';
import { exportSvgAsPng } from '../../utils/exportUtils';

export default function FloorPlan2DViewer({ 
  layout, 
  onLayoutChange, 
  onSwitchTo3D, 
  isEditMode, 
  setIsEditMode,
  selectedRoomId,
  setSelectedRoomId 
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Floor Active View State: 'ground' | 'first' | 'combined'
  const [activeFloorView, setActiveFloorView] = useState('ground');

  // Controls state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
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
  const separationGap = 25;

  // Canvas scaling math
  const padding = 35;
  const viewWidth = isCombined ? (plotW * 2 + separationGap + padding * 2) : (plotW + padding * 2);
  const viewHeight = plotL + padding * 2 + 10;

  // Auto Fit-To-Screen on mount or layout change
  useEffect(() => {
    handleFitToScreen();
  }, [plotW, plotL, activeFloorView]);

  const handleFitToScreen = () => {
    setZoom(isCombined ? 0.75 : 1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(2.5, prev + 0.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev - 0.2));

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
      const mouseX = ((e.clientX - rect.left - pan.x) / zoom) - padding;
      const mouseY = ((e.clientY - rect.top - pan.y) / zoom) - padding;

      const newX = Math.max(0, Math.min(plotW - draggingRoom.width, Math.round(mouseX - dragOffset.x)));
      const newY = Math.max(0, Math.min(plotL - draggingRoom.height, Math.round(mouseY - dragOffset.y)));

      // Update room in layout state
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
    setSelectedRoomId(room.id);

    if (isEditMode) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left - pan.x) / zoom) - padding;
      const mouseY = ((e.clientY - rect.top - pan.y) / zoom) - padding;
      setDraggingRoom(room);
      setDragOffset({ x: mouseX - room.x, y: mouseY - room.y });
    }
  };

  /**
   * Responsive Room Label Layout Logic
   */
  const getRoomLabelLayout = (room) => {
    const rw = room.width;
    const rh = room.height;

    let displayName = room.name;
    if (rw < 7 || rh < 6) {
      if (room.type === 'Bathroom') displayName = 'BATH';
      else if (room.type === 'Washroom') displayName = 'WC';
      else if (room.type === 'Living Room') displayName = 'HALL';
      else if (room.type === 'Master Bedroom') displayName = 'MASTER BED';
      else if (room.type === 'Staircase') displayName = 'STAIRS';
      else if (room.type === 'Hallway') displayName = 'HALLWAY';
      else if (room.type === 'Store Room') displayName = 'STORE';
    }

    const titleSize = Math.min(1.4, Math.max(0.8, rw / (displayName.length * 0.75)));
    const dimSize = Math.min(1.1, Math.max(0.7, rw / 11));
    const areaSize = Math.min(0.9, Math.max(0.6, rw / 13));

    const showArea = rh >= 4.5 && rw >= 5;
    const showDim = rh >= 3.5 && rw >= 4;

    return {
      displayName,
      titleSize,
      dimSize,
      areaSize,
      showDim,
      showArea
    };
  };

  /**
   * Professional Palette per Room Category
   */
  const getRoomFillColor = (room) => {
    const type = room.type;
    if (['Bedroom', 'Master Bedroom', 'Study Room'].includes(type)) return '#eff6ff'; // Soft blue
    if (['Kitchen'].includes(type)) return '#fffbe0'; // Soft warm yellow
    if (['Bathroom', 'Washroom'].includes(type)) return '#f1f5f9'; // Soft slate
    if (['Living Room', 'Hall', 'Dining Room'].includes(type)) return '#f8fafc'; // Soft neutral
    if (['Balcony'].includes(type)) return '#f0fdf4'; // Soft green
    if (['Staircase'].includes(type)) return '#faf5ff'; // Soft purple
    return '#f8fafc';
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
        
        {/* FLOOR HEADER BANNER */}
        <g transform="translate(0, -7.5)" className="pointer-events-none select-none font-sans">
          <rect 
            x="0" 
            y="0" 
            width={plotW} 
            height="4.5" 
            fill={isGround ? '#0284c7' : '#4f46e5'} 
            rx="0.6" 
            className="shadow-md" 
          />
          <text 
            x={plotW / 2} 
            y="2.8" 
            fill="#ffffff" 
            fontSize="1.6" 
            fontWeight="900" 
            textAnchor="middle" 
            className="tracking-widest uppercase font-mono"
          >
            {floorTitle} ({plotW} × {plotL} {plot.unit})
          </text>
        </g>

        {/* Outer Architectural Plot Boundary Wall */}
        <rect
          x="0"
          y="0"
          width={plotW}
          height={plotL}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="1.4"
          className="shadow-xl"
        />

        {/* ACCESS BADGES */}
        {isGround ? (
          (() => {
            const entryDoor = floorRooms
              .flatMap((r) => (r.doors || []).map((d) => ({ room: r, door: d })))
              .find(({ door }) => door.isMainEntry);
            const badgeX = entryDoor
              ? entryDoor.door.x + (entryDoor.door.width || 3.5) / 2 - 4.5
              : plotW / 2 - 4.5;
            return (
              <g transform={`translate(${badgeX}, -2.2)`}>
                <rect x="0" y="0" width="9" height="1.6" fill="#0284c7" rx="0.4" className="shadow-md" />
                <text x="4.5" y="1.1" fill="#ffffff" fontSize="0.85" fontWeight="900" textAnchor="middle" className="font-sans tracking-widest">
                  ▲ MAIN ENTRY
                </text>
              </g>
            );
          })()
        ) : (
          (() => {
            const stair = floorRooms.find((r) => r.type === 'Staircase');
            const stairX = stair ? stair.x + stair.width / 2 - 5.5 : plotW - 12;
            const stairY = stair ? stair.y + stair.height + 0.8 : plotL + 0.8;
            return (
              <g transform={`translate(${stairX}, ${stairY})`}>
                <rect x="0" y="0" width="11" height="1.6" fill="#6d28d9" rx="0.4" className="shadow-md" />
                <text x="5.5" y="1.1" fill="#ffffff" fontSize="0.8" fontWeight="900" textAnchor="middle" className="font-sans tracking-wider">
                  ▲ STAIRCASE ARRIVAL
                </text>
              </g>
            );
          })()
        )}

        {/* RENDER ROOMS */}
        {floorRooms.map((room) => {
          const rx = Math.round(room.x * 10) / 10;
          const ry = Math.round(room.y * 10) / 10;
          const rw = Math.round(room.width * 10) / 10;
          const rh = Math.round(room.height * 10) / 10;
          const roomArea = Math.round((rw * rh) * 10) / 10;
          const isSelected = selectedRoomId === room.id;

          const { displayName, titleSize, dimSize, areaSize, showDim, showArea } = getRoomLabelLayout(room);
          const fillColor = getRoomFillColor(room);

          return (
            <g 
              key={room.id} 
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
                fill={fillColor}
                stroke={isSelected ? '#0284c7' : '#334155'}
                strokeWidth={isSelected ? '1.2' : '0.6'}
                rx="0.1"
              />

              {/* Kitchen Counter & Stoves */}
              {room.type === 'Kitchen' && rw >= 6 && rh >= 5 && (
                <g opacity="0.35">
                  <rect x={rx + 0.3} y={ry + 0.3} width={rw - 0.6} height="1.2" fill="#d97706" rx="0.2" />
                  <circle cx={rx + 1.5} cy={ry + 0.9} r="0.4" fill="#ffffff" />
                  <circle cx={rx + 3.0} cy={ry + 0.9} r="0.4" fill="#ffffff" />
                </g>
              )}

              {/* Bathroom WC */}
              {(room.type === 'Bathroom' || room.type === 'Washroom') && rw >= 4 && rh >= 4 && (
                <g opacity="0.35" transform={`translate(${rx + 0.5}, ${ry + 0.5})`}>
                  <rect x="0" y="0" width="1.2" height="1.6" fill="#0284c7" rx="0.4" />
                  <circle cx="0.6" cy="1.0" r="0.4" fill="#ffffff" />
                </g>
              )}

              {/* Living Room Sofa */}
              {(room.type === 'Living Room' || room.type === 'Hall') && rw >= 10 && rh >= 8 && (
                <g opacity="0.25" transform={`translate(${rx + 0.8}, ${ry + 0.8})`}>
                  <rect x="0" y="0" width="3.5" height="1.4" fill="#475569" rx="0.3" />
                  <rect x="0.2" y="0.2" width="3.1" height="0.6" fill="#ffffff" rx="0.2" />
                </g>
              )}

              {/* Dining Table */}
              {room.type === 'Dining Room' && rw >= 8 && rh >= 7 && (
                <g opacity="0.25" transform={`translate(${rx + rw - 3.5}, ${ry + 0.8})`}>
                  <rect x="0" y="0" width="2.8" height="1.8" fill="#78350f" rx="0.3" />
                </g>
              )}

              {/* Text Hierarchy */}
              <g className="pointer-events-none select-none">
                <text
                  x={rx + rw / 2}
                  y={ry + rh / 2 - (showDim ? (showArea ? 1.0 : 0.4) : 0)}
                  fill="#0f172a"
                  fontSize={titleSize}
                  fontWeight="900"
                  textAnchor="middle"
                  className="font-sans tracking-wide"
                >
                  {displayName.toUpperCase()}
                </text>

                {showDimensions && showDim && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 + 0.8}
                    fill="#0369a1"
                    fontSize={dimSize}
                    fontWeight="800"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {rw} × {rh} {plot.unit}
                  </text>
                )}

                {showDimensions && showArea && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 + 2.0}
                    fill="#64748b"
                    fontSize={areaSize}
                    fontWeight="600"
                    textAnchor="middle"
                    className="font-sans font-semibold"
                  >
                    {roomArea} sq.{plot.unit}
                  </text>
                )}
              </g>

              {/* Staircase Steps */}
              {room.type === 'Staircase' && (
                <g opacity="0.6">
                  {[...Array(7)].map((_, i) => (
                    <line
                      key={i}
                      x1={rx + 0.5}
                      y1={ry + (rh / 7) * i}
                      x2={rx + rw - 0.5}
                      y2={ry + (rh / 7) * i}
                      stroke="#6d28d9"
                      strokeWidth="0.2"
                    />
                  ))}
                  <text x={rx + rw / 2} y={ry + rh - 0.6} fill="#6d28d9" fontSize="0.9" fontWeight="900" textAnchor="middle">
                    ↑ UP
                  </text>
                </g>
              )}

              {/* Balcony Railing */}
              {room.type === 'Balcony' && (
                <rect
                  x={rx + 0.2}
                  y={ry + 0.2}
                  width={rw - 0.4}
                  height={rh - 0.4}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="0.25"
                  strokeDasharray="0.4 0.4"
                />
              )}

              {/* Doors with Swing Arcs */}
              {(room.doors || []).map((door, idx) => {
                const dw = door.width || 3;
                const wall = door.wall || 'north';
                const vertical = wall === 'east' || wall === 'west';
                const swing = door.swing_direction || (vertical ? 'in_right' : 'in_bottom');

                let rectProps;
                let arcPath;
                if (vertical) {
                  rectProps = { x: door.x - 0.25, y: door.y, width: 0.5, height: dw };
                  if (swing === 'in_left' || wall === 'east') {
                    arcPath = `M ${door.x} ${door.y} A ${dw} ${dw} 0 0 0 ${door.x - dw} ${door.y + dw}`;
                  } else {
                    arcPath = `M ${door.x} ${door.y} A ${dw} ${dw} 0 0 1 ${door.x + dw} ${door.y + dw}`;
                  }
                } else {
                  rectProps = { x: door.x, y: door.y - 0.25, width: Math.min(dw, rw - 0.5), height: 0.5 };
                  if (swing === 'in_top' || swing === 'north') {
                    arcPath = `M ${door.x} ${door.y} A ${dw} ${dw} 0 0 0 ${door.x + dw} ${door.y - dw}`;
                  } else {
                    arcPath = `M ${door.x} ${door.y} A ${dw} ${dw} 0 0 1 ${door.x + dw} ${door.y + dw}`;
                  }
                }

                return (
                  <g key={idx}>
                    <rect {...rectProps} fill={door.isMainEntry ? '#0284c7' : '#d97706'} />
                    <path
                      d={arcPath}
                      fill="none"
                      stroke={door.isMainEntry ? '#0284c7' : '#d97706'}
                      strokeWidth="0.2"
                      strokeDasharray="0.4 0.2"
                    />
                  </g>
                );
              })}

              {/* Windows */}
              {(room.windows || []).map((win, idx) => {
                const ww = Math.min(win.width || 4, rw - 1);
                return (
                  <rect
                    key={idx}
                    x={win.x}
                    y={win.y - 0.3}
                    width={ww}
                    height="0.6"
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth="0.2"
                  />
                );
              })}

            </g>
          );
        })}

        {/* STRUCTURAL RCC COLUMNS */}
        <g className="pointer-events-none select-none">
          {columnPoints.map((col, i) => (
            <g key={i}>
              <rect
                x={col.x - 0.4}
                y={col.y - 0.4}
                width="0.8"
                height="0.8"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="0.1"
                rx="0.05"
              />
              <line x1={col.x - 0.3} y1={col.y - 0.3} x2={col.x + 0.3} y2={col.y + 0.3} stroke="#ffffff" strokeWidth="0.08" />
              <line x1={col.x - 0.3} y1={col.y + 0.3} x2={col.x + 0.3} y2={col.y - 0.3} stroke="#ffffff" strokeWidth="0.08" />
            </g>
          ))}
        </g>

        {/* DIMENSION LINES */}
        {showDimensions && (
          <g className="font-mono select-none">
            {/* Width Dimension Line */}
            <line x1="0" y1={plotL + 4} x2={plotW} y2={plotL + 4} stroke="#0284c7" strokeWidth="0.3" />
            <line x1="0" y1={plotL + 2.5} x2="0" y2={plotL + 5.5} stroke="#0284c7" strokeWidth="0.3" />
            <line x1={plotW} y1={plotL + 2.5} x2={plotW} y2={plotL + 5.5} stroke="#0284c7" strokeWidth="0.3" />
            
            <rect x={plotW / 2 - 8} y={plotL + 2.5} width="16" height="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="0.2" rx="0.6" />
            <text x={plotW / 2} y={plotL + 4.5} fill="#0369a1" fontSize="1.3" fontWeight="800" textAnchor="middle">
              WIDTH: {plotW} {plot.unit}
            </text>

            {/* Length Dimension Line */}
            <line x1={plotW + 4} y1="0" x2={plotW + 4} y2={plotL} stroke="#0284c7" strokeWidth="0.3" />
            <line x1={plotW + 2.5} y1="0" x2={plotW + 5.5} y2="0" stroke="#0284c7" strokeWidth="0.3" />
            <line x1={plotW + 2.5} y1={plotL} x2={plotW + 5.5} y2={plotL} stroke="#0284c7" strokeWidth="0.3" />

            <g transform={`translate(${plotW + 6.5}, ${plotL / 2}) rotate(90)`}>
              <rect x="-8" y="-1.5" width="16" height="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="0.2" rx="0.6" />
              <text x="0" y="0.5" fill="#0369a1" fontSize="1.3" fontWeight="800" textAnchor="middle">
                LENGTH: {plotL} {plot.unit}
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
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-900/95 p-4' : 'rounded-2xl'
      }`}
    >
      
      {/* TOP CONTROLS & FLOOR SWITCHER TOOLBAR */}
      <div className="bg-white border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 shadow-sm rounded-t-xl">
        
        {/* FLOOR SWITCHER CARDS */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveFloorView('ground')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeFloorView === 'ground' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Ground Floor
          </button>

          {floors.some(f => f.floor === 'first') && (
            <button
              onClick={() => setActiveFloorView('first')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeFloorView === 'first' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> First Floor
            </button>
          )}

          {floors.length > 1 && (
            <button
              onClick={() => setActiveFloorView('combined')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeFloorView === 'combined' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Combined (Side-by-Side)
            </button>
          )}
        </div>

        {/* ARCHITECTURAL TITLE BANNER */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-bold">
          <span className="text-sky-700 uppercase tracking-wider">
            {activeFloorView === 'ground' ? 'GROUND FLOOR PLAN' : activeFloorView === 'first' ? 'FIRST FLOOR PLAN' : 'DUAL BLUEPRINT SHEET: GROUND + FIRST'}
          </span>
          <span className="text-slate-400">|</span>
          <span>{plotW} × {plotL} {plot.unit}</span>
          <span className="text-slate-400">|</span>
          <span>{plotW * plotL * (isCombined ? 2 : 1)} sq.{plot.unit}</span>
        </div>

        {/* VIEWPORT CONTROLS */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={handleZoomIn} 
              className="p-1.5 text-slate-700 hover:bg-white rounded-lg transition" 
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={handleZoomOut} 
              className="p-1.5 text-slate-700 hover:bg-white rounded-lg transition" 
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={handleFitToScreen} 
              className="p-1.5 text-slate-700 hover:bg-white rounded-lg transition ml-1 flex items-center gap-1 px-2" 
              title="Fit to Screen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Fit</span>
            </button>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-xl text-xs font-semibold border transition ${
              showGrid ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Toggle Blueprint Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-2 rounded-xl text-xs font-semibold border transition ${
              showDimensions ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Toggle Dimensions"
          >
            {showDimensions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
              isEditMode ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Move className="w-3.5 h-3.5" /> {isEditMode ? 'Exit Edit' : 'Drag & Edit'}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition"
            title="Fullscreen Presentation Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => exportSvgAsPng(svgRef.current, `${layout.projectName || 'Layout'}-2D.png`)}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition"
            title="Export High-Res PNG"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onSwitchTo3D}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <Box className="w-4 h-4" /> 3D View
          </button>
        </div>

      </div>

      {/* MAIN SVG CANVAS WORKSPACE */}
      <div 
        className="flex-1 w-full h-full overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing relative flex items-center justify-center"
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
            <pattern id="archGrid" width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#e2e8f0" strokeWidth="0.08" />
            </pattern>
          </defs>

          {/* Blueprint Grid */}
          {showGrid && (
            <rect 
              x="0" 
              y="0" 
              width={viewWidth} 
              height={viewHeight} 
              fill="url(#archGrid)" 
            />
          )}

          {/* NORTH ARROW ARCHITECTURAL COMPASS */}
          <g transform={`translate(${viewWidth - 16}, 10)`} className="pointer-events-none select-none">
            <circle cx="6" cy="6" r="5" fill="#ffffff" stroke="#0f172a" strokeWidth="0.3" className="shadow-sm" />
            <polygon points="6,2 4.5,6.5 6,5.5 7.5,6.5" fill="#ef4444" />
            <polygon points="6,10 4.5,5.5 6,6.5 7.5,5.5" fill="#334155" />
            <text x="6" y="1.2" fill="#0f172a" fontSize="1.4" fontWeight="900" textAnchor="middle" className="font-mono">N</text>
          </g>

          {/* RENDER ACTIVE VIEWS */}
          {activeFloorView === 'ground' && (
            renderFloorSheet('ground', groundFloor.rooms || [], padding, padding, 'Ground Floor Plan')
          )}

          {activeFloorView === 'first' && (
            renderFloorSheet('first', firstFloor.rooms || [], padding, padding, 'First Floor Plan')
          )}

          {activeFloorView === 'combined' && (
            <>
              {renderFloorSheet('ground', groundFloor.rooms || [], padding, padding, 'Ground Floor Plan')}
              {renderFloorSheet('first', firstFloor.rooms || [], padding + plotW + separationGap, padding, 'First Floor Plan')}
            </>
          )}

        </svg>

        {/* FLOATING HOVER TOOLTIP */}
        {hoveredRoom && (
          <div className="absolute top-4 left-4 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg text-xs font-mono border border-slate-700 pointer-events-none z-20 space-y-0.5">
            <div className="font-bold text-sky-300">{hoveredRoom.name}</div>
            <div className="text-[11px] text-slate-300">Floor: <span className="capitalize font-bold text-white">{hoveredRoom.floor || 'Ground'}</span></div>
            <div className="text-[11px] text-slate-300">Dimensions: {hoveredRoom.width} × {hoveredRoom.height} {plot.unit}</div>
            <div className="text-[10px] text-slate-400">Area: {hoveredRoom.area} sq.{plot.unit}</div>
          </div>
        )}

        {/* ARCHITECTURAL SYMBOL LEGEND */}
        <div className="absolute bottom-3 left-3 bg-white/90 border border-slate-200 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm text-[10px] font-mono text-slate-700 flex items-center gap-3 z-10 pointer-events-none">
          <span className="font-bold text-slate-900 uppercase">Legend:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-900 inline-block rounded-xs"></span> Wall / Column</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-400 inline-block rounded-xs"></span> Window</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 inline-block rounded-xs"></span> Door</span>
          <span className="flex items-center gap-1"><span className="text-indigo-600 font-bold">↑</span> Staircase</span>
        </div>

      </div>

      {/* FOOTER CANVAS STATS BAR */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-mono shrink-0 rounded-b-xl">
        <div>
          Viewing: <span className="font-bold text-sky-700 capitalize">{activeFloorView === 'combined' ? 'Ground + First Dual Sheet' : `${activeFloorView} Floor`}</span>
        </div>
        <div>
          Total Plot Area: <span className="font-bold text-slate-900">{plotW * plotL} sq.{plot.unit}</span>
        </div>
      </div>

    </div>
  );
}
