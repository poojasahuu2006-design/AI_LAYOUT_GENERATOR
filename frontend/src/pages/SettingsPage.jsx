import React, { useState } from 'react';
import { Settings, Shield, Sliders, CheckCircle2, Lock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [unit, setUnit] = useState('ft');
  const [theme, setTheme] = useState('light');
  const [defaultFloorView, setDefaultFloorView] = useState('both');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savedMsg, setSavedMsg] = useState('');
  const [passError, setPassError] = useState('');

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSavedMsg('Preferences saved successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, newPassword })
      });
      setSavedMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassError('');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      setPassError('Password update failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 bg-architect-grid-light">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Application Settings</h1>
            <p className="text-xs text-slate-500">Configure account preferences, units, and security.</p>
          </div>
        </div>

        {savedMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedMsg}</span>
          </div>
        )}

        {/* PREFERENCES SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Design & Measurement Preferences</h2>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-6">
            {/* Units */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Measurement Units</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs font-bold transition ${
                  unit === 'ft' ? 'bg-sky-50 border-sky-500 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span>Feet (ft / sq.ft)</span>
                  <input type="radio" name="unit" value="ft" checked={unit === 'ft'} onChange={() => setUnit('ft')} className="hidden" />
                  {unit === 'ft' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs font-bold transition ${
                  unit === 'm' ? 'bg-sky-50 border-sky-500 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span>Meters (m / sq.m)</span>
                  <input type="radio" name="unit" value="m" checked={unit === 'm'} onChange={() => setUnit('m')} className="hidden" />
                  {unit === 'm' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                </label>
              </div>
            </div>

            {/* Default Floor View */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Default Studio Floor View</label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setDefaultFloorView('ground')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    defaultFloorView === 'ground' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Ground Floor
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultFloorView('first')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    defaultFloorView === 'first' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  First Floor
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultFloorView('both')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    defaultFloorView === 'both' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Ground + First
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-xl shadow-md transition"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* SECURITY SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
          </div>

          {passError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-sky-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-sky-500 transition"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4" /> Update Password
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
