import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function AdminLogin() {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("auth/login/", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.access);
      navigate("/admin/panel");
    } catch (err) {
      setError("Неверный логин или пароль");
    }
  }

  return (
    <div style={{ width: "300px", margin: "80px auto" }}>
      <h2>Администрация</h2>

      <form onSubmit={handleLogin}>
        <input
          placeholder="Логин"
          value={username}
          onChange={(e) => setUser(e.target.value)}
        /><br/><br/>

        <input
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPass(e.target.value)}
        /><br/><br/>

        <button>Войти</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
