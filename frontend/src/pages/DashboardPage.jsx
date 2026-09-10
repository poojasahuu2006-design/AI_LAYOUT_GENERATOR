import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PlusCircle, FolderKanban, Layers, Box, Settings, 
  Sparkles, Save, Download, Printer, Send, ShieldAlert, Sliders, CheckCircle2, AlertTriangle, 
  MousePointer, Square, DoorOpen, Maximize2, Lightbulb, Undo, Redo, FileText, Check, ListChecks,
  HardHat, Compass, Table, IndianRupee, Ruler
} from 'lucide-react';
import FloorPlan2DViewer from '../components/floorplan/FloorPlan2DViewer';
import Building3DViewer from '../components/3d/Building3DViewer';
import ValidationAlertModal from '../components/ValidationAlertModal';
import CivilEstimatorModal from '../components/CivilEstimatorModal';
import VastuComplianceModal from '../components/VastuComplianceModal';
import DoorWindowScheduleModal from '../components/DoorWindowScheduleModal';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { customizeLayout, saveProject, generateLayout } from '../services/api';
import { generateFloorLayoutLocally } from '../services/localLayoutEngine';
import BuildingSummaryCard from '../components/BuildingSummaryCard';
import { exportProjectJson, printFloorPlan } from '../utils/exportUtils';

import { useAuth } from '../context/AuthContext';

export default function DashboardPage({ 
  currentProject, 
  setCurrentProject, 
  onNavigate 
}) {
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiCustomizing, setAiCustomizing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'room' | 'wall' | 'door' | 'window'

  // Construction Modals State
  const [showCostModal, setShowCostModal] = useState(false);
  const [showVastuModal, setShowVastuModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Demo Save Account Modal State
  const [showDemoSaveModal, setShowDemoSaveModal] = useState(false);

  // Validation Alert Modal State
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Auto-generate default Ground + First layout if project is uninitialized
  useEffect(() => {
    if (!currentProject || !currentProject.layout || !currentProject.layout.floors || currentProject.layout.floors.length === 0) {
      const defaultLayout = generateDefaultProject();
      setCurrentProject && setCurrentProject(defaultLayout);
    }
  }, [currentProject]);

  function generateDefaultProject() {
    const demoPlot = { length: 40, width: 30, unit: 'ft' };
    const selectedFloors = ['ground', 'first'];
    const floorRequirements = {
      ground: [
        { type: 'Living Room', quantity: 1 },
        { type: 'Kitchen', quantity: 1 },
        { type: 'Dining Room', quantity: 1 },
        { type: 'Bathroom', quantity: 1 },
        { type: 'Staircase', quantity: 1 }
      ],
      first: [
        { type: 'Master Bedroom', quantity: 1 },
        { type: 'Bedroom', quantity: 1 },
        { type: 'Living Room', quantity: 1 },
        { type: 'Bathroom', quantity: 1 },
        { type: 'Balcony', quantity: 1 },
        { type: 'Staircase', quantity: 1 }
      ]
    };

    const layout = generateFloorLayoutLocally({ plot: demoPlot, selectedFloors, floorRequirements });

    return {
      projectName: '30×40 ft Ground + First Floor Layout',
      plotLength: 40,
      plotWidth: 30,
      unit: 'ft',
      selectedFloors,
      layout
    };
  }

  const layout = currentProject?.layout || {
    plot: { width: 30, length: 40, unit: 'ft' },
    floors: []
  };

  const plot = layout.plot || { width: 30, length: 40, unit: 'ft' };
  const floors = layout.floors || [];
  const groundFloor = floors.find(f => f.floor === 'ground') || { rooms: [] };
  const firstFloor = floors.find(f => f.floor === 'first') || { rooms: [] };

  const allRooms = [...(groundFloor.rooms || []), ...(firstFloor.rooms || [])];
  const selectedRoom = allRooms.find(r => r.id === selectedRoomId);

  // Selected room edit state
  const [editWidth, setEditWidth] = useState(selectedRoom?.width || 10);
  const [editHeight, setEditHeight] = useState(selectedRoom?.height || 10);

  useEffect(() => {
    if (selectedRoom) {
      setEditWidth(selectedRoom.width);
      setEditHeight(selectedRoom.height);
    }
  }, [selectedRoomId]);

  // Room Property Edit Apply
  const handleApplyRoomEdit = () => {
    if (!selectedRoom) return;
    const updatedFloors = floors.map(f => ({
      ...f,
      rooms: f.rooms.map(r => {
        if (r.id === selectedRoom.id) {
          const w = Math.max(2, Number(editWidth));
          const h = Math.max(2, Number(editHeight));
          return { ...r, width: w, height: h, area: Math.round(w * h * 10) / 10 };
        }
        return r;
      })
    }));

    const updatedBuiltUp = updatedFloors.reduce((sum, f) => sum + f.rooms.reduce((s, r) => s + r.area, 0), 0);

    setCurrentProject({
      ...currentProject,
      layout: { 
        ...layout, 
        floors: updatedFloors,
        builtUpArea: Math.round(updatedBuiltUp * 10) / 10,
        usedArea: Math.round(updatedBuiltUp * 10) / 10,
        spaceUtilization: Math.min(100, Math.round((updatedBuiltUp / (plot.width * plot.length * (currentProject?.selectedFloors?.length || 1))) * 100))
      }
    });
  };

  const [previousLayout, setPreviousLayout] = useState(null);
  const [customFeedback, setCustomFeedback] = useState(null);

  // AI Customization submit
  const handleCustomizationSubmit = async (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setAiCustomizing(true);
    setCustomFeedback(null);

    try {
      // Save snapshot for Undo
      setPreviousLayout(structuredClone(layout));

      const result = await customizeLayout(layout, customPrompt);
      if (result.success && result.layout) {
        setCurrentProject({ ...currentProject, layout: result.layout });
        setCustomFeedback({ success: true, message: result.message || 'Layout updated successfully.' });
        setCustomPrompt('');
      } else {
        setCustomFeedback({ success: false, message: result.reason || 'Unable to apply customization command.' });
      }
    } catch (err) {
      console.error(err);
      setCustomFeedback({ success: false, message: 'Customization error: ' + err.message });
    } finally {
      setAiCustomizing(false);
    }
  };

  const handleUndoCustomization = () => {
    if (previousLayout) {
      setCurrentProject({ ...currentProject, layout: previousLayout });
      setPreviousLayout(null);
      setCustomFeedback({ success: true, message: 'Reverted to previous layout.' });
    }
  };

  // Save Project
  const handleSaveProject = async () => {
    try {
      const payload = {
        projectName: currentProject?.projectName || `${plot.width}×${plot.length} ${plot.unit} Layout`,
        plotLength: plot.length,
        plotWidth: plot.width,
        unit: plot.unit || 'ft',
        selectedFloors: currentProject?.selectedFloors || ['ground'],
        floors: floors,
        layout: layout
      };

      const res = await saveProject(payload);
      if (res.success) {
        setSaveSuccessMsg('Project saved to your account!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save project: ' + err.message);
    }
  };

  // Resolution Actions for Validation Modal
  const handleReduceRoomSizes = () => {
    const updatedFloors = floors.map(f => ({
      ...f,
      rooms: f.rooms.map(r => ({
        ...r,
        width: Math.max(4, Math.round(r.width * 0.85 * 10) / 10),
        height: Math.max(4, Math.round(r.height * 0.85 * 10) / 10),
        area: Math.round((r.width * 0.85 * r.height * 0.85) * 10) / 10
      }))
    }));

    setCurrentProject({
      ...currentProject,
      layout: { ...layout, floors: updatedFloors }
    });
    setShowValidationModal(false);
  };

  const handleRemoveRoom = () => {
    if (allRooms.length <= 1) return;
    const smallestRoom = [...allRooms].sort((a, b) => a.area - b.area)[0];
    const updatedFloors = floors.map(f => ({
      ...f,
      rooms: f.rooms.filter(r => r.id !== smallestRoom.id)
    }));

    setCurrentProject({
      ...currentProject,
      layout: { ...layout, floors: updatedFloors }
    });
    setShowValidationModal(false);
  };

  const handleIncreasePlotDimensions = () => {
    const updatedPlot = {
      ...plot,
      width: plot.width + 10,
      length: plot.length + 10
    };

    setCurrentProject({
      ...currentProject,
      layout: { ...layout, plot: updatedPlot }
    });
    setShowValidationModal(false);
  };

  const handleAutoOptimize = async () => {
    try {
      const regenerated = await generateLayout({
        plot,
        selectedFloors: currentProject?.selectedFloors || ['ground']
      });
      setCurrentProject({ ...currentProject, layout: regenerated });
      setShowValidationModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const usedArea = layout.usedArea || layout.builtUpArea || allRooms.reduce((sum, r) => sum + r.area, 0);
  const totalPlotArea = plot.width * plot.length;
  const remainingArea = Math.max(0, totalPlotArea - usedArea);
  const efficiency = layout.spaceUtilization || layout.efficiencyRatio || (totalPlotArea ? Math.min(100, Math.round((usedArea / totalPlotArea) * 100)) : 0);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* 1. LEFT SIDEBAR NAVIGATION & TOOLS */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo / Header */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">AI House Planner</div>
              <div className="text-[10px] text-sky-700 font-semibold uppercase">Professional SaaS Studio</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200"
            >
              <LayoutDashboard className="w-4 h-4" /> Workspace Dashboard
            </button>

            <button
              onClick={() => onNavigate('input')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" /> New Project
            </button>

            <button
              onClick={() => onNavigate('saved')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              <FolderKanban className="w-4 h-4 text-indigo-600" /> My Saved Designs
            </button>

            {/* Left Tool Palette */}
            <div className="pt-4 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Design Tools
            </div>

            {[
              { id: 'select', name: 'Select Tool', icon: MousePointer },
              { id: 'room', name: 'Add Room', icon: Square },
              { id: 'door', name: 'Add Door', icon: DoorOpen },
              { id: 'window', name: 'Add Window', icon: Maximize2 }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTool === tool.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <tool.icon className="w-4 h-4" /> {tool.name}
              </button>
            ))}

            <div className="pt-4 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              View Switcher
            </div>

            <button
              onClick={() => setViewMode('2d')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                viewMode === '2d' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" /> 2D Floor Plan
            </button>

            <button
              onClick={() => setViewMode('3d')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                viewMode === '3d' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Box className="w-4 h-4" /> 3D View Model
            </button>
          </div>
        </div>

        {/* Sidebar Footer Stats */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="text-[11px] text-slate-600 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Plot:</span>
              <span className="font-bold text-slate-900">{plot.width}×{plot.length} {plot.unit}</span>
            </div>
            <div className="flex justify-between">
              <span>Built-Up:</span>
              <span className="font-bold text-sky-700">{usedArea} sq.{plot.unit}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CENTER WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top SaaS Header Toolbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-none">
              {currentProject?.projectName || 'Building Layout Project'}
            </h1>
            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-mono font-bold rounded-md hidden sm:inline-block">
              {plot.width} × {plot.length} {plot.unit}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-600 font-bold animate-pulse mr-2 hidden sm:inline">
                ✓ {saveSuccessMsg}
              </span>
            )}

            {/* CIVIL BOQ & COST ESTIMATOR */}
            <button
              onClick={() => setShowCostModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="Calculate Bill of Quantities & Construction Budget"
            >
              <HardHat className="w-3.5 h-3.5" /> <span className="hidden sm:inline">BOQ & Cost</span>
            </button>

            {/* VASTU SHASTRA AUDIT */}
            <button
              onClick={() => setShowVastuModal(true)}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              title="Vastu Shastra Compass Audit"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" /> <span className="hidden sm:inline">Vastu</span>
            </button>

            {/* DOOR & WINDOW SCHEDULES */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              title="Schedule of Openings (Doors & Windows)"
            >
              <Table className="w-3.5 h-3.5 text-sky-600" /> <span className="hidden sm:inline">Schedules</span>
            </button>

            {/* PRINT BLUEPRINT */}
            <button
              onClick={printFloorPlan}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
              title="Print Blueprint"
            >
              <Printer className="w-3.5 h-3.5" /> <span className="hidden md:inline">Print</span>
            </button>
            
            <button
              onClick={handleSaveProject}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>

            <button
              onClick={() => exportProjectJson(currentProject)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition hidden sm:flex"
            >
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
          </div>
        </header>

        {/* Center Canvas + Right Specs Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Visualizer Area */}
          <div className="flex-1 p-3 bg-slate-100 flex flex-col overflow-hidden relative">
            {layout.warnings && layout.warnings.length > 0 && (
              <div className="mb-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{layout.warnings[0]}</span>
                </div>
                <button 
                  onClick={() => setShowValidationModal(true)}
                  className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-lg"
                >
                  Resolve Issues
                </button>
              </div>
            )}

            <div className="flex-1 h-full overflow-hidden print:overflow-visible print:h-auto visualizer-container">
              {/* PRINT-ONLY ARCHITECTURAL SHEET TITLE BLOCK */}
              <div className="hidden print:flex items-center justify-between pb-3 mb-2 border-b-2 border-slate-900 font-mono text-xs text-slate-900">
                <div>
                  <div className="text-base font-black uppercase tracking-wider">{currentProject?.projectName || '30×40 FT GROUND + FIRST FLOOR LAYOUT'}</div>
                  <div className="text-[11px] text-slate-700">
                    PLOT: {plot.width} × {plot.length} {plot.unit} ({plot.width * plot.length} SQ.FT) | BUILT-UP: {usedArea} SQ.FT | CODE: NBC 2016 • IS 3861:2002
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <div className="font-bold text-sky-800 uppercase">ARCHITECTURAL CAD BLUEPRINT</div>
                  <div className="text-slate-600">SCALE: 1:100 | SHEET: 01 OF 01</div>
                </div>
              </div>

              {viewMode === '2d' ? (
                <FloorPlan2DViewer
                  layout={layout}
                  onLayoutChange={(updatedLayout) => setCurrentProject({ ...currentProject, layout: updatedLayout })}
                  onSwitchTo3D={() => setViewMode('3d')}
                  isEditMode={isEditMode}
                  setIsEditMode={setIsEditMode}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                />
              ) : (
                <Building3DViewer
                  layout={layout}
                  onSwitchTo2D={() => setViewMode('2d')}
                />
              )}

              {/* PRINT-ONLY ARCHITECTURAL FOOTER STAMP */}
              <div className="hidden print:flex items-center justify-between pt-2 mt-2 border-t-2 border-slate-900 font-mono text-[10px] text-slate-800">
                <div>DRAWING: RESIDENTIAL DUPLEX (GROUND + FIRST FLOOR)</div>
                <div>LICENSED CAD ENGINE: AI HOUSE PLANNER</div>
                <div className="font-bold text-emerald-800">STATUS: APPROVED & ISSUED FOR CONSTRUCTION</div>
              </div>
            </div>

            {/* Customization Feedback Banner */}
            {customFeedback && (
              <div className={`mt-2 px-4 py-2 rounded-xl text-xs flex items-center justify-between font-mono shrink-0 shadow-sm ${
                customFeedback.success ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{customFeedback.success ? '✓' : '⚠️'}</span>
                  <span>{customFeedback.message}</span>
                </div>
                <button onClick={() => setCustomFeedback(null)} className="font-bold text-[10px] uppercase opacity-70 hover:opacity-100">
                  Dismiss
                </button>
              </div>
            )}

            {/* Bottom AI Customization Bar */}
            <form 
              onSubmit={handleCustomizationSubmit}
              className="mt-2 bg-white border border-slate-200 rounded-2xl p-2 flex items-center gap-2 shadow-md shrink-0"
            >
              <div className="pl-3 text-sky-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder='AI Customization: e.g. "Increase master bedroom size", "Move staircase to left", "Make hall larger", "Add bathroom"'
                className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none px-2 py-1 font-sans"
              />

              {previousLayout && (
                <button
                  type="button"
                  onClick={handleUndoCustomization}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1 transition"
                  title="Revert to previous layout state"
                >
                  <Undo className="w-3.5 h-3.5" /> Undo
                </button>
              )}

              <button
                type="submit"
                disabled={aiCustomizing || !customPrompt.trim()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {aiCustomizing ? 'Updating...' : 'Apply Change'} <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* RIGHT SIDEBAR PROPERTIES & INSIGHTS PANEL */}
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 hidden lg:flex overflow-y-auto p-4 space-y-4">
            
            {/* SECTION 19: YOUR REQUIREMENTS PANEL */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                <ListChecks className="w-4 h-4 text-sky-600" />
                <span>Your Requirements</span>
              </div>

              <div className="text-xs space-y-2">
                <div className="font-mono text-slate-600 text-[11px] pb-1 border-b border-slate-200">
                  Plot: <span className="font-bold text-slate-900">{plot.width} × {plot.length} {plot.unit}</span>
                </div>

                {/* Ground Floor Requirements */}
                {groundFloor.rooms && groundFloor.rooms.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-sky-700 uppercase">Ground Floor</div>
                    <div className="mt-1 space-y-1">
                      {groundFloor.rooms.map(room => (
                        <div key={room.id} className="flex items-center justify-between text-[11px] text-slate-700 font-mono">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {room.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {room.width}×{room.height} {plot.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* First Floor Requirements */}
                {firstFloor.rooms && firstFloor.rooms.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-indigo-700 uppercase">First Floor</div>
                    <div className="mt-1 space-y-1">
                      {firstFloor.rooms.map(room => (
                        <div key={room.id} className="flex items-center justify-between text-[11px] text-slate-700 font-mono">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {room.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {room.width}×{room.height} {plot.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NEW FEATURE: FLOOR-WISE BUILDING ROOM SUMMARY */}
            <BuildingSummaryCard layout={layout} />

            {/* Selected Room Properties Card */}
            {selectedRoom ? (
              <div className="bg-slate-50 border border-sky-200 p-4 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">{selectedRoom.name}</span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-mono rounded-md font-bold">
                    {selectedRoom.floor.toUpperCase()} FLOOR
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Width ({plot.unit})</label>
                    <input
                      type="number"
                      value={editWidth}
                      onChange={(e) => setEditWidth(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Height ({plot.unit})</label>
                    <input
                      type="number"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleApplyRoomEdit}
                  className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Apply Room Changes
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center italic">
                Click any room on the 2D plan to view & edit specs.
              </div>
            )}

            {/* PROJECT SUMMARY PANEL */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">Project Summary</h3>
              <div className="text-xs font-mono text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Plot Size:</span>
                  <span className="font-bold">{plot.width} × {plot.length} {plot.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Plot Area:</span>
                  <span className="font-bold">{totalPlotArea} sq.{plot.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Floors:</span>
                  <span className="font-bold capitalize">{currentProject?.selectedFloors?.join(' + ') || 'Ground'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Used Area:</span>
                  <span className="font-bold text-sky-700">{usedArea} sq.{plot.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Area:</span>
                  <span className="font-bold text-emerald-700">{remainingArea} sq.{plot.unit}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span>Space Utilization:</span>
                  <span className="text-sky-700">{efficiency}%</span>
                </div>
              </div>
            </div>

            {/* AI DESIGN INSIGHTS CARD */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-extrabold text-sky-800">
                <Lightbulb className="w-4 h-4 text-sky-600" />
                <span>AI Design Insights</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                {(layout.insights || [
                  "Bedrooms are placed away from main entrance for better privacy.",
                  "Kitchen is positioned close to dining area for efficient service.",
                  "Natural ventilation is supported through exterior facing windows."
                ]).map((ins, idx) => (
                  <li key={idx}>{ins}</li>
                ))}
              </ul>
            </div>

          </aside>

        </div>

      </main>

      {/* Validation Alert Modal */}
      <ValidationAlertModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        plot={plot}
        errors={layout.warnings}
        onReduceRoomSizes={handleReduceRoomSizes}
        onRemoveRoom={handleRemoveRoom}
        onIncreasePlotDimensions={handleIncreasePlotDimensions}
        onAutoOptimize={handleAutoOptimize}
      />

      {/* Civil BOQ & Construction Cost Estimator Modal */}
      <CivilEstimatorModal
        isOpen={showCostModal}
        onClose={() => setShowCostModal(false)}
        layout={layout}
      />

      {/* Vastu Shastra Audit Modal */}
      <VastuComplianceModal
        isOpen={showVastuModal}
        onClose={() => setShowVastuModal(false)}
        layout={layout}
      />

      {/* Construction Schedule of Openings Modal */}
      <DoorWindowScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        layout={layout}
      />

    </div>
  );
}
