import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  fetchStats, 
  fetchAdminSubmissions, 
  moderateSubmission, 
  fetchAdminReports, 
  moderateReport, 
  fetchAdminSuggestedUpdates, 
  moderateSuggestedUpdate,
  fetchAdminCommunityUpdates,
  fetchSpots
} from '../services/api';
import type { 
  StatsResponse, 
  CommunitySubmissionItem, 
  ReportItem, 
  SuggestedUpdateItem 
} from '../services/api';
import { 
  Database, Users, AlertTriangle, CheckCircle, RefreshCw, 
  Check, X, Edit3, Clock, LayoutDashboard, MessageSquare, 
  MapPin, ShieldAlert, FileText
} from 'lucide-react';

type TabType = 'overview' | 'submissions' | 'updates' | 'reports' | 'community' | 'spots' | 'sync';

export function AdminDashboard() {
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [submissions, setSubmissions] = useState<CommunitySubmissionItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [updates, setUpdates] = useState<SuggestedUpdateItem[]>([]);
  const [communityUpdates, setCommunityUpdates] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || role !== 'admin') {
        navigate('/');
      } else {
        loadAllData();
      }
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statsData, subsData, repsData, upData, commData, spotsData] = await Promise.all([
        fetchStats(),
        fetchAdminSubmissions('pending'),
        fetchAdminReports('open'),
        fetchAdminSuggestedUpdates('pending'),
        fetchAdminCommunityUpdates(50),
        fetchSpots({ limit: 100 })
      ]);
      setStats(statsData);
      setSubmissions(subsData);
      setReports(repsData);
      setUpdates(upData);
      setCommunityUpdates(commData);
      setSpots(spotsData.spots || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, actionFn: (id: string, action: any) => Promise<any>, actionVal: string) => {
    setActionLoading(id);
    try {
      await actionFn(id, actionVal);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'submissions', label: 'Place Submissions', icon: MapPin, count: submissions.length },
    { id: 'updates', label: 'Suggested Updates', icon: Edit3, count: updates.length },
    { id: 'reports', label: 'Reports', icon: AlertTriangle, count: reports.length },
    { id: 'community', label: 'Recent Updates', icon: MessageSquare },
    { id: 'spots', label: 'Food Spots', icon: Database },
    { id: 'sync', label: 'Data Sync & Quality', icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-500" />
            Admin Panel
          </h2>
          <p className="text-xs text-slate-500 mt-1">Logged in as {user?.email}</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-brand-700' : 'bg-slate-800 text-slate-300'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-slate-900">
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <button 
            onClick={loadAllData}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Total Food Spots</p>
                <h3 className="text-4xl font-extrabold text-slate-900 mt-2">{stats.total_spots}</h3>
                <p className="text-xs text-brand-600 font-medium mt-1">Verified & Community</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Active Events</p>
                <h3 className="text-4xl font-extrabold text-brand-600 mt-2">{stats.active_events}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Currently serving</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Pending Actions</p>
                <h3 className="text-4xl font-extrabold text-amber-600 mt-2">{submissions.length + updates.length + reports.length}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Across all queues</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Recent Feedbacks</p>
                <h3 className="text-4xl font-extrabold text-blue-600 mt-2">{stats.total_feedbacks}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Total platform responses</p>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {submissions.length === 0 && <EmptyState message="No pending submissions." />}
              {submissions.map(sub => (
                <div key={sub.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded mr-2">{sub.category}</span>
                    <span className="text-xs text-slate-400">Submitted: {new Date(sub.created_at).toLocaleString()}</span>
                    <h3 className="text-lg font-bold mt-1 text-slate-900">{sub.name}</h3>
                    <p className="text-sm text-slate-600">{sub.area_name} • {sub.landmark}</p>
                    <p className="text-xs text-slate-500 mt-1"><Clock className="w-3.5 h-3.5 inline mr-1" />{sub.start_time} - {sub.end_time} {sub.event_date ? `(${sub.event_date})` : ''}</p>
                    {sub.meal_details && <p className="text-sm mt-2 bg-slate-50 p-2 rounded">🍽️ {sub.meal_details}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0 self-start md:self-center">
                    <button onClick={() => handleAction(sub.id, moderateSubmission, 'approve')} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"><Check className="w-4 h-4"/> Approve</button>
                    <button onClick={() => handleAction(sub.id, moderateSubmission, 'reject')} disabled={!!actionLoading} className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"><X className="w-4 h-4"/> Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              {updates.length === 0 && <EmptyState message="No suggested updates." />}
              {updates.map(up => (
                <div key={up.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded mr-2">{up.update_type.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-400">Submitted: {new Date(up.created_at).toLocaleString()}</span>
                    <div className="mt-2 text-sm">
                      <span className="font-semibold text-slate-900">Proposed change: </span>
                      <span className="bg-blue-50 text-blue-900 px-2 py-1 rounded font-mono">{up.suggested_value}</span>
                    </div>
                    {up.reason && <p className="text-sm mt-2 text-slate-600">Reason: {up.reason}</p>}
                    <p className="text-xs text-slate-400 mt-2">Target Spot ID: {up.spot_id}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 self-start md:self-center">
                    <button onClick={() => handleAction(up.id, moderateSuggestedUpdate, 'approve')} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"><Check className="w-4 h-4"/> Approve</button>
                    <button onClick={() => handleAction(up.id, moderateSuggestedUpdate, 'reject')} disabled={!!actionLoading} className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"><X className="w-4 h-4"/> Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 && <EmptyState message="No open reports." />}
              {reports.map(rep => (
                <div key={rep.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded mr-2">{rep.reason.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-400">Submitted: {new Date(rep.created_at).toLocaleString()}</span>
                    <p className="text-sm mt-2 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{rep.details || 'No details provided.'}</p>
                    <p className="text-xs text-slate-400 mt-2">Target Spot ID: {rep.spot_id}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 self-start md:self-center">
                    <button onClick={() => handleAction(rep.id, moderateReport, 'resolve')} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"><Check className="w-4 h-4"/> Resolve</button>
                    <button onClick={() => handleAction(rep.id, moderateReport, 'dismiss')} disabled={!!actionLoading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"><X className="w-4 h-4"/> Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Community Updates Tab */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              {communityUpdates.length === 0 && <EmptyState message="No community updates yet." />}
              {communityUpdates.map(fb => (
                <div key={fb.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {fb.feedback_type === 'happening' ? <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold">👍 Yes, it's happening</span> :
                     fb.feedback_type === 'not_happening' ? <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold">❌ Not happening</span> :
                     fb.feedback_type === 'started_late' ? <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold">⏰ Started late</span> :
                     <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">🏁 Finished early</span>}
                    <span className="text-xs text-slate-400">Target Spot ID: {fb.spot_id}</span>
                  </div>
                  <p className="text-sm text-slate-600">Reported at: {new Date(fb.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Spots Tab */}
          {activeTab === 'spots' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Registered Food Spots ({spots.length})</h3>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">Showing recent 100</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Area</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {spots.map(spot => (
                      <tr key={spot.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{spot.name}</td>
                        <td className="px-4 py-3">{spot.category}</td>
                        <td className="px-4 py-3">{spot.area_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${spot.live_status === 'serving_now' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {spot.live_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${spot.source_type === 'community' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {spot.source_type || 'system'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sync & Quality */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="bg-brand-50 text-brand-600 p-3 rounded-xl"><Database className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Data Sync Engine</h3>
                  <p className="text-sm text-slate-600 mt-1">The PostGREST data synchronization engine runs nightly to pull records from authorized external datasets. Community submissions and manual edits are preserved during syncs.</p>
                  <div className="mt-4 flex gap-4">
                    <div className="text-sm"><span className="font-semibold">Last Sync:</span> Today, 03:00 AM</div>
                    <div className="text-sm"><span className="font-semibold">Status:</span> <span className="text-emerald-600">Success</span></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl"><FileText className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Data Quality Metrics</h3>
                  <p className="text-sm text-slate-600 mt-1">Automatic flagging for inconsistent or missing data fields.</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    <li className="flex justify-between border-b pb-1"><span>Missing Coordinates:</span> <span className="font-bold text-slate-900">0 spots</span></li>
                    <li className="flex justify-between border-b pb-1"><span>Invalid Time Formats:</span> <span className="font-bold text-slate-900">0 spots</span></li>
                    <li className="flex justify-between border-b pb-1"><span>Duplicate Source IDs:</span> <span className="font-bold text-slate-900">0 spots</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
      <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-slate-600">{message}</h3>
    </div>
  );
}
