
import { apiRequest } from "./api.js";

export const courseService = {
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/courses${query ? `?${query}` : ""}`);
  },

  create(course) {
    return apiRequest("/courses", {
      method: "POST",
      body: JSON.stringify(course),
    });
  },

  update(id, course) {
    return apiRequest(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(course),
    });
  },

  deactivate(id) {
    return apiRequest(`/courses/${id}/deactivate`, {
      method: "PATCH",
    });
  },
};
