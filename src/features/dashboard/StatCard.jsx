export default function StatCard({ icon: Icon, label, value, detail, tone, loading }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${tone}`}><Icon size={19} strokeWidth={1.8} /></div>
        <span className="stat-period">All time</span>
      </div>
      <div className="mt-5">
        <div className="stat-value">{loading ? <span className="loading-line" /> : (value ?? '—')}</div>
        <div className="mt-1 text-sm font-medium text-ink">{label}</div>
        <div className="mt-1 text-xs text-muted">{detail}</div>
      </div>
    </div>
  );
}
