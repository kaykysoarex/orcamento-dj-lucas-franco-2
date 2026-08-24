import React from "react";
import { isDjProfilePdfReady } from "../../config/djProfiles.js";
import { PDF_ASSETS } from "../../config/pdfAssets";
import PdfPage from "./PdfPage.jsx";
import styles from "./SelectedDjPage.module.css";

/** A4 page rendered only after the selected DJ has a complete public profile. */
export default function SelectedDjPage({ dj }) {
  if (!isDjProfilePdfReady(dj)) return null;

  return (
    <PdfPage ariaLabel={`DJ selecionado: ${dj.name}`} pageClassName={`${styles.page} ${styles.pageSurface}`}>
      <div className={styles.frame} aria-hidden="true" />
      <div className={styles.blueLight} aria-hidden="true" />
      <div className={styles.goldLight} aria-hidden="true" />

      <main className={styles.content}>
        <p className={styles.eyebrow}>DJ SELECIONADO</p>
        <h1 className={styles.title}>QUEM FARÁ SUA FESTA ACONTECER</h1>
        <div className={styles.titleLine} aria-hidden="true" />

        <figure className={styles.photoFrame}>
          <img
            src={dj.image}
            alt={`Foto do ${dj.name}`}
            className={styles.photo}
            loading="eager"
            decoding="async"
          />
        </figure>

        <section className={styles.identity} aria-label={`DJ selecionado: ${dj.name}`}>
          <h2>{dj.name.toUpperCase()}</h2>
        </section>

        <div className={styles.actions}>
          <a
            className={styles.button}
            href={dj.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver Instagram de ${dj.name}`}
            data-pdf-link={dj.instagramUrl}
            data-pdf-url={dj.instagramUrl}
          >
            <span>VER INSTAGRAM</span><span aria-hidden="true">↗</span>
          </a>
          <a
            className={styles.button}
            href={dj.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Entrar em contato com ${dj.name}`}
            data-pdf-link={dj.whatsappUrl}
            data-pdf-url={dj.whatsappUrl}
          >
            <span>ENTRAR EM CONTATO</span><span aria-hidden="true">↗</span>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <img src={PDF_ASSETS.budgetData.logo} alt="Lucas Franco" className={styles.logo} />
      </footer>
    </PdfPage>
  );
}
