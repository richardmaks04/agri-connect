import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

function StatCard({ icon, label, value, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    red:     'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-xl border-2 p-4 ${colors[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value ?? '…'}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [analytics, setAnalytics]       = useState(null);
  const [users, setUsers]               = useState([]);
  const [pending, setPending]           = useState([]);
  const [activeTab, setActiveTab]       = useState('overview');
  const [actionMsg, setActionMsg]       = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [analyticsRes, usersRes, pendingRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users?limit=20'),
        api.get('/content?status=pending').catch(() => ({ data: { items: [] } })),
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data.users || []);
      // In a real app you'd have a dedicated pending endpoint
    } catch (_) {}
  };

  const approveContent = async (id) => {
    try {
      await api.put(`/admin/content/${id}/approve`);
      setActionMsg('✅ Content approved and published!');
      loadAll();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (_) {}
  };

  const suspendUser = async (id) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await api.put(`/admin/users/${id}/suspend`);
      setActionMsg('⛔ User suspended.');
      loadAll();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (_) {}
  };

  const ROLE_BADGE = {
    admin:     'bg-red-100 text-red-700',
    expert:    'bg-blue-100 text-blue-700',
    extension: 'bg-purple-100 text-purple-700',
    farmer:    'badge-green',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-800">⚙️ Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform management and analytics</p>
        </div>
        <span className="badge bg-red-100 text-red-700">Admin Access</span>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        {['overview', 'users', 'content'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'overview' ? '📊' : tab === 'users' ? '👥' : '📄'} {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard icon="👥" label="Active Users"     value={analytics?.totalUsers}     color="primary" />
            <StatCard icon="📄" label="Published Articles" value={analytics?.totalContent}  color="blue" />
            <StatCard icon="⏳" label="Pending Review"   value={analytics?.pendingContent}  color="amber" />
            <StatCard icon="❓" label="Community Questions" value={analytics?.totalQuestions} color="primary" />
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">📈 Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => setActiveTab('content')}
                className="btn-secondary text-sm py-3 flex items-center justify-center gap-2">
                ⏳ Review Pending Content ({analytics?.pendingContent || 0})
              </button>
              <button onClick={() => setActiveTab('users')}
                className="btn-secondary text-sm py-3 flex items-center justify-center gap-2">
                👥 Manage Users ({analytics?.totalUsers || 0})
              </button>
              <button onClick={() => navigate('/content/new')}
                className="btn-primary text-sm py-3 flex items-center justify-center gap-2">
                ✍️ Create Content
              </button>
            </div>
          </div>
        </>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Registered Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">State</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{u.profile?.fullName}</td>
                    <td className="py-2.5 pr-4 text-gray-500 text-xs">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge capitalize ${ROLE_BADGE[u.role] || 'badge-gray'}`}>{u.role}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 text-xs">{u.profile?.location?.state || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className={u.isActive ? 'badge-green' : 'badge bg-red-100 text-red-700'}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {u.isActive && u.role !== 'admin' && (
                        <button onClick={() => suspendUser(u._id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline">
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No users found.</p>
            )}
          </div>
        </div>
      )}

      {/* Content moderation tab */}
      {activeTab === 'content' && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Content Moderation</h3>
          {pending.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-600 font-medium">No content pending review</p>
              <p className="text-sm text-gray-400 mt-1">All submitted articles have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(item => (
                <div key={item._id} className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">By {item.author?.name} · {item.contentType}</p>
                      {item.summary && <p className="text-sm text-gray-600 mt-1">{item.summary}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => approveContent(item._id)} className="btn-primary text-xs py-1.5 px-3">
                        ✅ Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
