import React, { useEffect, useState } from "react";
import { PDF_ASSETS } from "../../config/pdfAssets";
import { BUDGET_EFFECTS_LAYOUT } from "../../pdf/layouts/budgetEffectsLayout";
import PdfPage from "./PdfPage.jsx";
import styles from "./BudgetEffectsPage.module.css";

type PdfItem = {
  id: string;
  nome?: string;
  descricao?: string;
  categoria?: string;
  quantidade?: number;
  imagem?: string;
  imagemFallback?: string;
};

type EffectsPage = {
  effects: PdfItem[];
  items: PdfItem[];
  continuation: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  estrutura: "ESTRUTURA",
  equipamento: "EQUIPAMENTO",
  efeito: "ILUMINAÇÃO E EFEITO",
  servico: "SERVIÇO",
};

function diagonalStyle(line: { startX: number; startY: number; endX: number; endY: number }) {
  const width = Math.hypot(line.endX - line.startX, line.endY - line.startY);
  const angle = Math.atan2(line.endY - line.startY, line.endX - line.startX) * (180 / Math.PI);
  return { left: `${line.startX}px`, top: `${line.startY}px`, width: `${width}px`, transform: `rotate(${angle}deg)` };
}

function fallbackEffectImage(effect: PdfItem) {
  const name = String(effect.nome || "Efeito selecionado").replace(/[&<>]/g, "");
  const motif = effect.id === "fogos-artificio"
    ? "<path d='M250 80v190M155 175h190M184 109l132 132M316 109L184 241' stroke='#d1a044' stroke-width='12' stroke-linecap='round'/><circle cx='250' cy='175' r='58' fill='none' stroke='#f2eee6' stroke-opacity='.45' stroke-width='3'/>"
    : effect.id === "canhao-co2"
      ? "<path d='M120 250h230l86-74-58-62-86 74H120z' fill='none' stroke='#d1a044' stroke-width='11' stroke-linejoin='round'/><path d='M405 113c57-35 103-8 99 33 45 5 63 54 23 79' fill='none' stroke='#f2eee6' stroke-opacity='.6' stroke-width='10' stroke-linecap='round'/>"
      : "<path d='M112 253l80-84 184-25 42 43-181 27-83 79z' fill='none' stroke='#d1a044' stroke-width='11' stroke-linejoin='round'/><path d='M388 135c57-45 119-31 134 9 42-9 68 29 43 66' fill='none' stroke='#f2eee6' stroke-opacity='.6' stroke-width='10' stroke-linecap='round'/>";
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 560 360'><rect width='560' height='360' fill='#0a0c0f'/><path d='M0 300L210 90l110 110L438 80l122 122v158H0z' fill='#15191e'/>${motif}<text x='280' y='330' text-anchor='middle' fill='#f2eee6' font-family='Arial,sans-serif' font-size='22' letter-spacing='2'>${name.toUpperCase()}</text></svg>`)}`;
}

function EffectImage({ effect }: { effect: PdfItem }) {
  const preferredSource = effect.imagem || effect.imagemFallback || fallbackEffectImage(effect);
  const [source, setSource] = useState(preferredSource);

  useEffect(() => {
    setSource(effect.imagem || effect.imagemFallback || fallbackEffectImage(effect));
  }, [effect]);

  return (
    <img
      className={styles.effectImage}
      src={source}
      alt={effect.nome || "Efeito selecionado"}
      onError={() => setSource(fallbackEffectImage(effect))}
    />
  );
}

export default function BudgetEffectsPage({ page }: { page: EffectsPage }) {
  const imageCount = Math.min(page.effects.length, 3);
  const itemsTop = page.continuation
    ? BUDGET_EFFECTS_LAYOUT.items.topByImageCount[0]
    : BUDGET_EFFECTS_LAYOUT.items.topByImageCount[imageCount as 0 | 1 | 2 | 3];

  return (
    <PdfPage
      ariaLabel={page.continuation ? "Iluminação e Efeitos - continuação" : "Iluminação e Efeitos"}
      pageClassName={`${styles.page} ${styles.pageSurface}`}
    >
        <div
          className={styles.texture}
          style={{ backgroundImage: `url("${PDF_ASSETS.budgetData.texture}")` }}
          aria-hidden="true"
        />
        <div className={styles.frame} />
        <div className={styles.decorativeLineTop} style={diagonalStyle(BUDGET_EFFECTS_LAYOUT.decorative.topDiagonal)} aria-hidden="true" />
        <div className={styles.decorativeLineBottom} style={diagonalStyle(BUDGET_EFFECTS_LAYOUT.decorative.bottomDiagonal)} aria-hidden="true" />

        <div className={styles.title} style={{ left: `${BUDGET_EFFECTS_LAYOUT.title.left}px`, top: `${BUDGET_EFFECTS_LAYOUT.title.top}px`, width: `${BUDGET_EFFECTS_LAYOUT.title.width}px` }}>
          <div>ILUMINAÇÃO</div>
          <div>E EFEITOS</div>
          <div className={styles.titleLine} />
        </div>

        {imageCount > 0 && (
          <div className={`${styles.imageGrid} ${styles[`images${imageCount}`]}`}>
            {page.effects.slice(0, 3).map((effect) => (
              <figure className={styles.effectCard} key={effect.id}>
                <EffectImage effect={effect} />
                <figcaption>{effect.nome}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className={styles.itemsSection} style={{ top: `${itemsTop}px`, bottom: `${BUDGET_EFFECTS_LAYOUT.items.bottom}px` }}>
          <div className={styles.itemsTitle}>{page.continuation ? "ITENS SELECIONADOS" : "DEMAIS ITENS SELECIONADOS"}</div>
          {page.items.length > 0 ? (
            <div className={styles.itemGrid}>
              {page.items.map((item, index) => (
                <article className={styles.item} key={`${item.id}-${index}`}>
                  <span className={styles.check}>✓</span>
                  <div className={styles.itemCopy}>
                    <div className={styles.itemMeta}>{CATEGORY_LABELS[item.categoria || ""] || "ITEM"}</div>
                    <div className={styles.itemName}>
                      {Number(item.quantidade) > 1 && <span className={styles.quantity}>{item.quantidade}×</span>}
                      {item.nome || "Item selecionado"}
                    </div>
                    {item.descricao && <div className={styles.itemDescription}>{item.descricao}</div>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Nenhum outro item selecionado.</p>
          )}
        </div>

        <div className={styles.logoContainer} style={{ bottom: `${BUDGET_EFFECTS_LAYOUT.logo.bottom}px` }}>
          <img src={PDF_ASSETS.budgetData.logo} alt="Lucas Franco" className={styles.logo} />
        </div>
    </PdfPage>
  );
}
