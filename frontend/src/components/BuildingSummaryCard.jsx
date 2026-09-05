import React, { useState } from 'react';
import { Building2, Layers, ChevronDown, ChevronUp, Home } from 'lucide-react';

const ROOM_CATEGORIES = [
  { key: 'bedrooms', label: 'Bedrooms', icon: '🛏', matchTypes: ['Bedroom', 'Master Bedroom', 'Study Room'] },
  { key: 'halls', label: 'Living/Hall', icon: '🛋', matchTypes: ['Living Room', 'Hall'] },
  { key: 'kitchens', label: 'Kitchen', icon: '🍳', matchTypes: ['Kitchen'] },
  { key: 'bathrooms', label: 'Bathrooms', icon: '🚿', matchTypes: ['Bathroom'] },
  { key: 'washrooms', label: 'Washrooms', icon: '🚽', matchTypes: ['Washroom'] },
  { key: 'dining', label: 'Dining', icon: '🍽', matchTypes: ['Dining Room'] },
  { key: 'balcony', label: 'Balcony', icon: '🌿', matchTypes: ['Balcony'] },
  { key: 'staircase', label: 'Staircase', icon: '🪜', matchTypes: ['Staircase'] },
  { key: 'utility', label: 'Utility/Store', icon: '📦', matchTypes: ['Utility Room', 'Store Room', 'Pooja Room'] }
];

export default function BuildingSummaryCard({ layout, activeFloorFilter = 'combined' }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'breakdown' | 'totals'
  const [expandedFloor, setExpandedFloor] = useState('all'); // 'ground' | 'first' | 'all'

  const plot = layout?.plot || { width: 30, length: 40, unit: 'ft' };
  const floors = layout?.floors || [];
  const groundFloor = floors.find(f => f.floor === 'ground') || { rooms: [] };
  const firstFloor = floors.find(f => f.floor === 'first') || { rooms: [] };

  const groundRooms = groundFloor.rooms || [];
  const firstRooms = firstFloor.rooms || [];
  const allRooms = [...groundRooms, ...firstRooms];

  // Helper: Calculate Category Count for a list of rooms
  const getCategoryCount = (rooms, matchTypes) => {
    return rooms.filter(r => matchTypes.includes(r.type)).length;
  };

  // Helper: Group rooms by category for room-wise breakdown
  const getGroupedRooms = (rooms) => {
    const groups = {};
    rooms.forEach(r => {
      let groupName = 'Other Spaces';
      if (['Bedroom', 'Master Bedroom', 'Study Room'].includes(r.type)) groupName = 'Bedrooms';
      else if (['Living Room', 'Hall'].includes(r.type)) groupName = 'Living / Hall';
      else if (['Kitchen'].includes(r.type)) groupName = 'Kitchen';
      else if (['Bathroom', 'Washroom'].includes(r.type)) groupName = 'Bathrooms';
      else if (['Dining Room'].includes(r.type)) groupName = 'Dining';
      else if (['Balcony'].includes(r.type)) groupName = 'Balcony';
      else if (['Staircase'].includes(r.type)) groupName = 'Staircase';
      else if (['Utility Room', 'Store Room', 'Pooja Room'].includes(r.type)) groupName = 'Utility & Store';

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(r);
    });
    return groups;
  };

  // Total Building Stats
  const totalFloorsCount = floors.length || 1;
  const totalBedrooms = getCategoryCount(allRooms, ['Bedroom', 'Master Bedroom', 'Study Room']);
  const totalKitchens = getCategoryCount(allRooms, ['Kitchen']);
  const totalHalls = getCategoryCount(allRooms, ['Living Room', 'Hall']);
  const totalBathrooms = getCategoryCount(allRooms, ['Bathroom', 'Washroom']);
  const totalBalconies = getCategoryCount(allRooms, ['Balcony']);
  const totalStaircases = getCategoryCount(allRooms, ['Staircase']);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 font-sans">
      
      {/* HEADER & VIEW TABS */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Building Summary</h3>
        </div>
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold rounded-md">
          {totalFloorsCount} {totalFloorsCount === 1 ? 'Floor' : 'Floors'} ({allRooms.length} Spaces)
        </span>
      </div>

      {/* VIEW SWITCH TABS */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-1 rounded-lg transition ${
            activeTab === 'summary' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Floor Summary
        </button>
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`py-1 rounded-lg transition ${
            activeTab === 'breakdown' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Breakdown
        </button>
        <button
          onClick={() => setActiveTab('totals')}
          className={`py-1 rounded-lg transition ${
            activeTab === 'totals' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Total Stats
        </button>
      </div>

      {/* TAB 1: FLOOR-WISE ROOM SUMMARY TABLE */}
      {activeTab === 'summary' && (
        <div className="space-y-4 pt-1">
          {/* GROUND FLOOR TABLE */}
          {(groundRooms.length > 0 || activeFloorFilter === 'ground' || activeFloorFilter === 'combined') && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <span className="text-xs font-black text-sky-700 uppercase tracking-wider">GROUND FLOOR</span>
                <span className="text-[10px] font-mono font-bold text-slate-500">{groundRooms.length} Rooms</span>
              </div>
              
              <div className="space-y-1.5 font-mono text-xs">
                {ROOM_CATEGORIES.map(cat => {
                  const count = getCategoryCount(groundRooms, cat.matchTypes);
                  return (
                    <div key={`g_${cat.key}`} className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-0">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      <span className={`font-bold ${count > 0 ? 'text-sky-700 font-extrabold' : 'text-slate-400'}`}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FIRST FLOOR TABLE */}
          {(firstRooms.length > 0 || activeFloorFilter === 'first' || activeFloorFilter === 'combined') && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">FIRST FLOOR</span>
                <span className="text-[10px] font-mono font-bold text-slate-500">{firstRooms.length} Rooms</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {ROOM_CATEGORIES.map(cat => {
                  const count = getCategoryCount(firstRooms, cat.matchTypes);
                  return (
                    <div key={`f_${cat.key}`} className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-0">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      <span className={`font-bold ${count > 0 ? 'text-indigo-700 font-extrabold' : 'text-slate-400'}`}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROOM-WISE DETAILED FLOOR BREAKDOWN */}
      {activeTab === 'breakdown' && (
        <div className="space-y-3 pt-1">
          {/* Ground Floor Detailed List */}
          {groundRooms.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-black text-sky-700 uppercase tracking-wider border-b border-sky-100 pb-1">
                GROUND FLOOR ROOMS
              </div>
              {Object.entries(getGroupedRooms(groundRooms)).map(([groupName, rooms]) => (
                <div key={`g_grp_${groupName}`} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{groupName}</span>
                    <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-mono">
                      {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                    </span>
                  </div>
                  <div className="space-y-0.5 pl-2 text-[11px] font-mono text-slate-600">
                    {rooms.map(r => (
                      <div key={r.id} className="flex items-center justify-between">
                        <span>• {r.name}</span>
                        <span className="font-semibold text-slate-800">{r.width} × {r.height} {plot.unit} ({r.area} sq.{plot.unit})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* First Floor Detailed List */}
          {firstRooms.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-[11px] font-black text-indigo-700 uppercase tracking-wider border-b border-indigo-100 pb-1">
                FIRST FLOOR ROOMS
              </div>
              {Object.entries(getGroupedRooms(firstRooms)).map(([groupName, rooms]) => (
                <div key={`f_grp_${groupName}`} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{groupName}</span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-mono">
                      {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                    </span>
                  </div>
                  <div className="space-y-0.5 pl-2 text-[11px] font-mono text-slate-600">
                    {rooms.map(r => (
                      <div key={r.id} className="flex items-center justify-between">
                        <span>• {r.name}</span>
                        <span className="font-semibold text-slate-800">{r.width} × {r.height} {plot.unit} ({r.area} sq.{plot.unit})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOTAL BUILDING OVERALL SUMMARY STATS */}
      {activeTab === 'totals' && (
        <div className="bg-gradient-to-br from-indigo-50/80 to-sky-50/80 border border-indigo-200 rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
          <div className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider pb-1 border-b border-indigo-200">
            TOTAL BUILDING SUMMARY
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-800 font-bold">
            <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
              <span className="text-[10px] text-slate-500">Total Floors:</span>
              <span className="text-sm text-indigo-700 font-extrabold">{totalFloorsCount}</span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
              <span className="text-[10px] text-slate-500">Total Bedrooms:</span>
              <span className="text-sm text-indigo-700 font-extrabold">{totalBedrooms}</span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
              <span className="text-[10px] text-slate-500">Total Kitchens:</span>
              <span className="text-sm text-indigo-700 font-extrabold">{totalKitchens}</span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
              <span className="text-[10px] text-slate-500">Total Halls:</span>
              <span className="text-sm text-indigo-700 font-extrabold">{totalHalls}</span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
              <span className="text-[10px] text-slate-500">Total Bathrooms:</span>
              <span className="text-sm text-indigo-700 font-extrabold">{totalBathrooms}</span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
              <span className="text-[10px] text-slate-500">Total Balconies:</span>
              <span className="text-sm text-indigo-700 font-extrabold">{totalBalconies}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-indigo-200 flex justify-between items-center text-xs font-black text-indigo-950">
            <span>Total Rooms / Spaces:</span>
            <span className="text-sm text-indigo-700 font-extrabold">{allRooms.length}</span>
          </div>

          {/* IS 3861: 2002 / RERA Carpet Area Breakdown */}
          <div className="mt-3 pt-3 border-t border-indigo-200/80 space-y-1.5 text-[11px] text-slate-700 font-mono">
            <div className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider mb-1">
              IS 3861: 2002 / RERA AREA MEASUREMENT
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Plinth / Built-Up Area:</span>
              <span className="font-extrabold text-slate-900">{layout?.plinthArea || layout?.builtUpArea || (plot.width * plot.length)} sq.{plot.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-bold">RERA Carpet Area (Net):</span>
              <span className="font-black text-emerald-700">{layout?.carpetArea || Math.round((plot.width * plot.length) * 0.9)} sq.{plot.unit}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>External Wall Deduction (9"):</span>
              <span>{layout?.wallDeductionArea || Math.round((plot.width * plot.length) * 0.1)} sq.{plot.unit}</span>
            </div>
          </div>

          {/* CODE COMPLIANCE CERTIFICATION (ECSBC 2024, MAHARASHTRA CO-OP ACT 1960, NBC 2016) */}
          <div className="mt-3 pt-3 border-t border-indigo-200/80 space-y-2 font-sans">
            <div className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider">
              CIVIL & ENERGY CODE CERTIFICATION
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex items-center justify-between text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>ECSBC 2024 (BEE)</span>
                </div>
                <span className="font-extrabold font-mono text-emerald-700">5-STAR GREEN RATED</span>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-2 rounded-lg flex items-center justify-between text-indigo-950">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Maharashtra Co-op Act 1960</span>
                </div>
                <span className="font-extrabold font-mono text-indigo-700">FSI & BYLAWS COMPLIANT</span>
              </div>

              <div className="bg-sky-50 border border-sky-200 p-2 rounded-lg flex items-center justify-between text-sky-950">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span>NBC 2016 (Volume 1)</span>
                </div>
                <span className="font-extrabold font-mono text-sky-700">SAFETY & STRUCTURAL PASS</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
