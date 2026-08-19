import React from "react";
import styles from "./EquipmentCategoryPage.module.css";

type Props = {
  name?: string;
  description?: string;
  quantity?: number;
};

/** A compact, reusable line for every equipment/service PDF category. */
export default function EquipmentListItem({ name = "Item selecionado", description, quantity = 1 }: Props) {
  return (
    <article className={styles.listItem}>
      <span className={styles.marker} aria-hidden="true" />
      <div className={styles.itemCopy}>
        <h2 className={styles.itemName}>
          {Number(quantity) > 1 && <span className={styles.quantity}>{quantity}×</span>}
          {name}
        </h2>
        {description && <p className={styles.itemDescription}>{description}</p>}
      </div>
    </article>
  );
}
