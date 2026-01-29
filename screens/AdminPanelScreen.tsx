
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AppState, User, Part, UserRole } from '../types';
import { shareToWhatsApp } from '../services/exportService';

interface Props {
  state: AppState;
  updateParts: (parts: Part[], time: string) => void;
  updateUsers: (users: User[]) => void;
  importSyncData: (data: any) => void;
  onClearLogs: () => void;
}

const AdminPanelScreen: React.FC<Props> = ({ state, updateParts, updateUsers, importSyncData, onClearLogs }) => {
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const [workToken, setWorkToken] = useState('');
  
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
        if (mappedParts.length > 0) { updateParts(mappedParts, new Date().toLocaleString()); alert(`DATABASE UPDATED`); }
      } catch (err) { alert('Format Error.'); } finally { setIsUploading(false); }
    };
    reader.readAsBinaryString(file);
  };

  const handleMergeToken = () => {
    try {
      const decoded = JSON.parse(atob(workToken));
      if (decoded.logs) {
        importSyncData(decoded);
        alert(`SUCCESS: Reports merged from ${decoded.userName}.`);
        setWorkToken('');
      }
    } catch (e) { alert("Invalid Token."); }
  };

  const generateSyncToken = () => {
    const token = btoa(JSON.stringify({ parts: state.parts, time: state.lastUploadInfo, users: state.users }));
    setSyncToken(token);
  };

  const broadcastTokenToWhatsApp = () => {
    if (!syncToken) return;
    shareToWhatsApp(`🚨 *TEAM UPDATE* 🚨\nAdmin has sent the latest inventory list and user updates.\n\n*Token:* \n${syncToken}`);
  };

  const handleResetPassword = () => {
    if (!resettingUser || !resetPasswordValue) return;
    updateUsers(state.users.map(u => u.id === resettingUser.id ? { ...u, password: resetPasswordValue, attempts: 0 } : u));
    setResettingUser(null); setResetPasswordValue('');
    alert(`Password Updated for ${resettingUser.name}.`);
  };

  return (
    <div className="p-6 space-y-12 animate-in fade-in duration-800 pb-24">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-coffee-900 tracking-tighter">Manage</h2>
        <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.25em]">Admin Console</p>
      </div>

      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Master Broadcast</h3>
        <div className="premium-card p-10 rounded-[3.5rem] space-y-8 bg-coffee-900 text-white shadow-2xl relative overflow-hidden">
           <p className="text-xl font-black relative z-10">Send Data to Team</p>
           {!syncToken ? (
             <button onClick={generateSyncToken} className="w-full py-6 bg-white/10 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em]">Generate Master Token</button>
           ) : (
             <button onClick={broadcastTokenToWhatsApp} className="w-full py-6 bg-emerald-600 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em]">WhatsApp Master Token</button>
           )}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Merge User Reports</h3>
        <div className="premium-card p-10 rounded-[3.5rem] space-y-5 shadow-xl border border-coffee-100">
           <p className="text-sm font-bold text-coffee-600">Paste a Work Token from a user to merge their audits into your master report.</p>
           <textarea className="w-full h-24 p-5 rounded-3xl bg-coffee-50 border-none outline-none text-[10px] font-mono shadow-inner" placeholder="Paste Work Token..." value={workToken} onChange={e => setWorkToken(e.target.value)} />
           <button onClick={handleMergeToken} className="w-full grad-royal text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Merge User Work</button>
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Team Credentials</h3>
        <div className="premium-card p-10 rounded-[4rem] space-y-4 border border-coffee-100 shadow-2xl">
          {state.users.map(u => (
            <div key={u.id} className="flex justify-between items-center bg-white p-5 rounded-3xl border border-coffee-50 shadow-sm">
               <div>
                  <p className="font-black text-coffee-900 text-sm">{u.name}</p>
                  <p className="text-[8px] font-black text-coffee-400 uppercase tracking-widest">{u.role}</p>
               </div>
               <button onClick={() => setResettingUser(u)} className="text-[9px] font-black text-coffee-600 bg-coffee-50 px-4 py-2 rounded-xl border border-coffee-100 uppercase tracking-widest">Reset Pass</button>
            </div>
          ))}
        </div>
      </section>

      {resettingUser && (
        <div className="fixed inset-0 z-[100] bg-coffee-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm premium-card p-10 rounded-[3.5rem] border border-coffee-100 space-y-8 shadow-2xl">
            <div className="text-center space-y-2">
              <h4 className="text-2xl font-black text-coffee-900">New Passkey</h4>
              <p className="text-sm font-bold text-coffee-600">Enter a new secure password for <span className="text-coffee-900">{resettingUser.name}</span></p>
            </div>
            <input type="text" className="w-full px-8 py-5 rounded-[2rem] bg-coffee-50 border-2 border-coffee-100 outline-none font-bold text-coffee-900 text-center text-xl" placeholder="Type Password Here" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} autoFocus />
            <div className="flex gap-4">
              <button onClick={handleResetPassword} className="flex-1 grad-primary text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl">Save Change</button>
              <button onClick={() => setResettingUser(null)} className="px-8 bg-coffee-100 text-coffee-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelScreen;
