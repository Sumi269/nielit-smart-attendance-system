import { useState } from "react";
import { studentService } from "../services/studentService.js";

export default function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadStudents(filters = {}) {
    setLoading(true);
    setError("");

    try {
      const result = await studentService.getAll(filters);
      setStudents(result.students || []);
    } catch (err) {
      setError(err.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  return {
    students,
    setStudents,
    loading,
    error,
    loadStudents,
  };
}