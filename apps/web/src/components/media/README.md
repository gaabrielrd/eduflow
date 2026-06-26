# Media Uploader

Componente de dominio para upload unitario de midia em `apps/web`.

## Fluxo

1. valida tipo e tamanho no cliente;
2. chama `POST /api/media/presign`;
3. envia o binario direto para a URL assinada com progresso;
4. chama `POST /api/media/complete`;
5. devolve o `MediaAsset` criado via `onUploaded`.

## Props principais

- `onUploaded(asset)`: callback com o asset confirmado pela API
- `acceptedMimeTypes?`: override da lista padrao de MIME types
- `maxSizeBytes?`: override do limite de tamanho
- `disabled?`: bloqueia interacoes
- `copy?`: override curto de titulo, descricao e CTA principal

## Observacoes

- v1 aceita apenas um arquivo por vez;
- retry reaproveita o ultimo arquivo valido e reinicia o fluxo completo;
- cancelamento aborta a requisicao em andamento sem upload resumivel;
- a tela `/app/media` e o consumidor inicial e demonstra o contrato do callback.
