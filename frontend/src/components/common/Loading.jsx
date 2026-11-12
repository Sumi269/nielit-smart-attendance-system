export default function Loading({ message = "Loading..." }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-spinner" />
      <span>{message}</span>
    </div>
  );
}