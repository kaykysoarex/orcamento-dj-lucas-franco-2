import React from "react";
import { PDF_ASSETS } from "../../config/pdfAssets";
import PdfPage from "./PdfPage.jsx";
import styles from "./LedPanelPage.module.css";

type LedPanel = {
  width?: string;
  height?: string;
  image?: string;
  imageName?: string;
};

function formatDimension(value?: string) {
  const normalized = String(value || "").trim();
  return normalized ? `${normalized.replace(".", ",")} m` : "Não informado";
}

/** A dedicated, fixed-layout page included only for a selected LED panel. */
export default function LedPanelPage({ panel }: { panel: LedPanel }) {
  const hasImage = Boolean(panel?.image);

  return (
    <PdfPage ariaLabel="Painel de LED" pageClassName={`${styles.page} ${styles.pageSurface}`}>
      <div className={styles.texture} style={{ backgroundImage: `url("${PDF_ASSETS.budgetData.texture}")` }} aria-hidden="true" />
      <div className={styles.frame} aria-hidden="true" />
      <div className={styles.blueLight} aria-hidden="true" />
      <div className={styles.goldLight} aria-hidden="true" />

      <header className={styles.header}>
        <p className={styles.kicker}>ESTRUTURA DO EVENTO</p>
        <h1>PAINEL DE LED</h1>
        <div className={styles.titleLine} aria-hidden="true" />
        <p className={styles.subtitle}>CONFIGURAÇÃO PERSONALIZADA</p>
      </header>

      <section className={styles.imageFrame} aria-label="Imagem selecionada do Painel de LED">
        {hasImage ? (
          <img src={panel.image} alt={panel.imageName || "Imagem selecionada para o Painel de LED"} className={styles.image} />
        ) : (
          <p className={styles.imagePlaceholder}>Imagem não informada</p>
        )}
      </section>

      <section className={styles.specifications} aria-label="Medidas do Painel de LED">
        <div className={styles.specification}>
          <p className={styles.specificationLabel}>LARGURA</p>
          <p className={styles.specificationValue}>{formatDimension(panel?.width)}</p>
        </div>
        <div className={styles.specification}>
          <p className={styles.specificationLabel}>ALTURA</p>
          <p className={styles.specificationValue}>{formatDimension(panel?.height)}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>Medidas informadas em metros (m).</p>
        <img src={PDF_ASSETS.budgetData.logo} alt="Lucas Franco" className={styles.logo} />
      </footer>
    </PdfPage>
  );
}
