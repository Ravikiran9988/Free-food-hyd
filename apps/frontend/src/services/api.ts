const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface CommunityConfirmation {
  confirmed_count: number;
  not_serving_count: number;
  started_late_count: number;
  finished_early_count: number;
  last_confirmation_minutes_ago?: number;
  confirmation_text: string;
  recent_feedback_count?: number;
}

export interface SpotSummary {
  id: string;
  source_id?: string;
  name: string;
  area_name: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  category: string;
  source_type: string;
  google_maps_url?: string;
  interested_count: number;
  report_count: number;
  status: string;
  live_status: 'serving_now' | 'starting_soon' | 'upcoming' | 'expired';
  start_time: string;
  end_time: string;
  start_date?: string;
  is_recurring_or_time_only: boolean;
  meal_detail_preview: string;
  distance_km?: number;
  community_confirmation: CommunityConfirmation;
  created_at: string;
  updated_at: string;
}

export interface MapPoint {
  id: string;
  name: string;
  area_name: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  category: string;
  live_status: string;
  start_time: string;
  end_time: string;
  distance_km?: number;
}

export interface TodaySections {
  serving_now: SpotSummary[];
  starting_soon: SpotSummary[];
  later_today: SpotSummary[];
}

export interface UpcomingDateGroup {
  date: string;
  label: string;
  spots: SpotSummary[];
}

export interface SpotDetail extends SpotSummary {
  events: Array<{
    id: string;
    spot_id: string;
    event_date?: string;
    start_time: string;
    end_time: string;
    start_time_raw?: string;
    end_time_raw?: string;
    duration_hours: number;
    status: string;
    is_recurring_or_time_only: boolean;
    created_at: string;
  }>;
  meal_details: Array<{
    id: string;
    details: string;
    source_type: string;
    created_at: string;
  }>;
  feedbacks: Array<{
    id: string;
    feedback_type: string;
    comment?: string;
    source_type: string;
    created_at: string;
  }>;
  suggested_updates: Array<{
    id: string;
    update_type: string;
    suggested_value: string;
    reason?: string;
    status: string;
    created_at: string;
  }>;
  resolved_meal_details: string;
  meal_provenance_badge: string;
}

export interface PaginatedSpots {
  items: SpotSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CategoryItem {
  name: string;
  slug: string;
  count: number;
}

export interface CommunitySubmissionItem {
  id: string;
  name: string;
  area_name: string;
  landmark?: string;
  category: string;
  event_date?: string;
  start_time: string;
  end_time: string;
  meal_details?: string;
  additional_info?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  created_at: string;
}

export interface ReportItem {
  id: string;
  spot_id: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
}

export interface SuggestedUpdateItem {
  id: string;
  spot_id: string;
  update_type: string;
  suggested_value: string;
  reason?: string;
  status: string;
  created_at: string;
}

export interface StatsResponse {
  total_spots: number;
  total_events: number;
  active_events: number;
  recurring_events: number;
  total_reports: number;
  total_feedbacks: number;
  total_submissions: number;
  total_suggested_updates: number;
}

export async function fetchSpots(params: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  sort?: string;
  lat?: number;
  lon?: number;
}): Promise<PaginatedSpots> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.lat !== undefined && params.lon !== undefined) {
    query.set('lat', params.lat.toString());
    query.set('lon', params.lon.toString());
  }

  const res = await fetch(`${API_BASE_URL}/spots?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch spots: ${res.statusText}`);
  return res.json();
}

export async function fetchMapPoints(params: {
  category?: string;
  status?: string;
  search?: string;
  lat?: number;
  lon?: number;
}): Promise<MapPoint[]> {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.lat !== undefined && params.lon !== undefined) {
    query.set('lat', params.lat.toString());
    query.set('lon', params.lon.toString());
  }

  const res = await fetch(`${API_BASE_URL}/spots/map-points?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch map points: ${res.statusText}`);
  return res.json();
}

export async function fetchTodaySections(coords?: { lat: number; lon: number }): Promise<TodaySections> {
  const query = new URLSearchParams();
  if (coords) {
    query.set('lat', coords.lat.toString());
    query.set('lon', coords.lon.toString());
  }
  const res = await fetch(`${API_BASE_URL}/events/today-sections?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch today sections: ${res.statusText}`);
  return res.json();
}

export async function fetchUpcomingGrouped(limit = 100): Promise<UpcomingDateGroup[]> {
  const res = await fetch(`${API_BASE_URL}/events/upcoming-grouped?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch upcoming grouped: ${res.statusText}`);
  return res.json();
}

export async function fetchSpotById(id: string, coords?: { lat: number; lon: number }): Promise<SpotDetail> {
  const query = new URLSearchParams();
  if (coords) {
    query.set('lat', coords.lat.toString());
    query.set('lon', coords.lon.toString());
  }
  const res = await fetch(`${API_BASE_URL}/spots/${id}?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch spot: ${res.statusText}`);
  return res.json();
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch(`${API_BASE_URL}/categories`);
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
  return res.json();
}

export async function fetchEventSection(type: 'today' | 'upcoming' | 'serving-now' | 'starting-soon', limit = 10): Promise<SpotSummary[]> {
  const res = await fetch(`${API_BASE_URL}/events/${type}?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type} events: ${res.statusText}`);
  return res.json();
}

export async function fetchNearbySpots(lat: number, lon: number, maxDistanceKm = 25, limit = 50): Promise<SpotSummary[]> {
  const res = await fetch(`${API_BASE_URL}/spots/nearby?lat=${lat}&lon=${lon}&max_distance_km=${maxDistanceKm}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch nearby spots: ${res.statusText}`);
  return res.json();
}

export async function submitCommunitySpot(data: {
  name: string;
  area_name: string;
  landmark?: string;
  category: string;
  event_date?: string;
  start_time: string;
  end_time: string;
  meal_details?: string;
  additional_info?: string;
  latitude?: number;
  longitude?: number;
  contact_info?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/community/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit spot: ${res.statusText}`);
  }
  return res.json();
}

export async function submitFeedback(data: {
  spot_id: string;
  event_id?: string;
  feedback_type: string;
  comment?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/community/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit feedback: ${res.statusText}`);
  }
  return res.json();
}

export async function suggestSpotUpdate(data: {
  spot_id: string;
  update_type: string;
  suggested_value: string;
  reason?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/community/suggest-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit update: ${res.statusText}`);
  }
  return res.json();
}

export async function submitReport(data: {
  spot_id: string;
  reason: string;
  details?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/community/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit report: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE_URL}/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

// --- Admin APIs ---

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('ffh_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function fetchAdminSubmissions(status = 'pending'): Promise<CommunitySubmissionItem[]> {
  const res = await fetch(`${API_BASE_URL}/admin/submissions?status=${status}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch submissions: ${res.statusText}`);
  return res.json();
}

export async function moderateSubmission(id: string, action: 'approve' | 'reject', notes?: string) {
  const res = await fetch(`${API_BASE_URL}/admin/submissions/${id}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ action, notes }),
  });
  if (!res.ok) throw new Error(`Failed to moderate submission: ${res.statusText}`);
  return res.json();
}

export async function fetchAdminReports(status = 'open'): Promise<ReportItem[]> {
  const res = await fetch(`${API_BASE_URL}/admin/reports?status=${status}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.statusText}`);
  return res.json();
}

export async function moderateReport(id: string, action: 'resolve' | 'dismiss') {
  const res = await fetch(`${API_BASE_URL}/admin/reports/${id}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`Failed to moderate report: ${res.statusText}`);
  return res.json();
}

export async function fetchAdminSuggestedUpdates(status = 'pending'): Promise<SuggestedUpdateItem[]> {
  const res = await fetch(`${API_BASE_URL}/admin/suggested-updates?status=${status}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch suggested updates: ${res.statusText}`);
  return res.json();
}

export async function moderateSuggestedUpdate(id: string, action: 'approve' | 'reject') {
  const res = await fetch(`${API_BASE_URL}/admin/suggested-updates/${id}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`Failed to moderate suggested update: ${res.statusText}`);
  return res.json();
}

export async function fetchAdminCommunityUpdates(limit = 50): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/admin/community-updates?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch community updates: ${res.statusText}`);
  return res.json();
}

export interface User {
  id: string;
  email: string;
  role: string;
  created_at?: string;
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function authLogin(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.detail || 'Login failed');
  }
  return res.json();
}

export async function authRegister(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.detail || 'Registration failed');
  }
  return res.json();
}

export async function updateUserProfile(data: {
  email?: string;
  current_password?: string;
  new_password?: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update profile');
  }
  return res.json();
}

export async function fetchAdminUsers(search?: string): Promise<User[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE_URL}/admin/users${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
  return res.json();
}

export async function updateAdminUserRole(userId: string, role: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update user role');
  }
  return res.json();
}

export async function deleteAdminUser(userId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete user');
  }
  return res.json();
}


