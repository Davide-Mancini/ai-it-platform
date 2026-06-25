import "./TopBar.css";

const VIEW_TITLES = {
  board: "Sprint board",
  list: "Backlog",
  dashboard: "Panoramica",
};

const VARIANTS = ["soft", "playful", "crisp"];

export default function TopBar({
  view,
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  variant,
  onVariantChange,
  onCreateClick,
}) {
  return (
    <header className="hx-topbar">
      <div className="hx-topbar__title-group">
        <div className="hx-topbar__breadcrumb">AI IT Platform</div>
        <div className="hx-topbar__title">{VIEW_TITLES[view]}</div>
      </div>

      <div className="hx-topbar__spacer" />

      {/* Search */}
      <label className="hx-topbar__search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="hx-topbar__search-icon">
          <circle cx="7" cy="7" r="4.5" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Cerca procedure…"
          className="hx-topbar__search-input"
        />
      </label>

      {/* Priority filter */}
      <select
        value={priorityFilter}
        onChange={e => onPriorityFilterChange(e.target.value)}
        className="hx-topbar__select"
      >
        <option value="all">Tutte le priorità</option>
        <option value="urgent">Urgente</option>
        <option value="high">Alta</option>
        <option value="medium">Media</option>
        <option value="low">Bassa</option>
      </select>

      {/* Variant switcher */}
      <div className="hx-topbar__variant-group">
        <span className="hx-topbar__variant-label">Stile</span>
        <div className="hx-topbar__variant-pills">
          {VARIANTS.map(v => (
            <button
              key={v}
              onClick={() => onVariantChange(v)}
              className={`hx-topbar__variant-pill${variant === v ? " hx-topbar__variant-pill--active" : ""}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Create button */}
      <button className="hx-topbar__create-btn" onClick={onCreateClick}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
        Crea
      </button>
    </header>
  );
}
