import { useState } from "react";
import { Check } from "lucide-react";
import { assetPath } from "../utils/assetPath";

export default function SeletorEstruturas({ estruturas = [], estruturaSelecionadaId, onSelecionar }) {
  // local thumb index for estrutura with multiple imagens
  const [thumbIndex, setThumbIndex] = useState({});

  function toggleThumb(estruturaId, imagens) {
    if (!imagens || imagens.length <= 1) return;
    setThumbIndex((prev) => ({ ...prev, [estruturaId]: ((prev[estruturaId] || 0) + 1) % imagens.length }));
  }

  function handleImgError(e) {
    try {
      e.currentTarget.onerror = null;
      e.currentTarget.src = assetPath("/images/placeholder-item.png");
    } catch (err) {
      e.currentTarget.style.display = 'none';
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
      {estruturas.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelecionar(e.id)}
          className={`obg-pkg-chip ${e.id === estruturaSelecionadaId ? "active" : ""}`}
          style={{ borderRadius: 12, padding: 12, textAlign: "left", background: "#faf8f5", border: e.id === estruturaSelecionadaId ? "2px solid #c9a961" : undefined }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 88, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" }}>
              <img
                src={e.imagens && e.imagens[(thumbIndex[e.id] || 0)]}
                alt={e.nome}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={handleImgError}
                onClick={(ev) => { ev.preventDefault(); toggleThumb(e.id, e.imagens); }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{e.nome}</div>
              <div style={{ fontSize: 12, color: "#6e675f" }}>{e.descricao}</div>
            </div>
            <div style={{ marginLeft: 8 }}>
              {e.id === estruturaSelecionadaId ? <Check size={18} color="#c9a961" /> : null}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
