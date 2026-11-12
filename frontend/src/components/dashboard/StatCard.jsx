export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "blue",
}) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${color}`}>
          <Icon size={22} />
        </div>
        <span className="demo-badge">DEMO</span>
      </div>

      <p className="stat-title">{title}</p>
      <h2 className="stat-value">{value}</h2>
      <p className="stat-description">{description}</p>
    </article>
  );
}