import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { venueService, type Venue } from '../services/venueService';

interface VenuesPageProps {
  onDataUpdate?: () => void;
}

export const VenuesPage: React.FC<VenuesPageProps> = ({ onDataUpdate }) => {
  const { t } = useTranslation('admin');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await venueService.getVenues();
      setVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('venues.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    try {
      await venueService.createVenue({ name: formData.name.trim(), address: formData.address.trim() || undefined });
      setFormData({ name: '', address: '' });
      setShowForm(false);
      fetchVenues();
      onDataUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('venues.errors.createFailed'));
    }
  };

  const handleUpdate = async () => {
    if (!editingVenue || !formData.name.trim()) return;
    try {
      await venueService.updateVenue(editingVenue.id, { name: formData.name.trim(), address: formData.address.trim() || undefined });
      setEditingVenue(null);
      setFormData({ name: '', address: '' });
      fetchVenues();
      onDataUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('venues.errors.updateFailed'));
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await venueService.deactivateVenue(id);
      fetchVenues();
      onDataUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('venues.errors.deactivateFailed'));
    }
  };

  const startEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({ name: venue.name, address: venue.address || '' });
    setShowForm(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingVenue(null);
    setFormData({ name: '', address: '' });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-slate-400">{t('status.loading', { ns: 'common' })}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-400">{t('venues.title')}</h2>
        <button
          onClick={() => { setShowForm(true); setEditingVenue(null); setFormData({ name: '', address: '' }); }}
          className="btn btn-primary"
        >
          {t('venues.addVenue')}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-md">{error}</div>
      )}

      {(showForm || editingVenue) && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 space-y-4">
          <h3 className="text-lg font-semibold">{editingVenue ? t('venues.editVenue') : t('venues.newVenue')}</h3>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('venues.name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder={t('venues.namePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('venues.address')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder={t('venues.addressPlaceholder')}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={editingVenue ? handleUpdate : handleCreate}
              className="bg-amber-600 hover:bg-amber-500 font-bold py-2 px-4 rounded-md transition"
            >
              {editingVenue ? t('buttons.save', { ns: 'common' }) : t('buttons.create', { ns: 'common' })}
            </button>
            <button onClick={cancelForm} className="bg-slate-600 hover:bg-slate-500 font-bold py-2 px-4 rounded-md transition">
              {t('buttons.cancel', { ns: 'common' })}
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700">
              <th className="text-left p-3 text-amber-400 font-semibold">{t('venues.name')}</th>
              <th className="text-left p-3 text-amber-400 font-semibold">{t('venues.address')}</th>
              <th className="text-left p-3 text-amber-400 font-semibold">{t('venues.status')}</th>
              <th className="text-right p-3 text-amber-400 font-semibold">{t('venues.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                <td className="p-3">{venue.name}</td>
                <td className="p-3 text-slate-400">{venue.address || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${venue.isActive ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {venue.isActive ? t('venues.active') : t('venues.inactive')}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => startEdit(venue)}
                    className="text-amber-400 hover:text-amber-300 font-semibold text-sm"
                  >
                    {t('buttons.edit', { ns: 'common' })}
                  </button>
                  {venue.isActive && (
                    <button
                      onClick={() => handleDeactivate(venue.id)}
                      className="text-red-400 hover:text-red-300 font-semibold text-sm"
                    >
                      {t('venues.deactivate')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {venues.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">{t('venues.noVenues')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
