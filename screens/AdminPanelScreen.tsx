
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AppState, User, Part, UserRole } from '../types';
import { exportToExcel } from '../services/exportService';
import { shareToWhatsApp } from '../services/exportService';

interface Props {
  state: AppState;
  updateParts: (parts: Part[], time: string) => void;
  updateUsers: (users: User[]) => void;
  onClearLogs: () => void;
}

const AdminPanelScreen: React.FC<Props> = ({ state, updateParts, updateUsers, onClearLogs }) => {
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [syncToken, setSyncToken] = useState('');

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
          alert(`DATABASE UPDATED: ${mappedParts.length} assets synced. Now broadcast this to your team.`);
        } else {
          alert('Sync Failed: Verify Excel headers.');
        }
      } catch (err) {
        alert('Format Error: Check Excel compatibility.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const generateSyncToken = () => {
    if (state.parts.length === 0) {
      alert("Database is empty. Upload a file first.");
      return;
    }
    const token = btoa(JSON.stringify({ 
      parts: state.parts, 
      time: state.lastUploadInfo,
      users: state.users 
    }));
    setSyncToken(token);
  };

  const broadcastTokenToWhatsApp = () => {
    if (!syncToken) {
      alert("Generate a token first.");
      return;
    }
    const message = `🚨 *TEAM DATABASE UPDATE* 🚨\n\n` +
      `Admin has updated the master parts list (${state.parts.length} items).\n\n` +
      `*Sync Token:* \n${syncToken}\n\n` +
      `_Please Copy & Paste this token in the "Locate Part" screen to update your device._`;
    shareToWhatsApp(message);
  };

  return (
    <div className="p-6 space-y-12 animate-in fade-in duration-800 pb-24">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">Admin Control</h2>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 grad-warm rounded-full"></div>
           <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.25em]">Executive System Control Center</p>
        </div>
      </div>

      {/* Sync Token Terminal */}
      <section className="space-y-5">
        <div className="flex items-center justify-between ml-5">
           <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest">Global Team Sync</h3>
           <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100">Sync Protocol</div>
        </div>
        <div className="premium-card p-10 rounded-[3.5rem] space-y-8 border border-coffee-50 bg-coffee-900 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute -bottom-10 -left-10 w-40 h-40 grad-primary opacity-20 rounded-full blur-3xl"></div>
           <div className="relative z-10 flex gap-5 items-start">
              <div className="p-4 bg-white/10 rounded-3xl border border-white/10">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              </div>
              <div>
                 <p className="text-xl font-black mb-1">Broadcast Database</p>
                 <p className="text-[10px] text-coffee-300 font-bold uppercase tracking-widest leading-relaxed">Send the latest data to all user devices.</p>
              </div>
           </div>
           
           {!syncToken ? (
             <button 
               onClick={generateSyncToken}
               className="w-full py-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all"
             >
               Generate Sync Token
             </button>
           ) : (
             <div className="space-y-4 animate-in slide-in-from-top-4">
                <button 
                  onClick={broadcastTokenToWhatsApp}
                  className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Share to Team WhatsApp
                </button>
                <button onClick={() => setSyncToken('')} className="w-full text-[8px] font-black text-coffee-400 uppercase tracking-widest">Reset Sync Bridge</button>
             </div>
           )}
        </div>
      </section>

      {/* Existing Upload Section */}
      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Master File Import</h3>
        <div className="premium-card p-12 rounded-[4.2rem] space-y-10 border border-coffee-50 relative overflow-hidden shadow-2xl">
           <div className="absolute -top-12 -right-12 w-48 h-48 grad-royal opacity-10 rounded-full blur-3xl"></div>
           <div className="flex items-center justify-between gap-8 relative z-10">
              <div className="flex-1">
                 <p className="text-2xl font-black text-coffee-900 tracking-tight leading-tight">Sync Excel</p>
                 <p className="text-[10px] text-coffee-300 font-bold uppercase tracking-[0.15em] mt-2">Update Core Inventory (.xlsx)</p>
              </div>
              <input type="file" accept=".xlsx,.xls,.csv" id="admin-upload" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <label htmlFor="admin-upload" className={`cursor-pointer ${isUploading ? 'bg-coffee-100' : 'grad-primary'} text-white px-10 py-6 rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-coffee-200 transition-all active:scale-95`}>
                 {isUploading ? 'Syncing...' : 'Upload Now'}
              </label>
           </div>
        </div>
      </section>

      {/* Manage Team Credentials */}
      <section className="space-y-5 pb-16">
         <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Team Credentials</h3>
         <div className="premium-card p-12 rounded-[4.2rem] space-y-10 border border-coffee-50 relative overflow-hidden shadow-2xl">
           <div className="space-y-5">
              <input 
                 placeholder="Operator ID" 
                 className="w-full px-8 py-6 rounded-[2.2rem] bg-coffee-50 border-none outline-none font-bold text-coffee-900 premium-input text-xl shadow-inner" 
                 value={newUserId}
                 onChange={e => setNewUserId(e.target.value)}
              />
              <input 
                 placeholder="Passkey" 
                 className="w-full px-8 py-6 rounded-[2.2rem] bg-coffee-50 border-none outline-none font-bold text-coffee-900 premium-input text-xl shadow-inner" 
                 value={newUserPass}
                 onChange={e => setNewUserPass(e.target.value)}
              />
              <button 
                onClick={() => {
                   if(newUserId && newUserPass) {
                      updateUsers([...state.users, { id: newUserId, name: newUserId, password: newUserPass, role: UserRole.USER }]);
                      setNewUserId(''); setNewUserPass('');
                      alert('USER ADDED');
                   }
                }} 
                className="w-full grad-warm text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl"
              >
                Provision Account
              </button>
           </div>
           
           <div className="max-h-[300px] overflow-y-auto space-y-4 pr-3 custom-scrollbar">
              {state.users.map(u => (
                <div key={u.id} className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-coffee-50 shadow-sm">
                   <div>
                      <p className="text-base font-black text-coffee-900 leading-tight">{u.name}</p>
                      <p className="text-[9px] font-black text-coffee-400 uppercase tracking-widest mt-1">{u.role}</p>
                   </div>
                   <button onClick={() => {
                      const pass = prompt(`Reset Passkey for ${u.name}?`);
                      if(pass) updateUsers(state.users.map(usr => usr.id === u.id ? {...usr, password: pass, attempts: 0} : usr));
                   }} className="text-[9px] font-black text-coffee-600 bg-coffee-100 px-4 py-2 rounded-xl uppercase tracking-widest">Reset</button>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPanelScreen;
