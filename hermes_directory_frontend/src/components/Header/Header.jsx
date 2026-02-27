import { Link } from "react-router-dom";
import styles from "./Header.module.css";
import logo from "/src/assets/img/bc_hermes_logo_all.svg";
import SmoothNavHashLink from "../../utils/SmoothNavHashLink";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerInner}>

          <SmoothNavHashLink to="#intro" className={styles.logoLink}>
            <img src={logo} alt="ГЕРМЕС логотип" className={styles.logo} />
          </SmoothNavHashLink>

          <nav className={styles.nav}>
            <SmoothNavHashLink className={styles.navLink} to="#about">
              о нас
            </SmoothNavHashLink>

            <SmoothNavHashLink className={styles.navLink} to="#rent">
              агенты
            </SmoothNavHashLink>

            <SmoothNavHashLink className={styles.navLink} to="#b_plus">
              B+
            </SmoothNavHashLink>

            <Link to="/residents" className={styles.navLink}>
              резиденты
            </Link>

            <SmoothNavHashLink className={styles.navLink} to="#contacts">
              контакты
            </SmoothNavHashLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
