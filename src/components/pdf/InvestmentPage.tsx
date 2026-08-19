import React from "react";
import { Music2 } from "lucide-react";
import { PDF_ASSETS } from "../../config/pdfAssets";
import { formatBudgetValue } from "../../utils/budgetValue.js";
import PdfPage from "./PdfPage.jsx";
import styles from "./InvestmentPage.module.css";

type Props = {
  valueInCents: number;
  proposalNumber?: number | null;
  clientName?: string;
  eventDate?: string;
  eventLocation?: string;
  showPaymentTerms?: boolean;
};

function displayValue(value?: string) {
  return value?.trim() || "Não informado";
}

function proposalNumberLabel(value?: number | null) {
  const number = Number(value);
  const safeNumber = Number.isFinite(number) && number > 0 ? Math.trunc(number) : 1;
  return `Nº ${String(safeNumber).padStart(4, "0")}`;
}

function eventValueClassName(value: string) {
  if (value.length > 46) return styles.eventValueLong;
  if (value.length > 31) return styles.eventValueMedium;
  return "";
}

export default function InvestmentPage({
  valueInCents,
  proposalNumber,
  clientName,
  eventDate,
  eventLocation,
  showPaymentTerms = true,
}: Props) {
  const value = formatBudgetValue(valueInCents);
  const valueClassName = value.length > 15 ? styles.valueLong : value.length > 12 ? styles.valueMedium : "";
  const eventDetails = [
    { label: "CLIENTE", value: displayValue(clientName) },
    { label: "DATA DO EVENTO", value: displayValue(eventDate) },
    { label: "LOCAL", value: displayValue(eventLocation) },
  ];

  return (
    <PdfPage ariaLabel="Investimento" pageClassName={`${styles.page} ${styles.pageSurface}`}>
      <div className={styles.frame} aria-hidden="true" />
      <div className={styles.blueLight} aria-hidden="true" />
      <div className={styles.goldLight} aria-hidden="true" />

      <header className={styles.proposalHeader}>
        <div className={styles.brand}>
          <span className={styles.musicMark} aria-hidden="true"><Music2 size={17} strokeWidth={1.8} /></span>
          <span>LUCAS FRANCO — DJ</span>
        </div>
        <span className={styles.proposalNumber}>{proposalNumberLabel(proposalNumber)}</span>
      </header>
      <div className={styles.headerRule} aria-hidden="true" />

      <main className={styles.content}>
        <p className={styles.eyebrow}>PROPOSTA PERSONALIZADA</p>
        <h1 className={styles.title}>INVESTIMENTO</h1>
        <p className={styles.subtitle}>PARA O SEU EVENTO</p>
        <p className={styles.intro}>
          Uma experiência completa, planejada para transformar o seu evento em um momento inesquecível.
        </p>

        <section className={styles.eventDetails} aria-label="Identificação da proposta">
          {eventDetails.map((detail) => (
            <div className={styles.eventDetail} key={detail.label}>
              <p className={styles.eventLabel}>{detail.label}</p>
              <p className={`${styles.eventValue} ${eventValueClassName(detail.value)}`}>{detail.value}</p>
            </div>
          ))}
        </section>

        <section className={styles.valueArea} aria-label="Valor total da proposta">
          <p className={styles.valueLabel}>VALOR TOTAL DA PROPOSTA</p>
          <p className={`${styles.value} ${valueClassName}`}>{value}</p>
          {showPaymentTerms && (
            <p className={styles.paymentNote}>Condições de pagamento conforme descritas na proposta.</p>
          )}
        </section>
      </main>

      <div className={styles.footer}>
        <img src={PDF_ASSETS.budgetData.logo} alt="Lucas Franco" className={styles.logo} />
        <p className={styles.closing}>Será um prazer fazer parte deste momento.</p>
      </div>
    </PdfPage>
  );
}
