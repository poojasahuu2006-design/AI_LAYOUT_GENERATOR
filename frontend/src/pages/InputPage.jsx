import React, { useState, useEffect, useRef } from 'react';
import { 
  Ruler, Mic, MicOff, Sparkles, Plus, Minus, Home, ArrowRight, RefreshCw, AlertCircle, Layers, CheckCircle2, Check, HelpCircle 
} from 'lucide-react';
import { parseRequirements, generateLayout } from '../services/api';
import { isSpeechSupported, createSpeechListener } from '../utils/speechRecognition';

const ROOM_CATALOG = [
  { type: 'Bedroom', label: 'Bedroom' },
  { type: 'Master Bedroom', label: 'Master Bedroom' },
  { type: 'Living Room', label: 'Living Room' },
  { type: 'Hall', label: 'Hall' },
  { type: 'Kitchen', label: 'Kitchen' },
  { type: 'Dining Room', label: 'Dining Room' },
  { type: 'Bathroom', label: 'Bathroom' },
  { type: 'Washroom', label: 'Washroom / Toilet' },
  { type: 'Balcony', label: 'Balcony' },
  { type: 'Utility Room', label: 'Utility Room' },
  { type: 'Store Room', label: 'Store Room' },
  { type: 'Staircase', label: 'Staircase' },
  { type: 'Study Room', label: 'Study Room' },
  { type: 'Pooja Room', label: 'Pooja Room' }
];

export default function InputPage({ onGenerateSuccess }) {
  // Step Wizard State: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Plot Specs
  const [plotLength, setPlotLength] = useState(40);
  const [plotWidth, setPlotWidth] = useState(30);
  const [unit, setUnit] = useState('ft');
  const [frontDirection, setFrontDirection] = useState('North');
  const [roadSide, setRoadSide] = useState('Front');

  // Step 2: Floor Selection ('ground' | 'first' | 'both')
  const [floorMode, setFloorMode] = useState('both'); // 'ground', 'first', 'both'

  // Step 3: Room Quantities (separated for Ground & First if both selected)
  const [groundCounts, setGroundCounts] = useState({
    'Living Room': 1,
    'Kitchen': 1,
    'Dining Room': 1,
    'Bathroom': 1,
    'Staircase': 1
  });

  const [firstCounts, setFirstCounts] = useState({
    'Master Bedroom': 1,
    'Bedroom': 1,
    'Bathroom': 1,
    'Balcony': 1,
    'Staircase': 1
  });

  // Step 4: NLP Text & Voice State
  const [naturalText, setNaturalText] = useState(
    'I have a 30 x 40 ft plot. On ground floor I need a living hall, kitchen, dining and bathroom. On first floor I need 2 bedrooms, bathroom and a balcony.'
  );

  const [parsedPreview, setParsedPreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [recognition, setRecognition] = useState(null);

  // Loading Screen Stepped Animation State
  const [loading, setLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [voiceCaptured, setVoiceCaptured] = useState(false);

  const baseTextRef = useRef('');

  // Setup Web Speech API
  useEffect(() => {
    if (isSpeechSupported()) {
      const rec = createSpeechListener({
        onResult: (fullSessionTranscript) => {
          setSpeechError('');
          setVoiceCaptured(true);
          const base = (baseTextRef.current || '').trim();
          const cleanSession = (fullSessionTranscript || '').trim();
          if (cleanSession) {
            setNaturalText(base ? `${base} ${cleanSession}` : cleanSession);
          }
        },
        onError: (err) => {
          setSpeechError(err);
          setIsListening(false);
        },
        onEnd: () => setIsListening(false)
      });
      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!isSpeechSupported() || !recognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setSpeechError('');
      setVoiceCaptured(false);
      baseTextRef.current = naturalText; // Store existing text before starting new speech session
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
        setSpeechError('Could not start microphone. Please check permissions.');
      }
    }
  };

  const handleClearText = () => {
    setNaturalText('');
    setParsedPreview(null);
    setVoiceCaptured(false);
    setSpeechError('');
  };

  const handleCountChange = (targetFloor, roomType, delta) => {
    const setter = targetFloor === 'ground' ? setGroundCounts : setFirstCounts;
    setter(prev => ({
      ...prev,
      [roomType]: Math.max(0, (prev[roomType] || 0) + delta)
    }));
  };

  // AI Parse NLP text string
  const handleUnderstandRequirements = async () => {
    if (!naturalText.trim()) return;
    setErrorMsg('');
    try {
      const parsed = await parseRequirements(naturalText);
      if (parsed) {
        setParsedPreview(parsed);
        if (parsed.plot) {
          if (parsed.plot.length) setPlotLength(parsed.plot.length);
          if (parsed.plot.width) setPlotWidth(parsed.plot.width);
          if (parsed.plot.unit) setUnit(parsed.plot.unit);
        }
        
        let mode = 'ground';
        if (parsed.selectedFloors && parsed.selectedFloors.length > 1) {
          mode = 'both';
        } else if (parsed.selectedFloors && parsed.selectedFloors.includes('first')) {
          mode = 'first';
        }
        setFloorMode(mode);

        if (parsed.floorRequirements?.ground && Array.isArray(parsed.floorRequirements.ground)) {
          const newGround = {};
          parsed.floorRequirements.ground.forEach(item => {
            if (item.type && item.quantity) {
              newGround[item.type] = item.quantity;
            }
          });
          if (Object.keys(newGround).length > 0) {
            setGroundCounts(prev => ({ ...prev, ...newGround }));
          }
        }

        if (parsed.floorRequirements?.first && Array.isArray(parsed.floorRequirements.first)) {
          const newFirst = {};
          parsed.floorRequirements.first.forEach(item => {
            if (item.type && item.quantity) {
              newFirst[item.type] = item.quantity;
            }
          });
          if (Object.keys(newFirst).length > 0) {
            setFirstCounts(prev => ({ ...prev, ...newFirst }));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to parse natural language requirements');
    }
  };

  // Generate Final Layout with Progressive Loading Animation
  const handleFinalSubmit = async (e) => {
    e?.preventDefault();
    if (Number(plotWidth) <= 0 || Number(plotLength) <= 0) {
      setErrorMsg('Please enter valid positive plot dimensions (Length > 0, Width > 0).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Progressive loading steps sequence
    const steps = [
      'Understanding your requirements...',
      'Planning your spaces...',
      'Checking dimensions...',
      'Creating your 2D floor plan...',
      'Building your 3D model...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStepText(steps[i]);
      await new Promise(r => setTimeout(r, 300));
    }

    try {
      let activeGroundCounts = { ...groundCounts };
      let activeFirstCounts = { ...firstCounts };
      let activeFloorMode = floorMode;
      let activeLength = Number(plotLength);
      let activeWidth = Number(plotWidth);

      if (naturalText.trim()) {
        try {
          const parsed = await parseRequirements(naturalText);
          if (parsed) {
            if (parsed.plot?.length) activeLength = parsed.plot.length;
            if (parsed.plot?.width) activeWidth = parsed.plot.width;
            if (parsed.selectedFloors?.length > 1) activeFloorMode = 'both';
            
            if (parsed.floorRequirements?.ground?.length) {
              parsed.floorRequirements.ground.forEach(r => {
                if (r.type && r.quantity) activeGroundCounts[r.type] = r.quantity;
              });
            }
            if (parsed.floorRequirements?.first?.length) {
              parsed.floorRequirements.first.forEach(r => {
                if (r.type && r.quantity) activeFirstCounts[r.type] = r.quantity;
              });
            }
          }
        } catch (e) {
          console.warn('[NLP auto-parse during submit warning]:', e);
        }
      }

      const targetFloors = activeFloorMode === 'both' ? ['ground', 'first'] : [activeFloorMode];
      
      const floorRequirements = {};
      if (targetFloors.includes('ground')) {
        floorRequirements.ground = Object.keys(activeGroundCounts)
          .filter(k => activeGroundCounts[k] > 0)
          .map(k => ({ type: k, quantity: activeGroundCounts[k] }));
      }
      if (targetFloors.includes('first')) {
        floorRequirements.first = Object.keys(activeFirstCounts)
          .filter(k => activeFirstCounts[k] > 0)
          .map(k => ({ type: k, quantity: activeFirstCounts[k] }));
      }

      const plotSpec = { length: activeLength, width: activeWidth, unit };
      
      const generated = await generateLayout({
        plot: plotSpec,
        selectedFloors: targetFloors,
        floorRequirements
      });

      if (!generated || !generated.floors || generated.floors.length === 0) {
        throw new Error('Layout engine returned empty floor plan. Please check plot size and room requirements.');
      }

      onGenerateSuccess && onGenerateSuccess({
        projectName: `${activeWidth}×${activeLength} ${unit} ${activeFloorMode === 'both' ? 'Ground + First' : activeFloorMode} Floor Layout`,
        plotLength: activeLength,
        plotWidth: activeWidth,
        unit,
        frontDirection,
        roadSide,
        selectedFloors: targetFloors,
        layout: generated
      });

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Layout generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 bg-architect-grid-light">
      <div className="max-w-4xl mx-auto">
        
        {/* PAGE HEADER BANNER */}
        <div className="mb-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Ground + First Floor Generator
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Start Designing Your Dream Home
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Specify plot size, select floor mode, or speak requirements to generate NBC 2016 & ECSBC 2024 certified 2D/3D layouts.
            </p>
          </div>
          <div className="shrink-0 bg-slate-100 p-3 rounded-2xl border border-slate-200 hidden sm:block">
            <Ruler className="w-8 h-8 text-sky-600" />
          </div>
        </div>

        {/* STEP PROGRESS INDICATOR BAR */}
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky top-20 z-40 backdrop-blur-md bg-white/95">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <button onClick={() => scrollToSection('section-plot')} className="flex items-center gap-2 text-sky-600 font-extrabold hover:underline">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono">01</span>
              <span>01 Space</span>
            </button>
            <span className="text-slate-300">→</span>
            <button onClick={() => scrollToSection('section-floors')} className="flex items-center gap-2 text-sky-600 font-extrabold hover:underline">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono">02</span>
              <span>02 Floors</span>
            </button>
            <span className="text-slate-300">→</span>
            <button onClick={() => scrollToSection('section-rooms')} className="flex items-center gap-2 text-sky-600 font-extrabold hover:underline">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono">03</span>
              <span>03 Rooms</span>
            </button>
            <span className="text-slate-300">→</span>
            <button onClick={() => scrollToSection('section-ai')} className="flex items-center gap-2 text-sky-600 font-extrabold hover:underline">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono">04</span>
              <span>04 AI Input</span>
            </button>
          </div>
        </div>

        {/* STEPPED LOADING SCREEN ANIMATION */}
        {loading && (
          <div className="py-24 bg-white border border-slate-200 rounded-3xl shadow-xl text-center p-8 max-w-lg mx-auto">
            <RefreshCw className="w-12 h-12 text-sky-600 animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Generating Building Layout</h3>
            <p className="text-sm font-semibold text-sky-600 animate-pulse font-mono">{loadingStepText}</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-8">

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: PLOT INFORMATION */}
            <div id="section-plot" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-28">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                <Ruler className="w-5 h-5 text-sky-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tell us about your plot</h2>
                  <p className="text-xs text-slate-500">Provide plot dimensions and orientation specs.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Plot Length</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={plotLength}
                    onChange={(e) => setPlotLength(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-mono focus:border-sky-500 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Plot Width</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={plotWidth}
                    onChange={(e) => setPlotWidth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-mono focus:border-sky-500 focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Unit</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setUnit('ft')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition ${
                        unit === 'ft' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Feet (ft)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('m')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition ${
                        unit === 'm' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Meter (m)
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE AREA PREVIEW & MINI PLOT GRAPHIC */}
              <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-sky-800 font-medium">Live Available Plot Area:</span>
                  <div className="text-2xl font-black text-sky-700 font-mono">
                    {plotWidth * plotLength} sq.{unit}
                  </div>
                </div>

                {/* Mini Plot Visual Preview Box */}
                <div className="w-32 h-20 bg-white border border-sky-300 rounded-lg flex items-center justify-center text-[11px] font-mono text-sky-700 font-bold relative shadow-inner">
                  <span>{plotWidth}' × {plotLength}'</span>
                </div>
              </div>
            </div>

            {/* STEP 2: FLOOR SELECTION */}
            <div id="section-floors" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-28">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Which floors do you want to design?</h2>
                    <p className="text-xs text-slate-500">Maximum supported floors = 2 (Ground Floor + First Floor).</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-full">
                  Supported Floors: Ground + First
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setFloorMode('ground')}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    floorMode === 'ground' ? 'bg-sky-50/80 border-sky-500 shadow-md' : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black uppercase text-sky-700">GROUND FLOOR</span>
                    <p className="text-xs text-slate-600 mt-1">Design the ground level layout only.</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Single Level</span>
                    {floorMode === 'ground' && <Check className="w-4 h-4 text-sky-600" />}
                  </div>
                </div>

                <div
                  onClick={() => setFloorMode('first')}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    floorMode === 'first' ? 'bg-sky-50/80 border-sky-500 shadow-md' : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black uppercase text-sky-700">FIRST FLOOR</span>
                    <p className="text-xs text-slate-600 mt-1">Design the first level layout only.</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Single Level</span>
                    {floorMode === 'first' && <Check className="w-4 h-4 text-sky-600" />}
                  </div>
                </div>

                <div
                  onClick={() => setFloorMode('both')}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    floorMode === 'both' ? 'bg-indigo-50/80 border-indigo-500 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black uppercase text-indigo-700">GROUND + FIRST FLOOR</span>
                    <p className="text-xs text-slate-600 mt-1">Create a complete two-level layout.</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-700">Two Levels</span>
                    {floorMode === 'both' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: ROOM REQUIREMENTS BUILDER */}
            <div id="section-rooms" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-28">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                <Home className="w-5 h-5 text-teal-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">What spaces do you need?</h2>
                  <p className="text-xs text-slate-500">Configure room quantities for your chosen floor(s).</p>
                </div>
              </div>

              {/* Ground Floor Rooms */}
              {(floorMode === 'ground' || floorMode === 'both') && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">Ground Floor Spaces</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {ROOM_CATALOG.map(room => (
                      <div key={`ground_${room.type}`} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800 mb-2 truncate">{room.label}</span>
                        <div className="flex items-center justify-between bg-white border border-slate-200 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleCountChange('ground', room.type, -1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-sky-700 font-mono">{groundCounts[room.type] || 0}</span>
                          <button
                            type="button"
                            onClick={() => handleCountChange('ground', room.type, 1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* First Floor Rooms */}
              {(floorMode === 'first' || floorMode === 'both') && (
                <div>
                  <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">First Floor Spaces</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {ROOM_CATALOG.map(room => (
                      <div key={`first_${room.type}`} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800 mb-2 truncate">{room.label}</span>
                        <div className="flex items-center justify-between bg-white border border-slate-200 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleCountChange('first', room.type, -1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-indigo-700 font-mono">{firstCounts[room.type] || 0}</span>
                          <button
                            type="button"
                            onClick={() => handleCountChange('first', room.type, 1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: NATURAL LANGUAGE AI INPUT & VOICE */}
            <div id="section-ai" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm scroll-mt-28">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Or simply describe your dream home</h2>
                    <p className="text-xs text-slate-500">AI will automatically interpret plot size, floors, and rooms.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition ${
                      isListening 
                        ? 'bg-rose-600 text-white animate-pulse' 
                        : voiceCaptured
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        <span>🔴 Stop Listening</span>
                      </>
                    ) : voiceCaptured ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>✓ Voice captured</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-sky-600" />
                        <span>🎤 Speak Requirements</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {speechError && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{speechError}</span>
                </div>
              )}

              <textarea
                rows={3}
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder="I have a 30 × 40 ft plot. I want 2 bedrooms, 1 kitchen, 1 hall, 2 bathrooms and a balcony."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 text-sm focus:border-sky-500 focus:bg-white outline-none resize-none"
              />

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUnderstandRequirements}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-sm transition"
                  >
                    ✨ Understand Requirements
                  </button>

                  <button
                    type="button"
                    onClick={handleClearText}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                  >
                    Clear Text
                  </button>
                </div>

                {naturalText.trim() && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {naturalText.trim().length} characters
                  </span>
                )}
              </div>

              {/* Parsed Preview Card */}
              {parsedPreview && (
                <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-slate-800 space-y-2">
                  <div className="font-bold text-sky-800 uppercase tracking-wider text-[11px]">Here's what we understood:</div>
                  <div className="font-mono">
                    Plot: {parsedPreview.plot.width} × {parsedPreview.plot.length} {parsedPreview.plot.unit}
                  </div>
                  <div className="font-mono">
                    Floors: {parsedPreview.selectedFloors?.join(' + ')}
                  </div>
                </div>
              )}
            </div>

            {/* GENERATE SUBMIT BUTTON */}
            <button
              onClick={handleFinalSubmit}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition text-base"
            >
              Generate 2D & 3D Building Layout <ArrowRight className="w-5 h-5" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
