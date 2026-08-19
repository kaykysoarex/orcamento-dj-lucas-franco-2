import React from 'react';
import { assetPath } from '../../utils/assetPath.js';
import PdfPage from './PdfPage.jsx';

export default function PdfBiographyPage() {
  return (
    <PdfPage ariaLabel="Biografia do DJ" pageClassName="pdf-page--full-bleed">
      <img className="pdf-page-image" src={assetPath("/images/pdf/lucas-franco-biografia.png")} alt="Biografia do DJ Lucas Franco" />
    </PdfPage>
  );
}
