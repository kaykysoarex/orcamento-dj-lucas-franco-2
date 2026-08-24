import { assetPath } from "../utils/assetPath.js";

/**
 * Cadastro central dos DJs que podem ser atribuídos a uma proposta.
 *
 * Não marque `imageAvailable` como true até que o arquivo WebP real esteja
 * disponível na rota indicada. A página individual do DJ só é renderizada
 * quando todos os dados públicos abaixo estiverem completos e válidos.
 */
export const DJ_PROFILES = {
  "lucas-franco": {
    id: "lucas-franco",
    name: "DJ Lucas Franco",
    displayName: "Lucas Franco",
    image: assetPath("/assets/pdf/djs/dj-lucas-franco.webp"),
    imageAvailable: true,
    instagramUrl: "https://www.instagram.com/djlucasfrancooficial/",
    whatsappUrl: "https://wa.me/5531982085111",
  },
  "felipe-souza": {
    id: "felipe-souza",
    name: "DJ Felipe Souza",
    displayName: "Felipe Souza",
    image: assetPath("/assets/pdf/djs/dj-felipe-souza.webp"),
    imageAvailable: true,
    instagramUrl: "https://www.instagram.com/dj_fellipe_souza/",
    whatsappUrl: "https://wa.me/5531994189876",
  },
};

export function getDjProfile(djId) {
  return djId ? DJ_PROFILES[djId] || null : null;
}

export function isKnownDjId(djId) {
  return Boolean(getDjProfile(djId));
}

function isExternalUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function isInstagramUrl(value) {
  return isExternalUrl(value, ["instagram.com"]);
}

function isWhatsAppUrl(value) {
  return isExternalUrl(value, ["wa.me", "whatsapp.com"]);
}

export function getMissingDjProfileData(dj) {
  if (!dj) return ["DJ"];

  return [
    !dj.imageAvailable && "foto",
    !isInstagramUrl(dj.instagramUrl) && "link válido do Instagram",
    !isWhatsAppUrl(dj.whatsappUrl) && "link válido do WhatsApp",
  ].filter(Boolean);
}

export function isDjProfilePdfReady(dj) {
  return Boolean(dj && dj.image && getMissingDjProfileData(dj).length === 0);
}
