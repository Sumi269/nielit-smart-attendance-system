import { Construction } from "lucide-react";

export default function ModulePage({ title, description }) {
  return (
    <section className="module-page">
      <div className="module-icon">
        <Construction size={26} />
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      <div className="module-notice">
        <strong>Frontend development stage</strong>
        <p>
          This module is not connected to real data yet. Its interface,
          validation, and data handling will be implemented next.
        </p>
      </div>
    </section>
  );
}