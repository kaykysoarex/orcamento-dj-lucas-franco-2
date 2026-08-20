import { assetPath } from "../utils/assetPath.js";

export const PDF_ASSETS = {
  budgetData: {
    dj: assetPath("/assets/pdf/dados-orcamento/dj-lucas-franco-fone.png"),
    logo: assetPath("/assets/pdf/dados-orcamento/logo-lucas-franco.png"),
    texture: assetPath("/assets/pdf/dados-orcamento/textura-fundo.svg"),
  },
  experience: {
    weddingPoster: assetPath("/assets/pdf/experiencia/experiencia-casamento-02-poster.webp"),
  },
} as const;
