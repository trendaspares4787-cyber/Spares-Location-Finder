
import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  user: User;
  onUpdateProfile: (oldId: string, newId: string, newPass: string, phone?: string) => void;
}

const ProfileScreen: React.FC<Props> = ({ user, onUpdateProfile }) => {
  const [newId, setNewId] = useState(user.id);
  const [newPass, setNewPass] = useState(user.password);
  const [newPhone, setNewPhone] = useState(user.phone || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newPass) {
      alert('Credentials cannot be empty.');
      return;
    }
    onUpdateProfile(user.id, newId, newPass, newPhone);
    setIsEditing(false);
    alert('PROFILE UPDATED: Changes synchronized with device.');
  };

  return (
    <div className="p-6 space-y-12 animate-in fade-in duration-800">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">My Profile</h2>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 grad-primary rounded-full"></div>
           <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Contact & ID Management</p>
        </div>
      </div>

      <div className="premium-card p-12 rounded-[4rem] shadow-2xl relative overflow-hidden border border-coffee-50">
        <div className="absolute top-0 right-0 w-48 h-48 grad-royal opacity-5 rounded-bl-full"></div>
        
        <div className="flex items-center gap-6 mb-12">
           <div className="w-20 h-20 grad-primary rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">
              {user.name.charAt(0)}
           </div>
           <div>
              <p className="text-2xl font-black text-coffee-900 leading-tight">{user.name}</p>
              <p className="text-[10px] font-black text-coffee-400 uppercase tracking-widest mt-1">{user.role} Terminal</p>
           </div>
        </div>

        {!isEditing ? (
          <div className="space-y-8">
             <div className="bg-coffee-50 p-6 rounded-3xl border border-coffee-100">
                <p className="text-[9px] font-black text-coffee-400 uppercase tracking-widest mb-2">Employee ID</p>
                <p className="text-lg font-bold text-coffee-800">{user.id}</p>
             </div>
             <div className="bg-coffee-50 p-6 rounded-3xl border border-coffee-100">
                <p className="text-[9px] font-black text-coffee-400 uppercase tracking-widest mb-2">WhatsApp Contact</p>
                <p className="text-lg font-bold text-coffee-800">{user.phone || 'No Number Linked'}</p>
             </div>
             <div className="bg-coffee-50 p-6 rounded-3xl border border-coffee-100">
                <p className="text-[9px] font-black text-coffee-400 uppercase tracking-widest mb-2">Secure Passkey</p>
                <p className="text-lg font-bold text-coffee-800">••••••••</p>
             </div>
             <button 
               onClick={() => setIsEditing(true)}
               className="w-full grad-warm text-white py-7 rounded-[2.2rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:translate-y-[-4px] transition-all"
             >
               Edit Contact & Key
             </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest ml-3">Employee Name (ID)</label>
              <input
                type="text"
                className="w-full px-8 py-5 rounded-[2rem] bg-coffee-50 border-none premium-input text-coffee-900 font-bold placeholder:text-coffee-200 outline-none"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest ml-3">WhatsApp Number</label>
              <input
                type="tel"
                className="w-full px-8 py-5 rounded-[2rem] bg-coffee-50 border-none premium-input text-coffee-900 font-bold placeholder:text-coffee-200 outline-none"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Include country code (e.g. 91...)"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest ml-3">New Secure Passkey</label>
              <input
                type="text"
                className="w-full px-8 py-5 rounded-[2rem] bg-coffee-50 border-none premium-input text-coffee-900 font-bold placeholder:text-coffee-200 outline-none"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-4">
               <button 
                 type="submit"
                 className="flex-1 grad-primary text-white py-7 rounded-[2.2rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:translate-y-[-4px] transition-all"
               >
                 Confirm Updates
               </button>
               <button 
                 type="button"
                 onClick={() => setIsEditing(false)}
                 className="px-8 bg-coffee-100 text-coffee-600 rounded-[2.2rem] font-black uppercase tracking-widest text-[11px] hover:bg-coffee-200 transition-all"
               >
                 Exit
               </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-emerald-50/50 p-8 rounded-[3.5rem] border border-emerald-100">
         <div className="flex gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg h-fit">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11"></polyline></svg>
            </div>
            <div>
               <p className="text-emerald-900 font-black text-sm mb-1 uppercase tracking-tight">Sync Status: Active</p>
               <p className="text-emerald-800/70 text-[10px] font-bold leading-relaxed">Your data is stored locally. Logout does not erase inventory. Only Admin wipes or manual updates clear the database.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
