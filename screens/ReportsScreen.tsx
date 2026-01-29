
import React, { useMemo } from 'react';
import { AuditLog, Part } from '../types';
import { shareReportAsFile, printView } from '../services/exportService';

interface Props {
  logs: AuditLog[];
  parts: Part[];
}

const ReportsScreen: React.FC<Props> = ({ logs, parts }) => {
  // Inventory Analytics
  const analytics = useMemo(() => {
    const totalAssetValue = parts.reduce((sum, p) => sum + (p.onHand * p.mav), 0);
    const lowStockItems = parts.filter(p => p.onHand < p.amd3);
    const zeroStockItems = parts.filter(p => p.onHand <= 0);
    const pendingReplenishment = parts.filter(p => (p.onOrder + p.dueInQty) > 0);
    const totalSKUs = parts.length;
    
    const activityTotal = logs.length;
    const qtyDeltas = logs.filter(l => l.type === 'MODIFICATION' && l.physicalQty !== l.onHandQty).length;
    const locShifts = logs.filter(l => l.type === 'MODIFICATION' && l.newLocation !== l.currentLocation).length;

    return {
      totalAssetValue,
      lowStockItemsCount: lowStockItems.length,
      zeroStockItemsCount: zeroStockItems.length,
      pendingCount: pendingReplenishment.length,
      totalSKUs,
      activityTotal,
      qtyDeltas,
      locShifts
    };
  }, [parts, logs]);

  const handleShareExcel = () => {
    shareReportAsFile('excel', logs, 'Global_Inventory_Report');
  };

  const handleSharePDF = () => {
    const headers = ["User", "Date", "Part", "Type", "Status"];
    const body = logs.map(l => [
      l.userName, 
      l.dateTime.split(',')[0], 
      l.partNumber, 
      l.type, 
      l.physicalQty !== l.onHandQty ? 'Count Mismatch' : 'Verified'
    ]);
    shareReportAsFile('pdf', logs, 'Inventory_Audit_Report', { headers, body, title: 'Enterprise Inventory Insights' });
  };

  return (
    <div className="p-6 space-y-10 animate-in fade-in duration-800 pb-28">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">Inventory Reports</h2>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 grad-royal rounded-full"></div>
           <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Enterprise Data Intelligence Dashboard</p>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 gap-5 no-print">
        <div className="grad-primary p-10 rounded-[3.5rem] text-white shadow-2xl shadow-coffee-200 flex justify-between items-center group transition-all hover:scale-[1.01] border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[100px]"></div>
           <div className="relative z-10">
             <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-80 mb-3">Total Asset Value</p>
             <p className="text-5xl font-black">₹{analytics.totalAssetValue.toLocaleString()}</p>
             <p className="text-[9px] font-bold uppercase tracking-widest mt-4 opacity-60">Calculated from {analytics.totalSKUs} SKUs</p>
           </div>
           <div className="relative z-10 p-5 bg-white/15 rounded-[2rem] backdrop-blur-xl border border-white/10">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-5">
           <SummaryCard label="Low Stock" value={analytics.lowStockItemsCount} grad="grad-warm" icon="alert" />
           <SummaryCard label="Zero Qty" value={analytics.zeroStockItemsCount} grad="grad-royal" icon="zero" />
           <SummaryCard label="Replenishment" value={analytics.pendingCount} grad="grad-primary" icon="sync" />
           <SummaryCard label="Total SKUs" value={analytics.totalSKUs} grad="bg-coffee-800" icon="box" />
        </div>
      </div>

      {/* Operational Reports */}
      <div className="space-y-6 no-print">
         <h3 className="text-[10px] font-black text-coffee-400 uppercase tracking-widest ml-5">Operational Activity</h3>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-7 rounded-[2.5rem] border border-coffee-100 shadow-sm">
               <p className="text-[8px] font-black text-coffee-300 uppercase tracking-widest mb-1.5">User Verifications</p>
               <p className="text-2xl font-black text-coffee-900">{analytics.activityTotal}</p>
            </div>
            <div className="bg-white p-7 rounded-[2.5rem] border border-coffee-100 shadow-sm">
               <p className="text-[8px] font-black text-coffee-300 uppercase tracking-widest mb-1.5">Stock Variances</p>
               <p className="text-2xl font-black text-orange-600">{analytics.qtyDeltas}</p>
            </div>
         </div>
      </div>

      {/* Recent Ledger Display */}
      <div className="premium-card rounded-[3.8rem] overflow-hidden border border-coffee-100 shadow-2xl">
        <div className="px-10 py-9 grad-primary text-white flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Activity Ledger</h3>
          <div className="px-5 py-2 bg-white/15 rounded-full backdrop-blur-xl text-[10px] font-black border border-white/10">{logs.length} Operations</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-coffee-50/50 text-coffee-400 font-black uppercase tracking-[0.25em] border-b border-coffee-100">
                <th className="px-10 py-6">Operation Details</th>
                <th className="px-10 py-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100/40">
              {logs.slice(0, 20).map((log) => (
                <tr key={log.id} className="hover:bg-coffee-50 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 grad-warm rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg group-hover:scale-110 transition-transform">
                          {log.userName.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-coffee-900 text-sm leading-none mb-1.5">{log.partNumber}</p>
                          <p className="text-[10px] font-bold text-coffee-500 uppercase tracking-widest truncate max-w-[140px]">{log.partName}</p>
                          <p className="text-[9px] text-coffee-300 font-bold uppercase mt-1.5 tracking-tighter">By {log.userName} • {log.dateTime.split(',')[0]}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <StatusBadge type={log.onHandQty !== log.physicalQty ? 'QTY' : log.currentLocation !== log.newLocation ? 'LOC' : 'OK'} />
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-10 py-24 text-center text-coffee-200 font-black uppercase tracking-[0.3em] italic opacity-40">Dashboard Empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 no-print">
        <ActionButton onClick={handleShareExcel} label="Share Excel" grad="grad-warm" icon={<ExcelIcon />} />
        <ActionButton onClick={handleSharePDF} label="Share PDF" grad="grad-royal" icon={<PdfIcon />} />
        <ActionButton onClick={printView} label="Print Report" grad="grad-primary" />
        <p className="col-span-2 text-center text-[9px] font-bold text-coffee-300 uppercase tracking-widest mt-2">Business intelligence generated from live terminal data</p>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string, value: number, grad: string, icon: string }> = ({ label, value, grad, icon }) => (
  <div className={`${grad} p-7 rounded-[3rem] text-white shadow-xl flex flex-col justify-between transition-all hover:translate-y-[-5px] border border-white/10 relative overflow-hidden`}>
    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
    <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-80 mb-5 relative z-10">{label}</p>
    <div className="flex items-end justify-between relative z-10">
       <p className="text-4xl font-black">{value}</p>
       <div className="opacity-40">
          {icon === 'alert' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
          {icon === 'box' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
          {icon === 'sync' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>}
          {icon === 'zero' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line></svg>}
       </div>
    </div>
  </div>
);

const StatusBadge: React.FC<{ type: 'QTY' | 'LOC' | 'OK' }> = ({ type }) => {
  const styles = {
    QTY: 'bg-orange-50 text-orange-700 border-orange-100',
    LOC: 'bg-coffee-100 text-coffee-800 border-coffee-200',
    OK: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  const labels = { QTY: 'Qty Drift', LOC: 'Re-Located', OK: 'Perfect' };
  return (
    <span className={`${styles[type]} px-5 py-2.5 rounded-full font-black text-[9px] uppercase tracking-[0.2em] border shadow-sm`}>
      {labels[type]}
    </span>
  );
};

const ActionButton: React.FC<{ onClick: () => void, label: string, grad: string, icon?: React.ReactNode }> = ({ onClick, label, grad, icon }) => (
  <button
    onClick={onClick}
    className={`${grad} text-white py-7 rounded-[2.2rem] font-black shadow-xl hover:translate-y-[-4px] active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2`}
  >
    {icon}
    {label}
  </button>
);

const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="8" y1="9" x2="10" y2="9"></line></svg>;
const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>;

export default ReportsScreen;
