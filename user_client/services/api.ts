import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically add Bearer token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("user_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
      
      if (typeof window !== "undefined") {
        const refreshToken =
          localStorage.getItem("user_refresh_token") ||
          sessionStorage.getItem("user_refresh_token");

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
              sessionStorage.setItem("user_token", newToken);
              if (localStorage.getItem("user_remember") === "true") {
                localStorage.setItem("user_refresh_token", newRefreshToken);
                sessionStorage.removeItem("user_refresh_token");
              } else {
                sessionStorage.setItem("user_refresh_token", newRefreshToken);
                localStorage.removeItem("user_refresh_token");
              }
              if (response.data.user) {
                sessionStorage.setItem("user_user", JSON.stringify(response.data.user));
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
        sessionStorage.removeItem("user_token");
        sessionStorage.removeItem("user_refresh_token");
        localStorage.removeItem("user_refresh_token");
        sessionStorage.removeItem("user_user");
        localStorage.removeItem("user_remember");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
