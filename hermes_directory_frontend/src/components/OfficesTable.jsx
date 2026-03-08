import React, { useState, useEffect } from "react";
import api, { logoutAndRedirect } from "../api/api";
import "../styles/table_admin.css";
import logo from "../assets/img/bc_hermes_logo.svg";

const emptyForm = {
  tower: "",
  number: "",
  owner: "",
  phone: "",
  website: "",
};

export default function OfficesTable() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("owner");
  const [sortDir, setSortDir] = useState("asc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== LOAD DATA =====
  async function loadOffices() {
    try {
      setLoading(true);
      const res = await api.get("offices/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setItems(data);
    } catch (err) {
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffices();
  }, []);

  // ===== FORM HANDLERS =====
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (editingId === null) {
        const res = await api.post("offices/", form);
        setItems((prev) => [...prev, res.data]);
      } else {
        const res = await api.put(`offices/${editingId}/`, form);
        setItems((prev) =>
          prev.map((row) => (row.id === editingId ? res.data : row))
        );
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError("Ошибка сохранения");
    }
  }

  function handleEdit(row) {
    setEditingId(row.id);
    setForm({
      tower: row.tower,
      number: row.number,
      owner: row.owner,
      phone: row.phone,
      website: row.website,
    });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить запись?")) return;

    try {
      await api.delete(`offices/${id}/`);
      setItems((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError("Ошибка удаления");
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
        <form className="input-row" onSubmit={handleSubmit}>
          <input name="tower" placeholder="TOWER" value={form.tower} onChange={handleChange} />
          <input name="number" placeholder="NUMBER" value={form.number} onChange={handleChange} />
          <input name="owner" placeholder="OWNER" value={form.owner} onChange={handleChange} />
          <input name="phone" placeholder="PHONE" value={form.phone} onChange={handleChange} />
          <input name="website" placeholder="WEBSITE" value={form.website} onChange={handleChange} />

          <button className="add-btn">
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
            <button className="cancel-btn" onClick={handleCancel}>
              CANCEL
            </button>
          ) : (
            <div className="actions-col">действия</div>
          )}
        </div>

        <div className="head__line__bottom"></div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
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
                  <button className="btn edit-btn" onClick={() => handleEdit(o)}>EDIT</button>
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

