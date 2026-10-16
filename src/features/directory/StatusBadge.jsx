export default function StatusBadge({ status }) {
  const active = status === 'ACTIVE';
  return (
    <span className={`status-badge ${active ? 'status-active' : 'status-inactive'}`}>
      <span />{active ? 'Active' : (status || 'Unknown').toLowerCase()}
    </span>
  );
}
