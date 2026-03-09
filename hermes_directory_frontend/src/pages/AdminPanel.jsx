import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import OfficesTable from "../components/OfficesTable";
import api, { logoutAndRedirect } from "../api/api";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const meResponse = await api.get("auth/me/");
        const me = meResponse.data || {};
        const isAdmin = Boolean(me.is_staff || me.is_superuser);

        if (!isAdmin) {
          logoutAndRedirect();
          return;
        }

        setIsChecking(false);
      } catch (error) {
        logoutAndRedirect();
      }
    }

    checkAccess();
  }, [navigate]);

  if (isChecking) {
    return <div style={{ padding: "24px" }}>Проверка доступа...</div>;
  }

  return (
    <div>
      <OfficesTable />
    </div>
  );
}
