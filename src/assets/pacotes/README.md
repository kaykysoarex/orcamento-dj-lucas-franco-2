# Fotos fixas dos pacotes

Essa pasta é onde ficam as fotos padrão que já vêm prontas em cada pacote (Essencial, Premium, Completo), sem o Lucas precisar fazer upload de nada.

## Como adicionar

1. Coloque os arquivos de imagem aqui (ex: `essencial-1.jpg`, `essencial-2.jpg`, `premium-1.jpg`...).
2. No `src/App.jsx`, no bloco `DEFAULT_PHOTOS` (perto do topo do arquivo), importe cada imagem e adicione no array do pacote correspondente:

```jsx
import essencial1 from "./assets/pacotes/essencial-1.jpg";
import premium1 from "./assets/pacotes/premium-1.jpg";

const DEFAULT_PHOTOS = {
  essencial: [essencial1],
  premium: [premium1],
  completo: [],
};
```

3. Rodar `npm run build` de novo pra confirmar que compilou certinho.

Até 4 fotos por pacote. Recomendo fotos na horizontal ou quadradas, e evitar arquivos muito grandes (o ideal é já mandar comprimido — menos de 500KB por foto).

Se quiser, é só me mandar as fotos reais do equipamento/estrutura que eu já deixo tudo configurado.
