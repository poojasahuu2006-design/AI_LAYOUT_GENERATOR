import React from 'react';

/**
 * High-Precision 2D Architectural CAD Symbols Library
 * Conforms to IS 962:1989 Architectural and Building Drawing Standards
 */

/**
 * 1. CAD Staircase with Violet/Purple Styling, Tread Lines, and UP Arrow
 */
export function CadStaircase({ x, y, width, height }) {
  const treads = Math.max(7, Math.min(14, Math.floor(height * 1.5)));
  const treadHeight = height / treads;

  return (
    <g className="select-none pointer-events-none">
      {/* Background soft fill */}
      <rect
        x={x + 0.15}
        y={y + 0.15}
        width={width - 0.3}
        height={height - 0.3}
        fill="#f5f3ff"
        stroke="#6366f1"
        strokeWidth="0.3"
        rx="0.2"
      />

      {/* Stair Treads */}
      {Array.from({ length: treads }).map((_, i) => (
        <line
          key={i}
          x1={x + 0.2}
          y1={y + (i * treadHeight)}
          x2={x + width - 0.2}
          y2={y + (i * treadHeight)}
          stroke="#4f46e5"
          strokeWidth="0.18"
        />
      ))}

      {/* Central Flight Line */}
      <line
        x1={x + width / 2}
        y1={y + 0.4}
        x2={x + width / 2}
        y2={y + height - 0.4}
        stroke="#4338ca"
        strokeWidth="0.22"
      />

      {/* Directional UP Arrow */}
      <g transform={`translate(${x + width / 2}, ${y + height * 0.5})`}>
        <line
          x1="0"
          y1={height * 0.35}
          x2="0"
          y2={-height * 0.3}
          stroke="#4338ca"
          strokeWidth="0.28"
        />
        <polygon
          points={`0,${-height * 0.35} -0.7,${-height * 0.22} 0.7,${-height * 0.22}`}
          fill="#4338ca"
        />
        <rect
          x="-1.5"
          y="-0.7"
          width="3.0"
          height="1.4"
          fill="#4338ca"
          rx="0.3"
        />
        <text
          x="0"
          y="0.3"
          fill="#ffffff"
          fontSize="0.8"
          fontWeight="900"
          textAnchor="middle"
          className="font-sans font-black"
        >
          UP
        </text>
      </g>
    </g>
  );
}

/**
 * 2. CAD Living Room Furniture (L-Shaped Sectional Sofa + Coffee Table)
 */
export function CadLivingFurniture({ x, y, width, height }) {
  if (width < 8 || height < 7) return null;

  const sofaThickness = 1.8;
  const sofaLength = Math.min(width * 0.55, 7.5);
  const sofaDepth = Math.min(height * 0.55, 6.5);
  const offsetX = x + 0.8;
  const offsetY = y + 0.8;

  return (
    <g opacity="0.4" className="select-none pointer-events-none">
      {/* L-Shaped Sectional Sofa */}
      <path
        d={`
          M ${offsetX} ${offsetY}
          L ${offsetX + sofaLength} ${offsetY}
          L ${offsetX + sofaLength} ${offsetY + sofaThickness}
          L ${offsetX + sofaThickness} ${offsetY + sofaThickness}
          L ${offsetX + sofaThickness} ${offsetY + sofaDepth}
          L ${offsetX} ${offsetY + sofaDepth}
          Z
        `}
        fill="#cbd5e1"
        stroke="#475569"
        strokeWidth="0.18"
        strokeLinejoin="round"
      />

      {/* Cushion Lines */}
      <line
        x1={offsetX + sofaThickness}
        y1={offsetY + sofaThickness}
        x2={offsetX + sofaLength}
        y2={offsetY + sofaThickness}
        stroke="#94a3b8"
        strokeWidth="0.12"
      />
      <line
        x1={offsetX + sofaThickness}
        y1={offsetY + sofaThickness}
        x2={offsetX + sofaThickness}
        y2={offsetY + sofaDepth}
        stroke="#94a3b8"
        strokeWidth="0.12"
      />

      {/* Coffee Table */}
      <rect
        x={offsetX + sofaThickness + 0.6}
        y={offsetY + sofaThickness + 0.6}
        width={Math.min(2.8, width * 0.25)}
        height={Math.min(1.8, height * 0.2)}
        fill="#e2e8f0"
        stroke="#64748b"
        strokeWidth="0.15"
        rx="0.2"
      />
    </g>
  );
}

/**
 * 3. CAD Dining Table with Chairs
 */
export function CadDiningFurniture({ x, y, width, height }) {
  if (width < 7 || height < 6) return null;

  const tableW = Math.min(3.6, width * 0.45);
  const tableH = Math.min(2.4, height * 0.4);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const tx = cx - tableW / 2;
  const ty = cy - tableH / 2;

  return (
    <g opacity="0.4" className="select-none pointer-events-none">
      {/* Table Body */}
      <rect
        x={tx}
        y={ty}
        width={tableW}
        height={tableH}
        fill="#e2e8f0"
        stroke="#475569"
        strokeWidth="0.18"
        rx="0.25"
      />

      {/* Chairs */}
      <rect x={tx + 0.4} y={ty - 0.7} width="1.0" height="0.55" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.12" rx="0.15" />
      <rect x={tx + tableW - 1.4} y={ty - 0.7} width="1.0" height="0.55" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.12" rx="0.15" />
      <rect x={tx + 0.4} y={ty + tableH + 0.15} width="1.0" height="0.55" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.12" rx="0.15" />
      <rect x={tx + tableW - 1.4} y={ty + tableH + 0.15} width="1.0" height="0.55" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.12" rx="0.15" />
    </g>
  );
}

/**
 * 4. CAD Bedroom Furniture (Double Bed, Pillows, Side Nightstands)
 */
export function CadBedFurniture({ x, y, width, height }) {
  if (width < 7 || height < 6) return null;

  const bedW = 4.8;
  const bedH = 5.6;
  const bx = x + 0.8;
  const by = y + 0.8;

  return (
    <g opacity="0.45" className="select-none pointer-events-none">
      {/* Headboard */}
      <rect x={bx} y={by} width={bedW} height="0.6" fill="#94a3b8" stroke="#475569" strokeWidth="0.15" rx="0.1" />

      {/* Mattress */}
      <rect x={bx} y={by + 0.6} width={bedW} height={bedH - 0.6} fill="#f1f5f9" stroke="#475569" strokeWidth="0.18" rx="0.2" />

      {/* Pillows */}
      <rect x={bx + 0.4} y={by + 0.8} width="1.6" height="1.0" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.12" rx="0.2" />
      <rect x={bx + bedW - 2.0} y={by + 0.8} width="1.6" height="1.0" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.12" rx="0.2" />

      {/* Quilt Fold Line */}
      <line x1={bx + 0.2} y1={by + 2.4} x2={bx + bedW - 0.2} y2={by + 2.4} stroke="#94a3b8" strokeWidth="0.14" strokeDasharray="0.3 0.2" />

      {/* Nightstands */}
      <rect x={bx - 1.1} y={by + 0.2} width="0.9" height="1.1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.12" rx="0.1" />
      <rect x={bx + bedW + 0.2} y={by + 0.2} width="0.9" height="1.1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.12" rx="0.1" />
    </g>
  );
}

/**
 * 5. CAD Bathroom Fixtures (WC Commode + Wash Basin)
 */
export function CadToiletFixtures({ x, y, width, height }) {
  const wcx = x + 0.7;
  const wcy = y + 0.7;

  return (
    <g opacity="0.5" className="select-none pointer-events-none">
      {/* Cistern Tank */}
      <rect x={wcx} y={wcy} width="1.8" height="0.7" fill="#e2e8f0" stroke="#475569" strokeWidth="0.15" rx="0.1" />
      {/* Bowl */}
      <ellipse cx={wcx + 0.9} cy={wcy + 1.5} rx="0.7" ry="0.9" fill="#f8fafc" stroke="#475569" strokeWidth="0.15" />
      <ellipse cx={wcx + 0.9} cy={wcy + 1.5} rx="0.45" ry="0.65" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.1" />

      {/* Washbasin */}
      {width >= 4.5 && (
        <g transform={`translate(${x + width - 1.8}, ${y + 0.7})`}>
          <rect x="0" y="0" width="1.4" height="1.1" fill="#f8fafc" stroke="#475569" strokeWidth="0.15" rx="0.2" />
          <ellipse cx="0.7" cy="0.55" rx="0.5" ry="0.38" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.1" />
        </g>
      )}
    </g>
  );
}

/**
 * 6. CAD Kitchen Fixtures (Counter, Gas Burners, Sink)
 */
export function CadKitchenFixtures({ x, y, width, height }) {
  if (width < 5 || height < 4.5) return null;

  const counterDepth = 1.8;
  const counterW = width - 1.2;

  return (
    <g opacity="0.45" className="select-none pointer-events-none">
      {/* Countertop */}
      <rect x={x + 0.6} y={y + 0.6} width={counterW} height={counterDepth} fill="#f1f5f9" stroke="#475569" strokeWidth="0.18" rx="0.1" />

      {/* Gas Stove */}
      <rect x={x + 1.2} y={y + 0.85} width="2.2" height="1.3" fill="#334155" stroke="#0f172a" strokeWidth="0.12" rx="0.15" />
      <circle cx={x + 1.75} cy={y + 1.5} r="0.4" fill="#64748b" stroke="#ffffff" strokeWidth="0.08" />
      <circle cx={x + 2.85} cy={y + 1.5} r="0.4" fill="#64748b" stroke="#ffffff" strokeWidth="0.08" />

      {/* Sink */}
      <rect x={x + counterW - 1.8} y={y + 0.85} width="1.6" height="1.3" fill="#e2e8f0" stroke="#475569" strokeWidth="0.12" rx="0.15" />
    </g>
  );
}

/**
 * 7. CAD Pooja Room Mandir Altar Symbol
 */
export function CadPoojaAltar({ x, y, width, height }) {
  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <g opacity="0.5" className="select-none pointer-events-none">
      <rect x={cx - 1.2} y={cy - 1.0} width="2.4" height="2.0" fill="#fef3c7" stroke="#d97706" strokeWidth="0.18" rx="0.3" />
      <circle cx={cx} cy={cy} r="0.5" fill="#f59e0b" />
      <polygon points={`${cx},${cy - 0.7} ${cx - 0.3},${cy} ${cx + 0.3},${cy}`} fill="#ef4444" />
      <text x={cx} y={cy + 1.7} fill="#b45309" fontSize="0.75" fontWeight="900" textAnchor="middle" className="font-mono">
        OM / PUJA
      </text>
    </g>
  );
}

/**
 * 8. True North Drafting Compass (Top Right Corner)
 */
export function CadTrueNorthCompass({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none select-none">
      <circle cx="6" cy="6" r="5.2" fill="#ffffff" stroke="#0f172a" strokeWidth="0.25" />
      <circle cx="6" cy="6" r="4.8" fill="none" stroke="#64748b" strokeWidth="0.1" strokeDasharray="0.3 0.2" />

      <polygon points="6,1.4 4.8,6 6,5.2 7.2,6" fill="#0f172a" />
      <polygon points="6,10.6 4.8,6 6,6.8 7.2,6" fill="#cbd5e1" stroke="#475569" strokeWidth="0.08" />

      <text x="6" y="0.8" fill="#0f172a" fontSize="1.3" fontWeight="900" textAnchor="middle" className="font-mono">
        N
      </text>
      <text x="6" y="13.2" fill="#64748b" fontSize="0.9" fontWeight="800" textAnchor="middle" className="font-mono tracking-widest">
        TRUE NORTH
      </text>
    </g>
  );
}

/**
 * 9. IS 962 / NBC Compliant Architectural CAD Title Block (Bottom Right Corner)
 */
export function CadTitleBlock({ 
  x, 
  y, 
  projectTitle = "30×40 Standard 2BHK", 
  clientName = "Shri Sharma",
  drawingTitle = "GROUND FLOOR PLAN", 
  scale = "1:100 / A3", 
  rev = "00", 
  dwgNo = "A-101",
  dateStr = new Date().toLocaleDateString('en-GB')
}) {
  const boxW = 28;
  const boxH = 14;

  return (
    <g transform={`translate(${x}, ${y})`} className="select-none font-sans pointer-events-none">
      {/* Title Block Border */}
      <rect x="0" y="0" width={boxW} height={boxH} fill="#ffffff" stroke="#0f172a" strokeWidth="0.35" className="shadow-md" />

      {/* Header Banner */}
      <rect x="0" y="0" width={boxW} height="2.2" fill="#0f172a" />
      <circle cx="1.3" cy="1.1" r="0.35" fill="#38bdf8" />
      <text x="2.2" y="1.45" fill="#ffffff" fontSize="0.75" fontWeight="900" className="tracking-wider font-mono">
        BUILDPAN AI — ARCHITECTURAL 2D CAD
      </text>
      <text x={boxW - 0.8} y="1.45" fill="#94a3b8" fontSize="0.55" fontWeight="700" textAnchor="end" className="font-mono">
        IS 962:1989 COMPLIANT
      </text>

      {/* Project Title */}
      <rect x="0" y="2.2" width={boxW} height="2.8" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.15" />
      <text x="0.8" y="3.1" fill="#64748b" fontSize="0.55" fontWeight="800" className="font-mono uppercase">PROJECT TITLE</text>
      <text x="0.8" y="4.3" fill="#0f172a" fontSize="0.95" fontWeight="900" className="tracking-wide">{projectTitle}</text>
      <text x={boxW - 0.8} y="4.3" fill="#475569" fontSize="0.65" fontWeight="600" textAnchor="end">Client: {clientName}</text>

      {/* Metadata Grid */}
      <line x1="0" y1="7.4" x2={boxW} y2="7.4" stroke="#0f172a" strokeWidth="0.15" />
      <line x1={boxW * 0.58} y1="5.0" x2={boxW * 0.58} y2="10.0" stroke="#0f172a" strokeWidth="0.15" />

      <text x="0.8" y="5.8" fill="#64748b" fontSize="0.5" fontWeight="800" className="font-mono uppercase">DRAWING</text>
      <text x="0.8" y="6.9" fill="#0284c7" fontSize="0.8" fontWeight="900" className="font-mono uppercase">{drawingTitle}</text>

      <text x={boxW * 0.58 + 0.8} y="5.8" fill="#64748b" fontSize="0.5" fontWeight="800" className="font-mono uppercase">SCALE & SHEET</text>
      <text x={boxW * 0.58 + 0.8} y="6.9" fill="#0f172a" fontSize="0.75" fontWeight="800" className="font-mono">{scale}</text>

      <line x1="0" y1="10.0" x2={boxW} y2="10.0" stroke="#0f172a" strokeWidth="0.15" />

      <text x="0.8" y="8.3" fill="#64748b" fontSize="0.5" fontWeight="800" className="font-mono uppercase">DATE & REV</text>
      <text x="0.8" y="9.4" fill="#0f172a" fontSize="0.75" fontWeight="800" className="font-mono">{dateStr} | Rev: {rev}</text>

      <text x={boxW * 0.58 + 0.8} y="8.3" fill="#64748b" fontSize="0.5" fontWeight="800" className="font-mono uppercase">DWG NO</text>
      <text x={boxW * 0.58 + 0.8} y="9.4" fill="#0f172a" fontSize="0.75" fontWeight="900" className="font-mono">{dwgNo}</text>

      {/* Disclaimer */}
      <rect x="0" y="10.0" width={boxW} height="4.0" fill="#f1f5f9" />
      <g transform="translate(0.8, 11.2)">
        <circle cx="0.4" cy="-0.2" r="0.25" fill="#eab308" />
        <text x="1.0" y="0.0" fill="#854d0e" fontSize="0.55" fontWeight="900" className="font-mono uppercase">STATUS: AI CONCEPT PROPOSAL (VERIFICATION REQUIRED)</text>
        <text x="0" y="1.2" fill="#64748b" fontSize="0.45" fontWeight="500">Generated via BuildPlan AI for design assistance. Statutory verification by a</text>
        <text x="0" y="2.0" fill="#64748b" fontSize="0.45" fontWeight="500">registered architect/engineer required per NBC 2016 before execution.</text>
      </g>
    </g>
  );
}

/**
 * 10. Architectural Door Opening with 90° Radial Dashed Swing Arc
 */
export function CadDoorSymbol({ door, roomX, roomY, roomW, roomH, index = 1 }) {
  const dw = door.width || 3.0;
  const wall = door.wall || 'north';
  const tag = door.isMainEntry ? 'MAIN' : `D${index}`;
  const isVertical = wall === 'east' || wall === 'west';

  const dx = door.x !== undefined ? door.x : (isVertical ? (wall === 'east' ? roomX + roomW : roomX) : roomX + 1.0);
  const dy = door.y !== undefined ? door.y : (isVertical ? roomY + 1.0 : (wall === 'south' ? roomY + roomH : roomY));

  let arcPath = "";
  let tagX = dx;
  let tagY = dy;

  if (isVertical) {
    if (wall === 'east') {
      arcPath = `M ${dx} ${dy} A ${dw} ${dw} 0 0 0 ${dx - dw} ${dy + dw}`;
      tagX = dx - dw * 0.5;
      tagY = dy + dw * 0.5;
    } else {
      arcPath = `M ${dx} ${dy} A ${dw} ${dw} 0 0 1 ${dx + dw} ${dy + dw}`;
      tagX = dx + dw * 0.5;
      tagY = dy + dw * 0.5;
    }
  } else {
    if (wall === 'north') {
      arcPath = `M ${dx} ${dy} A ${dw} ${dw} 0 0 1 ${dx + dw} ${dy + dw}`;
      tagX = dx + dw * 0.5;
      tagY = dy + dw * 0.5;
    } else {
      arcPath = `M ${dx} ${dy} A ${dw} ${dw} 0 0 0 ${dx + dw} ${dy - dw}`;
      tagX = dx + dw * 0.5;
      tagY = dy - dw * 0.5;
    }
  }

  return (
    <g className="pointer-events-none select-none">
      <line x1={dx} y1={dy} x2={isVertical ? dx : dx + dw} y2={isVertical ? dy + dw : dy} stroke="#ffffff" strokeWidth="0.7" />
      <line
        x1={dx}
        y1={dy}
        x2={isVertical ? (wall === 'east' ? dx - dw : dx + dw) : dx}
        y2={isVertical ? dy : (wall === 'north' ? dy + dw : dy - dw)}
        stroke={door.isMainEntry ? '#0284c7' : '#d97706'}
        strokeWidth="0.22"
      />
      <path d={arcPath} fill="none" stroke={door.isMainEntry ? '#0284c7' : '#0891b2'} strokeWidth="0.18" strokeDasharray="0.35 0.2" />
      <g transform={`translate(${tagX}, ${tagY})`}>
        <circle cx="0" cy="0" r="0.65" fill="#ffffff" stroke="#0891b2" strokeWidth="0.12" />
        <text x="0" y="0.25" fill="#0f172a" fontSize="0.55" fontWeight="900" textAnchor="middle" className="font-mono font-black">{tag}</text>
      </g>
    </g>
  );
}

/**
 * 11. Architectural Window Opening with Cyan Sill Detail and Tag
 */
export function CadWindowSymbol({ win, roomX, roomY, roomW, roomH, index = 1 }) {
  const ww = Math.min(win.width || 4.0, (win.wall === 'east' || win.wall === 'west') ? roomH - 0.8 : roomW - 0.8);
  const wall = win.wall || 'north';
  const isVertical = wall === 'east' || wall === 'west';
  const isVentilator = win.type === 'Ventilator' || win.width <= 2.5;
  const tag = isVentilator ? `V${index}` : `W${index}`;

  const wx = win.x !== undefined ? win.x : (isVertical ? (wall === 'east' ? roomX + roomW : roomX) : roomX + (roomW - ww) / 2);
  const wy = win.y !== undefined ? win.y : (isVertical ? roomY + (roomH - ww) / 2 : (wall === 'south' ? roomY + roomH : roomY));

  return (
    <g className="pointer-events-none select-none">
      <line x1={isVertical ? wx : wx} y1={isVertical ? wy : wy} x2={isVertical ? wx : wx + ww} y2={isVertical ? wy + ww : wy} stroke="#ffffff" strokeWidth="0.8" />
      {isVertical ? (
        <g>
          <line x1={wx - 0.25} y1={wy} x2={wx - 0.25} y2={wy + ww} stroke="#0284c7" strokeWidth="0.15" />
          <line x1={wx} y1={wy} x2={wx} y2={wy + ww} stroke="#38bdf8" strokeWidth="0.22" />
          <line x1={wx + 0.25} y1={wy} x2={wx + 0.25} y2={wy + ww} stroke="#0284c7" strokeWidth="0.15" />
        </g>
      ) : (
        <g>
          <line x1={wx} y1={wy - 0.25} x2={wx + ww} y2={wy - 0.25} stroke="#0284c7" strokeWidth="0.15" />
          <line x1={wx} y1={wy} x2={wx + ww} y2={wy} stroke="#38bdf8" strokeWidth="0.22" />
          <line x1={wx} y1={wy + 0.25} x2={wx + ww} y2={wy + 0.25} stroke="#0284c7" strokeWidth="0.15" />
        </g>
      )}
      <g transform={`translate(${isVertical ? (wall === 'east' ? wx + 0.9 : wx - 0.9) : wx + ww / 2}, ${isVertical ? wy + ww / 2 : (wall === 'north' ? wy - 0.9 : wy + 0.9)})`}>
        <circle cx="0" cy="0" r="0.65" fill="#e0f2fe" stroke="#0284c7" strokeWidth="0.12" />
        <text x="0" y="0.25" fill="#0369a1" fontSize="0.55" fontWeight="900" textAnchor="middle" className="font-mono font-black">{tag}</text>
      </g>
    </g>
  );
}

/**
 * 12. Vastu 9-Zone Overlay Grid Component
 */
export function CadVastuOverlay({ plotW, plotL }) {
  const cellW = plotW / 3;
  const cellH = plotL / 3;

  const zones = [
    { name: 'NW (VAYAVYA)', elem: 'Air / Guest', fill: '#f0fdf4', stroke: '#22c55e', tx: 0, ty: 0 },
    { name: 'NORTH (KUBER)', elem: 'Wealth / Water', fill: '#ecfeff', stroke: '#06b6d4', tx: 1, ty: 0 },
    { name: 'NE (ISHANYA)', elem: 'Divine / Water', fill: '#eff6ff', stroke: '#3b82f6', tx: 2, ty: 0 },
    { name: 'WEST (VARUNA)', elem: 'Dining / Bed', fill: '#f8fafc', stroke: '#64748b', tx: 0, ty: 1 },
    { name: 'BRAHMASTHANA', elem: 'Open Center', fill: '#fffbeb', stroke: '#f59e0b', tx: 1, ty: 1 },
    { name: 'EAST (INDRA)', elem: 'Entrance / Living', fill: '#ecfeff', stroke: '#06b6d4', tx: 2, ty: 1 },
    { name: 'SW (NAIRUTYA)', elem: 'Master / Earth', fill: '#fef2f2', stroke: '#ef4444', tx: 0, ty: 2 },
    { name: 'SOUTH (YAMA)', elem: 'Stairs / Bed', fill: '#faf5ff', stroke: '#a855f7', tx: 1, ty: 2 },
    { name: 'SE (AGNEYA)', elem: 'Kitchen / Fire', fill: '#fff7ed', stroke: '#f97316', tx: 2, ty: 2 }
  ];

  return (
    <g opacity="0.45" className="pointer-events-none select-none">
      {zones.map((z, idx) => (
        <g key={idx} transform={`translate(${z.tx * cellW}, ${z.ty * cellH})`}>
          <rect x="0" y="0" width={cellW} height={cellH} fill={z.fill} stroke={z.stroke} strokeWidth="0.25" strokeDasharray="0.6 0.3" />
          <text x={cellW / 2} y={cellH / 2 - 0.4} fill="#0f172a" fontSize="0.9" fontWeight="900" textAnchor="middle" className="font-mono">{z.name}</text>
          <text x={cellW / 2} y={cellH / 2 + 0.8} fill="#475569" fontSize="0.7" fontWeight="700" textAnchor="middle">{z.elem}</text>
        </g>
      ))}
    </g>
  );
}
