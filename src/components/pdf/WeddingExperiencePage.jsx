import React from "react";
import { PDF_ASSETS } from "../../config/pdfAssets";
import { EXPERIENCE_URL } from "../../config/experienceLink";
import PdfPage from "./PdfPage.jsx";
import styles from "./WeddingExperiencePage.module.css";

export default function WeddingExperiencePage() {
  return (
    <PdfPage
      ariaLabel="Experiência de casamento"
      pageClassName={`${styles.page} ${styles.pageSurface}`}
    >
      <div className={styles.frame} aria-hidden="true" />
      <div className={styles.blueLight} aria-hidden="true" />
      <div className={styles.goldLight} aria-hidden="true" />

      <main className={styles.content}>
        <p className={styles.eyebrow}>EXPERIÊNCIA LUCAS FRANCO</p>
        <h1 className={styles.title}>
          <span>VIVA ESSA</span>
          <span>EXPERIÊNCIA</span>
        </h1>
        <p className={styles.description}>
          Veja como música, luz e energia transformam cada momento do seu casamento.
        </p>

        <figure className={styles.photoFrame}>
          <img
            src={PDF_ASSETS.experience.weddingPoster}
            alt="Noivos celebrando na pista de dança sob iluminação azul"
            className={styles.photo}
            width="1672"
            height="941"
            loading="eager"
            decoding="async"
          />
        </figure>

        <p className={styles.callout}>CLIQUE E DESCUBRA COMO SERÁ A SUA EXPERIÊNCIA</p>
        <a
          className={styles.button}
          href={EXPERIENCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Assistir à experiência de casamento no site Lucas Franco"
          data-pdf-link={EXPERIENCE_URL}
        >
          <span>ASSISTIR À EXPERIÊNCIA</span>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </a>
      </main>

      <footer className={styles.footer}>
        <img src={PDF_ASSETS.budgetData.logo} alt="Lucas Franco" className={styles.logo} />
      </footer>
    </PdfPage>
  );
}
