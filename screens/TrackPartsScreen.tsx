
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Part, User, AuditLog } from '../types';

interface Props {
  currentUser: User;
  parts: Part[];
  addLog: (log: Omit<AuditLog, 'id'>) => void;
  onNavigateManual: (partNumber?: string) => void;
  updateParts: (parts: Part[], uploadTime: string) => void;
}

const TrackPartsScreen: React.FC<Props> = ({ currentUser, parts, addLog, onNavigateManual, updateParts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundPart, setFoundPart] = useState<Part | null>(null);
  const [isVerified, setIsVerified] = useState(true);
  const [physicalQty, setPhysicalQty] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  // Instant lookup as user types
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFoundPart(null);
      return;
    }

    const part = parts.find(p => 
      String(p.partNumber || '').trim().toLowerCase() === term
    );

    if (part) {
      setFoundPart(part);
      setIsVerified(true);
      setPhysicalQty('');
      setNewLocation('');
    } else {
      setFoundPart(null);
    }
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
          alert(`SYNC COMPLETE: ${mappedParts.length} assets updated.`);
        } else {
          alert('Sync Failed: Check Excel headers.');
        }
      } catch (err) {
        alert('File Error: Incompatible format.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleTokenImport = () => {
    try {
      const decoded = JSON.parse(atob(tokenInput));
      if (decoded.parts && Array.isArray(decoded.parts)) {
        updateParts(decoded.parts, decoded.time || new Date().toLocaleString());
        alert("DATABASE SYNCED SUCCESSFULLY!");
        setTokenInput('');
        setShowImport(false);
      } else {
        alert("Invalid Sync Token.");
      }
    } catch (e) {
      alert("Token Corrupted or Invalid.");
    }
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
    alert('SUCCESS: Inventory Trail Updated.');
    setFoundPart(null);
    setSearchTerm('');
  };

  return (
    <div className="p-6 space-y-10 animate-in fade-in duration-800 pb-20">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">Locate Part</h2>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 grad-primary rounded-full"></div>
             <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Instant Enterprise Discovery</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="relative">
            <input type="file" accept=".xlsx,.xls" id="user-sync" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            <label htmlFor="user-sync" className="flex items-center gap-2 px-4 py-2.5 bg-coffee-100 text-coffee-700 rounded-2xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-sm active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              {isUploading ? 'Syncing...' : 'Sync Data'}
            </label>
          </div>
          <button 
            onClick={() => setShowImport(!showImport)}
            className="text-[8px] font-black uppercase tracking-widest text-coffee-400 bg-white/50 px-3 py-1 rounded-full border border-coffee-100"
          >
            {showImport ? 'Hide Import' : 'Import Shared Token'}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="animate-in slide-in-from-top-4 duration-500 premium-card p-8 rounded-[2.5rem] border-coffee-200 bg-coffee-50 space-y-5">
           <p className="text-[10px] font-black text-coffee-500 uppercase tracking-widest">Master Database Import</p>
           <textarea 
             className="w-full h-24 p-5 rounded-3xl bg-white border border-coffee-100 outline-none text-[10px] font-mono focus:border-coffee-400 transition-all"
             placeholder="Paste the shared sync token here..."
             value={tokenInput}
             onChange={e => setTokenInput(e.target.value)}
           />
           <button 
             onClick={handleTokenImport}
             className="w-full grad-royal text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
           >
             Sync Shared Database
           </button>
        </div>
      )}

      <div className="relative group">
        <div className="absolute -inset-1 grad-primary rounded-[2.8rem] blur-md opacity-10 group-hover:opacity-20 transition-all duration-700"></div>
        <div className="relative premium-card p-2 rounded-[2.8rem] flex gap-3 shadow-2xl border-coffee-100">
          <input
            type="text"
            className="flex-1 px-8 py-5 rounded-[2.2rem] bg-coffee-50 border-none outline-none font-bold text-coffee-900 placeholder:text-coffee-200 premium-input text-lg"
            placeholder="Type Part Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="p-5 text-coffee-400">
             <SearchIcon />
          </div>
        </div>
      </div>

      {!foundPart && searchTerm.trim() !== '' && (
        <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500">
          <p className="text-coffee-300 font-black uppercase tracking-widest text-[11px] mb-6">Asset Not Registered</p>
          <button 
            onClick={() => onNavigateManual(searchTerm)}
            className="grad-warm text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl"
          >
            Create Manual Entry
          </button>
        </div>
      )}

      {foundPart && (
        <div className="animate-in slide-in-from-bottom-16 duration-800">
          <div className="bg-white p-10 rounded-[3.8rem] shadow-[0_60px_120px_-30px_rgba(60,42,33,0.15)] border border-coffee-50 space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 grad-primary opacity-5 rounded-bl-[120px]"></div>
            
            <div className="space-y-5">
               <span className="inline-flex px-5 py-2 bg-coffee-100 text-coffee-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-coffee-200">System Record Match</span>
               <h3 className="text-4xl font-black text-coffee-900 leading-tight">{foundPart.partName}</h3>
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-coffee-50 text-coffee-700 rounded-2xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path></svg>
                  </div>
                  <span className="text-lg font-black text-coffee-600 uppercase tracking-tighter">PART NO: {foundPart.partNumber}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatItem label="Bin LOC" value={foundPart.location} color="bg-coffee-100 text-coffee-900" dot="bg-coffee-600" highlight />
              <StatItem label="ON HAND" value={foundPart.onHand.toString()} color="bg-coffee-50 text-coffee-800" dot="bg-coffee-400" />
              <StatItem label="DUE IN" value={foundPart.dueInQty.toString()} color="bg-coffee-50 text-coffee-700" dot="bg-coffee-300" />
              <StatItem label="ON ORDER" value={foundPart.onOrder.toString()} color="bg-coffee-50 text-coffee-700" dot="bg-coffee-300" />
              <StatItem label="AMD3" value={foundPart.amd3.toString()} color="bg-orange-50 text-orange-800" dot="bg-orange-400" />
              <StatItem label="MAV" value={`₹${Number(foundPart.mav).toLocaleString()}`} color="bg-coffee-50 text-coffee-800" dot="bg-coffee-500" />
              
              <div className="col-span-2 grid grid-cols-2 gap-4 pt-4">
                <StatItem 
                  label="HAND + UPCOMING" 
                  value={(foundPart.onHand + foundPart.dueInQty + foundPart.onOrder).toString()} 
                  color="grad-warm text-white" 
                  dot="bg-white" 
                />
                <StatItem 
                  label="SYS GEN STOCK" 
                  value={foundPart.sysGenStock.toString()} 
                  color="grad-primary text-white" 
                  dot="bg-white" 
                />
              </div>
            </div>

            <div className="pt-10 border-t border-coffee-50 space-y-10">
              <button 
                onClick={() => setIsVerified(!isVerified)}
                className={`w-full flex items-center justify-between p-7 rounded-[2.8rem] transition-all border-2 ${isVerified ? 'bg-coffee-100/50 border-coffee-200' : 'bg-orange-50 border-orange-200'} group relative overflow-hidden shadow-sm`}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all ${isVerified ? 'bg-coffee-600 text-white shadow-coffee-200' : 'bg-orange-600 text-white shadow-orange-200'}`}>
                    {isVerified ? <CheckIcon /> : <EditIcon />}
                  </div>
                  <div className="text-left">
                    <span className={`block text-sm font-black uppercase tracking-widest ${isVerified ? 'text-coffee-900' : 'text-orange-900'}`}>
                      {isVerified ? 'Verification OK' : 'Modify Records'}
                    </span>
                    <span className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest">System Record Status</span>
                  </div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full animate-ping ${isVerified ? 'bg-coffee-400' : 'bg-orange-400'}`}></div>
              </button>

              {!isVerified && (
                <div className="space-y-6 p-10 grad-primary rounded-[3.5rem] shadow-2xl animate-in slide-in-from-top-10 duration-600">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-coffee-100/80 uppercase tracking-[0.2em] ml-3">Physical Stock Count</label>
                    <input
                      type="number"
                      className="w-full px-8 py-6 rounded-[2rem] bg-white/10 border-2 border-white/20 outline-none font-bold text-white placeholder:text-white/30 focus:bg-white/15 transition-all text-2xl"
                      placeholder="0"
                      value={physicalQty}
                      onChange={(e) => setPhysicalQty(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-coffee-100/80 uppercase tracking-[0.2em] ml-3">Current Location ID</label>
                    <input
                      type="text"
                      className="w-full px-8 py-6 rounded-[2rem] bg-white/10 border-2 border-white/20 outline-none font-bold text-white placeholder:text-white/30 focus:bg-white/15 transition-all text-2xl"
                      placeholder="Shelf / Bin ID"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                className={`w-full py-8 rounded-[2.8rem] font-black shadow-2xl transition-all uppercase tracking-[0.3em] text-[11px] ${isVerified ? 'grad-warm shadow-coffee-200' : 'grad-primary shadow-coffee-200'} text-white hover:translate-y-[-6px] active:scale-95`}
              >
                Submit Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem: React.FC<{ label: string, value: string, color: string, dot: string, highlight?: boolean }> = ({ label, value, color, dot, highlight }) => (
  <div className={`${color} p-5 rounded-[2.2rem] border border-white/10 relative overflow-hidden transition-all hover:scale-[1.04] shadow-sm`}>
    <div className={`absolute -top-6 -right-6 w-16 h-16 ${dot} opacity-5 rounded-full`}></div>
    <div className="flex items-center gap-2 mb-1.5">
       <div className={`w-1.5 h-1.5 ${dot} rounded-full`}></div>
       <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{label}</p>
    </div>
    <p className={`text-lg font-black leading-none truncate ${highlight ? 'underline decoration-1 underline-offset-4' : ''}`}>{value || '—'}</p>
  </div>
);

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;

export default TrackPartsScreen;
