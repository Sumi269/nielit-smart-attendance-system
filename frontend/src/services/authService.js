
import { apiRequest } from "./api.js";
import { saveToken, clearToken } from "./api.js";

export const authService = {
  async login(email, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveToken(data.token);
    return data;
  },

  async getMe() {
    return apiRequest("/auth/me");
  },

  logout() {
    clearToken();
  },
};
