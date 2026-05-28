import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically add Bearer token to requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("admin_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle common responses and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error status is 401 and we haven't already retried the request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("admin_refresh_token");

      if (refreshToken) {
        try {
          // Attempt silent refresh using a raw axios request to avoid interceptors
          const response = await axios.post(
            `${api.defaults.baseURL || "http://localhost:3000"}/auth/refresh`,
            { refreshToken }
          );

          if (response.data?.accessToken) {
            const newToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshToken || refreshToken;

            // Store new tokens
            sessionStorage.setItem("admin_token", newToken);
            localStorage.setItem("admin_refresh_token", newRefreshToken);
            if (response.data.user) {
              sessionStorage.setItem("admin_user", JSON.stringify(response.data.user));
            }

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed in interceptor:", refreshError);
        }
      }

      // If no refresh token or refresh failed, clean up and redirect to login
      sessionStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      sessionStorage.removeItem("admin_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
