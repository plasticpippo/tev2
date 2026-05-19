import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const getVenues = async (): Promise<Venue[]> => {
  return makeApiRequest(apiUrl('/api/venues'), { headers: getAuthHeaders() });
};

const getVenue = async (id: number): Promise<Venue> => {
  return makeApiRequest(apiUrl(`/api/venues/${id}`), { headers: getAuthHeaders() });
};

const createVenue = async (data: { name: string; address?: string }): Promise<Venue> => {
  const result = await makeApiRequest(apiUrl('/api/venues'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  notifyUpdates();
  return result;
};

const updateVenue = async (id: number, data: { name?: string; address?: string }): Promise<Venue> => {
  const result = await makeApiRequest(apiUrl(`/api/venues/${id}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  notifyUpdates();
  return result;
};

const deactivateVenue = async (id: number): Promise<Venue> => {
  const result = await makeApiRequest(apiUrl(`/api/venues/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  notifyUpdates();
  return result;
};

export const venueService = {
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  deactivateVenue,
};
