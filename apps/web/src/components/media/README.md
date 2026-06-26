# Media Components

Componentes de dominio para upload e selecao de midia em `apps/web`.

## MediaUploader

Fluxo:

1. valida tipo e tamanho no cliente;
2. chama `POST /api/media/presign`;
3. envia o binario direto para a URL assinada com progresso;
4. chama `POST /api/media/complete`;
5. devolve o `MediaAsset` criado via `onUploaded`.

Props principais:

- `onUploaded(asset)`: callback com o asset confirmado pela API
- `acceptedMimeTypes?`: override da lista padrao de MIME types
- `maxSizeBytes?`: override do limite de tamanho
- `disabled?`: bloqueia interacoes
- `copy?`: override curto de titulo, descricao e CTA principal

Observacoes:

- v1 aceita apenas um arquivo por vez;
- retry reaproveita o ultimo arquivo valido e reinicia o fluxo completo;
- cancelamento aborta a requisicao em andamento sem upload resumivel;
- a tela `/app/media` e o consumidor inicial e demonstra o contrato do callback.

## MediaPicker

Componente de selecao unitario para escolher um `MediaAsset` existente da biblioteca da
organizacao.

API atual:

- `onSelect(asset)`: callback disparado apenas na confirmacao explicita
- `trigger?`: elemento opcional usado como acionador do dialog; sem override, o picker rende um botao padrao
- `title?`, `description?`, `confirmLabel?`, `cancelLabel?`: overrides curtos de copy

Comportamento do MVP:

- abre em dialog proprio;
- lista assets via `GET /api/media` usando `listMediaAssets()`;
- busca no cliente por `originalName` e `fileName`;
- permite apenas single-select;
- confirmar fecha o dialog e devolve o `MediaAsset` ao pai;
- cancelar ou fechar o dialog descarta a selecao pendente;
- cobre estados de loading, erro, biblioteca vazia e busca sem resultados.

Nao objetivo desta iteracao:

- integrar o picker ao schema de `contentJson` ou aos blocos `image`, `video` e `file`;
- adicionar upload, delete ou multi-select dentro do picker.
