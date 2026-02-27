import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OfficesTable from "../components/OfficesTable";

export default function AdminPanel() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Если токена нет — отправляем на главную
    if (!token) {
      navigate("/");
      return;
    }
  }, [navigate]);

  return (
    <div>
      <OfficesTable />
    </div>
  );
}
