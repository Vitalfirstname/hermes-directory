import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Residents from "./pages/Residents";
import AdminPanel from "./pages/AdminPanel";
import ScrollToHash from "./utils/ScrollToHash";


export default function App() {
  return (
    <BrowserRouter>
    <ScrollToHash />
      <Routes>

        {/* Главная страница — публичная + форма логина */}
        <Route path="/" element={<Landing />} />

        {/* Админ-панель — только для авторизованных */}
        <Route path="/admin/panel" element={<AdminPanel />} />

        {/* таблица арендаторов - отдельной страницей */}
        <Route path="/residents" element={<Residents />} />


      </Routes>
    </BrowserRouter>
  );
}
