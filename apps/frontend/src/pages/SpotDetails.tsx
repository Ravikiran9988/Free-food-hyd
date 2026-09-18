import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar, 
  Info, 
  Users, 
  AlertTriangle, 
  Navigation, 
  CheckCircle, 
  Loader2, 
  Edit3, 
  ThumbsUp, 
  XCircle, 
  Clock3, 
  Flag 
} from 'lucide-react';
import { fetchSpotById, submitFeedback, submitReport, suggestSpotUpdate } from '../services/api';
import type { SpotDetail } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { MapComponent } from '../components/MapComponent';

export function SpotDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Feedback State
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Suggest Update Form State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateType, setUpdateType] = useState('timing_correction');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  // Report Form State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('wrong_time');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchSpotById(id)
      .then(setSpot)
      .catch((err) => setError(err.message || 'Failed to load spot details'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleQuickFeedback = async (type: string, comment?: string) => {
    if (!spot) return;
    setFeedbackLoading(true);
    setFeedbackMessage(null);
    try {
      await submitFeedback({
        spot_id: spot.id,
        feedback_type: type,
        comment,
      });
      setFeedbackMessage('Thank you for confirming! Your update is live for the community.');
      // Refresh spot data
      const updated = await fetchSpotById(spot.id);
      setSpot(updated);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Could not record feedback');
    } finally {
      setFeedbackLoading(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleSuggestUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot || !suggestedValue.trim()) return;
    setUpdateSubmitting(true);
    try {
      await suggestSpotUpdate({
        spot_id: spot.id,
        update_type: updateType,
        suggested_value: suggestedValue.trim(),
        reason: updateReason.trim() || undefined,
      });
      setUpdateSuccess(true);
      setTimeout(() => {
        setShowUpdateModal(false);
        setUpdateSuccess(false);
        setSuggestedValue('');
        setUpdateReason('');
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to submit suggested update');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot) return;
    setReportSubmitting(true);
    try {
      await submitReport({
        spot_id: spot.id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
        setReportDetails('');
        fetchSpotById(spot.id).then(setSpot);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-slate-500 font-medium">Loading food spot details...</p>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="max-w-3xl mx-auto my-20 text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Spot Not Found</h2>
        <p className="text-slate-500 mb-6">{error || "The food spot you are looking for does not exist or has been removed."}</p>
        <button onClick={() => navigate('/explore')} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
          Browse All Spots
        </button>
      </div>
    );
  }

  const primaryEvent = spot.events && spot.events.length > 0 ? spot.events[0] : null;
  const isRecurring = primaryEvent ? primaryEvent.is_recurring_or_time_only : spot.is_recurring_or_time_only;
  const mapsUrl = spot.google_maps_url || (spot.latitude && spot.longitude ? `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}` : undefined);
  const liveStatus = spot.live_status || spot.status;
  const confirmation = spot.community_confirmation;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header/Hero area */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold tracking-wider text-brand-700 uppercase bg-brand-50 border border-brand-100 px-3 py-1 rounded-md">
                  {spot.category || 'Annadhanam'}
                </span>
                <StatusBadge status={liveStatus} />
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  Source: {spot.source_type === 'imported' ? 'Verified Feed' : 'Community Submission'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 leading-tight">
                {spot.landmark || spot.name || spot.area_name.split(',')[0]}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 flex items-start gap-2 leading-relaxed">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-brand-600" />
                {spot.area_name}
              </p>
            </div>
            
            <div className="hidden md:flex flex-wrap items-center gap-3 shrink-0">
              <button 
                onClick={() => setShowUpdateModal(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-colors"
              >
                <Edit3 className="w-4 h-4 text-brand-600" />
                <span>Suggest Update</span>
              </button>
              {mapsUrl && (
                <a 
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Directions</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* REAL-TIME COMMUNITY CONFIRMATION ACTION BOX */}
          <section className="bg-gradient-to-br from-slate-900 to-brand-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={liveStatus} />
                  <span className="text-xs text-slate-300 font-medium">Recent Updates</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold">
                  {liveStatus === 'expired' ? '⚫ THIS EVENT HAS ENDED' :
                   liveStatus === 'serving_now' ? 'Is this food being served now?' :
                   liveStatus === 'starting_soon' ? 'Is this event still happening?' :
                   'Is this food available today?'}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-brand-300 bg-brand-900/80 px-3 py-1.5 rounded-lg border border-brand-700/50 block">
                  {confirmation?.confirmation_text || 'No recent updates'}
                </span>
              </div>
            </div>

            {feedbackMessage && (
              <div className="mb-4 p-3 bg-brand-500/20 border border-brand-400/40 rounded-xl text-brand-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Confirmation Buttons */}
            {liveStatus === 'serving_now' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  disabled={feedbackLoading}
                  onClick={() => handleQuickFeedback('serving_now')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                  aria-label="Report that the scheduled food event is currently happening"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>👍 Yes, it's happening</span>
                </button>
                <button
                  disabled={feedbackLoading}
                  onClick={() => handleQuickFeedback('not_serving')}
                  className="bg-red-600/80 hover:bg-red-600 text-white p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                  aria-label="Report that the food is not happening"
                >
                  <XCircle className="w-4 h-4" />
                  <span>❌ Not happening</span>
                </button>
                <button
                  disabled={feedbackLoading}
                  onClick={() => handleQuickFeedback('started_late')}
                  className="bg-amber-600/80 hover:bg-amber-600 text-white p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Clock3 className="w-4 h-4" />
                  <span>⏰ Started late</span>
                </button>
                <button
                  disabled={feedbackLoading}
                  onClick={() => handleQuickFeedback('finished_early')}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Flag className="w-4 h-4" />
                  <span>🏁 Finished early</span>
                </button>
              </div>
            ) : liveStatus === 'starting_soon' ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={feedbackLoading}
                  onClick={() => handleQuickFeedback('happening')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  aria-label="Report that the scheduled food event is currently happening"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>👍 Yes, it's happening</span>
                </button>
                <button
                  disabled={feedbackLoading}
                  onClick={() => handleQuickFeedback('cancelled')}
                  className="bg-red-600/80 hover:bg-red-600 text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  aria-label="Report that the food is not happening"
                >
                  <XCircle className="w-4 h-4" />
                  <span>❌ Not happening</span>
                </button>
              </div>
            ) : liveStatus === 'expired' ? (
              <div className="flex flex-col gap-2">
                <p className="text-slate-300 text-sm">
                  This event has concluded. 
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={feedbackLoading}
                  onClick={() => handleQuickFeedback('serving_now')}
                  className="bg-brand-600 hover:bg-brand-700 text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  aria-label="Report that the scheduled food event is currently happening"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>👍 Yes, it's happening</span>
                </button>
                <button
                  disabled={feedbackLoading}
                  onClick={() => setShowUpdateModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Suggest Timing Change</span>
                </button>
              </div>
            )}
          </section>

          {/* Timing Section */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              Schedule & Timings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-600" /> Date Information
                </div>
                <div className="font-semibold text-slate-900 text-base">
                  {isRecurring ? (
                    <span className="text-blue-700">Daily / Recurring Meal</span>
                  ) : (
                    spot.start_date || 'Scheduled Event'
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isRecurring ? 'Runs regularly without fixed expiration' : 'Specific event date'}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-600" /> Serving Hours
                </div>
                <div className="font-semibold text-slate-900 text-base">
                  {spot.start_time} - {spot.end_time}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Indian Standard Time (IST)
                </p>
              </div>
            </div>
          </section>

          {/* Meal Details Section (Strict Provenance) */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-brand-600" />
                Meal Details
              </h2>
              {spot.meal_details && spot.meal_details.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md">
                  {spot.meal_provenance_badge}
                </span>
              )}
            </div>

            {spot.meal_details && spot.meal_details.length > 0 ? (
              <div className="space-y-3">
                {spot.meal_details.map((m) => (
                  <div key={m.id} className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4">
                    <p className="text-slate-800 leading-relaxed font-medium">{m.details}</p>
                    <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
                      <span>{m.source_type === 'community' ? 'Meal details — Community provided' : 'Source Verified'}</span> &bull;
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                <p className="text-slate-600 font-medium italic">Meal details not provided.</p>
                <p className="text-xs text-slate-400 mt-1">Details will appear once confirmed by attendees.</p>
              </div>
            )}
          </section>

          {/* Location Map */}
          {spot.latitude !== 0 && spot.longitude !== 0 && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  Exact Map Location
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
                </span>
              </div>
              <MapComponent spots={[spot as any]} className="h-[320px] w-full rounded-xl z-0" center={[spot.latitude, spot.longitude]} zoom={15} />
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-1">Recent Updates</h3>
            <p className="text-xs text-slate-500 mb-4">Recent updates from people who checked the place.</p>
            
            <div className="space-y-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">People Interested</span>
                </div>
                <span className="font-bold text-slate-900">{spot.interested_count}</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Reports from people</span>
                </div>
                <span className="font-bold text-slate-900">{spot.report_count}</span>
              </div>

              <div className="pt-4 space-y-2.5">
                <button 
                  onClick={() => setShowUpdateModal(true)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4 text-brand-600" />
                  Suggest an Update
                </button>

                <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Report Incorrect Information
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 flex items-center gap-3">
        <button 
          onClick={() => setShowUpdateModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Update</span>
        </button>
        {mapsUrl && (
          <a 
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-[2] flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions</span>
          </a>
        )}
      </div>

      {/* Suggest an Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Suggest an Update</h3>
            <p className="text-xs text-slate-500 mb-4">Help keep timing, location, or food information accurate.</p>

            {updateSuccess ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle className="w-12 h-12 mx-auto" />
                <p className="font-bold">Thank you! Your suggested update has been submitted for review.</p>
              </div>
            ) : (
              <form onSubmit={handleSuggestUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">What needs updating?</label>
                  <select 
                    value={updateType} 
                    onChange={(e) => setUpdateType(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="timing_correction">Timing / Schedule Correction</option>
                    <option value="location_correction">Location / Landmark Correction</option>
                    <option value="meal_detail_correction">Meal Details Correction</option>
                    <option value="recurring_schedule">Daily / Recurring Schedule Updates</option>
                    <option value="cancellation">Event Cancelled / Discontinued</option>
                    <option value="other">Other Information</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Correct Information <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="e.g. The correct timing is 1:00 PM to 3:00 PM every day..."
                    rows={3}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason / Source (Optional)</label>
                  <input 
                    type="text"
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    placeholder="e.g. Visited yesterday and confirmed with organizers"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={updateSubmitting}
                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
                  >
                    {updateSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Incorrect Info Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Report Incorrect Information</h3>
            <p className="text-xs text-slate-500 mb-4">Let us know if location, timing, or details are inaccurate.</p>

            {reportSubmitted ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle className="w-12 h-12 mx-auto" />
                <p className="font-bold">Report submitted for moderation review.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Issue Type</label>
                  <select 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="wrong_location">Wrong Location / Pin</option>
                    <option value="wrong_time">Wrong Timing / Schedule</option>
                    <option value="event_cancelled">Event Cancelled / Closed</option>
                    <option value="duplicate">Duplicate Entry</option>
                    <option value="incorrect_meal_details">Incorrect Meal Details</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Details <span className="text-red-500">*</span></label>
                  <textarea 
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe what needs to be updated or corrected..."
                    rows={3}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={reportSubmitting}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
