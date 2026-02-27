import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function SmoothNavHashLink({ to, className, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const id = to.startsWith("#") ? to.slice(1) : to;

  const onClick = (e) => {
    e.preventDefault();

    // Если мы не на главной — идём на "/#id".
    // ScrollToHash подхватит и плавно докрутит после рендера Landing.
    if (pathname !== "/") {
      navigate(`/#${id}`);
      return;
    }

    // Если мы уже на главной — скроллим сразу
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Обновим URL хешем (без перезагрузки)
    window.history.pushState(null, "", `#${id}`);
  };

  return (
    <a href={`#${id}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
