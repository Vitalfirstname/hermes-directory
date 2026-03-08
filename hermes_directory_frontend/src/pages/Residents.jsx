import { useEffect, useState } from "react";

import Header from "../components/Header/Header";
import ResidentsTable from "../components/ResidentsTable/ResidentsTable";
import api from "../api/api";

export default function Residents() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("offices/")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setOffices(data);
      })
      .catch((err) => {
        console.error("Ошибка загрузки офисов", err);
        setError("Ошибка загрузки данных");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header />
      <ResidentsTable offices={offices} loading={loading} error={error} />
    </>
  );
}
