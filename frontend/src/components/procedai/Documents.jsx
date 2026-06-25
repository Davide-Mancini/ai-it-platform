import "./Documents.css";

const EXT_COLOR = { pdf: "#DC2626", docx: "#2563EB", xlsx: "#059669" };

function DownloadIcon() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>;
}

function formatDate(dt) {
  return dt ? new Date(dt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export default function Documents({ documents, loading }) {
  const cats = ["Tutte", ...new Set(documents.map(d => d.file_type || "Altro").filter(Boolean))];

  return (
    <div className="pai-view pai-docs">
      {/* Sidebar */}
      <div className="pai-docs__sidebar">
        <div className="pai-card pai-docs__cats">
          <div className="pai-docs__cats-label">Categorie</div>
          {cats.map((cat, i) => (
            <div key={cat} className={`pai-docs__cat-item${i === 0 ? " pai-docs__cat-item--active" : ""}`}>
              <span>{cat}</span>
              <span className="pai-docs__cat-count">
                {i === 0 ? documents.length : documents.filter(d => (d.file_type || "Altro") === cat).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="pai-docs__main">
        <div className="pai-card pai-docs__table">
          <div className="pai-docs__table-header">
            <span>Nome documento</span>
            <span>Tipo</span>
            <span>Aggiornato</span>
            <span>Azioni</span>
          </div>

          {loading && (
            <div className="pai-docs__loading">Caricamento documenti…</div>
          )}

          {!loading && documents.length === 0 && (
            <div className="pai-docs__empty">Nessun documento trovato.</div>
          )}

          {documents.map((doc, i) => {
            const ext = doc.file_type?.replace(".", "").toLowerCase() || "doc";
            const color = EXT_COLOR[ext] || "#475569";
            return (
              <div key={doc.id} className="pai-docs__row">
                <div className="pai-docs__row-name">
                  <div className="pai-docs__ext-badge" style={{ color, background: `${color}14` }}>
                    {ext.toUpperCase()}
                  </div>
                  <div>
                    <div className="pai-docs__doc-title">{doc.title}</div>
                    <div className="pai-docs__doc-sub">{doc.content?.slice(0, 60) || "—"}</div>
                  </div>
                </div>
                <span className="pai-docs__row-type">{ext.toUpperCase()}</span>
                <span className="pai-docs__row-date">{formatDate(doc.updated_at || doc.created_at)}</span>
                <div className="pai-docs__row-actions">
                  <button className="pai-docs__action-btn" title="Scarica">
                    <DownloadIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
