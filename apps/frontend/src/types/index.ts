export type Category = 
  | 'Annadhanam' 
  | 'Temple Meals' 
  | 'Community Meals' 
  | 'Daily Free Food' 
  | 'Free Meal Distribution' 
  | 'Special Events';

export type SpotStatus = 'active' | 'upcoming' | 'expired' | 'recurring_time_only';

export interface Spot {
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
  status: SpotStatus;
  start_time: string;
  end_time: string;
  start_date?: string;
  is_recurring_or_time_only: boolean;
  meal_detail_preview: string;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}
