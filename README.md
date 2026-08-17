# Orçamentos — DJ Lucas Franco

Ferramenta para montar e enviar orçamentos rapidamente, sem precisar editar nada no Canva.

## Rodar localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Gerar a versão de produção (pra hospedar)

```bash
npm run build
```

Isso gera a pasta `dist/` — é o que você sobe na hospedagem (Vercel, Netlify, etc.), do mesmo jeito que os outros sites.

## Como funciona

- **Pacotes personalizados**: não há planos prontos. Crie cada pacote do zero, dê um nome e selecione os equipamentos que serão usados no show.
- **Catálogo de equipamentos**: os equipamentos ficam em uma lista pesquisável. Use o campo de busca para localizar um item, selecione-o para incluir no pacote e cadastre novos itens quando necessário.
- **Exclusão segura de pacotes**: o botão `×` abre uma confirmação na tela; só confirma a remoção quando o usuário escolhe “Sim, apagar”.
- **Fotos por pacote**: dá pra anexar até 4 fotos por pacote (equipamento, estrutura montada, etc.) — aparecem tanto na prévia quanto no PDF exportado. As imagens são comprimidas automaticamente no navegador antes de salvar, pra não pesar no armazenamento.
- **Forma de pagamento**: também editável uma vez e salva automaticamente.
- Pra cada cliente: seleciona o pacote, ajusta valor se precisar negociar, adiciona itens extras, preenche nome/data/local.
- **PDF com dados completos**: nome do cliente, data e local do evento são obrigatórios para liberar a geração do PDF.
- **Exportar PDF**: usa a função de impressão do navegador (`Salvar como PDF`), funciona no computador e no celular.
- **Copiar p/ WhatsApp**: copia um texto já formatado, pronto pra colar direto na conversa.
- **Histórico fiel**: ao salvar, a proposta guarda uma cópia do pacote, das fotos e do valor usados naquele momento. Alterações futuras nos pacotes não mudam os orçamentos já salvos.
- **Numeração**: um número só é reservado quando o orçamento é salvo; abrir ou fechar o site não cria lacunas na sequência.

## Importante sobre o salvamento automático

Os dados (pacotes, forma de pagamento, número da proposta) ficam salvos no **navegador do aparelho usado**, via `localStorage`. Isso significa:

- Se ele limpar os dados do navegador, perde as configurações salvas (mas pode reconfigurar rápido).
- Se ele usar em outro celular/computador, os pacotes não aparecem automaticamente lá — precisa configurar de novo naquele aparelho (ou usar sempre o mesmo dispositivo pra montar orçamentos).

Se no futuro isso virar um problema (ex: ele quiser acessar de qualquer aparelho com os mesmos pacotes salvos), a solução é adicionar um banco de dados simples — dá pra evoluir depois, sem precisar refazer a ferramenta do zero.

Quando o cabeçalho mostrar **"não foi possível salvar"**, o navegador não conseguiu gravar os dados (por exemplo, por falta de espaço ou modo privado). Nesse caso, reduza a quantidade/tamanho das fotos e não feche a página antes de copiar o conteúdo importante.
