import { apiRequest } from "./api.js";

export const importService = {
  upload(file, options = {}) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("courseId", options.courseId || "");
    formData.append("batchId", options.batchId || "");
    formData.append("academicYear", options.academicYear || "");

    return apiRequest("/imports/students", {
      method: "POST",
      body: formData,
    });
  },
};