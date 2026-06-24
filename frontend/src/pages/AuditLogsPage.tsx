import React, { useEffect, useState } from 'react';
import api, { AuditLog, fmt } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Activity, ShieldAlert, KeyRound, UserMinus, FileMinus } from 'lucide-react';

export default function AuditLogsPage() {
  const { role } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      setError('Access denied: You must be an administrator to view system logs.');
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/audit-logs');
        setLogs(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [role]);

  const getActionIcon = (action: string) => {
    if (action.includes('DELETE')) return <ShieldAlert className="w-4 h-4 text-red-500" />;
    if (action.includes('PASSWORD') || action.includes('2FA')) return <KeyRound className="w-4 h-4 text-blue-500" />;
    if (action.includes('STAFF')) return <UserMinus className="w-4 h-4 text-orange-500" />;
    if (action.includes('ORDER') || action.includes('PRODUCT')) return <FileMinus className="w-4 h-4 text-yellow-500" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const getActionBadge = (action: string) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (action.includes('DELETE')) colorClass = 'bg-red-100 text-red-800 border border-red-200';
    else if (action.includes('PASSWORD') || action.includes('2FA')) colorClass = 'bg-blue-100 text-blue-800 border border-blue-200';
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 w-fit ${colorClass}`}>
        {getActionIcon(action)}
        {action}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Security Restriction</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Permanent, read-only record of critical system actions for security monitoring.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Activity className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {fmt.datetime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{log.user.username}</span>
                          <span className="text-xs text-gray-500 capitalize">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">System / Deleted User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate" title={log.details || ''}>
                        {log.details ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {log.details}
                          </code>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
