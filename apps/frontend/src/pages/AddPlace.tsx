import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { submitCommunitySpot } from '../services/api';
import { LocationPicker } from '../components/LocationPicker';

export function AddPlace() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    area_name: '',
    landmark: '',
    category: 'Annadhanam',
    start_time: '12:30 PM',
    end_time: '02:30 PM',
    event_date: '',
    meal_details: '',
    contact_info: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Annadhanam',
    'Temple Meals',
    'Community Meals',
    'Daily Free Food',
    'Free Meal Distribution',
    'Special Events',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.latitude === null || formData.longitude === null) {
      setError("Please select a valid location on the map.");
      setIsSubmitting(false);
      return;
    }

    if (
      formData.latitude < 17.1 || formData.latitude > 17.7 ||
      formData.longitude < 78.1 || formData.longitude > 78.9
    ) {
      if (!window.confirm("The selected location seems to be outside the Greater Hyderabad area. Are you sure you want to submit?")) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await submitCommunitySpot({
        name: formData.name.trim() || formData.area_name.trim(),
        area_name: formData.area_name.trim(),
        landmark: formData.landmark.trim() || undefined,
        category: formData.category,
        start_time: formData.start_time,
        end_time: formData.end_time,
        event_date: formData.event_date.trim() || undefined,
        meal_details: formData.meal_details.trim() || undefined,
        contact_info: formData.contact_info.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/explore');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit food spot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-800 to-brand-900 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-brand-700/60 p-2.5 rounded-xl">
              <PlusCircle className="w-6 h-6 text-brand-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Add a Free Food Spot</h1>
              <p className="text-brand-200 text-xs sm:text-sm">Contribute a free meal or distribution spot to help the Hyderabad community.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-900">Submission Received!</h2>
              <p className="text-slate-600 max-w-sm mx-auto">Thank you for helping others. Your submission has been saved and will appear after moderation.</p>
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
                  Place / Temple / Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Venkateswara Temple or Daily Langar Hall"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <LocationPicker 
                  value={formData.latitude !== null && formData.longitude !== null 
                    ? { lat: formData.latitude, lon: formData.longitude } 
                    : null}
                  onChange={(pos) => setFormData({ ...formData, latitude: pos.lat, longitude: pos.lon })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Area Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ameerpet, Secunderabad, Kukatpally"
                    value={formData.area_name}
                    onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite Metro Pillar 1042"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12:30 PM"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 02:30 PM"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Specific Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Meal Details (Optional)
                </label>
                <textarea
                  placeholder="e.g. Full meals with Rice, Sambar, Sweet / Prashadam (leave blank if unknown)"
                  rows={3}
                  value={formData.meal_details}
                  onChange={(e) => setFormData({ ...formData, meal_details: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
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
                    <span>Submitting Spot...</span>
                  </>
                ) : (
                  <span>Submit for Community Verification</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
