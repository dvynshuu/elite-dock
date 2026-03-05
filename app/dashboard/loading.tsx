export default function DashboardLoading() {
  return (
    <div className="p-4">
      <div className="placeholder-glow mb-4">
        <span className="placeholder col-4" style={{ height: 36 }} />
      </div>
      <div className="row g-3 mb-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="col-md-4">
            <div className="placeholder-glow card border-0 shadow-sm p-4">
              <span className="placeholder col-8 mb-3" />
              <span className="placeholder col-4" />
            </div>
          </div>
        ))}
      </div>
      <div className="row g-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="col-md-6 col-xl-4">
            <div className="placeholder-glow card border-0 shadow-sm p-4" style={{ minHeight: 220 }}>
              <span className="placeholder col-7 mb-2" />
              <span className="placeholder col-5 mb-2" />
              <span className="placeholder col-10 mb-2" />
              <span className="placeholder col-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
