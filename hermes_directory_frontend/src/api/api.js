import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Подставляем токен в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Если токен просрочен — выкидываем на главную
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/"; // ✔ вход на главной странице
    }
    return Promise.reject(error);
  }
);

export default api;
