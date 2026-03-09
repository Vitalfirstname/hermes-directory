import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return "";
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
  return api
    .post("auth/logout/", {})
    .catch(() => null)
    .finally(() => {
      window.location.href = "/";
    });
}

api.interceptors.request.use((config) => {
  const unsafeMethod = ["post", "put", "patch", "delete"].includes(
    (config.method || "").toLowerCase()
  );
  if (unsafeMethod) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isRefreshRequest = originalRequest?.url?.includes("auth/refresh/");
    const isLoginRequest = originalRequest?.url?.includes("auth/login/");
    const isLogoutRequest = originalRequest?.url?.includes("auth/logout/");

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      isLoginRequest ||
      isLogoutRequest
    ) {
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
      await axios.post(
        "/api/auth/refresh/",
        {},
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );

      processRefreshQueue(null, "refreshed");
      return api(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      await logoutAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { logoutAndRedirect };

export default api;
