import React, { useEffect, useState } from 'react';
import { 
  FolderKanban, Calendar, Ruler, Layers, Trash2, ExternalLink, PlusCircle, 
  RefreshCw, Search, Star, Edit3, Check, X, AlertTriangle, Filter, Sparkles
} from 'lucide-react';
import { getProjects, deleteProject, toggleFavoriteProject, renameProject } from '../services/api';

export default function SavedProjectsPage({ onOpenProject, onNewDesign }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'recent' | 'both' | 'favorites'

  // Rename Inline State
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Delete Modal State
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const fetchSavedProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      if (res.success) {
        setProjects(res.projects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedProjects();
  }, []);

  // Handle Favorite Toggle
  const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
      await toggleFavoriteProject(id);
      setProjects(prev => prev.map(p => {
        if ((p._id || p.id) === id) {
          return { ...p, isFavorite: !p.isFavorite };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Start Rename
  const handleStartRename = (id, currentName, e) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(currentName);
  };

  // Submit Rename
  const handleSaveRename = async (id, e) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    try {
      await renameProject(id, editingName.trim());
      setProjects(prev => prev.map(p => {
        if ((p._id || p.id) === id) {
          return { ...p, projectName: editingName.trim() };
        }
        return p;
      }));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Delete Modal
  const handlePromptDelete = (id, name, e) => {
    e.stopPropagation();
    setDeletingId(id);
    setDeletingName(name || 'this design project');
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProject(deletingId);
      setProjects(prev => prev.filter(p => (p._id || p.id) !== deletingId));
      setDeletingId(null);
    } catch (e) {
      alert('Delete failed');
    }
  };

  // Filter & Search Logic
  const filteredProjects = projects.filter(proj => {
    // Search query filter
    const nameMatch = (proj.projectName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const dimMatch = `${proj.plotWidth}x${proj.plotLength}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || dimMatch;

    if (!matchesSearch) return false;

    // Filter tab
    if (activeFilter === 'favorites') return proj.isFavorite;
    if (activeFilter === 'both') return (proj.selectedFloors || []).includes('ground') && (proj.selectedFloors || []).includes('first');
    if (activeFilter === 'recent') {
      const createdDate = new Date(proj.createdAt || Date.now());
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdDate >= sevenDaysAgo;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 bg-architect-grid-light">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider mb-1">
              <FolderKanban className="w-4 h-4" /> My Designs Library
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Projects</h1>
          </div>

          <button
            onClick={onNewDesign}
            className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" /> + New Project
          </button>
        </div>

        {/* SEARCH BAR & FILTERS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or dimensions (e.g. 30×40)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'recent', label: 'Recent' },
              { id: 'both', label: 'Ground + First' },
              { id: 'favorites', label: '★ Favorites' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeFilter === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT GRID */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mb-3" />
            <span>Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* SECTION 30: EMPTY STATE */
          <div className="py-16 bg-white border border-slate-200 rounded-3xl text-center p-8 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-inner">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-2">No projects found</h3>
            <p className="text-xs text-slate-500 mb-6">
              {searchQuery || activeFilter !== 'all' 
                ? 'No saved designs match your current search or filter criteria.'
                : 'Create your first AI-generated home layout.'}
            </p>
            <button
              onClick={onNewDesign}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
            >
              + Create New Design
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(proj => {
              const id = proj._id || proj.id;
              const dateStr = proj.createdAt ? new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
              const floorsList = proj.selectedFloors || ['ground'];
              const isFav = proj.isFavorite || false;

              // Room Summary Counts for Card
              let bedCount = 0;
              let bathCount = 0;
              let kitchenCount = 0;
              let balconyCount = 0;

              (proj.floors || []).forEach(f => {
                (f.rooms || []).forEach(r => {
                  if (r.type?.toLowerCase().includes('bedroom')) bedCount++;
                  if (r.type?.toLowerCase().includes('bath')) bathCount++;
                  if (r.type?.toLowerCase().includes('kitchen')) kitchenCount++;
                  if (r.type?.toLowerCase().includes('balcony')) balconyCount++;
                });
              });

              return (
                <div
                  key={id}
                  onClick={() => onOpenProject(proj)}
                  className="bg-white border border-slate-200 hover:border-sky-500 p-5 rounded-3xl cursor-pointer transition shadow-sm hover:shadow-md group flex flex-col justify-between"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {editingId === id ? (
                        <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full bg-slate-50 border border-sky-400 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                            autoFocus
                          />
                          <button onClick={(e) => handleSaveRename(id, e)} className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 truncate">
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition truncate">
                            {proj.projectName || 'Building Layout'}
                          </h3>
                          <button
                            onClick={(e) => handleStartRename(id, proj.projectName || 'Building Layout', e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-600 rounded transition"
                            title="Rename Project"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleFavorite(id, e)}
                          className={`p-1.5 rounded-lg transition ${
                            isFav ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                          }`}
                          title={isFav ? 'Favorited' : 'Add to Favorites'}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => handlePromptDelete(id, proj.projectName, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 bg-sky-50 text-sky-700 font-mono text-[11px] font-bold rounded-lg border border-sky-200 flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> {proj.plotWidth} × {proj.plotLength} {proj.unit || 'ft'}
                      </span>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-sans text-[11px] font-bold rounded-lg border border-indigo-200 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {floorsList.join(' + ')}
                      </span>
                    </div>

                    {/* Quick Room Count Highlights */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 text-xs font-semibold text-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Bedrooms:</span>
                        <span className="font-bold text-slate-800">{bedCount || 2}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Bathrooms:</span>
                        <span className="font-bold text-slate-800">{bathCount || 2}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Kitchen & Living:</span>
                        <span className="font-bold text-slate-800">Yes</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                    <span className="text-[11px] font-normal text-slate-400">Modified {dateStr}</span>
                    <span className="flex items-center gap-1 text-sky-600 group-hover:translate-x-1 transition font-bold">
                      Open Project <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* PART 19 — DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl text-slate-900 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Delete this project?</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete <strong>"{deletingName}"</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md transition"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
