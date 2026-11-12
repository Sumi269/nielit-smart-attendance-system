
import { apiRequest } from "./api.js";

export const batchService = {
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/batches${query ? `?${query}` : ""}`);
  },

  create(batch) {
    return apiRequest("/batches", {
      method: "POST",
      body: JSON.stringify(batch),
    });
  },

  update(id, batch) {
    return apiRequest(`/batches/${id}`, {
      method: "PUT",
      body: JSON.stringify(batch),
    });
  },

  deactivate(id) {
    return apiRequest(`/batches/${id}/deactivate`, {
      method: "PATCH",
    });
  },

  enrollStudent(batchId, studentId) {
    return apiRequest(`/batches/${batchId}/students`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    });
  },

  withdrawStudent(batchId, studentId) {
    return apiRequest(`/batches/${batchId}/students/${studentId}`, {
      method: "DELETE",
    });
  },
};
