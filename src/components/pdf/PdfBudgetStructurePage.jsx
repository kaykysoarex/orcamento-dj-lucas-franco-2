import React from "react";
import BudgetStructurePage from "./BudgetStructurePage";

export default function PdfBudgetStructurePage(props) {
  // props should match the wrapper usage in App.jsx: structure and includedItems
  return <BudgetStructurePage {...props} mode={props.mode || "preview"} />;
}
