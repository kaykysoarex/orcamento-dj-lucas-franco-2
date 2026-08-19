import React from "react";
import { PDF_ASSETS } from "../../config/pdfAssets";
import PdfPage from "./PdfPage.jsx";
import EquipmentListItem from "./EquipmentListItem";
import styles from "./EquipmentCategoryPage.module.css";

type PdfItem = {
  id: string;
  nome?: string;
  pdfDescription?: string;
  quantidade?: number;
};

type CategoryPage = {
  category: { id: string; title: string };
  items: PdfItem[];
  continuation: boolean;
};

/** Shared A4 page for Som e DJ, Iluminação & Efeitos and Serviços. */
export default function EquipmentCategoryPage({ page }: { page: CategoryPage }) {
  const label = page.continuation ? `${page.category.title} — CONTINUAÇÃO` : page.category.title;

  return (
    <PdfPage ariaLabel={label} pageClassName={`${styles.page} ${styles.pageSurface}`}>
      <div
        className={styles.texture}
        style={{ backgroundImage: `url("${PDF_ASSETS.budgetData.texture}")` }}
        aria-hidden="true"
      />
      <div className={styles.frame} />
      <div className={styles.decorativeLineTop} aria-hidden="true" />
      <div className={styles.decorativeLineBottom} aria-hidden="true" />

      <header className={styles.title}>
        <div>{page.category.title}</div>
        {page.continuation && <div className={styles.continuation}>— CONTINUAÇÃO</div>}
        <div className={styles.titleLine} />
      </header>

      <section className={styles.list} aria-label={`Itens de ${page.category.title}`}>
        {page.items.map((item) => (
          <EquipmentListItem
            key={item.id}
            name={item.nome}
            description={item.pdfDescription}
            quantity={item.quantidade}
          />
        ))}
      </section>

      <div className={styles.logoContainer}>
        <img src={PDF_ASSETS.budgetData.logo} alt="Lucas Franco" className={styles.logo} />
      </div>
    </PdfPage>
  );
}
