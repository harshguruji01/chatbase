import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  HardDrive,
  AlertTriangle,
  Search,
  Trash2,
  Activity,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { OutlinedButton } from '../common/OutlinedButton';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { formatRelativeTime } from '../../lib/utils';
import type { Profile, Report, AdminAuditLog } from '../../types';
import { useToast } from '../common/Toast';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { user, profile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'reports' | 'audit'>('analytics');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    voiceMessages: 0,
    videoMessages: 0,
    pendingReports: 0,
    suspendedUsers: 0,
  });

  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Selected user for action modal
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'delete' | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchReports();
    fetchAuditLogs();
    fetchUsers();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { count: suspendedCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_suspended', true);
      const { count: messagesCount } = await supabase.from('messages').select('id', { count: 'exact', head: true });
      const { count: voiceCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('type', 'voice');
      const { count: videoCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('type', 'video');
      const { count: reportsCount } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: Math.max(1, (usersCount || 0) - (suspendedCount || 0)),
        totalMessages: messagesCount || 0,
        voiceMessages: voiceCount || 0,
        videoMessages: videoCount || 0,
        pendingReports: reportsCount || 0,
        suspendedUsers: suspendedCount || 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').limit(50);
      if (data) setUsersList(data as Profile[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data } = await supabase
        .from('reports')
        .select('*, reporter:reporter_id(*), reported:reported_id(*)')
        .order('created_at', { ascending: false });
      if (data) setReportsList(data as Report[]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data } = await supabase
        .from('admin_audit_logs')
        .select('*, admin:admin_id(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setAuditLogs(data as AdminAuditLog[]);
    } catch (err) {
      console.error(err);
    }
  };

  const logAdminAction = async (action: string, targetType: string, targetId: string, reason: string) => {
    if (!user) return;
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      reason,
    });
    fetchAuditLogs();
  };

  const handleExecuteUserAction = async () => {
    if (!selectedUser || !actionType) return;
    try {
      if (actionType === 'suspend') {
        await supabase.from('profiles').update({ is_suspended: true }).eq('id', selectedUser.id);
        await logAdminAction('SUSPEND_USER', 'user', selectedUser.id, actionReason || 'Suspended by admin');
        showToast(`User @${selectedUser.username} suspended.`, 'info');
      } else if (actionType === 'unsuspend') {
        await supabase.from('profiles').update({ is_suspended: false }).eq('id', selectedUser.id);
        await logAdminAction('UNSUSPEND_USER', 'user', selectedUser.id, actionReason || 'Unsuspended by admin');
        showToast(`User @${selectedUser.username} reactivated.`, 'success');
      } else if (actionType === 'delete') {
        await supabase.from('profiles').delete().eq('id', selectedUser.id);
        await logAdminAction('DELETE_USER', 'user', selectedUser.id, actionReason || 'Deleted by admin');
        showToast(`User @${selectedUser.username} permanently deleted.`, 'error');
      }

      fetchUsers();
      fetchAnalytics();
      setSelectedUser(null);
      setActionType(null);
      setActionReason('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await supabase.from('reports').update({ status }).eq('id', reportId);
      await logAdminAction(`REPORT_${status.toUpperCase()}`, 'report', reportId, 'Moderation review complete');
      fetchReports();
      fetchAnalytics();
      showToast(`Report marked as ${status}.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--color-danger)" style={{ margin: '0 auto 16px' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          You do not have administrative privileges to access this area.
        </p>
        <OutlinedButton variant="primary" onClick={onBack} style={{ marginTop: '20px' }}>
          Return to ChatBase
        </OutlinedButton>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.display_name.toLowerCase().includes(q) ||
      u.user_code.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)', overflowY: 'auto' }}>
      {/* Admin Top Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <OutlinedButton variant="ghost" size="sm" className="btn-icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </OutlinedButton>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={22} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>ChatBase Admin Control</h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as admin: @{profile?.username}
            </span>
          </div>
        </div>

        {/* Tab Navigator */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'analytics' ? 'var(--color-primary-light)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'users' ? 'var(--color-primary-light)' : 'transparent',
              color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Users ({stats.totalUsers})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'reports' ? 'var(--color-primary-light)' : 'transparent',
              color: activeTab === 'reports' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Reports ({stats.pendingReports})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'audit' ? 'var(--color-primary-light)' : 'transparent',
              color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div style={{ padding: '24px', flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Total Users</span>
                  <Users size={20} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>{stats.totalUsers}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: '4px' }}>
                  {stats.activeUsers} active accounts
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Total Messages</span>
                  <MessageSquare size={20} color="var(--color-accent)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>{stats.totalMessages}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Auto-purges after 30 days
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Voice & Videos</span>
                  <HardDrive size={20} color="var(--color-pink)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>
                  {stats.voiceMessages + stats.videoMessages}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {stats.voiceMessages} audio, {stats.videoMessages} video
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Pending Reports</span>
                  <AlertTriangle size={20} color="var(--color-warning)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>{stats.pendingReports}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-danger)', marginTop: '4px' }}>
                  {stats.suspendedUsers} suspended users
                </div>
              </div>
            </div>

            {/* System Health Card */}
            <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Activity size={24} color="var(--color-success)" />
                <div>
                  <h4 style={{ fontWeight: 700 }}>System Health: Operational</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Supabase PostgreSQL, Realtime WebSocket & Storage buckets active.
                  </p>
                </div>
              </div>
              <span className="user-code-badge" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                ● All Services Online
              </span>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-wrapper" style={{ maxWidth: '400px' }}>
              <Search size={16} className="input-icon-left" />
              <input
                type="text"
                className="input-field has-left-icon"
                placeholder="Filter by name, username, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                    <th style={{ padding: '12px 16px' }}>User</th>
                    <th style={{ padding: '12px 16px' }}>Unique ID</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Joined</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Loading user accounts...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No user accounts match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.display_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700 }}>
                        {u.user_code}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {u.email || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.is_suspended ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Suspended</span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {u.is_suspended ? (
                            <OutlinedButton
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('unsuspend');
                              }}
                            >
                              Unsuspend
                            </OutlinedButton>
                          ) : (
                            <OutlinedButton
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('suspend');
                              }}
                            >
                              Suspend
                            </OutlinedButton>
                          )}
                          <OutlinedButton
                            variant="danger"
                            size="sm"
                            className="btn-icon"
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('delete');
                            }}
                          >
                            <Trash2 size={14} />
                          </OutlinedButton>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {reportsList.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No abuse or spam reports found.
              </div>
            ) : (
              reportsList.map((r) => (
                <div key={r.id} className="card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="user-code-badge" style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}>
                        {r.reason.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatRelativeTime(r.created_at)}
                      </span>
                    </div>

                    <p style={{ marginTop: '8px', fontSize: '0.92rem' }}>
                      Reported User: <strong>@{r.reported?.username || r.reported_id}</strong> by @{r.reporter?.username || r.reporter_id}
                    </p>

                    {r.details && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        "{r.details}"
                      </p>
                    )}
                  </div>

                  {r.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <OutlinedButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolveReport(r.id, 'dismissed')}
                      >
                        Dismiss
                      </OutlinedButton>
                      <OutlinedButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveReport(r.id, 'resolved')}
                      >
                        Mark Resolved
                      </OutlinedButton>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      Status: {r.status}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
              Administrative Audit Trail
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color="var(--color-primary)" />
                    <div>
                      <strong>{log.action}</strong> on {log.target_type} ({log.target_id.substring(0, 8)})
                      {log.reason && <span style={{ color: 'var(--text-muted)' }}> - "{log.reason}"</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Modal (Suspend, Unsuspend, Delete) */}
      <Modal
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title={`${actionType?.toUpperCase()} User @${selectedUser?.username}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to {actionType} user <strong>{selectedUser?.display_name}</strong> (@{selectedUser?.username})?
          </p>

          <div className="input-group">
            <label className="input-label">Reason for Action (Audit Log)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Terms violation, spamming, harassment..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <OutlinedButton variant="secondary" onClick={() => setSelectedUser(null)}>
              Cancel
            </OutlinedButton>
            <OutlinedButton
              variant={actionType === 'unsuspend' ? 'primary' : 'danger'}
              onClick={handleExecuteUserAction}
            >
              Confirm {actionType}
            </OutlinedButton>
          </div>
        </div>
      </Modal>

      {/* Footer Branding */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '16px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
        }}
      >
        ChatBase Administration Console • Made by HarshGuruJi • www.webguruji.online
      </div>
    </div>
  );
};
