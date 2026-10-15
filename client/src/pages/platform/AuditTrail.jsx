import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Activity,
  Search,
  ShieldCheck,
  FileText,
  RefreshCw,
  Calendar,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AuditTrail() {
  const { refreshCounter, accentColor } = useOutletContext() || {};
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/audit-logs');
      if (res.data?.success) {
        setAuditLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit trail logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [refreshCounter]);

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.actorName && log.actorName.toLowerCase().includes(q)) ||
      (log.entity && log.entity.toLowerCase().includes(q)) ||
      (log.entityId && log.entityId.toLowerCase().includes(q));

    const matchesAction =
      actionFilter === 'ALL' || (log.action && log.action.includes(actionFilter));

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3A] tracking-tight">
            Security & Compliance Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-[#53607A] font-medium mt-0.5">
            Immutable system audit logs tracking store approvals, status overrides, and platform configuration changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#53607A] bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-xl shadow-xs">
            Total Audits: <span className="font-extrabold text-[#0B1B3A]">{auditLogs.length}</span>
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
          <input
            type="text"
            placeholder="Search by action, operator, entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] placeholder-[#8B96AB] focus:outline-none focus:border-[#0FA38F] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'STORE', 'STATUS', 'LOGIN', 'SECURITY'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActionFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                actionFilter === filter
                  ? 'bg-[#0B1B3A] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#53607A] border border-[#CBD5E1] hover:bg-white hover:text-[#0B1B3A]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#53607A]">
            <RefreshCw className="animate-spin text-[#0FA38F] mb-3" size={32} />
            <p className="font-bold text-sm">Loading audit logs from MongoDB...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-[#53607A]">
            <FileText className="mx-auto mb-3 text-[#CBD5E1]" size={44} />
            <h3 className="font-extrabold text-base text-[#0B1B3A]">No audit logs recorded</h3>
            <p className="text-xs text-[#8B96AB] mt-1">
              {searchQuery
                ? `No logs match the query "${searchQuery}".`
                : 'No compliance events have been logged yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Audit Details</th>
                  <th className="py-3.5 px-4 text-right">Security State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 text-xs font-medium text-[#53607A]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#8B96AB]" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0B1B3A]">{log.actorName || 'System'}</div>
                      <div className="text-[11px] text-[#53607A] uppercase font-mono">
                        {log.actorRole || 'PLATFORM_ADMIN'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30 uppercase font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-[#0B1B3A]">
                      {log.entity}: <span className="text-[#0FA38F]">{log.entityId || 'N/A'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#53607A] max-w-xs truncate">
                      {log.details ? (
                        typeof log.details === 'object' ? (
                          <pre className="font-mono text-[11px] bg-[#F1F5F9] p-1 rounded overflow-hidden text-ellipsis">
                            {JSON.stringify(log.details)}
                          </pre>
                        ) : (
                          String(log.details)
                        )
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0FA38F]">
                        <ShieldCheck size={14} /> Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
