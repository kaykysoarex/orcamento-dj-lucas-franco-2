import { assetPath } from "../utils/assetPath.js";

export const PLACEHOLDER_ITEM_IMAGE = assetPath("/images/placeholder-item.png");

export const CATEGORIAS_ITEM = [
  { id: "estrutura", nome: "Estrutura" },
  { id: "equipamento", nome: "Equipamentos" },
  { id: "efeito", nome: "Efeitos e iluminação" },
  { id: "servico", nome: "Serviços profissionais" },
];

const imagem = (categoria, slug) => assetPath(`/images/${categoria}/${slug}.png`);

export const catalogoItens = [
  { id: "estrutura-prime", slug: "estrutura-prime", nome: "Estrutura Prime", descricao: "Estrutura para composição da montagem do evento.", categoria: "estrutura", imagem: imagem("estruturas", "estrutura-prime"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 1 },
  { id: "moving-head-profissional", slug: "moving-head-profissional", nome: "Moving Head Profissional", descricao: "Iluminação móvel para complementar a ambientação do evento.", categoria: "efeito", imagem: imagem("efeitos", "moving-head-profissional"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 2 },
  { id: "envelopamento-black", slug: "envelopamento-black", nome: "Envelopamento Black", descricao: "Acabamento visual black para a estrutura do evento.", categoria: "estrutura", imagem: imagem("estruturas", "envelopamento-black"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 3 },
  { id: "pista-led-slim-paris-black", slug: "pista-led-slim-paris-black", nome: "Pista de LED Slim Paris Black", descricao: "Pista de LED para valorizar a experiência visual do evento.", categoria: "estrutura", imagem: imagem("estruturas", "pista-led-slim-paris-black"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 4 },
  { id: "plataforma-video-360", slug: "plataforma-video-360", nome: "Plataforma de Vídeo 360°", descricao: "Plataforma para registros em vídeo com experiência 360°.", categoria: "equipamento", imagem: imagem("equipamentos", "plataforma-video-360"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 5 },
  { id: "maquina-fumaca-profissional", slug: "maquina-fumaca-profissional", nome: "Máquina de Fumaça Profissional", descricao: "Efeito de fumaça para ambientação e momentos especiais.", categoria: "efeito", imagem: imagem("efeitos", "maquina-fumaca-profissional"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 6 },
  { id: "estrutura-decorativa-x", slug: "estrutura-decorativa-x", nome: "Estrutura Decorativa em X", descricao: "Estrutura decorativa em X para composição do cenário.", categoria: "estrutura", imagem: imagem("estruturas", "estrutura-decorativa-x"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 7 },
  { id: "painel-led", slug: "painel-led", nome: "Painel de LED", descricao: "Painel de LED para composição visual do evento.", categoria: "estrutura", imagem: imagem("estruturas", "painel-led"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 8 },
  { id: "iluminacao-cenica", slug: "iluminacao-cenica", nome: "Iluminação Cênica", descricao: "Iluminação para criar ambientação e destacar o espaço.", categoria: "efeito", imagem: imagem("efeitos", "iluminacao-cenica"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 9 },
  { id: "strobo-led", slug: "strobo-led", nome: "Strobo de LED", descricao: "Efeito de luz strobo para momentos de destaque.", categoria: "efeito", imagem: imagem("efeitos", "strobo-led"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 10 },
  { id: "canhao-co2", slug: "canhao-co2", nome: "Canhão de CO₂", descricao: "Efeito especial de CO₂ para momentos marcantes.", categoria: "efeito", imagem: imagem("efeitos", "canhao-co2"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 11 },
  { id: "bazuca-co2", slug: "bazuca-co2", nome: "Bazuca de CO₂", descricao: "Efeito especial de CO₂ para entradas e celebrações.", categoria: "efeito", imagem: imagem("efeitos", "bazuca-co2"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 12 },
  { id: "controladora-pilot-2000", slug: "controladora-pilot-2000", nome: "Controladora Pilot 2000", descricao: "Controladora para operação da iluminação do evento.", categoria: "equipamento", imagem: imagem("equipamentos", "controladora-pilot-2000"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 13 },
  { id: "estrutura-boate-x", slug: "estrutura-boate-x", nome: "Estrutura de Boate em X", descricao: "Estrutura em X para compor a montagem de boate.", categoria: "estrutura", imagem: imagem("estruturas", "estrutura-boate-x"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 14 },
  { id: "globos-espelhados", slug: "globos-espelhados", nome: "Globos Espelhados", descricao: "Elementos decorativos para complementar a ambientação.", categoria: "efeito", imagem: imagem("efeitos", "globos-espelhados"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 15 },
  { id: "storymaker-eventos", slug: "storymaker-eventos", nome: "Serviço de StoryMaker para Eventos", descricao: "Registro de conteúdos do evento para stories e redes sociais.", categoria: "servico", imagem: imagem("servicos", "storymaker-eventos"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 16 },
  { id: "microfone-sem-fio", slug: "microfone-sem-fio", nome: "Microfone Profissional sem Fio", descricao: "Microfone sem fio para falas e participações durante o evento.", categoria: "equipamento", imagem: imagem("equipamentos", "microfone-sem-fio"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 17 },
  { id: "mesa-dobravel", slug: "mesa-dobravel", nome: "Mesa Dobrável para Equipamentos", descricao: "Mesa de apoio para organização dos equipamentos.", categoria: "equipamento", imagem: imagem("equipamentos", "mesa-dobravel"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 18 },
  { id: "mini-brut-duplo-led", slug: "mini-brut-duplo-led", nome: "Mini Brut Duplo de LED", descricao: "Iluminação de apoio para ambientação do evento.", categoria: "efeito", imagem: imagem("efeitos", "mini-brut-duplo-led"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 19 },
  { id: "sistema-som-profissional", slug: "sistema-som-profissional", nome: "Sistema de Som Profissional para DJ", descricao: "Sistema de som para a apresentação do DJ.", categoria: "equipamento", imagem: imagem("equipamentos", "sistema-som-profissional"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 20 },
  { id: "mesa-som-yamaha", slug: "mesa-som-yamaha", nome: "Mesa de Som Yamaha", descricao: "Mesa de som para controle e operação do áudio.", categoria: "equipamento", imagem: imagem("equipamentos", "mesa-som-yamaha"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 21 },
  { id: "tecnico-audio", slug: "tecnico-audio", nome: "Técnico de Áudio", descricao: "Acompanhamento técnico para operação do áudio.", categoria: "servico", imagem: imagem("servicos", "tecnico-audio"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 22 },
  { id: "tecnico-iluminacao", slug: "tecnico-iluminacao", nome: "Técnico de Iluminação", descricao: "Acompanhamento técnico para operação da iluminação.", categoria: "servico", imagem: imagem("servicos", "tecnico-iluminacao"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 23 },
  { id: "cabeamento-completo", slug: "cabeamento-completo", nome: "Cabeamento Completo", descricao: "Cabeamento necessário para a organização da montagem.", categoria: "equipamento", imagem: imagem("equipamentos", "cabeamento-completo"), imagemFallback: PLACEHOLDER_ITEM_IMAGE, exibirImagemNoPdf: true, ativo: true, ordem: 24 },
];

export function buscarItemPorId(itemId) {
  return catalogoItens.find((item) => item.id === itemId);
}

export function buscarCategoriaItem(categoria) {
  return CATEGORIAS_ITEM.find((item) => item.id === categoria);
}
