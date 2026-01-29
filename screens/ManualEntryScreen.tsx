
import React, { useState, useEffect } from 'react';
import { ManualEntry, User } from '../types';

interface Props {
  currentUser: User;
  manualEntries: ManualEntry[];
  addManualEntry: (entry: Omit<ManualEntry, 'id'>) => void;
  initialPartNumber?: string;
  onClearPrefill?: () => void;
}

const ManualEntryScreen: React.FC<Props> = ({ currentUser, manualEntries, addManualEntry, initialPartNumber, onClearPrefill }) => {
  const [partNumber, setPartNumber] = useState('');
  const [qty, setQty] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (initialPartNumber) setPartNumber(initialPartNumber);
  }, [initialPartNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addManualEntry({
      userName: currentUser.name,
      dateTime: new Date().toLocaleString(),
      partNumber,
      foundPhysicalQty: Number(qty),
      foundLocation: location
    });
    setPartNumber('');
    setQty('');
    setLocation('');
    if (onClearPrefill) onClearPrefill();
    alert('REGISTERED: Part manual entry committed.');
  };

  return (
    <div className="p-6 space-y-12 animate-in fade-in duration-800">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">Registry</h2>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 grad-warm rounded-full"></div>
           <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Add Missing Assets Manually</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="premium-card p-12 rounded-[4rem] shadow-2xl space-y-10 relative overflow-hidden border border-coffee-50">
        <div className="absolute top-0 left-0 w-32 h-32 grad-royal opacity-5 rounded-br-full"></div>
        
        <div className="space-y-8 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest mb-4 ml-3">Asset Identifier</label>
            <input
              type="text"
              className="w-full px-8 py-6 rounded-[2.2rem] bg-coffee-50/50 border-none outline-none font-bold text-coffee-900 premium-input text-2xl placeholder:text-coffee-200"
              required
              placeholder="e.g. PART-XYZ"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest mb-4 ml-3">Actual Count</label>
              <input
                type="number"
                className="w-full px-8 py-6 rounded-[2.2rem] bg-coffee-50/50 border-none outline-none font-bold text-coffee-900 premium-input text-2xl placeholder:text-coffee-200"
                required
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-coffee-500 uppercase tracking-widest mb-4 ml-3">Designated Area</label>
              <input
                type="text"
                className="w-full px-8 py-6 rounded-[2.2rem] bg-coffee-50/50 border-none outline-none font-bold text-coffee-900 premium-input text-2xl placeholder:text-coffee-200"
                required
                placeholder="Bin ID"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full grad-primary text-white py-8 rounded-[2.8rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-coffee-200 hover:translate-y-[-6px] active:scale-95 transition-all mt-6"
        >
          Finalize Registry
        </button>
      </form>

      <div className="premium-card rounded-[3.8rem] overflow-hidden border border-coffee-50 shadow-xl">
        <div className="px-10 py-7 bg-coffee-50/50 border-b border-coffee-100">
           <p className="text-[10px] font-black text-coffee-400 uppercase tracking-[0.25em]">Recent Transactions</p>
        </div>
        <div className="max-h-[350px] overflow-y-auto divide-y divide-coffee-50">
          {manualEntries.map((e) => (
            <div key={e.id} className="p-10 hover:bg-coffee-100/30 transition-all group">
              <div className="flex justify-between items-center mb-5">
                 <div className="px-5 py-1.5 grad-royal text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">{e.partNumber}</div>
                 <span className="text-[9px] font-black text-coffee-200 uppercase tracking-widest">{e.dateTime.split(',')[0]}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <MiniInfo label="Count" val={e.foundPhysicalQty.toString()} />
                 <MiniInfo label="Area" val={e.foundLocation} />
                 <MiniInfo label="Op" val={e.userName.split(' ')[0]} />
              </div>
            </div>
          ))}
          {manualEntries.length === 0 && (
            <div className="py-24 text-center opacity-40">
               <p className="text-sm font-black uppercase tracking-[0.3em] text-coffee-200">No Registry Data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MiniInfo: React.FC<{ label: string, val: string }> = ({ label, val }) => (
  <div className="bg-coffee-50 p-4 rounded-3xl border border-coffee-100/50 group-hover:bg-white transition-colors">
     <p className="text-[8px] font-black text-coffee-300 uppercase tracking-widest mb-1.5 leading-none">{label}</p>
     <p className="text-[11px] font-black text-coffee-900 truncate">{val}</p>
  </div>
);

export default ManualEntryScreen;
