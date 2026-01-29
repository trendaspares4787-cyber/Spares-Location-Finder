
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Part, User, AuditLog } from '../types';
import { shareToWhatsApp } from '../services/exportService';

interface Props {
  currentUser: User;
  parts: Part[];
  addLog: (log: Omit<AuditLog, 'id'>) => void;
  onNavigateManual: (partNumber?: string) => void;
  updateParts: (parts: Part[], uploadTime: string) => void;
  importSyncData: (data: any) => void;
}

const TrackPartsScreen: React.FC<Props> = ({ currentUser, parts, addLog, onNavigateManual, updateParts, importSyncData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundPart, setFoundPart] = useState<Part | null>(null);
  const [isVerified, setIsVerified] = useState(true);
  const [physicalQty, setPhysicalQty] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) { setFoundPart(null); return; }
    const part = parts.find(p => String(p.partNumber || '').trim().toLowerCase() === term);
    if (part) {
      setFoundPart(part);
      setIsVerified(true);
      setPhysicalQty('');
      setNewLocation('');
    } else { setFoundPart(null); }
  }, [searchTerm, parts]);

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
          alert(`DATABASE UPDATED: Master list saved on device.`);
        }
      } catch (err) { alert('Format Error.'); } finally { setIsUploading(false); }
    };
    reader.readAsBinaryString(file);
  };

  const handleTokenImport = () => {
    try {
      const decoded = JSON.parse(atob(tokenInput));
      if (decoded.parts) {
        importSyncData(decoded);
        alert("TEAM DATA SYNCED: Master records and user list updated.");
        setShowImport(false);
        setTokenInput('');
      }
    } catch (e) { alert("Invalid Token."); }
  };

  const handleSave = () => {
    if (!foundPart) return;
    const log: Omit<AuditLog, 'id'> = {
      userName: currentUser.name,
      dateTime: new Date().toLocaleString(),
      partNumber: String(foundPart.partNumber),
      partName: foundPart.partName,
      onHandQty: foundPart.onHand,
      physicalQty: isVerified ? foundPart.onHand : Number(physicalQty),
      currentLocation: foundPart.location,
      newLocation: isVerified ? foundPart.location : newLocation,
      mav: foundPart.mav,
      type: isVerified ? 'VERIFICATION' : 'MODIFICATION'
    };
    addLog(log);
    alert('SUCCESS: Audit Entry Saved.');
    setFoundPart(null);
    setSearchTerm('');
  };

  return (
    <div className="p-6 space-y-10 pb-20">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-coffee-900 tracking-tighter">Locate Part</h2>
          <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Search & Audit</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <input type="file" accept=".xlsx,.xls" id="user-sync" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          <label htmlFor="user-sync" className="px-4 py-2.5 bg-coffee-800 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-md">
            {isUploading ? 'Syncing...' : 'Upload File'}
          </label>
          <button onClick={() => setShowImport(!showImport)} className="text-[8px] font-black uppercase tracking-widest text-coffee-600 bg-coffee-100 px-4 py-2 rounded-full border border-coffee-200">
            {showImport ? 'Close' : 'Import Team Sync'}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="premium-card p-8 rounded-[2.5rem] bg-coffee-50 space-y-5 shadow-2xl">
           <p className="text-[10px] font-black text-coffee-500 uppercase tracking-widest text-center">Master Sync Token</p>
           <textarea className="w-full h-24 p-5 rounded-3xl bg-white border border-coffee-100 text-[10px] font-mono shadow-inner outline-none" placeholder="Paste Token..." value={tokenInput} onChange={e => setTokenInput(e.target.value)} />
           <button onClick={handleTokenImport} className="w-full grad-royal text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Sync Device</button>
        </div>
      )}

      <div className="relative premium-card p-2 rounded-[2.8rem] flex gap-3 shadow-2xl border-coffee-100">
        <input type="text" className="flex-1 px-8 py-5 rounded-[2.2rem] bg-coffee-50 outline-none font-bold text-coffee-900 placeholder:text-coffee-200 text-lg" placeholder="Search Part No..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {foundPart && (
        <div className="bg-white p-10 rounded-[3.8rem] shadow-2xl border border-coffee-50 space-y-12">
          <div className="space-y-5">
             <div className="flex justify-between items-start">
                <span className="inline-flex px-5 py-2 bg-coffee-100 text-coffee-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">System Record Match</span>
                <button onClick={() => shareToWhatsApp(`*PART INFO*\n*No:* ${foundPart.partNumber}\n*Name:* ${foundPart.partName}\n*Loc:* ${foundPart.location}\n*Stock:* ${foundPart.onHand}`)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm"><WhatsAppIcon /></button>
             </div>
             <h3 className="text-4xl font-black text-coffee-900 leading-tight">{foundPart.partName}</h3>
             <p className="text-lg font-black text-coffee-600 uppercase tracking-tighter">PART NO: {foundPart.partNumber}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Bin LOC" value={foundPart.location} color="bg-coffee-100" />
            <StatItem label="ON HAND" value={foundPart.onHand.toString()} color="bg-coffee-50" />
          </div>
          <div className="pt-10 border-t border-coffee-50 space-y-10">
            <button onClick={() => setIsVerified(!isVerified)} className={`w-full flex items-center justify-between p-7 rounded-[2.8rem] border-2 ${isVerified ? 'bg-coffee-100/50 border-coffee-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center text-white ${isVerified ? 'bg-coffee-600' : 'bg-orange-600'}`}>
                  {isVerified ? <CheckIcon /> : <EditIcon />}
                </div>
                <span className={`text-sm font-black uppercase tracking-widest ${isVerified ? 'text-coffee-900' : 'text-orange-900'}`}>{isVerified ? 'Verification OK' : 'Modify Records'}</span>
              </div>
            </button>
            {!isVerified && (
              <div className="space-y-6 p-10 grad-primary rounded-[3.5rem] shadow-2xl">
                <input type="number" className="w-full px-8 py-6 rounded-[2rem] bg-white/10 border-2 border-white/20 outline-none font-bold text-white text-2xl placeholder:text-white/40" placeholder="Physical Count" value={physicalQty} onChange={(e) => setPhysicalQty(e.target.value)} />
                <input type="text" className="w-full px-8 py-6 rounded-[2rem] bg-white/10 border-2 border-white/20 outline-none font-bold text-white text-2xl placeholder:text-white/40" placeholder="Current Area" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
              </div>
            )}
            <button onClick={handleSave} className={`w-full py-8 rounded-[2.8rem] font-black uppercase tracking-[0.3em] text-[11px] ${isVerified ? 'grad-warm' : 'grad-primary'} text-white`}>Submit Audit Entry</button>
          </div>
        </div>
      )}
    </div>
  );
};

const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
const StatItem: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
  <div className={`${color} p-5 rounded-[2.2rem] border border-black/5`}>
    <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1.5">{label}</p>
    <p className="text-lg font-black leading-none truncate">{value || '—'}</p>
  </div>
);
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;

export default TrackPartsScreen;
