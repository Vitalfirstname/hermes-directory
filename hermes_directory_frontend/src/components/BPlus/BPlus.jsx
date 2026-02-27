import "./bplus.css";

import img1 from "../../assets/img/b_plus/b_plus1.jpg";
import img2 from "../../assets/img/b_plus/b_plus2.jpg";
import img3 from "../../assets/img/b_plus/b_plus3.jpg";
import img4 from "../../assets/img/b_plus/b_plus4.jpg";
import img5 from "../../assets/img/b_plus/b_plus5.jpg";
import img6 from "../../assets/img/b_plus/b_plus6.jpg";

export default function BPlus() {
  return (
    <section className="section__b_plus" id="b_plus">
      <div className="bplus__container">
        <div className="b_plus__subtitle_box">
          <p className="b_plus__subtitle">СОВРЕМЕННЫЙ ОФИСНЫЙ ЦЕНТР КЛАССА B+</p>
          <div className="line__b_plus_1" />
        </div>

        <div className="bplus__specs" role="list">
          <div className="spec" role="listitem">
            <div className="spec__k">Общая площадь:</div>
            <div className="spec__v">13 093 м²</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Этажность:</div>
            <div className="spec__v">8 этажей</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Форматы офисов:</div>
            <div className="spec__v">
              Кабинетная и open space система планировок. Предусмотрен собственный конференц-зал.
            </div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Парковка:</div>
            <div className="spec__v">57 / 97 машиномест (наземная / подземная / гостевая)</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Безопасность и доступ:</div>
            <div className="spec__v">Контроль доступа в здание и общие зоны. Доступ 24/7.</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Интернет:</div>
            <div className="spec__v">Оптоволоконная телеком-инфраструктура, подключение нескольких провайдеров</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Телефония:</div>
            <div className="spec__v">Цифровая, современная IP-телефония</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Комфорт:</div>
            <div className="spec__v">4 лифта KONE бесшумные (Финляндия), включая уровень -1 (парковка)</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Вентиляция:</div>
            <div className="spec__v">Приточно-вытяжная с рекуперацией воздуха</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Питание:</div>
            <div className="spec__v">Несколько кафетериев, горячая кухня</div>
          </div>

          <div className="spec" role="listitem">
            <div className="spec__k">Техслужба:</div>
            <div className="spec__v">Постоянный штат на объекте</div>
          </div>
        </div>

        <div className="line__b_plus_next" />

        <div className="bplus__gallery">
          <figure className="shot">
            <img src={img1} alt="Фасад бизнес-центра «ГЕРМЕС»" loading="lazy" />
            <figcaption className="shot__caption">Фасад бизнес-центра</figcaption>
          </figure>

          <figure className="shot">
            <img src={img2} alt="Входная группа / лобби" loading="lazy" />
            <figcaption className="shot__caption">Вход / лобби</figcaption>
          </figure>

          <figure className="shot">
            <img src={img3} alt="Лифты" loading="lazy" />
            <figcaption className="shot__caption">Лифтовой холл</figcaption>
          </figure>

          <figure className="shot">
            <img src={img4} alt="Офисные пространства" loading="lazy" />
            <figcaption className="shot__caption">Общие зоны этажей</figcaption>
          </figure>

          <figure className="shot">
            <img src={img5} alt="Парковка" loading="lazy" />
            <figcaption className="shot__caption">Подземный паркинг</figcaption>
          </figure>

          <figure className="shot">
            <img src={img6} alt="Кофетерии" loading="lazy" />
            <figcaption className="shot__caption">Зоны отдыха</figcaption>
          </figure>
        </div>

        <div className="line__b_plus_next" />
      </div>
    </section>
  );
}
