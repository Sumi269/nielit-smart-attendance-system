import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ message = "Something went wrong." }) {
  return (
    <div className="error-message" role="alert">
      <AlertCircle size={19} />
      <span>{message}</span>
    </div>
  );
}