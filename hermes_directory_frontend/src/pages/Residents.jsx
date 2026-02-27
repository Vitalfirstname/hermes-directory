import { useEffect, useState } from "react";
import Header from "../components/Header/Header";
import ResidentsTable from "../components/ResidentsTable/ResidentsTable";
import api from "../api/api";


export default function Residents() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("offices/")
      .then(res => {
        setOffices(res.data);
      })
      .catch(err => {
        console.error("Ошибка загрузки офисов", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header />
      <ResidentsTable
        offices={offices}
        loading={loading}
      />
    </>
  );
}
