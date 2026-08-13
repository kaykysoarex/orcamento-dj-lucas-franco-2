import { useEffect, useState } from "react";

const FALLBACK_DATA_URI = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%2314161c'/%3E%3Cpath d='M0 140 90 70l55 45 38-32 137 97H0z' fill='%232c303a'/%3E%3Ccircle cx='244' cy='55' r='24' fill='%23c9a961' opacity='.8'/%3E%3Ctext x='160' y='155' fill='%23f3efe6' font-family='Arial' font-size='14' text-anchor='middle'%3EImagem pendente%3C/text%3E%3C/svg%3E";

export default function ItemProposta({ item, quantidade = 1 }) {
  const [src, setSrc] = useState(item?.imagem || item?.imagemFallback);

  useEffect(() => {
    setSrc(item?.imagem || item?.imagemFallback);
  }, [item]);

  function handleImageError() {
    if (src !== item?.imagemFallback) {
      setSrc(item?.imagemFallback);
    } else if (src !== FALLBACK_DATA_URI) {
      setSrc(FALLBACK_DATA_URI);
    }
  }

  if (!item) return null;

  return (
    <div className="obg-proposal-item" data-item-id={item.id}>
      {item.exibirImagemNoPdf && (
        <img
          className="obg-proposal-item-image"
          src={src}
          alt=""
          loading="lazy"
          onError={handleImageError}
        />
      )}
      <div className="obg-proposal-item-copy">
        <div className="obg-proposal-item-name">
          {quantidade > 1 && <span className="obg-proposal-item-quantity">{quantidade}×</span>}
          {item.nome}
        </div>
        <div className="obg-proposal-item-description">{item.descricao}</div>
      </div>
    </div>
  );
}
