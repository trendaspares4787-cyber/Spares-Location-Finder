
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AppState, User, Part, UserRole } from '../types';
import { exportToExcel } from '../services/exportService';

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
          alert(`DATABASE UPDATED: ${mappedParts.length} assets synced.`);
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

  const copyToken = () => {
    navigator.clipboard.writeText(syncToken);
    alert("Token copied! Share this with users to sync their devices.");
  };

  return (
    <div className="p-6 space-y-12 animate-in fade-in duration-800 pb-24">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">Admin</h2>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 grad-warm rounded-full"></div>
           <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.25em]">Executive System Control</p>
        </div>
      </div>

      {/* Sync Token Terminal */}
      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Global Redistribution</h3>
        <div className="premium-card p-10 rounded-[3.5rem] space-y-8 border border-coffee-50 bg-coffee-900 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute -bottom-10 -left-10 w-40 h-40 grad-primary opacity-20 rounded-full blur-3xl"></div>
           <div className="relative z-10">
              <p className="text-xl font-black mb-2">Sync Protocol</p>
              <p className="text-[10px] text-coffee-300 font-bold uppercase tracking-widest leading-relaxed">Share this terminal's state with other users across different locations.</p>
           </div>
           
           {!syncToken ? (
             <button 
               onClick={generateSyncToken}
               className="w-full py-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all"
             >
               Generate Sync Token
             </button>
           ) : (
             <div className="space-y-4 animate-in slide-in-from-top-4">
                <div className="bg-black/40 p-5 rounded-3xl border border-white/10 break-all h-24 overflow-y-auto text-[8px] font-mono opacity-50">
                  {syncToken}
                </div>
                <button 
                  onClick={copyToken}
                  className="w-full py-6 grad-warm text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl"
                >
                  Copy & Share Database
                </button>
                <button onClick={() => setSyncToken('')} className="w-full text-[8px] font-black text-coffee-400 uppercase tracking-widest">Reset Token</button>
             </div>
           )}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Inventory Orchestration</h3>
        <div className="premium-card p-12 rounded-[4.2rem] space-y-10 border border-coffee-50 relative overflow-hidden shadow-2xl">
           <div className="absolute -top-12 -right-12 w-48 h-48 grad-royal opacity-10 rounded-full blur-3xl"></div>
           
           <div className="flex items-center justify-between gap-8 relative z-10">
              <div className="flex-1">
                 <p className="text-2xl font-black text-coffee-900 tracking-tight leading-tight">Sync Database</p>
                 <p className="text-[10px] text-coffee-300 font-bold uppercase tracking-[0.15em] mt-2">Deploy Master Records (.xlsx)</p>
              </div>
              <input type="file" accept=".xlsx,.xls,.csv" id="admin-upload" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <label htmlFor="admin-upload" className={`cursor-pointer ${isUploading ? 'bg-coffee-100' : 'grad-primary'} text-white px-10 py-6 rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-coffee-200 transition-all active:scale-95`}>
                 {isUploading ? 'Deploying...' : 'Sync Now'}
              </label>
           </div>

           {state.lastUploadInfo && (
              <div className="bg-coffee-900 text-coffee-100 p-8 rounded-[3.5rem] flex justify-between items-center group shadow-xl">
                 <div>
                    <p className="text-sm font-black uppercase tracking-widest mb-1">{state.parts.length} Units Active</p>
                    <p className="text-[9px] text-coffee-400 font-bold uppercase italic">{state.lastUploadInfo}</p>
                 </div>
                 <button onClick={() => confirm('Purge Master Database?') && updateParts([], '')} className="p-5 bg-white/10 text-white rounded-[1.8rem] hover:bg-rose-600 transition-all border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                 </button>
              </div>
           )}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Credential Management</h3>
        <div className="premium-card p-12 rounded-[4.2rem] space-y-10 border border-coffee-50 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-32 h-32 grad-warm opacity-10 rounded-bl-full"></div>
           
           <div className="space-y-5">
              <input 
                 placeholder="Operator ID" 
                 className="w-full px-8 py-6 rounded-[2.2rem] bg-coffee-50 border-none outline-none font-bold text-coffee-900 premium-input text-xl" 
                 value={newUserId}
                 onChange={e => setNewUserId(e.target.value)}
              />
              <input 
                 placeholder="Set Passkey" 
                 className="w-full px-8 py-6 rounded-[2.2rem] bg-coffee-50 border-none outline-none font-bold text-coffee-900 premium-input text-xl" 
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
                className="w-full grad-warm text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-coffee-200"
              >
                Provision Account
              </button>
           </div>
           
           <div className="max-h-[250px] overflow-y-auto space-y-4 pr-3 custom-scrollbar">
              {state.users.map(u => (
                <div key={u.id} className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-coffee-50 shadow-sm transition-all hover:bg-coffee-50">
                   <div>
                      <p className="text-base font-black text-coffee-900 leading-tight">{u.name}</p>
                      <p className="text-[9px] font-black text-coffee-400 uppercase tracking-widest mt-1">{u.role}</p>
                   </div>
                   <button onClick={() => {
                      const pass = prompt('Define New Passkey?');
                      if(pass) updateUsers(state.users.map(usr => usr.id === u.id ? {...usr, password: pass, attempts: 0} : usr));
                   }} className="text-[10px] font-black text-white bg-coffee-800 px-5 py-3 rounded-2xl uppercase tracking-widest shadow-md">Pass</button>
                </div>
              ))}
           </div>
        </div>
      </section>

      <section className="space-y-5 pb-16">
         <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">System Maintenance</h3>
         <div className="premium-card p-12 rounded-[4.2rem] flex gap-5 border border-coffee-50">
            <button 
              onClick={() => exportToExcel(state.logs, 'Global_Inventory_Audit')}
              className="flex-1 grad-royal text-white py-7 rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl"
            >
              Export Global
            </button>
            <button 
              onClick={() => confirm('Purge all system transaction logs?') && onClearLogs()}
              className="flex-1 bg-coffee-50 text-coffee-400 border border-coffee-100 py-7 rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              Purge Session
            </button>
         </div>
      </section>
    </div>
  );
};

export default AdminPanelScreen;
