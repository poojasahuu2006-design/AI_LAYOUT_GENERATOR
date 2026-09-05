import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import InputPage from './pages/InputPage';
import SavedProjectsPage from './pages/SavedProjectsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  
  // Navigation State: 'home' | 'login' | 'signup' | 'forgot-password' | 'dashboard' | 'input' | 'workspace' | 'saved' | 'profile' | 'settings'
  const [activePage, setActivePage] = useState('home');
  const [currentProject, setCurrentProject] = useState(null);

  // Sync active page with authentication state on load or change
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // If not logged in, force login/signup page only
        if (activePage !== 'signup' && activePage !== 'forgot-password') {
          setActivePage('login');
        }
      } else {
        // If logged in and on auth pages, redirect FIRST to home page
        if (activePage === 'login' || activePage === 'signup') {
          setActivePage('home');
        }
      }
    }
  }, [isAuthenticated, loading]);

  // Loading state prevents any content flash before session check completes
  if (loading) {
    return <LoadingScreen />;
  }

  // Safe navigation function
  const navigateTo = (page) => {
    if (!isAuthenticated && page !== 'signup' && page !== 'forgot-password') {
      setActivePage('login');
      return;
    }
    setActivePage(page);
  };

  // Handle Generated Layout from Input Page
  const handleGenerateSuccess = (projectData) => {
    setCurrentProject(projectData);
    setActivePage('workspace');
  };

  // Handle Opening Saved Project
  const handleOpenSavedProject = (project) => {
    setCurrentProject(project);
    setActivePage('workspace');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* SaaS Navbar renders ONLY when authenticated */}
      {isAuthenticated && (
        <Navbar 
          activePage={activePage} 
          setActivePage={navigateTo} 
        />
      )}

      {/* Main App Content View Router */}
      <div className="flex-1">
        {/* UNAUTHENTICATED ROUTES */}
        {!isAuthenticated ? (
          <>
            {activePage === 'signup' ? (
              <SignUpPage onNavigate={navigateTo} />
            ) : activePage === 'forgot-password' ? (
              <ForgotPasswordPage onNavigate={navigateTo} />
            ) : (
              <LoginPage onNavigate={navigateTo} />
            )}
          </>
        ) : (
          /* AUTHENTICATED & PROTECTED APPLICATION ROUTES */
          <>
            {activePage === 'home' && (
              <ProtectedRoute onRedirectToLogin={() => setActivePage('login')}>
                <LandingPage 
                  onStartDesigning={() => navigateTo('input')} 
                  onViewDemo={() => navigateTo('workspace')}
                  onGoToWorkspace={() => navigateTo('workspace')}
                  onGoToSaved={() => navigateTo('saved')}
                />
              </ProtectedRoute>
            )}

            {activePage === 'dashboard' && (
              <ProtectedRoute onRedirectToLogin={() => setActivePage('login')}>
                <DashboardPage 
                  currentProject={currentProject} 
                  setCurrentProject={setCurrentProject}
                  onNavigate={navigateTo} 
                />
              </ProtectedRoute>
            )}

            {(activePage === 'input' || activePage === 'create' || activePage === 'design' || activePage === 'start-designing') && (
              <ProtectedRoute onRedirectToLogin={() => setActivePage('login')}>
                <InputPage 
                  onGenerateSuccess={handleGenerateSuccess} 
                />
              </ProtectedRoute>
            )}

            {activePage === 'workspace' && (
              <ProtectedRoute onRedirectToLogin={() => setActivePage('login')}>
                <DashboardPage 
                  currentProject={currentProject} 
                  setCurrentProject={setCurrentProject}
                  onNavigate={navigateTo} 
                />
              </ProtectedRoute>
            )}

            {activePage === 'saved' && (
              <ProtectedRoute onRedirectToLogin={() => setActivePage('login')}>
                <SavedProjectsPage 
                  onOpenProject={handleOpenSavedProject} 
                  onNewDesign={() => navigateTo('input')} 
                />
              </ProtectedRoute>
            )}

            {activePage === 'profile' && (
              <ProtectedRoute onRedirectToLogin={() => setActivePage('login')}>
                <ProfilePage 
                  onNavigate={navigateTo} 
                />
              </ProtectedRoute>
            )}

            {activePage === 'settings' && (
              <ProtectedRoute onRedirectToLogin={() => setActivePage('login')}>
                <SettingsPage />
              </ProtectedRoute>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
