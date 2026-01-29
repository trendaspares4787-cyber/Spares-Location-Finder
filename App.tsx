
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, User, Part, AuditLog, ManualEntry, UserRole } from './types';
import { loadState, saveState } from './services/storageService';
import LoginScreen from './screens/LoginScreen';
import TrackPartsScreen from './screens/TrackPartsScreen';
import ReportsScreen from './screens/ReportsScreen';
import ManualEntryScreen from './screens/ManualEntryScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [currentScreen, setCurrentScreen] = useState<string>('login');
  const [prefilledPartNumber, setPrefilledPartNumber] = useState<string>('');

  useEffect(() => {
    if (state.currentUser) {
      setCurrentScreen('track');
    } else {
      setCurrentScreen('login');
    }
  }, [state.currentUser]);

  const handleLogin = useCallback((user: User) => {
    const updatedUsers = state.users.map(u => u.id === user.id ? { ...u, attempts: 0 } : u);
    setState(prev => {
      const newState = { ...prev, currentUser: user, users: updatedUsers };
      saveState(newState);
      return newState;
    });
  }, [state.users]);

  const handleLogout = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, currentUser: null };
      saveState(newState);
      return newState;
    });
    setCurrentScreen('login');
  }, []);

  const addLog = useCallback((log: Omit<AuditLog, 'id'>) => {
    const newLog: AuditLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => {
      const newState = { ...prev, logs: [newLog, ...prev.logs] };
      saveState(newState);
      return newState;
    });
  }, []);

  const addManualEntry = useCallback((entry: Omit<ManualEntry, 'id'>) => {
    const newEntry: ManualEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => {
      const newState = { ...prev, manualEntries: [newEntry, ...prev.manualEntries] };
      saveState(newState);
      return newState;
    });
  }, []);

  const updateParts = useCallback((parts: Part[], uploadTime: string) => {
    setState(prev => {
      const newState = { ...prev, parts, lastUploadInfo: uploadTime };
      saveState(newState);
      return newState;
    });
  }, []);

  const updateUsers = useCallback((users: User[]) => {
    setState(prev => {
      const newState = { ...prev, users };
      saveState(newState);
      return newState;
    });
  }, []);

  const navigateToManual = (partNumber?: string) => {
    if (partNumber) {
      setPrefilledPartNumber(partNumber);
    } else {
        setPrefilledPartNumber('');
    }
    setCurrentScreen('manual');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} users={state.users} updateUsers={updateUsers} />;
      case 'track':
        return (
          <TrackPartsScreen 
            currentUser={state.currentUser!} 
            parts={state.parts} 
            addLog={addLog} 
            onNavigateManual={navigateToManual} 
          />
        );
      case 'reports':
        return <ReportsScreen logs={state.logs} />;
      case 'manual':
        return (
          <ManualEntryScreen 
            currentUser={state.currentUser!} 
            manualEntries={state.manualEntries} 
            addManualEntry={addManualEntry} 
            initialPartNumber={prefilledPartNumber}
            onClearPrefill={() => setPrefilledPartNumber('')}
          />
        );
      case 'admin':
        return state.currentUser?.role === UserRole.ADMIN ? (
          <AdminPanelScreen 
            state={state} 
            updateParts={updateParts} 
            updateUsers={updateUsers}
            onClearLogs={() => {
              setState(prev => {
                const newState = { ...prev, logs: [], manualEntries: [] };
                saveState(newState);
                return newState;
              });
            }}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col max-w-md mx-auto shadow-[0_0_150px_rgba(0,0,0,0.05)] relative overflow-hidden ring-1 ring-coffee-100/50">
      {/* Premium Header - Only show when logged in */}
      {state.currentUser && (
        <header className="bg-white/90 backdrop-blur-3xl px-6 pt-12 pb-6 border-b border-coffee-100/50 sticky top-0 z-50 no-print transition-all duration-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 grad-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-coffee-200/50 transition-transform hover:scale-105">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                   <circle cx="12" cy="10" r="3"></circle>
                 </svg>
               </div>
               <h1 className="text-lg font-black text-coffee-800 tracking-tighter">Tracker</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-coffee-500 tracking-widest">{state.currentUser.role}</p>
                <p className="text-sm font-bold text-coffee-900 leading-none mt-0.5">{state.currentUser.name}</p>
              </div>
              <button onClick={handleLogout} className="p-2.5 bg-coffee-100/50 text-coffee-600 rounded-xl hover:bg-coffee-600 hover:text-white transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto ${state.currentUser ? 'pb-36' : ''}`}>
        {renderScreen()}
      </main>

      {/* Coffee Theme Navigation Bar */}
      {state.currentUser && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] glass-nav rounded-[2.8rem] p-2 flex justify-between items-center no-print shadow-[0_25px_60px_rgba(61,32,9,0.15)] ring-1 ring-white/60">
          <NavItem active={currentScreen === 'track'} label="Track" onClick={() => setCurrentScreen('track')} icon={<SearchIcon />} color="coffee" />
          <NavItem active={currentScreen === 'reports'} label="History" onClick={() => setCurrentScreen('reports')} icon={<FileTextIcon />} color="coffee" />
          <NavItem active={currentScreen === 'manual'} label="Add" onClick={() => navigateToManual()} icon={<PlusIcon />} color="coffee" />
          {state.currentUser.role === UserRole.ADMIN && (
            <NavItem active={currentScreen === 'admin'} label="Manage" onClick={() => setCurrentScreen('admin')} icon={<SettingsIcon />} color="coffee" />
          )}
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, label: string, onClick: () => void, icon: React.ReactNode, color: string }> = ({ active, label, onClick, icon, color }) => (
  <button 
    onClick={onClick} 
    className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 py-3.5 rounded-[2.2rem] ${active ? `text-${color}-800 bg-${color}-100/50 shadow-inner` : 'text-coffee-300 opacity-70 hover:opacity-100'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

export default App;
