
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AppState, User, Part, UserRole } from '../types';
import { shareToWhatsApp, shareReportAsFile } from '../services/exportService';

interface Props {
  state: AppState;
  updateParts: (parts: Part[], time: string) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUsers: (users: User[]) => void;
  importSyncData: (data: any) => void;
  onClearLogs: () => void;
}

const AdminPanelScreen: React.FC<Props> = ({ state, updateParts, onAddUser, onDeleteUser, onUpdateUsers, importSyncData, onClearLogs }) => {
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];
        const mappedParts: Part[] = jsonData.map((row: any) => {
          const cleanRow: any = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.toString().toLowerCase().replace(/[^a-z0-9]/g, '').trim();
            cleanRow[cleanKey] = row[key];
          });
          return {
            partNumber: String(cleanRow['partnumber'] || cleanRow['partno'] || cleanRow['sku'] || '').trim(),
            partName: String(cleanRow['partname'] || cleanRow['description'] || 'N/A').trim(),
            onHand: parseFloat(String(cleanRow['onhand'] || cleanRow['stock'] || 0).replace(/,/g, '')) || 0,
            onOrder: parseFloat(String(cleanRow['onorder'] || 0).replace(/,/g, '')) || 0,
            dueInQty: parseFloat(String(cleanRow['dueinqty'] || 0).replace(/,/g, '')) || 0,
            location: String(cleanRow['location'] || cleanRow['bin'] || 'N/A').trim(),
            mav: parseFloat(String(cleanRow['mav'] || cleanRow['price'] || 0).replace(/,/g, '')) || 0,
            amd3: parseFloat(String(cleanRow['amd3'] || 0).replace(/,/g, '')) || 0,
            sysGenStock: parseFloat(String(cleanRow['sysgenstock'] || 0).replace(/,/g, '')) || 0,
          };
        }).filter(p => p.partNumber !== "");
        if (mappedParts.length > 0) { 
          updateParts(mappedParts, new Date().toLocaleString()); 
          alert(`DATABASE UPDATED: ${mappedParts.length} items loaded.`); 
        }
      } catch (err) { alert('Format Error.'); } finally { setIsUploading(false); }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddUser = () => {
    if (!newUserId || !newUserPass) {
      alert("Employee ID and Passkey are required.");
      return;
    }
    const exists = state.users.find(u => u.id.toLowerCase() === newUserId.toLowerCase());
    if (exists) { alert("User already exists in the registry."); return; }
    
    onAddUser({ 
      id: newUserId, 
      name: newUserId, 
      password: newUserPass, 
      phone: newUserPhone,
      role: UserRole.USER 
    });
    setNewUserId(''); setNewUserPass(''); setNewUserPhone('');
    alert(`SUCCESS: Account for ${newUserId} provisioned.`);
  };

  const handleDeleteRequest = (userId: string) => {
    if (userId === state.currentUser?.id) { 
      alert("Protocol Error: You cannot delete your own session account."); 
      return; 
    }
    if (window.confirm(`URGENT: Permanent removal of user [${userId}]? Access will be revoked immediately.`)) {
      onDeleteUser(userId);
    }
  };

  const generateSyncToken = () => {
    const token = btoa(JSON.stringify({ parts: state.parts, time: state.lastUploadInfo, users: state.users }));
    setSyncToken(token);
    return token;
  };

  const handleShareToUser = async (type: 'token' | 'excel') => {
    const targetUser = state.users.find(u => u.id === targetUserId);
    const name = targetUser ? targetUser.name : "Team Member";
    const phone = targetUser?.phone;
    
    if (type === 'token') {
      const tokenToShare = syncToken || generateSyncToken();
      const message = `Hello ${name},\n\nLatest Master Sync Token for Tracker:\n\n${tokenToShare}`;
      shareToWhatsApp(message, phone);
    } else {
      if (state.parts.length === 0) { alert("No data to share."); return; }
      
      const fileName = `Master_Data_${new Date().getTime()}`;
      const shareText = `Hello ${name},\n\nI am sharing the Master Data Excel file. Please open and import this into the Tracker app.`;
      
      // Use the unified share function which uses navigator.share
      // This allows the user to pick WhatsApp AND send the actual file
      await shareReportAsFile('excel', state.parts, fileName, undefined, shareText);
    }
  };

  const handleResetPassword = () => {
    if (!resettingUser || !resetPasswordValue) return;
    const updated = state.users.map(u => u.id === resettingUser.id ? { ...u, password: resetPasswordValue, attempts: 0 } : u);
    onUpdateUsers(updated);
    setResettingUser(null); setResetPasswordValue('');
    alert(`CREDENTIALS UPDATED for ${resettingUser.name}.`);
  };

  return (
    <div className="p-6 space-y-12 animate-in fade-in duration-800 pb-24">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-coffee-900 tracking-tighter">Manage</h2>
        <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.25em]">System Administration</p>
      </div>

      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Team Registry</h3>
        <div className="premium-card p-10 rounded-[3.5rem] space-y-8 border-2 border-coffee-100/50 shadow-2xl bg-white">
           <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                 <label className="text-[8px] font-black text-coffee-300 uppercase tracking-widest ml-3">Employee ID / Name</label>
                 <input type="text" placeholder="e.g. John Doe" value={newUserId} onChange={e => setNewUserId(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-coffee-50 border border-coffee-100 outline-none font-bold text-coffee-900 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                 <label className="text-[8px] font-black text-coffee-300 uppercase tracking-widest ml-3">Secure Passkey</label>
                 <input type="text" placeholder="Initial Password" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-coffee-50 border border-coffee-100 outline-none font-bold text-coffee-900 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                 <label className="text-[8px] font-black text-coffee-300 uppercase tracking-widest ml-3">WhatsApp Number</label>
                 <input type="tel" placeholder="91..." value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-coffee-50 border border-coffee-100 outline-none font-bold text-coffee-900 focus:bg-white transition-all" />
              </div>
              <button onClick={handleAddUser} className="w-full grad-primary text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all mt-2">
                Create User
              </button>
           </div>
        </div>

        <div className="premium-card p-10 rounded-[4rem] space-y-8 border border-coffee-50 shadow-xl bg-coffee-50/30">
          <div className="flex justify-between items-center px-2">
             <p className="text-[10px] font-black text-coffee-500 uppercase tracking-widest">Active Personnel</p>
             <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black text-coffee-900 shadow-sm">{state.users.length} Users</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {state.users.map(u => (
              <div key={u.id} className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-coffee-100/50 shadow-sm transition-all hover:border-coffee-200 group">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.5rem] grad-royal flex items-center justify-center text-white font-black text-sm shadow-md">{u.name.charAt(0)}</div>
                    <div>
                       <div className="flex items-center gap-2">
                          <p className="font-black text-coffee-900 text-sm leading-none">{u.name}</p>
                          <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${u.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.role}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setResettingUser(u)} className="p-3 bg-coffee-50 text-coffee-400 rounded-2xl hover:bg-coffee-900 hover:text-white transition-all">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteRequest(u.id)} 
                      className={`p-3 rounded-2xl transition-all ${u.id === state.currentUser?.id ? 'bg-coffee-100 text-coffee-200 cursor-not-allowed' : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white shadow-sm'}`}
                      disabled={u.id === state.currentUser?.id}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Distribution Hub</h3>
        <div className="premium-card p-10 rounded-[3.5rem] space-y-8 bg-coffee-900 text-white shadow-2xl relative overflow-hidden">
           <div className="space-y-6 relative z-10">
              <div className="space-y-3">
                 <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest block ml-2">Direct Target Device</label>
                 <select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-white outline-none appearance-none cursor-pointer">
                    <option value="" className="text-coffee-900">Choose Recipient...</option>
                    {state.users.map(u => (
                       <option key={u.id} value={u.id} className="text-coffee-900">{u.name}</option>
                    ))}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handleShareToUser('token')} className="flex-1 py-5 bg-white/10 border border-white/20 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex flex-col items-center gap-2">
                   Token Share
                 </button>
                 <button onClick={() => handleShareToUser('excel')} className="flex-1 py-5 bg-emerald-600 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                   Excel Report
                 </button>
              </div>
           </div>
        </div>
      </section>

      {resettingUser && (
        <div className="fixed inset-0 z-[100] bg-coffee-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-sm premium-card p-10 rounded-[3.5rem] border border-coffee-100 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h4 className="text-2xl font-black text-coffee-900">Reset Credentials</h4>
              <p className="text-sm font-bold text-coffee-600">User: <span className="text-coffee-900">{resettingUser.name}</span></p>
            </div>
            <input type="text" className="w-full px-8 py-5 rounded-[2rem] bg-coffee-50 border-2 border-coffee-100 outline-none font-bold text-coffee-900 text-center text-xl" placeholder="New Passkey" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} autoFocus />
            <div className="flex gap-4">
              <button onClick={handleResetPassword} className="flex-1 grad-primary text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Update</button>
              <button onClick={() => setResettingUser(null)} className="px-8 bg-coffee-100 text-coffee-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelScreen;
