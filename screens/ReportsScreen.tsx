
import React from 'react';
import { AuditLog } from '../types';
import { shareReportAsFile, printView } from '../services/exportService';

interface Props {
  logs: AuditLog[];
}

const ReportsScreen: React.FC<Props> = ({ logs }) => {
  const summary = {
    total: logs.length,
    qtyChanged: logs.filter(l => l.type === 'MODIFICATION' && l.physicalQty !== l.onHandQty).length,
    locChanged: logs.filter(l => l.type === 'MODIFICATION' && l.newLocation !== l.currentLocation).length,
  };

  const handleShareExcel = () => {
    shareReportAsFile('excel', logs, 'Activity_Log');
  };

  const handleSharePDF = () => {
    const headers = ["User", "Date", "Part", "Type", "Prev Qty", "New Qty"];
    const body = logs.map(l => [l.userName, l.dateTime.split(',')[0], l.partNumber, l.type, l.onHandQty, l.physicalQty]);
    shareReportAsFile('pdf', logs, 'Activity_Log', { headers, body, title: 'Inventory Audit Trail' });
  };

  return (
    <div className="p-6 space-y-10 animate-in fade-in duration-800">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-coffee-900 tracking-tighter">Audit Trail</h2>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 grad-royal rounded-full"></div>
           <p className="text-[10px] text-coffee-600 font-black uppercase tracking-[0.2em]">Transaction Ledger History</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 no-print">
        <div className="grad-primary p-10 rounded-[3.5rem] text-white shadow-2xl shadow-coffee-200 flex justify-between items-center group transition-all hover:scale-[1.02] border border-white/10">
           <div>
             <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-80 mb-3">System Interactions</p>
             <p className="text-6xl font-black">{summary.total}</p>
           </div>
           <div className="p-5 bg-white/15 rounded-[2rem] backdrop-blur-xl border border-white/10">
             <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line></svg>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-5">
           <SummaryCard label="Qty Deltas" value={summary.qtyChanged} grad="grad-warm" />
           <SummaryCard label="Bin Shifts" value={summary.locChanged} grad="grad-royal" />
        </div>
      </div>

      <div className="premium-card rounded-[3.8rem] overflow-hidden border border-coffee-100 shadow-2xl">
        <div className="px-10 py-9 grad-primary text-white flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Session Ledger</h3>
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
              {logs.map((log) => (
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
                  <td colSpan={2} className="px-10 py-24 text-center text-coffee-200 font-black uppercase tracking-[0.3em] italic opacity-40">Database Clean</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 no-print pb-20">
        <ActionButton onClick={handleShareExcel} label="Share Excel" grad="grad-warm" icon={<ExcelIcon />} />
        <ActionButton onClick={handleSharePDF} label="Share PDF" grad="grad-royal" icon={<PdfIcon />} />
        <ActionButton onClick={printView} label="Print Ledger" grad="grad-primary" />
        <p className="col-span-2 text-center text-[9px] font-bold text-coffee-300 uppercase tracking-widest mt-2">Reports can be shared directly as documents</p>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string, value: number, grad: string }> = ({ label, value, grad }) => (
  <div className={`${grad} p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between transition-all hover:scale-[1.05] border border-white/10`}>
    <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-80 mb-5">{label}</p>
    <p className="text-4xl font-black">{value}</p>
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
