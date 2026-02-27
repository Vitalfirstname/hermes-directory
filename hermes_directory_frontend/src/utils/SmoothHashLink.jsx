import React from "react";

export default function SmoothHashLink({ to, className, children }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault(); // убираем резкий браузерный jump
        const id = to.startsWith("#") ? to.slice(1) : to;
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `#${id}`); // хеш в URL сохраняем
      }}
    >
      {children}
    </a>
  );
}
