import { useState, useEffect } from 'react';
import { getPartners } from '../services/api';
import type { Partner } from '../types/candidate';
import '../styles/PartnerSelect.css';

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
    return (
      <div className="partner-loading">
        <div className="partner-loading-spinner" />
        <span>Загрузка партнёров...</span>
      </div>
    );
  }

  return (
    <div className="partner-select">
      <label className="partner-label">
        Партнёр<span className="required">*</span>
      </label>
      <div className="partner-select-wrapper">
        <select
          value={selectedId}
          onChange={handleChange}
          className="partner-dropdown"
        >
          <option value="">Выберите партнёра</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};