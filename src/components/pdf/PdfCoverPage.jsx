import React from 'react';
import { assetPath } from '../../utils/assetPath.js';

export default function PdfCoverPage() {
  return (
    <section className="pdf-page pdf-page--full-bleed" aria-label="Capa do PDF">
      <img className="pdf-page__full-image" src={assetPath("/images/pdf/lucas-franco-logo.png")} alt="Capa da proposta Lucas Franco" />
    </section>
  );
}
