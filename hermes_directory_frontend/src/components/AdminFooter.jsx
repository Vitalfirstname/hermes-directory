import { useState } from "react";
import api from "../api/api";
import SmoothNavHashLink from "../utils/SmoothNavHashLink";



import logo from "/src/assets/img/admin_login/bc_hermes_logo_all.svg";
import blog1 from "/src/assets/img/admin_login/blogs1.jpg";
import blog2 from "/src/assets/img/admin_login/blogs2.jpg";
import blog3 from "/src/assets/img/admin_login/blogs3.jpg";

import "/src/styles/footer.css";

export default function AdminFooter() {
    // ===== LOGIN STATE =====
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorLogin, setErrorLogin] = useState("");

    // ===== SUBSCRIBE STATE ===== (заглушка)
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    // ===== LOGIN HANDLER =====
    async function handleLogin(e) {
        e.preventDefault();
        setErrorLogin("");

        try {
            const res = await api.post("auth/login/", {
                username,
                password,
            });

            // Save JWT
            localStorage.setItem("token", res.data.access);

            // Redirect
            window.location.href = "/admin/panel";
        } catch (err) {
            setErrorLogin("Неверный логин или пароль");
        }
    }

    // ===== SUBSCRIBE HANDLER (заглушка) =====
    function handleSubscribe(e) {
        e.preventDefault();

        if (!email.trim()) return;

        setSent(true);
        setEmail("");

        setTimeout(() => setSent(false), 3000);
    }

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__inner">

                    {/* ===== COLUMN 1 ===== */}
                    <div className="footer__col footer__col--first">
                        <SmoothNavHashLink to="#intro" className="footer__logoLink">
                            <img src={logo} className="footer__logo" alt="ГЕРМЕС" />
                        </SmoothNavHashLink>


                        <div className="footer__text">
                            <p>ТОВАРИЩЕСТВО СОБСТВЕННИКОВ "БЦ ГЕРМЕС", г. Минск, ул. Казинца, 11 А</p>

                            <p className="footer-contacts__phone">
                                Администрация:
                                <a className="tel" href="tel:+375293340340">+375 (29) 3-340-340</a>
                            </p>

                            <p className="footer-contacts__phone">
                                Городской:
                                <a className="tel" href="tel:+375172787052">+375 (17) 278-70-52</a>
                            </p>

                            <p className="footer-contacts__email">
                                E-mail:
                                <a className="email" href="mailto:hermes-minsk@tut.by">
                                    hermes-minsk@tut.by
                                </a>
                            </p>

                            <p className="footer-contacts__details">
                                Расчётный счёт: BY16 BPSB 3015 1720 6401 4933 0000<br />
                                Банк: ОАО «БПС-Сбербанк», BIC BPSBBY2X<br />
                                ОКПО: 382181215000<br />
                                УНП: 192413107
                            </p>
                        </div>

                        {/* SOCIALS */}
                        <div className="footer__social">
                            <div className="footer__social__header">
                                <b>&nbsp;</b>
                            </div>

                            <div className="footer__social__content">
                                соцсети:
                                <a href="https://www.facebook.com" target="_blank"><i className="fa-brands fa-facebook"></i></a>
                                <a href="https://x.com" target="_blank"><i className="fa-brands fa-twitter"></i></a>
                                <a href="https://ru.pinterest.com" target="_blank"><i className="fa-brands fa-pinterest"></i></a>
                                <a href="https://www.instagram.com/" target="_blank"><i className="fa-brands fa-instagram"></i></a>
                            </div>
                        </div>

                        {/* SUBSCRIBE (ЗАГЛУШКА) */}
                        <form className="subscribe" onSubmit={handleSubscribe}>
                            <input
                                className="subscribe__input"
                                type="email"
                                placeholder="Ваш e-mail..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button className="subscribe__btn" type="submit">Связаться</button>
                        </form>

                        {sent && (
                            <div className="subscribe-success">Спасибо! Мы свяжемся с вами.</div>
                        )}
                    </div>

                    {/* ===== COLUMN 2 ===== */}
                    <div className="footer__col footer__col--second">
                        <div className="footer__title">Объекты управляющей компании</div>

                        <div className="blogs">
                            <div className="blogs__item">
                                <img className="blogs__img" src={blog1} alt="" />
                                <div className="blogs__content">
                                    <a className="blogs__title" href="https://www.google.com/maps/place/%D0%90%D0%BB%D1%8C%D1%8F%D0%BD%D1%81/@53.8833941,27.5095188,17z/data=!4m6!3m5!1s0x46dbd005a4b29df9:0x171759015e581400!8m2!3d53.883432!4d27.5119006!16s%2Fg%2F11c6_svc0t?entry=ttu&g_ep=EgoyMDI1MTIwMi4wIKXMDSoASAFQAw%3D%3D" target="_blank">
                                        БЦ «Альянс»<br />Минск, 3-я ул. Щорса, 9.<br />Класс: C / С+<br />
                                        Площадь: ~4530 м², 5 этажей.
                                    </a>
                                    <div>Год ввода в эксплуатацию: 2011.</div>
                                </div>
                            </div>

                            <div className="blogs__item">
                                <img className="blogs__img" src={blog2} alt="" />
                                <div className="blogs__content">
                                    <a className="blogs__title" href="https://www.google.com/maps/place/%D0%92%D0%90%D0%9B%D0%95%D0%9E-%D0%A6%D0%95%D0%9D%D0%A2%D0%A0+%D0%9C%D0%9D%D0%9E%D0%93%D0%9E%D0%A4%D0%A3%D0%9D%D0%9A%D0%A6%D0%98%D0%9E%D0%9D%D0%90%D0%9B%D0%AC%D0%9D%D0%AB%D0%99+%D0%9A%D0%9E%D0%9C%D0%9F%D0%9B%D0%95%D0%9A%D0%A1/@53.9222884,27.6299298,14z/data=!4m10!1m2!2m1!1z0JHRhiDQktCw0LvQtdC-!3m6!1s0x46dbce95a2887189:0x84cca73e633721b2!8m2!3d53.9237036!4d27.6696694!15sCg_QkdGGINCS0LDQu9C10L5aESIP0LHRhiDQstCw0LvQtdC-kgEObWVkaWNhbF9jZW50ZXKaASRDaGREU1VoTk1HOW5TMFZKUTBGblRVTnZka2xVVEdsUlJSQULgAQD6AQQIdRAO!16s%2Fg%2F11gfnck_7j?entry=ttu&g_ep=EgoyMDI1MTIwMi4wIKXMDSoASAFQAw%3D%3D" target="_blank">
                                        БЦ «Валео»<br />Минск, ул. Ф. Скорины, 12.<br />Класс: B / B+<br />
                                        Площадь: ~6325 м², 7 этажей.
                                    </a>
                                    <div>Год ввода в эксплуатацию: 2013.</div>
                                </div>
                            </div>

                            <div className="blogs__item">
                                <img className="blogs__img" src={blog3} alt="" />
                                <div className="blogs__content">
                                    <a className="blogs__title" href="https://www.google.com/maps/place/%D0%93%D0%B5%D1%80%D0%BC%D0%B5%D1%81/@53.8651756,27.5213691,17z/data=!4m6!3m5!1s0x46dbd1af7ac10ac1:0xa5dc40b1bd2f4048!8m2!3d53.8652515!4d27.5242015!16s%2Fg%2F11h51jrwr4?entry=ttu&g_ep=EgoyMDI1MTIwMi4wIKXMDSoASAFQAw%3D%3D" target="_blank">
                                        БЦ «Гермес»<br />Минск, ул. Казинца, 11А.<br />Класс: B+<br />
                                        Площадь: ~13093 м², 8 этажей.
                                    </a>
                                    <div>Год ввода в эксплуатацию: 2015.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== COLUMN 3 — LOGIN BOX ===== */}
                    <div className="footer__col footer__col--third">

                        <div className="login-box">
                            <div className="footer__title">Административная панель</div>

                            <form className="login-form" onSubmit={handleLogin}>
                                <div className="form-group">
                                    <label>Логин</label>
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder="Введите логин"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Пароль</label>
                                    <input
                                        className="input"
                                        type="password"
                                        placeholder="Введите пароль"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className={`error-box ${errorLogin ? "show" : ""}`}>
                                    <div className="login-error">{errorLogin}</div>
                                </div>

                                <button className="btn-login" type="submit">Вход</button>

                                <div className="admin__in">Административный доступ</div>
                            </form>

                        </div>
                    </div>

                </div>
            </div>

            <div className="copyright">
                Создание сайта:&nbsp;
                <a href="https://www.instagram.com/" target="_blank">_artcore_gallery_</a>&nbsp; © БЦ «Гермес»
            </div>
        </footer>
    );
}
