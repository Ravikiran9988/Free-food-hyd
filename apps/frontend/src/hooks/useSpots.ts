import { useState, useEffect, useCallback } from 'react';
import { fetchSpots, fetchNearbySpots, fetchCategories, fetchMapPoints } from '../services/api';
import type { CategoryItem, SpotSummary, MapPoint } from '../services/api';

interface UseSpotsOptions {
  initialSearch?: string;
  initialCategory?: string;
  initialStatus?: string;
  initialPage?: number;
  limit?: number;
}

export function useSpots({
  initialSearch = '',
  initialCategory = 'all',
  initialStatus = 'all',
  initialPage = 1,
  limit = 20
}: UseSpotsOptions = {}) {
  const [spots, setSpots] = useState<SpotSummary[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const loadSpots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (userLocation && status === 'near_me') {
        const [spotsData, mapData] = await Promise.all([
          fetchNearbySpots(userLocation.lat, userLocation.lon, 25, 50),
          fetchMapPoints({ lat: userLocation.lat, lon: userLocation.lon })
        ]);
        setSpots(spotsData);
        setMapPoints(mapData);
        setTotal(spotsData.length);
        setPages(1);
      } else {
        const [spotsData, mapData] = await Promise.all([
          fetchSpots({
            page,
            limit,
            category,
            status,
            search,
            lat: userLocation?.lat,
            lon: userLocation?.lon,
          }),
          fetchMapPoints({
            category,
            status,
            search,
            lat: userLocation?.lat,
            lon: userLocation?.lon,
          })
        ]);
        setSpots(spotsData.items);
        setMapPoints(mapData);
        setTotal(spotsData.total);
        setPages(spotsData.pages);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading spots');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, category, status, search, userLocation]);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        (err) => {
          console.warn('Geolocation denied or failed, using Hyderabad center:', err);
          setUserLocation({ lat: 17.3850, lon: 78.4867 });
        }
      );
    } else {
      setUserLocation({ lat: 17.3850, lon: 78.4867 });
    }
  };

  return {
    spots,
    mapPoints,
    total,
    page,
    pages,
    setPage,
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    categories,
    isLoading,
    error,
    userLocation,
    requestLocation,
    refresh: loadSpots,
  };
}
