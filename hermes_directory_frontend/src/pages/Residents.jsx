import { useEffect, useState } from "react";

import Header from "../components/Header/Header";
import ResidentsTable from "../components/ResidentsTable/ResidentsTable";
import loadOffices from "../api/loadOffices";

export default function Residents() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadOffices(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setOffices(data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Ошибка загрузки офисов", err);
        setError("Ошибка загрузки данных");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <Header />
      <ResidentsTable offices={offices} loading={loading} error={error} />
    </>
  );
}
