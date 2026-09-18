import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { submitReport } from '../services/api';

export function ReportInfo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    spot_id: '',
    reason: 'incorrect_location',
    details: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.spot_id.trim()) {
      setError('Please provide the Spot ID or search on the spot details page.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await submitReport({
        spot_id: formData.spot_id.trim(),
        reason: formData.reason,
        details: formData.details.trim(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/explore');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-700 to-amber-800 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600/60 p-2.5 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Report Incorrect Information</h1>
              <p className="text-amber-200 text-xs sm:text-sm">Help keep Free Food Hyderabad accurate and reliable.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-900">Report Submitted!</h2>
              <p className="text-slate-600 max-w-sm mx-auto">Thank you for reporting. Our moderation system has logged this entry.</p>
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
                  Spot ID or Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste Spot ID (found on the spot details URL) or search spot"
                  value={formData.spot_id}
                  onChange={(e) => setFormData({ ...formData, spot_id: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Reason for Report
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="incorrect_location">Incorrect Location / Pin</option>
                  <option value="wrong_time">Wrong Timing / Schedule</option>
                  <option value="closed">Permanently Closed / Cancelled</option>
                  <option value="wrong_details">Wrong Meal Details</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  required
                  placeholder="Please describe what is incorrect and provide the accurate information if you know it..."
                  rows={4}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
