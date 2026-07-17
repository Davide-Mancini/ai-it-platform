function HomePage({ onLogout }) {
  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: "#0d1b2a" }}>
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#0d6efd" />
              <path d="M14 24h6l4-10 4 20 4-10h6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="navbar-brand mb-0 fw-bold">AI IT Platform</span>
          </div>
          <button
            className="btn btn-outline-light btn-sm ms-auto"
            onClick={onLogout}
          >
            Esci
          </button>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <h2 className="fw-bold mb-2">Benvenuto nella piattaforma</h2>
            <p className="text-muted">Questa è la homepage. I contenuti verranno aggiunti qui.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
