import React from 'react';
import BudgetDataPage from './BudgetDataPage';

// Thin compatibility wrapper so other code importing PdfBudgetDataPage.jsx continues to work
export default function PdfBudgetDataPage(props) {
  // Props already match: eventType, location, eventDate, showDuration, clientName
  return <BudgetDataPage {...props} />;
}
