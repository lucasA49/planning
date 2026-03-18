import React from 'react';

const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateFr = (date) => {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addWeeks = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
};

const WeekPicker = ({ value, onChange }) => {
  const monday = value ? getMondayOfWeek(value + 'T00:00:00') : getMondayOfWeek(new Date());
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const handlePrev = () => {
    const prev = addWeeks(monday, -1);
    onChange(toISODate(prev));
  };

  const handleNext = () => {
    const next = addWeeks(monday, 1);
    onChange(toISODate(next));
  };

  const handleToday = () => {
    onChange(toISODate(getMondayOfWeek(new Date())));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        onClick={handlePrev}
        style={{
          padding: '6px 12px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        &larr;
      </button>
      <div style={{ textAlign: 'center', minWidth: '200px' }}>
        <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>
          Semaine du {formatDateFr(monday)}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          au {formatDateFr(sunday)}
        </div>
      </div>
      <button
        onClick={handleNext}
        style={{
          padding: '6px 12px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        &rarr;
      </button>
      <button
        onClick={handleToday}
        style={{
          padding: '6px 14px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        Aujourd'hui
      </button>
    </div>
  );
};

export { getMondayOfWeek, toISODate };
export default WeekPicker;
