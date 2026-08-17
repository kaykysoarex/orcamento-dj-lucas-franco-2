Corrija a responsividade da prévia das duas primeiras páginas do PDF no mobile.

O foco principal do sistema é o celular.

## Problema atual

Na prévia mobile:

* A página A4 permanece com largura física de `210mm`;
* A imagem fica maior que a tela;
* A lateral direita é cortada;
* A logo aparece incompleta;
* Os textos ficam fora da área visível;
* Existe rolagem ou transbordamento horizontal;
* A página não reduz proporcionalmente.

O tamanho físico de `210mm × 297mm` deve ser utilizado somente para gerar ou imprimir o PDF.

Na prévia da tela, a página deve ocupar no máximo 100% da largura disponível e preservar a proporção A4.

## Antes de alterar

1. Analise os componentes da prévia;
2. Inspecione os estilos calculados;
3. Localize regras como:

   * `width: 210mm`;
   * `min-width: 210mm`;
   * Larguras fixas em pixels;
   * `max-width` incorreto;
   * Margens negativas;
   * Transformações;
   * Contêineres com `overflow`;
4. Identifique exatamente qual elemento está causando o corte;
5. Não faça apenas uma correção visual temporária.

## Resultado esperado no mobile

A página deve:

* Aparecer inteira;
* Ocupar a largura disponível;
* Preservar a proporção A4;
* Manter a imagem cobrindo toda a página;
* Não cortar a lateral;
* Não distorcer a logo;
* Não criar rolagem horizontal;
* Ficar centralizada;
* Ter uma pequena margem externa para separar a página da interface.

A capa e a biografia devem continuar ocupando 100% de suas respectivas folhas no PDF final.

## Separar prévia e exportação

Utilize o mesmo componente, mas estilos diferentes para:

```text
Modo de prévia na tela
Modo de impressão/exportação
```

Na tela, a página deve ser responsiva.

Na impressão, deve possuir exatamente `210mm × 297mm`.

## Contêiner da prévia

Crie ou ajuste um contêiner semelhante a:

```css
.pdf-preview-viewport {
  width: 100%;
  max-width: 100%;
  padding: 8px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow-x: hidden;
}
```

A página deve usar:

```css
@media screen {
  .pdf-page--full-bleed {
    position: relative;
    width: 100%;
    max-width: 794px;
    min-width: 0;
    height: auto;
    aspect-ratio: 210 / 297;
    margin: 0 auto 16px;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;
    background: #191a1e;
  }
}
```

Não aplique `210mm` ou `min-width: 210mm` na visualização mobile.

## Imagem na prévia

A imagem deve preencher a página responsiva:

```css
.pdf-page__full-image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  object-fit: cover;
  object-position: center;
}
```

Não utilize:

```css
width: 210mm;
min-width: 210mm;
width: auto;
height: auto;
transform: scale(...);
left: 50%;
translateX(...);
```

na prévia mobile.

## Estilos específicos para celular

Adicione:

```css
@media screen and (max-width: 600px) {
  .pdf-preview-viewport {
    width: 100%;
    padding: 4px;
    overflow-x: hidden;
  }

  .pdf-page--full-bleed {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: auto;
    aspect-ratio: 210 / 297;
    margin: 0 auto 12px;
    border-radius: 0;
  }
}
```

Se a página estiver dentro de `flex` ou `grid`, aplique:

```css
min-width: 0;
max-width: 100%;
```

nos elementos pais que estiverem causando transbordamento.

Não resolva o problema somente adicionando:

```css
body {
  overflow-x: hidden;
}
```

Isso apenas esconderia o conteúdo cortado. A página precisa realmente caber na tela.

## Estilos para impressão e PDF

Mantenha o tamanho físico somente na exportação:

```css
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  html,
  body,
  #root {
    margin: 0 !important;
    padding: 0 !important;
  }

  .pdf-preview-viewport {
    width: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
  }

  .pdf-page--full-bleed {
    position: relative;
    width: 210mm !important;
    min-width: 210mm !important;
    max-width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
  }

  .pdf-page__full-image {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    object-position: center;
  }
}
```

## Caso o gerador capture o HTML

Se o PDF for gerado com `html2canvas`, `html2pdf` ou biblioteca semelhante:

* Não capture diretamente a página reduzida do mobile;
* Crie uma cópia de exportação fora da área visível;
* Renderize essa cópia em dimensões fixas de A4;
* Não use `display: none`;
* Aguarde as imagens carregarem;
* Remova a cópia após a geração.

Exemplo conceitual:

```tsx
<div className="pdf-export-root" aria-hidden="true">
  <FullBleedPdfPage src={capa} />
  <FullBleedPdfPage src={biografia} />
  <PdfProposalContent orcamento={orcamento} />
</div>
```

A versão de exportação pode ficar fora da tela:

```css
.pdf-export-root {
  position: fixed;
  left: -10000px;
  top: 0;
  width: 210mm;
  background: #fff;
}
```

Não utilize a largura atual do celular para definir a resolução do PDF.

## Caso utilize jsPDF

Se as imagens forem adicionadas diretamente ao jsPDF, mantenha:

```ts
pdf.addImage(capa, "PNG", 0, 0, 210, 297);
pdf.addPage("a4", "portrait");
pdf.addImage(biografia, "PNG", 0, 0, 210, 297);
```

Nesse caso, a correção mobile deve afetar somente a prévia.

## Eliminar largura fixa herdada

Procure também nos elementos pais por:

```css
min-width;
width;
flex-basis;
grid-template-columns;
transform;
zoom;
white-space;
```

Remova ou sobrescreva qualquer largura fixa que impeça a página de reduzir.

Confirme que:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

em todas as telas testadas.

## Testes mobile obrigatórios

Teste nos seguintes tamanhos:

```text
320 × 568
360 × 800
375 × 812
390 × 844
412 × 915
430 × 932
```

Em todos eles, verifique:

1. A página aparece inteira;
2. A logo aparece completa;
3. O texto superior aparece completo;
4. A frase inferior aparece completa;
5. A biografia aparece inteira;
6. Não existe rolagem horizontal;
7. A imagem mantém a proporção;
8. Não existem espaços brancos internos;
9. Não existe corte lateral;
10. A navegação da página continua funcionando.

Utilize Playwright ou a ferramenta de navegador já disponível para tirar screenshots nos tamanhos testados.

## Testes desktop e PDF

Verifique também:

* Desktop continua funcionando;
* Capa ocupa 100% da página 1;
* Biografia ocupa 100% da página 2;
* Conteúdo dinâmico começa na página 3;
* PDF final continua A4;
* Imagens não ficam pixeladas;
* Não há páginas vazias;
* Lint passa;
* Typecheck passa;
* Testes passam;
* Build passa.

## Restrições

Não altere:

* As imagens;
* A logo;
* A biografia;
* Os dados do orçamento;
* Os cálculos;
* As estruturas;
* Os equipamentos;
* O design das páginas;
* As demais funcionalidades.

No final, informe:

1. A causa exata do corte mobile;
2. Arquivos modificados;
3. Regras CSS removidas;
4. Regras responsivas adicionadas;
5. Screenshots ou dimensões testadas;
6. Resultado do PDF;
7. Resultado do build.
