const batches = [
  { name: "CABA · Sample Batch A", students: 60, attendance: 89 },
  { name: "Cyber Security · Sample Batch B", students: 45, attendance: 84 },
  { name: "IT-O Level · Sample Batch C", students: 55, attendance: 92 },
];

export default function BatchSummary() {
  return (
    <div className="batch-summary">
      {batches.map((batch) => (
        <div className="batch-row" key={batch.name}>
          <div className="batch-row-heading">
            <strong>{batch.name}</strong>
            <span>{batch.attendance}%</span>
          </div>

          <p>{batch.students} sample students</p>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${batch.attendance}%` }}
            />
          </div>
        </div>
      ))}

      <p className="muted-note">
        These sample values are illustrative and are not official records.
      </p>
    </div>
  );
}