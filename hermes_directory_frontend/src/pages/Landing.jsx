import Header from "../components/Header/Header";
import Intro from "../components/Intro/Intro";
import About from "../components/About/About";
import BPlus from "../components/BPlus/BPlus";
import AdminFooter from "../components/AdminFooter";

import ContactsSection from "../components/ContactsSection/ContactsSection";

export default function Landing() {
  return (
    <>
      <Header />
      <Intro />
      <About />
      <BPlus />


      {/*<main className="landing" style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "60px 20px",
        textAlign: "center",

        
      }}>
        <section id="welcome" className="section">
          <h1></h1>
          <p>первая секция лэндинга.</p>
        </section>

        <section id="about" className="section">
          <p>О бизнес-центре</p>
          <p>Описание, фотографии, информация о здании.</p>
        </section>

        <section id="residents" className="section">
          <p>резиденты</p>
          <p>публичная версия.</p>
        </section>

        
      </main>*/}
      <ContactsSection />
      <AdminFooter />
    </>
  );
}
