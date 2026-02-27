import styles from "./ContactsSection.module.css";
import bgImage from "../../assets/img/back_map.jpg";

export default function ContactsSection() {
  return (
    <section
      id="contacts"
      className={styles.sectionContacts}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className={styles.inner}>
        <div className={styles.map}>
          <div className={styles.mapTitle}>
            <span>
              <i className="fa-solid fa-location-dot"></i>
            </span>
            <br />
            <a
              href="https://maps.app.goo.gl/xtkQCTA4HNMJtY9C6"
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть карту
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
