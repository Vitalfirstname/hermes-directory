import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let isRefreshing = false;
let refreshQueue = [];

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setAuthTokens(access, refresh) {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function processRefreshQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token);
  });

  refreshQueue = [];
}

function logoutAndRedirect() {
  clearAuthTokens();
  window.location.href = "/";
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const refreshToken = getRefreshToken();

    const isRefreshRequest = originalRequest?.url?.includes("auth/refresh/");
    const isLoginRequest = originalRequest?.url?.includes("auth/login/");

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      isLoginRequest
    ) {
      return Promise.reject(error);
    }

    if (!refreshToken) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    isRefreshing = true;

    try {
      const refreshResponse = await axios.post("/api/auth/refresh/", {
        refresh: refreshToken,
      });

      const newAccessToken = refreshResponse.data?.access;
      if (!newAccessToken) {
        throw new Error("No access token in refresh response");
      }

      setAuthTokens(newAccessToken, refreshToken);
      processRefreshQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      logoutAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  logoutAndRedirect,
};

export default api;
