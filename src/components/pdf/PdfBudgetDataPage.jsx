import React, { useMemo, useRef, useState, useEffect } from 'react';
import { PDF_ASSETS } from '../../config/pdfAssets';
import { BUDGET_DATA_LAYOUT } from '../../pdf/layouts/budgetDataLayout';

function formatBRDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch (e) { return iso; }
}

// Design surface reference width (px)
const DESIGN_WIDTH_PX = 1055;
const BASE_FONT_PX = 28; // as requested for design surface
const MIN_FONT_PX = 10; // mobile minimum visible

function measureTextWidth(text, fontSize, fontFamily = 'Montserrat') {
  try {
    const canvas = measureTextWidth._canvas || (measureTextWidth._canvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}, Arial, sans-serif`;
    const metrics = ctx.measureText(text);
    return metrics.width;
  } catch (e) {
    // fallback approximation
    return text.length * fontSize * 0.55;
  }
}

export default function PdfBudgetDataPage({ eventType, location, eventDate, showDuration, clientName }) {
  const values = useMemo(() => ({
    eventType,
    location,
    eventDate: formatBRDate(eventDate),
    showDuration,
    clientName
  }), [eventType, location, eventDate, showDuration, clientName]);

  const pageRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(DESIGN_WIDTH_PX); // avoid zero

  useEffect(() => {
    const el = pageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    // measure initial
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) setPageWidth(rect.width);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || entry.target.getBoundingClientRect().width;
        if (w && w !== pageWidth) setPageWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // compute font for each field based on pageWidth and content
  function calcFontForField(text, cfg, opts = {}) {
    const isDate = !!opts.isDate;
    const scale = pageWidth / DESIGN_WIDTH_PX; // single strategy
    let size = Math.round(BASE_FONT_PX * scale);
    size = Math.min(Math.max(size, MIN_FONT_PX), BASE_FONT_PX);

    // available width in px based on cfg.maxWidth% of the current page width
    const availableWidth = (cfg.maxWidth / 100) * pageWidth;
    // leave small safety padding so text doesn't touch the golden line
    const padding = Math.max(6, Math.round(pageWidth * 0.003));
    const avail = Math.max(availableWidth - padding, 20);

    // For date and duration: force single-line (nowrap). Reduce size until it fits or until MIN_FONT_PX
    if (isDate || opts.forceSingleLine) {
      let measured = measureTextWidth(text, size);
      while (measured > avail && size > MIN_FONT_PX) {
        size -= 1;
        measured = measureTextWidth(text, size);
      }
      return { fontSize: size, whiteSpace: 'nowrap' };
    }

    // For other fields: try to fit in one line by reducing size; if not possible, allow two lines
    let measured = measureTextWidth(text, size);
    while (measured > avail && size > MIN_FONT_PX) {
      size -= 1;
      measured = measureTextWidth(text, size);
    }

    if (measured <= avail) {
      return { fontSize: size, whiteSpace: 'nowrap' };
    }

    // couldn't fit even at min size on single line => allow wrapping (max 2 lines)
    // set to minimum size and allow normal wrapping; CSS will limit max-height to 2 lines
    return { fontSize: Math.max(size, MIN_FONT_PX), whiteSpace: 'normal' };
  }

  return (
    <section ref={pageRef} className="pdf-page pdf-page--full-bleed pdf-budget-data" aria-label="Dados do Orçamento">
      <img className="pdf-page__full-image" src={PDF_ASSETS.budgetDataPage} alt="Dados do Orçamento" />
      <div className="pdf-budget-overlay" aria-hidden="false">
        {Object.keys(BUDGET_DATA_LAYOUT).map((key) => {
          const cfg = BUDGET_DATA_LAYOUT[key];
          const value = values[key] || '';
          const isDate = key === 'eventDate';
          const calc = calcFontForField(value, cfg, { isDate, forceSingleLine: isDate || key === 'showDuration' });

          // compute vertical position so text bottom sits consistently above the golden line
          const scale = pageWidth / DESIGN_WIDTH_PX;
          const paddingDesignPx = 13; // design surface vertical gap between text bottom and line (12-14px requested)
          const paddingPx = paddingDesignPx * scale; // scale with page

          // compute line position in px from percent (lineY is percent of page height)
          const lineYPercent = cfg.lineY; // percent of page height
          // ensure pageHeight measured; fallback to design height scaled by width if missing
          const pageHeight = pageRef.current ? pageRef.current.getBoundingClientRect().height : (DESIGN_WIDTH_PX * 1491 / DESIGN_WIDTH_PX);
          const lineYPx = (lineYPercent / 100) * pageHeight;

          const textHeightPx = calc.fontSize * 1.1; // fontSize * line-height
          let topPx = lineYPx - paddingPx - textHeightPx; // top in px
          // clamp topPx to be non-negative and not overlap top area
          topPx = Math.max(topPx, 0);

          const topPercent = (topPx / pageHeight) * 100;

          return (
            <div
              key={key}
              className="pdf-budget-field"
              data-field={key}
              data-value={value}
              style={{ left: `${cfg.lineX}%`, top: `${topPercent}%`, width: `${cfg.lineWidth}%` }}
            >
              <div
                className="pdf-budget-field__text"
                style={{
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  fontWeight: 300,
                  fontStyle: 'normal',
                  color: '#F2EEE6',
                  textAlign: 'left',
                  fontSize: `${calc.fontSize}px`,
                  lineHeight: 1.1,
                  letterSpacing: '0.2px',
                  textShadow: 'none',
                  WebkitTextStroke: '0px transparent',
                  whiteSpace: calc.whiteSpace,
                  overflowWrap: 'break-word',
                  maxHeight: calc.whiteSpace === 'normal' ? `${Math.ceil(2 * calc.fontSize * 1.1)}px` : '9999px'
                }}
              >
                {value}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .pdf-budget-data { position: relative; }
        .pdf-page__full-image { z-index: 1; }
        .pdf-budget-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
        .pdf-budget-field { position: absolute; transform: translate(-0%, -0%); }

        /* values baseline */
        .pdf-budget-field__text {
          display: block;
          color: #F2EEE6;
          text-align: left;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-shadow: none !important;
        }

        /* Keep overlay non-interactive */
        .pdf-budget-field { pointer-events: none; }

        @media print {
          .pdf-budget-field { outline: none !important; }
          .pdf-budget-field__text { font-size: 11pt; line-height: 1.1; }
        }
      `}</style>
    </section>
  );
}
