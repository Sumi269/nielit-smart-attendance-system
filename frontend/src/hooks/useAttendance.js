import { useState } from "react";
import { attendanceService } from "../services/attendanceService.js";

export default function useAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAttendance(filters = {}) {
    setLoading(true);
    setError("");

    try {
      const result = await attendanceService.getAll(filters);
      setRecords(result.records || []);
    } catch (err) {
      setError(err.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  return {
    records,
    setRecords,
    loading,
    error,
    loadAttendance,
  };
}