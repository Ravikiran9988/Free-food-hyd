import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Edit3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { suggestSpotUpdate, fetchSpots } from '../services/api';
import type { SpotSummary } from '../services/api';

export function SuggestUpdate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefilledSpotId = searchParams.get('spot_id') || '';

  const [spotId, setSpotId] = useState(prefilledSpotId);
  const [updateType, setUpdateType] = useState('timing_correction');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [spotsList, setSpotsList] = useState<SpotSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpots({ limit: 100 }).then(data => setSpotsList(data.items)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotId) {
      setError('Please select or specify a food spot.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await suggestSpotUpdate({
        spot_id: spotId,
        update_type: updateType,
        suggested_value: suggestedValue.trim(),
        reason: reason.trim() || undefined,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/explore');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-brand-900 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-brand-700/60 p-2.5 rounded-xl">
              <Edit3 className="w-6 h-6 text-brand-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Suggest a Food Spot Update</h1>
              <p className="text-brand-200 text-xs sm:text-sm">Help the community maintain accurate timings and locations.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-900">Suggestion Received!</h2>
              <p className="text-slate-600 max-w-sm mx-auto">Thank you for contributing. Our moderators will review and apply the update.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Food Spot <span className="text-red-500">*</span>
                </label>
                {spotsList.length > 0 ? (
                  <select
                    value={spotId}
                    onChange={(e) => setSpotId(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  >
                    <option value="">-- Choose a Food Spot --</option>
                    {spotsList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.area_name})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Spot ID or exact name"
                    value={spotId}
                    onChange={(e) => setSpotId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Correction Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="timing_correction">Timing / Schedule Correction</option>
                  <option value="location_correction">Location / Landmark Correction</option>
                  <option value="meal_detail_correction">Meal Details Correction</option>
                  <option value="recurring_schedule">Daily / Recurring Schedule Updates</option>
                  <option value="cancellation">Event Cancelled / Closed</option>
                  <option value="other">Other Information</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Corrected Information <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Serves meals daily at 1:00 PM instead of 12:30 PM..."
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Reason or Source of Information (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spoke to trust organizer / visited today"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Suggestion...</span>
                  </>
                ) : (
                  <span>Submit Suggestion</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
