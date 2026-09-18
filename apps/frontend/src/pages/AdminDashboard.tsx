import { useState, useEffect } from 'react';
import { 
  fetchStats, 
  fetchAdminSubmissions, 
  moderateSubmission, 
  fetchAdminReports, 
  moderateReport, 
  fetchAdminSuggestedUpdates, 
  moderateSuggestedUpdate,
  loginAdmin
} from '../services/api';
import type { 
  StatsResponse, 
  CommunitySubmissionItem, 
  ReportItem, 
  SuggestedUpdateItem 
} from '../services/api';
import { 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Check, 
  X, 
  Edit3, 
  Clock, 
  ShieldCheck
} from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'reports' | 'updates' | 'stats'>('submissions');
  const [submissions, setSubmissions] = useState<CommunitySubmissionItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [updates, setUpdates] = useState<SuggestedUpdateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await loginAdmin(username, password);
      localStorage.setItem('admin_token', data.access_token);
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  const loadAllData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [statsData, subsData, repsData, upData] = await Promise.all([
        fetchStats(),
        fetchAdminSubmissions('pending'),
        fetchAdminReports('open'),
        fetchAdminSuggestedUpdates('pending')
      ]);
      setStats(statsData);
      setSubmissions(subsData);
      setReports(repsData);
      setUpdates(upData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const handleModerateSub = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await moderateSubmission(id, action);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerateRep = async (id: string, action: 'resolve' | 'dismiss') => {
    setActionLoading(id);
    try {
      await moderateReport(id, action);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerateUp = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await moderateSuggestedUpdate(id, action);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
          </div>
          {loginError && <p className="text-red-600 text-sm mb-4 text-center">{loginError}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" />
            </div>
            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-xl transition-colors">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-brand-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Moderation Console</h1>
            </div>
            <p className="text-slate-500 text-sm">Review community submissions, reports, and suggested updates</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadAllData}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-transparent hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Total Food Spots</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.total_spots.toLocaleString()}</h3>
                <p className="text-xs text-brand-600 font-semibold mt-1">From cleaned dataset</p>
              </div>
              <div className="bg-brand-50 p-3.5 rounded-xl text-brand-600">
                <Database className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Pending Submissions</p>
                <h3 className="text-3xl font-extrabold text-brand-600 mt-1">{submissions.length}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Awaiting approval</p>
              </div>
              <div className="bg-brand-50 p-3.5 rounded-xl text-brand-600">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Open Reports</p>
                <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{reports.length}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Requires review</p>
              </div>
              <div className="bg-amber-50 p-3.5 rounded-xl text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Suggested Updates</p>
                <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{updates.length}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Corrections submitted</p>
              </div>
              <div className="bg-blue-50 p-3.5 rounded-xl text-blue-600">
                <Edit3 className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'submissions'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Pending Submissions</span>
            <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">{submissions.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Reports</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{reports.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'updates'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Suggested Updates</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{updates.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'stats'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Architecture & Policy
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {submissions.length > 0 ? (
              submissions.map(sub => (
                <div key={sub.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded">
                        {sub.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        Submitted on {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{sub.name}</h3>
                    <p className="text-sm text-slate-600">{sub.area_name} {sub.landmark ? `• ${sub.landmark}` : ''}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sub.start_time} - {sub.end_time} {sub.event_date ? `(${sub.event_date})` : '(Recurring/Daily)'}</span>
                    </p>
                    {sub.meal_details ? (
                      <p className="text-xs bg-amber-50 text-amber-900 p-2 rounded-lg mt-2 font-medium">
                        Meal details — Community provided: {sub.meal_details}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">Meal details not provided.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={actionLoading === sub.id}
                      onClick={() => handleModerateSub(sub.id, 'approve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve & Publish
                    </button>
                    <button
                      disabled={actionLoading === sub.id}
                      onClick={() => handleModerateSub(sub.id, 'reject')}
                      className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">No pending submissions</h3>
                <p className="text-slate-500 text-sm">All community submitted food spots have been reviewed.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.map(rep => (
                <div key={rep.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded">
                        {rep.reason.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Report details:</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {rep.details || 'No additional details provided'}
                    </p>
                    <p className="text-xs text-slate-400">Target Spot ID: {rep.spot_id}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={actionLoading === rep.id}
                      onClick={() => handleModerateRep(rep.id, 'resolve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Resolve
                    </button>
                    <button
                      disabled={actionLoading === rep.id}
                      onClick={() => handleModerateRep(rep.id, 'dismiss')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Dismiss
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">No open reports</h3>
                <p className="text-slate-500 text-sm">There are currently no community reports awaiting action.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-4">
            {updates.length > 0 ? (
              updates.map(up => (
                <div key={up.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded">
                        {up.update_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(up.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Suggested Correction:</p>
                    <p className="text-sm text-slate-800 bg-blue-50/50 p-3 rounded-xl border border-blue-100 font-medium">
                      {up.suggested_value}
                    </p>
                    {up.reason && <p className="text-xs text-slate-500">Reason: {up.reason}</p>}
                    <p className="text-xs text-slate-400">Target Spot ID: {up.spot_id}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={actionLoading === up.id}
                      onClick={() => handleModerateUp(up.id, 'approve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Apply Update
                    </button>
                    <button
                      disabled={actionLoading === up.id}
                      onClick={() => handleModerateUp(up.id, 'reject')}
                      className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">No pending suggested updates</h3>
                <p className="text-slate-500 text-sm">All community suggestions have been processed.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              Community Data Provenance & Anti-Abuse Policies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm text-slate-600">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">1. Time-Sensitive Expiry</h4>
                <p>Community confirmations expire after a 3-hour sliding window. Yesterday's feedback cannot falsely mark today's event as currently active.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">2. Anti-Abuse & Rate Limiting</h4>
                <p>Sliding window rate limiters (15 req/min) and voting cooldowns (120s per spot) prevent vote manipulation and bot spamming.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">3. Non-Destructive Submissions</h4>
                <p>Community suggestions and additions enter a moderation queue and never overwrite original verified PostGREST source coordinates without review.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
