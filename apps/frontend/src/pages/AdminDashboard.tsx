import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Database,
  Edit3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminCommunityUpdates,
  fetchAdminReports,
  fetchAdminSuggestedUpdates,
  fetchAdminSubmissions,
  fetchStats,
  moderateReport,
  moderateSubmission,
  moderateSuggestedUpdate,
} from '../services/api';
import type {
  CommunitySubmissionItem,
  ReportItem,
  SuggestedUpdateItem,
  StatsResponse,
} from '../services/api';

type Tab = 'overview' | 'submissions' | 'reports' | 'updates' | 'activity';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [submissions, setSubmissions] = useState<CommunitySubmissionItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [updates, setUpdates] = useState<SuggestedUpdateItem[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, submissionsData, reportsData, updatesData, activityData] =
        await Promise.all([
          fetchStats(),
          fetchAdminSubmissions('pending'),
          fetchAdminReports('open'),
          fetchAdminSuggestedUpdates('pending'),
          fetchAdminCommunityUpdates(50),
        ]);

      setStats(statsData);
      setSubmissions(submissionsData);
      setReports(reportsData);
      setUpdates(updatesData);
      setActivity(activityData);
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.message?.includes('403')) {
        setError('Your admin session is no longer valid. Please sign in again.');
      } else {
        setError(err?.message || 'Unable to load admin data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setActionLoading(id);
    try {
      await action();
      await loadAllData();
    } catch (err: any) {
      setError(err?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'submissions', label: 'Submissions', count: submissions.length },
    { id: 'reports', label: 'Reports', count: reports.length },
    { id: 'updates', label: 'Suggested Updates', count: updates.length },
    { id: 'activity', label: 'Recent Activity' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-brand-600" />
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Moderate community content and monitor data quality.
              </p>
              {user?.email && (
                <p className="text-xs text-slate-400 mt-2">{user.email} · Administrator</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAllData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <nav className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Metric icon={<Database />} label="Food Spots" value={stats?.total_spots} />
              <Metric icon={<Activity />} label="Active Events" value={stats?.active_events} />
              <Metric icon={<Users />} label="Pending Submissions" value={stats?.total_submissions} />
              <Metric icon={<AlertTriangle />} label="Open Reports" value={stats?.total_reports} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Metric icon={<Edit3 />} label="Pending Updates" value={stats?.total_suggested_updates} />
              <Metric icon={<CheckCircle />} label="Community Updates" value={stats?.total_feedbacks} />
              <Metric icon={<Activity />} label="Recurring / Time-only" value={stats?.recurring_events} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900">What needs attention?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <ActionSummary title="Submissions" count={submissions.length} onClick={() => setActiveTab('submissions')} />
                <ActionSummary title="Reports" count={reports.length} onClick={() => setActiveTab('reports')} />
                <ActionSummary title="Suggested Updates" count={updates.length} onClick={() => setActiveTab('updates')} />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'submissions' && (
          <ModerationList
            title="Pending Place Submissions"
            empty="No pending submissions."
            items={submissions}
            render={(sub) => (
              <>
                <div>
                  <Badge>{sub.category}</Badge>
                  <h3 className="font-bold text-slate-900 mt-2">{sub.name}</h3>
                  <p className="text-sm text-slate-600">{sub.area_name}{sub.landmark ? ` · ${sub.landmark}` : ''}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub.start_time} – {sub.end_time}{sub.event_date ? ` · ${sub.event_date}` : ' · Recurring / date not provided'}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {sub.meal_details ? `Meal details — community provided: ${sub.meal_details}` : 'Meal details not provided.'}
                  </p>
                </div>
                <Actions
                  loading={actionLoading === sub.id}
                  approveLabel="Approve & Publish"
                  onApprove={() => runAction(sub.id, () => moderateSubmission(sub.id, 'approve'))}
                  onReject={() => runAction(sub.id, () => moderateSubmission(sub.id, 'reject'))}
                />
              </>
            )}
          />
        )}

        {activeTab === 'reports' && (
          <ModerationList
            title="Open Reports"
            empty="No open reports."
            items={reports}
            render={(rep) => (
              <>
                <div>
                  <Badge tone="amber">{rep.reason.replaceAll('_', ' ')}</Badge>
                  <p className="text-sm text-slate-700 mt-2">{rep.details || 'No additional details provided.'}</p>
                  <p className="text-xs text-slate-400 mt-2">Spot ID: {rep.spot_id}</p>
                </div>
                <Actions
                  loading={actionLoading === rep.id}
                  approveLabel="Resolve"
                  rejectLabel="Dismiss"
                  onApprove={() => runAction(rep.id, () => moderateReport(rep.id, 'resolve'))}
                  onReject={() => runAction(rep.id, () => moderateReport(rep.id, 'dismiss'))}
                />
              </>
            )}
          />
        )}

        {activeTab === 'updates' && (
          <ModerationList
            title="Suggested Updates"
            empty="No pending suggested updates."
            items={updates}
            render={(up) => (
              <>
                <div>
                  <Badge tone="blue">{up.update_type.replaceAll('_', ' ')}</Badge>
                  <p className="font-semibold text-slate-900 mt-2">{up.suggested_value}</p>
                  {up.reason && <p className="text-sm text-slate-600 mt-1">{up.reason}</p>}
                  <p className="text-xs text-slate-400 mt-2">Spot ID: {up.spot_id}</p>
                </div>
                <Actions
                  loading={actionLoading === up.id}
                  approveLabel="Apply Update"
                  onApprove={() => runAction(up.id, () => moderateSuggestedUpdate(up.id, 'approve'))}
                  onReject={() => runAction(up.id, () => moderateSuggestedUpdate(up.id, 'reject'))}
                />
              </>
            )}
          />
        )}

        {activeTab === 'activity' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Recent Community Activity</h2>
              <p className="text-sm text-slate-500 mt-1">Recent reports from people about whether scheduled food is happening.</p>
            </div>
            {activity.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No recent activity.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activity.map(item => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{formatFeedback(item.feedback_type)}</p>
                      <p className="text-xs text-slate-500">Spot ID: {item.spot_id}</p>
                    </div>
                    <time className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide font-bold text-slate-400">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {value === undefined ? '—' : value.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      </div>
    </div>
  );
}

function ActionSummary({ title, count, onClick }: { title: string; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50/40 transition-colors">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
      <p className="text-xs text-brand-600 mt-1">Review now →</p>
    </button>
  );
}

function ModerationList<T extends { id: string }>({
  title,
  empty,
  items,
  render,
}: {
  title: string;
  empty: string;
  items: T[];
  render: (item: T) => ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          {empty}
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {render(item)}
          </div>
        ))
      )}
    </section>
  );
}

function Actions({
  loading,
  approveLabel,
  rejectLabel = 'Reject',
  onApprove,
  onReject,
}: {
  loading: boolean;
  approveLabel: string;
  rejectLabel?: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex gap-2 shrink-0">
      <button
        disabled={loading}
        onClick={onApprove}
        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
      >
        <Check className="w-4 h-4" /> {approveLabel}
      </button>
      <button
        disabled={loading}
        onClick={onReject}
        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
      >
        <X className="w-4 h-4" /> {rejectLabel}
      </button>
    </div>
  );
}

function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'amber' | 'blue' }) {
  const classes = {
    green: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-800',
    blue: 'bg-blue-50 text-blue-800',
  };
  return <span className={`inline-flex text-xs font-bold uppercase px-2.5 py-1 rounded-lg ${classes[tone]}`}>{children}</span>;
}

function formatFeedback(type: string) {
  const labels: Record<string, string> = {
    serving_now: '👍 Yes, it is happening',
    happening: '👍 Yes, it is happening',
    not_serving: '❌ Not happening',
    cancelled: '❌ Not happening',
    started_late: '⏰ Started late',
    finished_early: '🏁 Finished early',
  };
  return labels[type] || type.replaceAll('_', ' ');
}
