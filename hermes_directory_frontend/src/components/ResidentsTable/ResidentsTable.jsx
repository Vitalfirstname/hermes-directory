import styles from "./ResidentsTable.module.css";
import { useEffect, useState, Fragment, useMemo } from "react";
import api from "../../api/api";

export default function ResidentsTable() {

  const [offices, setOffices] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("tower");
  const [sortOrder, setSortOrder] = useState("asc");
  const [limit, setLimit] = useState(15);




  // ===== DATA LOAD =====
  useEffect(() => {
    api.get("/offices/")
      .then((res) => {
        console.log("STATUS:", res.status);
        console.log("DATA:", res.data);

        // если DRF с пагинацией:
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results ?? [];

        setOffices(data);
      })
      .catch((err) => {
        console.error("API ERROR:", err);
      });
  }, []);

  // ===== FILTER =====
  const filteredOffices = useMemo(() => {
    if (!search.trim()) return offices;

    const query = search.toLowerCase();

    return offices.filter((office) =>
      [office.tower, office.number, office.owner, office.phone]
        .filter(Boolean)
        .some((field) =>
          field.toString().toLowerCase().includes(query)
        )
    );
  }, [search, offices]);

  // ===== SORT =====

  const sortedOffices = useMemo(() => {
    const sorted = [...filteredOffices];

    sorted.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();

      if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
      if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredOffices, sortField, sortOrder]);

  const visibleOffices = useMemo(() => {
    if (limit === "all") return sortedOffices;
    return sortedOffices.slice(0, limit);
  }, [sortedOffices, limit]);





  // ===== RENDER =====


  return (
    <section className={styles.table_public} id="table_public">
      <div className={styles.container}>
        {/* FIXED HEAD */}
        <div className={styles.addHead}>
          {/* SEARCH PANEL */}
          <div className={styles.topControls}>
            <div className={styles.residents_text}>РЕЗИДЕНТЫ</div>

            <div className={styles.search_text}>поиск:</div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="башня, номер, владелец, телефон"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className={styles.search_text}>сортировка списка:</div>

            <select
              className={styles.sortItemSelect}
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="tower">башня</option>
              <option value="number">номер</option>
              <option value="owner">владелец</option>
              <option value="phone">телефон</option>
            </select>

            <select
              className={styles.sortSelect}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">▲ по возрастанию</option>
              <option value="desc">▼ по убыванию</option>
            </select>

            <div className={styles.tablePagination}>
              <span className={styles.paginationLabel}>список</span>
              <button className={styles.pageSizeBtn15} onClick={() => setLimit(15)}>15</button>
              <button className={styles.pageSizeBtnAll} onClick={() => setLimit("all")}>Все</button>
            </div>
          </div>

          {/* COLUMN TITLES */}
          <div className={styles.columnHead}>
            <div>башня</div>
            <div>номер</div>
            <div>владелец</div>
            <div>телефон</div>
            <div>веб-ресурс</div>
          </div>

          <div className={styles.headLineBottom} />
        </div>

        {/* TABLE BODY */}
        <div className={styles.tableWrapper}>
          <div
            className={`${styles.tableBody} ${limit === "all" ? styles.noScroll : ""
              }`}
          >


            <div className={styles.gridTable}>
              {visibleOffices.map((office) => (

                <Fragment key={office.id}>
                  <div className={styles.cell}>{office.tower}</div>
                  <div className={styles.cell}>{office.number}</div>
                  <div className={styles.cell}>{office.owner}</div>
                  <div className={styles.cell}>{office.phone || "—"}</div>

                  <div className={styles.cell}>
                    {office.website ? (
                      <a href={office.website} target="_blank" rel="noreferrer" className={styles.website}>
                        {office.website}
                      </a>

                    ) : (
                      "—"
                    )}
                  </div>
                </Fragment>
              ))}
            </div>

          </div>
        </div>
      </div>

      <div className={styles.copyright}>
        Создание сайта:&nbsp;
        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
          _artcore_gallery_
        </a>
        &nbsp;© БЦ «Гермес»
      </div>
    </section>
  );
}
