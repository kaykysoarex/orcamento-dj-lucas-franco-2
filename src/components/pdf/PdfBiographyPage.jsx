import React from 'react';
import { assetPath } from '../../utils/assetPath.js';

export default function PdfBiographyPage() {
  return (
    <section className="pdf-page pdf-page--full-bleed" aria-label="Biografia do DJ">
      <img className="pdf-page__full-image" src={assetPath("/images/pdf/lucas-franco-biografia.png")} alt="Biografia do DJ Lucas Franco" />
    </section>
  );
}
