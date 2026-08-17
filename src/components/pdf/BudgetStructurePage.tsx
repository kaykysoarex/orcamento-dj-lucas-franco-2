import React, { useEffect, useRef, useState } from "react";
import { BUDGET_STRUCTURE_LAYOUT } from "../../pdf/layouts/budgetStructureLayout";
import { PDF_ASSETS } from "../../config/pdfAssets";
import styles from "./BudgetStructurePage.module.css";

const DESIGN_WIDTH_PX = 1055;
const DESIGN_HEIGHT_PX = 1491;

type StructureType = {
  id: string;
  nome?: string; // project uses Portuguese 'nome'
  descricao?: string;
  imagens?: string[]; // project stores imagens array
  itensInclusosIds?: string[];
};

type IncludedItem = { id: string; nome: string };

type Props = {
  structure: StructureType | null;
  includedItems: IncludedItem[];
  mode?: "preview" | "export";
};

export default function BudgetStructurePage({ structure, includedItems = [], mode = "preview" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageScale, setPageScale] = useState(1);
  const [fontsReady, setFontsReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    (document as any).fonts?.ready?.then(() => setFontsReady(true)).catch(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth ?? 0;
      if (width > 0) {
        const nextScale = width / DESIGN_WIDTH_PX;
        if (Number.isFinite(nextScale) && nextScale > 0) setPageScale(nextScale);
      }
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  if (!structure) return null;

  const imageSrc = Array.isArray(structure.imagens) && structure.imagens.length ? structure.imagens[0] : "";
  const structureName = (structure.nome || structure.name || "").toString();

  return (
    <div ref={containerRef} className={styles.container} style={{ "--page-scale": pageScale } as React.CSSProperties}>
      <div className={`${styles.page} ${styles.pageSurface}`}>
        <div className={styles.texture} aria-hidden="true" />
        <div className={styles.frame} />

        <div
          className={styles.decorativeLineTop}
          style={{
            left: `${BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.startX}px`,
            top: `${BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.startY}px`,
            width: `${Math.sqrt(Math.pow(BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.endX - BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.startX, 2) + Math.pow(BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.endY - BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.startY, 2))}px`,
            transform: `rotate(${Math.atan2(BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.endY - BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.startY, BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.endX - BUDGET_STRUCTURE_LAYOUT.decorative.topDiagonal.startX) * (180 / Math.PI)}deg)`,
          }}
          aria-hidden
        />

        <div
          className={styles.decorativeLineBottom}
          style={{
            left: `${BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.startX}px`,
            top: `${BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.startY}px`,
            width: `${Math.sqrt(Math.pow(BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.endX - BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.startX, 2) + Math.pow(BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.endY - BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.startY, 2))}px`,
            transform: `rotate(${Math.atan2(BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.endY - BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.startY, BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.endX - BUDGET_STRUCTURE_LAYOUT.decorative.bottomDiagonal.startX) * (180 / Math.PI)}deg)`,
          }}
          aria-hidden
        />

        {/* Title */}
        <div
          className={styles.title}
          style={{ left: `${BUDGET_STRUCTURE_LAYOUT.title.left}px`, top: `${BUDGET_STRUCTURE_LAYOUT.title.top}px`, width: `${BUDGET_STRUCTURE_LAYOUT.title.width}px` }}
        >
          <div>ESTRUTURA</div>
          <div>SELECIONADA</div>
        </div>

        {/* Structure name + underline */}
        <div className={styles.structureName} style={{ left: `${BUDGET_STRUCTURE_LAYOUT.structureName.left}px`, top: `${BUDGET_STRUCTURE_LAYOUT.structureName.top}px`, width: `${BUDGET_STRUCTURE_LAYOUT.structureName.width}px` }}>
          <div className={styles.structureNameText}>{structureName}</div>
          <div className={styles.underline} style={{ width: `${BUDGET_STRUCTURE_LAYOUT.titleLine.width}px`, marginTop: '10px' }} />
        </div>

        {/* Photo */}
        <div
          className={styles.photoWrap}
          style={{ left: `${BUDGET_STRUCTURE_LAYOUT.photo.left}px`, top: `${BUDGET_STRUCTURE_LAYOUT.photo.top}px`, width: `${BUDGET_STRUCTURE_LAYOUT.photo.width}px`, height: `${BUDGET_STRUCTURE_LAYOUT.photo.height}px` }}
        >
          {!imageSrc || imageFailed ? (
            <div className={styles.photoPlaceholder} aria-hidden>
              <div className={styles.photoPlaceholderInner}>Imagem indisponível</div>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={structureName}
              className={styles.photo}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>

        {/* Included title */}
        <div className={styles.includedTitle} style={{ left: `${BUDGET_STRUCTURE_LAYOUT.includedSection.left}px`, top: `${BUDGET_STRUCTURE_LAYOUT.includedSection.top}px`, width: `${BUDGET_STRUCTURE_LAYOUT.includedSection.width}px` }}>
          INCLUSO NESTA ESTRUTURA
        </div>

        {/* Included items list */}
        <div className={styles.includedGrid} style={{ left: `${BUDGET_STRUCTURE_LAYOUT.includedSection.left}px`, top: `${BUDGET_STRUCTURE_LAYOUT.includedSection.top + 64}px`, width: `${BUDGET_STRUCTURE_LAYOUT.includedSection.width}px` }}>
          {includedItems && includedItems.length > 0 ? (
            <ul className={styles.includedList}>
              {includedItems.map((it) => (
                <li key={it.id} className={styles.includedItem}>
                  <span className={styles.check}>✓</span>
                  <span className={styles.includedName}>{it.nome}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.noItems}>Nenhum item incluso</div>
          )}
        </div>

        {/* Logo centered at bottom */}
        <div className={styles.logoContainer} style={{ left: 0, right: 0, bottom: 8 }}>
          <img src={PDF_ASSETS.budgetData.logo} alt="Lucas Franco" className={styles.logo} />
        </div>
      </div>
    </div>
  );
}
