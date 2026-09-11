export default function Filters({ filters, onChange, onClear }) {
  const hasActiveFilters = Boolean(filters.date || filters.status);

  return (
    <section className="filters" aria-label="Filter appointments">
      <div className="filter-field">
        <label htmlFor="filter-date">Date</label>
        <input
          id="filter-date"
          type="date"
          value={filters.date}
          onChange={(e) => onChange({ ...filters, date: e.target.value })}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          <option value="">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <button
        type="button"
        className="btn-link"
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        Clear filters
      </button>
    </section>
  );
}
