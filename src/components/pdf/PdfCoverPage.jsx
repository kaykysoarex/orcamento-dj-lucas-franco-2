import React from 'react';
import { assetPath } from '../../utils/assetPath.js';
import PdfPage from './PdfPage.jsx';

export default function PdfCoverPage() {
  return (
    <PdfPage ariaLabel="Capa do PDF" pageClassName="pdf-page--full-bleed">
      <img className="pdf-page-image" src={assetPath("/images/pdf/lucas-franco-logo.png")} alt="Capa da proposta Lucas Franco" />
    </PdfPage>
  );
}
