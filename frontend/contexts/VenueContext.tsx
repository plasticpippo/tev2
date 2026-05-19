import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { venueService, type Venue } from '../services/venueService';
import { isAuthTokenReady } from '../services/apiBase';

interface VenueContextType {
  activeVenue: Venue | null;
  venues: Venue[];
  loading: boolean;
  setActiveVenueById: (id: number) => void;
  refreshVenues: () => Promise<void>;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

const VENUE_STORAGE_KEY = 'activeVenueId';

interface VenueProviderProps {
  children: React.ReactNode;
}

export const VenueProvider: React.FC<VenueProviderProps> = ({ children }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshVenues = useCallback(async () => {
    if (!isAuthTokenReady()) {
      return;
    }
    try {
      setLoading(true);
      const data = await venueService.getVenues();
      setVenues(data);

      const savedId = localStorage.getItem(VENUE_STORAGE_KEY);
      const saved = savedId ? parseInt(savedId, 10) : null;

      const active = data.find((v: Venue) => v.id === saved && v.isActive)
        || data.find((v: Venue) => v.isActive)
        || null;

      if (active) {
        setActiveVenue(active);
        localStorage.setItem(VENUE_STORAGE_KEY, String(active.id));
      }
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVenues();
  }, [refreshVenues]);

  const setActiveVenueById = useCallback((id: number) => {
    const venue = venues.find(v => v.id === id);
    if (venue && venue.isActive) {
      setActiveVenue(venue);
      localStorage.setItem(VENUE_STORAGE_KEY, String(id));
    }
  }, [venues]);

  return (
    <VenueContext.Provider value={{ activeVenue, venues, loading, setActiveVenueById, refreshVenues }}>
      {children}
    </VenueContext.Provider>
  );
};

export function useVenue(): VenueContextType {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
}

export default VenueContext;
