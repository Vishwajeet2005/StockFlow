import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, UserPlus, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/layout/PageHeader';
import ConfirmDialog from '../components/layout/ConfirmDialog';

export default function StaffPage() {
  const { role } = useAuth();
  const [staffForm, setStaffForm] = useState({ username: '', password: '' });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  useEffect(() => {
    if (role === 'admin') {
      api.get('/auth/staff').then(r => setStaffList(r.data)).catch(() => {});
    }
  }, [role]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setStaffLoading(true);
    try {
      await api.post('/auth/staff', staffForm);
      toast.success(`Staff user ${staffForm.username} created successfully!`);
      setStaffForm({ username: '', password: '' });
      const { data } = await api.get('/auth/staff');
      setStaffList(data);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create staff');
    } finally { setStaffLoading(false); }
  };

  const handleDeleteStaff = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/auth/staff/${confirmDelete.id}`);
      setStaffList(prev => prev.filter(s => s.id !== confirmDelete.id));
      toast.success('Staff account removed');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to remove staff');
    } finally {
      setConfirmDelete(null);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="h-full flex flex-col p-6 items-center justify-center">
        <Users size={48} className="text-ink-300 mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Access Denied</h2>
        <p className="text-ink-500">Only administrators can access Staff Management.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Staff Management" subtitle="Manage user accounts for your workspace" />

      <div className="p-6 max-w-3xl animate-fade-in grid gap-6 md:grid-cols-2 items-start">
        <div className="card p-5 border-brand-100 bg-brand-50/30">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-brand-600" />
            <h3 className="font-semibold text-brand-900 text-sm">Add New Staff</h3>
          </div>
          <p className="text-xs text-ink-500 mb-4">
            Create limited access staff accounts for your workspace. Staff can view and manage inventory, orders, and manufacturing, but cannot delete products or access security settings.
          </p>
          
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div>
              <label className="label">Staff Username</label>
              <input className="input" placeholder="e.g. jdoe_staff" value={staffForm.username} onChange={e => setStaffForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Initial Password</label>
              <div className="relative">
                <input className="input pr-10" type={showNew ? 'text' : 'password'} placeholder="Min. 8 characters" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm w-full" disabled={staffLoading}>
              {staffLoading ? <><Loader2 size={14} className="animate-spin" />Creating…</> : <><UserPlus size={14} />Create Staff User</>}
            </button>
          </form>
        </div>

        <div className="card p-5 border-surface-2 bg-white">
          <h4 className="font-semibold text-ink-900 text-sm mb-4">Current Staff Accounts</h4>
          {staffList.length > 0 ? (
            <div className="space-y-2">
              {staffList.map(s => (
                <div key={s.id} className="flex justify-between items-center bg-surface-1 p-3 rounded-lg border border-surface-2 text-sm">
                  <div>
                    <div className="font-medium text-ink-900">{s.username}</div>
                    <div className="text-xs text-ink-400">Added {new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xs text-ink-500 text-right">
                    <div className="font-medium text-ink-700 mb-1.5">{s.last_login ? new Date(s.last_login).toLocaleString('en-IN') : 'Never'}</div>
                    <button className="btn btn-ghost btn-sm p-1 h-auto text-red-500 hover:bg-red-50 ml-auto" onClick={() => setConfirmDelete(s)} title="Remove Staff">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-ink-400 text-center py-6 bg-surface-1 rounded-lg border border-dashed border-surface-3">
              No staff accounts yet. Use the form to create one.
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Remove Staff Account"
          message={`Are you sure you want to remove the staff account "${confirmDelete.username}"? They will no longer be able to log in.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleDeleteStaff}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
