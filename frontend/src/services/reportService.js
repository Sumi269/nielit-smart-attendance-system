import { apiRequest } from "./api.js";

export const reportService = {
  getAttendanceReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reports/attendance${query ? `?${query}` : ""}`);
  },
};