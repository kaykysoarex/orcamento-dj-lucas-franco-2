import React, { useEffect, useState } from "react";
import { PDF_ASSETS } from "../../config/pdfAssets";
import { BUDGET_DATA_LAYOUT } from "../../pdf/layouts/budgetDataLayout";
import { formatEventDate } from "../../pdf/utils/formatEventDate";
import PdfPage from "./PdfPage.jsx";
import styles from "./BudgetDataPage.module.css";

type BudgetDataPageProps = {
  clientName: string;
  eventDate: string;
  location: string;
  eventType: string;
  showDuration: string;
  mode?: "preview" | "export";
};

/**
 * Measures text width using canvas to calculate font sizing
 */
function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily = "Montserrat"
): number {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return text.length * fontSize * 0.55;
    ctx.font = `300 ${fontSize}px ${fontFamily}, Arial, sans-serif`;
    return ctx.measureText(text).width;
  } catch {
    return text.length * fontSize * 0.55;
  }
}

/**
 * Calculates optimal font size for a text to fit within a given width
 */
function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  baseFontSize = 34,
  minFontSize = 28,
  isSingleLine = false
): number {
  if (!text) return baseFontSize;

  let fontSize = baseFontSize;
  let width = measureTextWidth(text, fontSize);

  // Reduce font size until text fits (step by 1px)
  while (width > maxWidth && fontSize > minFontSize) {
    fontSize -= 1;
    width = measureTextWidth(text, fontSize);
  }

  return fontSize;
}

/**
 * BudgetDataField Component
 */
function BudgetDataField({
  label,
  value,
  showLine,
  fieldKey,
}: {
  label: string;
  value: string;
  showLine: boolean;
  fieldKey: keyof typeof BUDGET_DATA_LAYOUT.fields;
}) {
  const fieldConfig = BUDGET_DATA_LAYOUT.fields[fieldKey];
  const contentWidth = BUDGET_DATA_LAYOUT.content.width;
  const maxTextWidth = contentWidth; // use design units, don't multiply by page scale

  // Calculate optimal font size (design-surface px)
  const isSingleLine =
    fieldKey === "eventDate" || fieldKey === "showDuration";
  const fontSize = calculateOptimalFontSize(
    value,
    maxTextWidth * 0.95,
    34,
    28,
    isSingleLine
  );

  // Calculate height (design units)
  const fieldHeight = fieldConfig.height;
  const paddingBottom = 13; // Distance between text bottom and line (design)
  const textHeight = fontSize * 1.1; // With line-height
  // Move values slightly upward by 10px in design units (≈3-4px visible at 390px)
  const topOffset = fieldHeight - paddingBottom - textHeight - 30;
  const safeValue = typeof value === "string" ? value.trim() : "";

  return (
    <div
      className={styles.field}
      style={{
        left: `${BUDGET_DATA_LAYOUT.content.left}px`,
        top: `${fieldConfig.top}px`,
        width: `${contentWidth}px`,
        height: `${fieldHeight}px`,
      }}
    >
      <label className={styles.label}>{label}</label>

      {safeValue && (
        <div
          className={styles.value}
          style={{
            fontSize: `${fontSize}px`,
            marginTop: `${topOffset}px`,
          }}
        >
          {safeValue}
        </div>
      )}

      {showLine && <div className={styles.line} />}
    </div>
  );
}

/**
 * Main BudgetDataPage Component
 */
export default function BudgetDataPage({
  clientName,
  eventDate,
  location,
  eventType,
  showDuration,
  mode = "preview",
}: BudgetDataPageProps) {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkFonts = async () => {
      try {
        await (document as any).fonts.ready;
        setFontsReady(true);
      } catch {
        setFontsReady(true);
      }
    };
    checkFonts();
  }, []);

  const formattedDate = formatEventDate(eventDate);
  const safeClientName = typeof clientName === "string" ? clientName.trim() : "";
  const safeLocation = typeof location === "string" ? location.trim() : "";
  const safeEventType = typeof eventType === "string" ? eventType.trim() : "";
  const safeShowDuration = typeof showDuration === "string" ? showDuration.trim() : "";

  return (
    <PdfPage ariaLabel="Dados do Orçamento" pageClassName={`${styles.page} ${styles.pageSurface}`}>
        {/* Texture layer (separate) */}
        <div
          className={styles.texture}
          style={{ backgroundImage: `url("${PDF_ASSETS.budgetData.texture}")` }}
          aria-hidden="true"
        />

        {/* Frame */}
        <div className={styles.frame} />

        {/* Decorative Lines */}
      <div
        className={styles.decorativeLineTop}
        style={{
          left: `${BUDGET_DATA_LAYOUT.decorativeLineTop.startX}px`,
          top: `${BUDGET_DATA_LAYOUT.decorativeLineTop.startY}px`,
          width: `${Math.sqrt(Math.pow(BUDGET_DATA_LAYOUT.decorativeLineTop.endX - BUDGET_DATA_LAYOUT.decorativeLineTop.startX, 2) + Math.pow(BUDGET_DATA_LAYOUT.decorativeLineTop.endY - BUDGET_DATA_LAYOUT.decorativeLineTop.startY, 2))}px`,
          transform: `rotate(${Math.atan2(BUDGET_DATA_LAYOUT.decorativeLineTop.endY - BUDGET_DATA_LAYOUT.decorativeLineTop.startY, BUDGET_DATA_LAYOUT.decorativeLineTop.endX - BUDGET_DATA_LAYOUT.decorativeLineTop.startX) * (180 / Math.PI)}deg)`,
        }}
        aria-hidden="true"
      />

      <div
        className={styles.decorativeLineBottom}
        style={{
          left: `${BUDGET_DATA_LAYOUT.decorativeLineBottom.startX}px`,
          top: `${BUDGET_DATA_LAYOUT.decorativeLineBottom.startY}px`,
          width: `${Math.sqrt(Math.pow(BUDGET_DATA_LAYOUT.decorativeLineBottom.endX - BUDGET_DATA_LAYOUT.decorativeLineBottom.startX, 2) + Math.pow(BUDGET_DATA_LAYOUT.decorativeLineBottom.endY - BUDGET_DATA_LAYOUT.decorativeLineBottom.startY, 2))}px`,
          transform: `rotate(${Math.atan2(BUDGET_DATA_LAYOUT.decorativeLineBottom.endY - BUDGET_DATA_LAYOUT.decorativeLineBottom.startY, BUDGET_DATA_LAYOUT.decorativeLineBottom.endX - BUDGET_DATA_LAYOUT.decorativeLineBottom.startX) * (180 / Math.PI)}deg)`,
        }}
        aria-hidden="true"
      />

      {/* Title */}
      <div
        className={styles.title}
        style={{
          left: `${BUDGET_DATA_LAYOUT.title.left}px`,
          top: `${BUDGET_DATA_LAYOUT.title.top}px`,
          width: `${BUDGET_DATA_LAYOUT.title.width}px`,
              fontSize: `82px`,
        }}
      >
        <div>DADOS DO</div>
        <div>ORÇAMENTO</div>
        <div
          className={styles.titleLine}
          style={{
            width: `94px`,
          }}
        />
      </div>



      {/* DJ Photo */}
      <img
        src={PDF_ASSETS.budgetData.dj}
        className={styles.dj}
        alt=""
        aria-hidden="true"
        style={{
          left: `${BUDGET_DATA_LAYOUT.dj.left}px`,
          top: `${BUDGET_DATA_LAYOUT.dj.top}px`,
          width: `${BUDGET_DATA_LAYOUT.dj.width}px`,
        }}
      />

      {/* Fields */}
      {fontsReady && (
        <>
          <BudgetDataField
            label="TIPO DE EVENTO"
            value={safeEventType}
            showLine={true}
            fieldKey="eventType"
          />
          <BudgetDataField
            label="LOCAL"
            value={safeLocation}
            showLine={true}
            fieldKey="location"
          />
          <BudgetDataField
            label="DATA"
            value={formattedDate}
            showLine={true}
            fieldKey="eventDate"
          />
          <BudgetDataField
            label="TEMPO DE COBERTURA DE EVENTO"
            value={safeShowDuration}
            showLine={true}
            fieldKey="showDuration"
          />
          <BudgetDataField
            label="CLIENTE"
            value={safeClientName}
            showLine={true}
            fieldKey="clientName"
          />
        </>
      )}
      <img
        src={PDF_ASSETS.budgetData.logo}
        className={styles.logo}
        alt="Lucas Franco"
        style={{
          left: `${BUDGET_DATA_LAYOUT.logo.left}px`,
          bottom: `${BUDGET_DATA_LAYOUT.logo.bottom}px`,
          width: `${BUDGET_DATA_LAYOUT.logo.width}px`,
        }}
      />
    </PdfPage>
  );
}
