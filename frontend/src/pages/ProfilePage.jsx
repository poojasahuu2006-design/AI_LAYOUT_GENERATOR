import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, FolderKanban, Save, CheckCircle2, ShieldCheck, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../services/api';

export default function ProfilePage({ onNavigate }) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [projectCount, setProjectCount] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    const fetchCounts = async () => {
      try {
        const res = await getProjects();
        if (res.projects) {
          setProjectCount(res.projects.length);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCounts();
  }, [user]);

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({ name, email });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const joinDateStr = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'September 2026';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 bg-architect-grid-light">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-600/20 uppercase">
              {name ? name.charAt(0) : 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{name || 'User Profile'}</h1>
              <p className="text-xs text-slate-500 font-mono">{email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active User Account
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">Member Since</span>
              <p className="text-sm font-bold text-slate-800">{joinDateStr}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">Saved Projects</span>
              <p className="text-sm font-bold text-slate-800">{projectCount} Designs</p>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 pb-3 border-b border-slate-100">
            Account Details
          </h2>

          {saveSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  disabled={!isEditing}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-sky-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  disabled={!isEditing}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-sky-500 transition"
                  required
                />
              </div>
            </div>

            {isEditing && (
              <div className="pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
