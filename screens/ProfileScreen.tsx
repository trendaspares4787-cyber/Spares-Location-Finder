
import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  user: User;
  onUpdateProfile: (oldId: string, newId: string, newPass: string) => void;
}

const ProfileScreen: React.FC<Props> = ({ user, onUpdateProfile }) => {
  const [newId, setNewId] = useState(user.id);
  const [newPass, setNewPass] = useState(user.password);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newPass) {
      alert('Credentials cannot be empty.');
      return;
    }
    onUpdateProfile(user.id, newId, newPass);
    setIsEditing(false);
    alert('PROFILE UPDATED: Changes saved to terminal.');
  };

  return (
    <div className="p-6 space-y-12 animate-in fade-in duration-800">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">My Profile</h2>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 grad-primary rounded-full"></div>
           <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Credential Management Console</p>
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
              <p className="text-[10px] font-black text-coffee-400 uppercase tracking-widest mt-1">{user.role} Account</p>
           </div>
        </div>

        {!isEditing ? (
          <div className="space-y-8">
             <div className="bg-coffee-50 p-6 rounded-3xl border border-coffee-100">
                <p className="text-[9px] font-black text-coffee-400 uppercase tracking-widest mb-2">Employee ID / Name</p>
                <p className="text-lg font-bold text-coffee-800">{user.id}</p>
             </div>
             <div className="bg-coffee-50 p-6 rounded-3xl border border-coffee-100">
                <p className="text-[9px] font-black text-coffee-400 uppercase tracking-widest mb-2">Secure Passkey</p>
                <p className="text-lg font-bold text-coffee-800">••••••••</p>
             </div>
             <button 
               onClick={() => setIsEditing(true)}
               className="w-full grad-warm text-white py-7 rounded-[2.2rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:translate-y-[-4px] transition-all"
             >
               Modify Credentials
             </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest ml-3">New Employee Name (ID)</label>
              <input
                type="text"
                className="w-full px-8 py-5 rounded-[2rem] bg-coffee-50 border-none premium-input text-coffee-900 font-bold placeholder:text-coffee-200 outline-none"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                required
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
                 Save Changes
               </button>
               <button 
                 type="button"
                 onClick={() => setIsEditing(false)}
                 className="px-8 bg-coffee-100 text-coffee-600 rounded-[2.2rem] font-black uppercase tracking-widest text-[11px] hover:bg-coffee-200 transition-all"
               >
                 Cancel
               </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-orange-50/50 p-8 rounded-[3.5rem] border border-orange-100">
         <div className="flex gap-4">
            <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg h-fit">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div>
               <p className="text-orange-900 font-black text-sm mb-1 uppercase tracking-tight">Security Alert</p>
               <p className="text-orange-800/70 text-[10px] font-bold leading-relaxed">Changes to ID or Password will be reflected on the next login. Ensure your credentials are stored securely as per corporate policy.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
