import "./intro.css";
import SmoothHashLink from "../../utils/SmoothHashLink";
import bgImage from "../../assets/img/bg8.jpg"; // путь проверь

export default function Intro() {
  return (
    <section
      className="intro"
      id="intro"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="container">
        <div className="intro__inner">
          <div className="intro__title1">
            <span>ПРОСТРАНСТВО</span>
            <span>для ВАШЕГО</span>
            <span>БИЗНЕСА</span>
          </div>

          <div className="line__x"></div>


          {/* <div className="intro__title">
            СОВРЕМЕННЫЙ<br />
            ОФИСНЫЙ<br />
            ЦЕНТР<br />
            КЛАССА B+
          </div>*/}

          <SmoothHashLink to="#b_plus" className="intro__title intro__title--link">
            СОВРЕМЕННЫЙ<br />
            ОФИСНЫЙ<br />
            ЦЕНТР<br />
            КЛАССА B+
          </SmoothHashLink>


          <div className="line__i"></div>

          <a
            className="btn__intro"
            href="#"
            target="_blank"
            rel=""
          >
            сайт управляющей компании
          </a>

          <div className="line__ix"></div>
        </div>
      </div>
    </section>
  );
}
