import React, { useState, useEffect } from "react";
import api, { logoutAndRedirect } from "../api/api";
import loadOffices from "../api/loadOffices";
import "../styles/table_admin.css";
import logo from "../assets/img/bc_hermes_logo.svg";
import {
  formatSubscriber,
  OWNER_CONTROLS,
  parseOfficePhone,
  PHONE_CODES,
  validateOfficeForm,
} from "./officeFormValidation";

const emptyForm = {
  tower: "",
  number: "",
  owner: "",
  phoneCode: "",
  phoneDigits: "",
  legacyPhone: "",
  website: "",
};

const officeFields = ["tower", "number", "owner", "phone", "website"];

function errorMessage(value) {
  return (Array.isArray(value) ? value : [value])
    .filter((message) => typeof message === "string" && message.trim())
    .join("\n");
}

function getSaveErrors(error) {
  const response = error.response;
  if (!response) {
    return { general: "Не удалось связаться с сервером. Проверьте подключение и повторите попытку." };
  }
  if (response.status >= 500) {
    return { general: "Сервер не смог сохранить запись. Повторите попытку позже." };
  }

  const apiError = response.data?.error;
  const fallback = errorMessage(apiError?.message) || "Не удалось сохранить запись. Повторите попытку.";
  if (apiError?.code !== "validation_error") return { general: fallback };

  const details = apiError.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return { general: errorMessage(details) || fallback };
  }

  const errors = {};
  for (const [field, value] of Object.entries(details)) {
    const message = errorMessage(value);
    if (!message) continue;
    if (officeFields.includes(field)) errors[field] = message;
    else errors.general = [errors.general, message].filter(Boolean).join("\n");
  }
  return Object.keys(errors).length ? errors : { general: fallback };
}

export default function OfficesTable() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("owner");
  const [sortDir, setSortDir] = useState("asc");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const formDisabled = saving || loading || Boolean(loadError);

  // ===== LOAD DATA =====
  useEffect(() => {
    const controller = new AbortController();
    loadOffices(controller.signal)
      .then((offices) => {
        if (!controller.signal.aborted) setItems(offices);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError("Ошибка загрузки данных");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // ===== FORM HANDLERS =====
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "owner" && OWNER_CONTROLS.test(value)) {
      setFormErrors((prev) => ({ ...prev, owner: "Переносы строк и управляющие символы запрещены." }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name === "phoneCode" ? "phone" : name]: "" }));
  }

  function handleNumberChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setForm((prev) => ({ ...prev, number: digits }));
    setFormErrors((prev) => ({ ...prev, number: "" }));
  }

  function handleOwnerPaste(e) {
    if (OWNER_CONTROLS.test(e.clipboardData.getData("text"))) {
      e.preventDefault();
      setFormErrors((prev) => ({ ...prev, owner: "Переносы строк и управляющие символы запрещены." }));
    }
  }

  function handlePhoneChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 7);
    setForm((prev) => ({ ...prev, phoneDigits: digits, legacyPhone: "" }));
    setFormErrors((prev) => ({ ...prev, phone: "" }));
  }

  function handlePhonePaste(e) {
    const text = e.clipboardData.getData("text");
    if (/^[0-9]{1,7}$/.test(text)) return;
    e.preventDefault();
    const phone = parseOfficePhone(text);
    if (phone) {
      setForm((prev) => ({ ...prev, ...phone, legacyPhone: "" }));
      setFormErrors((prev) => ({ ...prev, phone: "" }));
    } else {
      setFormErrors((prev) => ({ ...prev, phone: "Вставьте номер +375 с допустимым кодом или до семи цифр." }));
    }
  }

  function clearPhone() {
    setForm((prev) => ({ ...prev, phoneCode: "", phoneDigits: "", legacyPhone: "" }));
    setFormErrors((prev) => ({ ...prev, phone: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (formDisabled) return;
    const { errors, payload } = validateOfficeForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    setSaving(true);

    try {
      if (editingId === null) {
        const res = await api.post("offices/", payload);
        setItems((prev) => [...prev, res.data]);
      } else {
        const res = await api.put(`offices/${editingId}/`, payload);
        setItems((prev) =>
          prev.map((row) => (row.id === editingId ? res.data : row))
        );
      }

      setForm(emptyForm);
      setEditingId(null);
      setFormErrors({});
    } catch (error) {
      setFormErrors(getSaveErrors(error));
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(row) {
    const phone = parseOfficePhone(row.phone || "");
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      tower: row.tower ?? "",
      number: row.number ?? "",
      owner: row.owner ?? "",
      website: row.website ?? "",
      legacyPhone: phone ? "" : (row.phone || ""),
      ...phone,
    });
    setFormErrors({});
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить запись?")) return;

    setDeleteError("");
    try {
      await api.delete(`offices/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
    } catch {
      setDeleteError("Ошибка удаления");
    }
  }

  // ===== FILTER + SORT =====
  const filtered = items
    .filter((o) =>
      `${o.tower} ${o.number} ${o.owner} ${o.phone}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  function fieldMessage(name) {
    return formErrors[name] && <span id={`office-${name}-error`} className="office-field-error" role="alert">{formErrors[name]}</span>;
  }

  function fieldAccessibility(name) {
    return {
      "aria-invalid": Boolean(formErrors[name]),
      "aria-describedby": formErrors[name] ? `office-${name}-error` : undefined,
      disabled: formDisabled,
    };
  }

  return (
    <div className="container">
      <div className="add-head">
        {/* LOGO + TITLE + EXIT */}
        <div className="head__top">
          {/*<a href="/">
            <img src={logo} className="head__logo" alt="Гермес" />
          </a>*/}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              logoutAndRedirect();
            }}
          >
            <img src={logo} className="head__logo" alt="Гермес" />
          </a>




          <div className="residents_text">РЕЗИДЕНТЫ</div>

          {/*<a href="/" className="table__exit">выход</a>*/}

          <a
            href="/"
            className="table__exit"
            onClick={(e) => {
              e.preventDefault();
              logoutAndRedirect();
            }}
          >
            ВЫХОД
          </a>


        </div>

        {/* SEARCH PANEL */}
        <div className="top-controls">
          <div className="search_text">поиск</div>

          <input
            type="text"
            className="search-input"
            placeholder="башня, номер, владелец, телефон"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="sort-item-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="tower">башня</option>
            <option value="number">номер</option>
            <option value="owner">владелец</option>
            <option value="phone">телефон</option>
          </select>

          <select
            className="sort-select"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="asc">▲ по возрастанию</option>
            <option value="desc">▼ по убыванию</option>
          </select>
        </div>

        {/* INPUT ROW (ADD / SAVE) */}
        <form className="input-row" onSubmit={handleSubmit} noValidate>
          <div className="office-field">
            <select name="tower" aria-label="Башня" required value={form.tower} onChange={handleChange} {...fieldAccessibility("tower")}>
              <option value="" disabled>TOWER</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
            {fieldMessage("tower")}
          </div>
          <div className="office-field">
            <input type="text" inputMode="numeric" name="number" aria-label="Кабинет" placeholder="NUMBER" required value={form.number} onChange={handleNumberChange} {...fieldAccessibility("number")} />
            {fieldMessage("number")}
          </div>
          <div className="office-field">
            <input name="owner" aria-label="Организация" placeholder="OWNER" required value={form.owner} onChange={handleChange} onPaste={handleOwnerPaste} {...fieldAccessibility("owner")} />
            {fieldMessage("owner")}
          </div>
          <div className="office-field">
            <div className="office-phone">
              <span>+375</span>
              <select name="phoneCode" aria-label="Код телефона" value={form.phoneCode} onChange={handleChange} {...fieldAccessibility("phone")}>
                <option value="">CODE</option>
                {PHONE_CODES.map((code) => <option key={code}>{code}</option>)}
              </select>
              <input type="text" inputMode="numeric" name="phoneDigits" aria-label="Абонентский номер" placeholder="XXX-XX-XX" value={form.legacyPhone || formatSubscriber(form.phoneDigits)} onChange={handlePhoneChange} onPaste={handlePhonePaste} {...fieldAccessibility("phone")} />
              {(form.phoneCode || form.phoneDigits || form.legacyPhone) && (
                <button type="button" onClick={clearPhone} aria-label="Очистить телефон" disabled={saving}>×</button>
              )}
            </div>
            {fieldMessage("phone")}
          </div>
          <div className="office-field">
            <input type="text" inputMode="url" name="website" aria-label="Веб-сайт" placeholder="WEBSITE" value={form.website} onChange={handleChange} {...fieldAccessibility("website")} />
            {fieldMessage("website")}
          </div>

          <button className="add-btn" disabled={formDisabled}>
            {editingId ? "SAVE" : "ADD"}
          </button>
        </form>

        {/* COLUMN TITLES + CANCEL PLACE */}
        <div className="column-head">
          <div>башня</div>
          <div>номер</div>
          <div>владелец</div>
          <div>телефон</div>
          <div>веб-ресурс</div>

          {editingId ? (
            <button className="cancel-btn" onClick={handleCancel} disabled={saving}>
              CANCEL
            </button>
          ) : (
            <div className="actions-col">действия</div>
          )}
        </div>

        <div className="head__line__bottom"></div>
        {formErrors.general && <div className="office-field-error" role="alert">{formErrors.general}</div>}
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        {loading && <div className="cell" role="status">Загрузка данных...</div>}
        {loadError && <div className="cell" role="alert">{loadError}</div>}
        {deleteError && <div className="cell" role="alert">{deleteError}</div>}
        <div className="grid-table">
          {filtered.map((o) => (
            <React.Fragment key={o.id}>
              <div className="cell">{o.tower}</div>
              <div className="cell">{o.number}</div>
              <div className="cell">{o.owner}</div>
              <div className="cell">{o.phone}</div>

              <div className="cell">
                {o.website ? (
                  <a
                    href={o.website.startsWith("http") ? o.website : "http://" + o.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#f1c17f" }}
                  >
                    {o.website}
                  </a>
                ) : "—"}
              </div>

              <div className="cell actions">
                <div className="btn-group">
                  <button className="btn edit-btn" onClick={() => handleEdit(o)} disabled={saving}>EDIT</button>
                  <button className="btn delete-btn" onClick={() => handleDelete(o.id)}>DELETE</button>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <footer>
        <div className="copyright">
          Создание сайта:&nbsp;
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
            _artcore_gallery_
          </a>
          &nbsp; © БЦ «Гермес»
        </div>
      </footer>
    </div>
  );
}

