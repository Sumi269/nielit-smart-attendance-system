
import { apiRequest } from "./api.js";

export const studentService = {
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/students${query ? `?${query}` : ""}`);
  },

  getById(id) {
    return apiRequest(`/students/${encodeURIComponent(id)}`);
  },

  create(student) {
    return apiRequest("/students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  },

  update(id, student) {
    return apiRequest(`/students/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(student),
    });
  },

  deactivate(id) {
    return apiRequest(`/students/${encodeURIComponent(id)}/deactivate`, {
      method: "PATCH",
    });
  },
};
