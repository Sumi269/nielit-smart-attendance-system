import { apiRequest } from "./api.js";

export const attendanceService = {
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/attendance${query ? `?${query}` : ""}`);
  },

  create(record) {
    return apiRequest("/attendance", {
      method: "POST",
      body: JSON.stringify(record),
    });
  },

  getSummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/summary${query ? `?${query}` : ""}`);
  },
};