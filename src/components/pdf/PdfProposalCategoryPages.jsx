import React from "react";
import EquipmentCategoryPage from "./EquipmentCategoryPage";
import { createProposalCategoryPages } from "../../pdf/utils/proposalCategories.js";

export default function PdfProposalCategoryPages({ categories = [] }) {
  return categories.flatMap((category) =>
    createProposalCategoryPages(category).map((page, index) => (
      <EquipmentCategoryPage key={`${category.id}-${index}`} page={page} />
    ))
  );
}
