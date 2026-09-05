import React, { useState, useRef, useEffect } from 'react';
import { Home, Sparkles, FolderKanban, PlusCircle, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    setActivePage('login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Floor Limit Badge */}
        <div 
          onClick={() => setActivePage('home')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 group-hover:scale-105 transition">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                AI House Planner
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
                Ground + First Floor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">NBC 2016 • ECSBC 2024 • Mah. Act 1960 Compliant</p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActivePage('home')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activePage === 'home' 
                ? 'bg-white text-sky-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" /> Home
          </button>

          <button
            onClick={() => setActivePage('input')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activePage === 'input' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Start Designing
          </button>

          <button
            onClick={() => setActivePage('workspace')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activePage === 'workspace' 
                ? 'bg-white text-sky-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Workspace (2D/3D)
          </button>

          <button
            onClick={() => setActivePage('saved')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activePage === 'saved' 
                ? 'bg-white text-sky-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" /> My Projects
          </button>
        </nav>

        {/* User Profile Menu */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-sm">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono leading-none truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="font-extrabold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => { setDropdownOpen(false); setActivePage('home'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2.5 transition"
                >
                  <Home className="w-4 h-4 text-sky-600" /> Home Page
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); setActivePage('workspace'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2.5 transition"
                >
                  <Sparkles className="w-4 h-4 text-sky-600" /> Workspace (2D/3D)
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); setActivePage('profile'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2.5 transition"
                >
                  <User className="w-4 h-4 text-sky-600" /> Profile
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); setActivePage('saved'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2.5 transition"
                >
                  <FolderKanban className="w-4 h-4 text-indigo-600" /> My Projects
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); setActivePage('settings'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2.5 transition"
                >
                  <Settings className="w-4 h-4 text-amber-600" /> Settings
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2.5 transition"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
