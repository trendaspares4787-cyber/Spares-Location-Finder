
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
  updateUsers: (users: User[]) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin, users, updateUsers }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateTime(now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
    
    if (!user) {
      setError('Identity unknown. Verify credentials.');
      return;
    }

    if ((user.attempts || 0) >= 3) {
      alert('Security Lockout: Contact system admin.');
      return;
    }

    if (user.password === password) {
      onLogin(user);
    } else {
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, attempts: (u.attempts || 0) + 1 } : u
      );
      updateUsers(updatedUsers);
      setError(`Credentials invalid. ${3 - (user.attempts || 0) - 1} attempts left.`);
    }
  };

  return (
    <div className="px-8 flex flex-col min-h-screen animate-in fade-in duration-1000 bg-transparent">
      {/* Header Section */}
      <div className="pt-24 mb-14 text-center relative">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(127,85,57,0.15)] flex items-center justify-center relative group">
            <div className="absolute inset-0 grad-primary opacity-5 rounded-[2.5rem] blur-2xl group-hover:opacity-10 transition-opacity"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-coffee-600 relative z-10 transition-transform group-hover:scale-110">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>
        
        <h2 className="text-4xl font-black text-coffee-900 tracking-tighter leading-tight mb-3">
          Parts Location Tracker
        </h2>
        <div className="flex items-center justify-center gap-3">
           <div className="h-[1.5px] w-6 bg-coffee-200/50"></div>
           <p className="text-coffee-400 font-bold text-[10px] uppercase tracking-[0.3em]">Inventory Management System</p>
           <div className="h-[1.5px] w-6 bg-coffee-200/50"></div>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-7 premium-card p-10 rounded-[4rem] shadow-2xl relative z-10 border border-coffee-50/50">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest ml-3">Emp Name</label>
            <input
              type="text"
              className="w-full px-7 py-5 rounded-[2rem] bg-coffee-50/30 border-none premium-input text-coffee-900 font-bold placeholder:text-coffee-200 outline-none shadow-sm"
              placeholder="Username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest ml-3">Password</label>
            <input
              type="password"
              className="w-full px-7 py-5 rounded-[2rem] bg-coffee-50/30 border-none premium-input text-coffee-900 font-bold placeholder:text-coffee-200 outline-none shadow-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-orange-50/80 p-5 rounded-3xl flex items-center gap-4 animate-bounce border border-orange-100">
            <div className="w-2 h-2 bg-orange-600 rounded-full shadow-[0_0_10_rgba(234,88,12,0.4)]"></div>
            <p className="text-orange-800 text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full grad-primary text-white py-7 rounded-[2.5rem] font-black shadow-2xl shadow-coffee-200/40 hover:translate-y-[-4px] active:scale-95 transition-all uppercase tracking-[0.25em] text-xs mt-4"
        >
          Log in
        </button>
      </form>

      {/* Footer Section with Date */}
      <div className="mt-auto pt-20 pb-12 text-center">
        <div className="inline-block px-8 py-3.5 bg-white/60 border border-coffee-100/50 rounded-full shadow-sm mb-6 backdrop-blur-md">
          <p className="text-coffee-700 font-extrabold text-[11px] uppercase tracking-[0.2em]">
            {dateTime}
          </p>
        </div>
        <p className="text-coffee-200 text-[9px] font-black uppercase tracking-[0.5em] opacity-60">Enterprise Secure Terminal</p>
      </div>
    </div>
  );
};

export default LoginScreen;
