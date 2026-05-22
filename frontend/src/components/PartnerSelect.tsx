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
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPartners();
        setPartners(data);
      } catch (e) {
        console.error('Partners error:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(e.target.value);
    onSelect(e.target.value);
  };

  if (loading) {
    return <div>Загрузка партнёров...</div>;
  }

  return (
    <div className="partner-select">
      <label>Партнёр</label>

      <select value={selectedId} onChange={handleChange}>
        <option value="">Выберите партнёра</option>

        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
};