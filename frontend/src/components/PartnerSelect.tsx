import { useState, useEffect } from 'react';
import { getPartners } from '../services/api';
import type { Partner } from '../types/candidate';

interface PartnerSelectProps {
  onSelect: (partnerId: string) => void;
}

export const PartnerSelect = ({ onSelect }: PartnerSelectProps) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const data = await getPartners();
        setPartners(data);
      } catch (err) {
        console.error('Ошибка загрузки партнёров:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPartners();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    onSelect(id);
  };

  if (loading) {
    return <div className="text-gray-500">Загрузка партнёров...</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Партнёр <span className="text-red-500">*</span>
      </label>
      <select
        value={selectedId}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Выберите партнёра</option>
        {partners.map((partner) => (
          <option key={partner.id} value={partner.id}>
            {partner.name}
          </option>
        ))}
      </select>
    </div>
  );
};