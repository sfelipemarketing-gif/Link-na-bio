# SFelipe Lab — Tech Landing

Landing page estática para GitHub Pages, com estética super tech, conexões do SFelipe, ícones flutuantes, microinterações e um mini jogo de cobrinha integrado.

## O que existe na página

A página apresenta um hero comercial com CTAs, o perfil do SFelipe, cards para WhatsApp, YouTube e SFelipe Music, efeitos visuais responsivos e uma seção arcade sem servidor. O jogo funciona com setas, WASD e botões de toque no celular; mostra score, melhor pontuação da sessão e reinício.

## Personalização

Edite `config.js` para alterar nome, handle, descrição, foto, música, cor de destaque e os destinos dos cards. Não coloque tokens, senhas ou dados privados no arquivo: todo o conteúdo do repositório é público.

Os assets `foto.jpg`, `logo.jpg`, `icon.svg` e `musica.mp3` ficam na raiz. O site não usa backend ou dependências de build, então continua compatível com GitHub Pages.

## Publicar no GitHub Pages

No repositório, abra **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)`. Salve e aguarde a publicação. O site será servido em `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`.

Para testar localmente, execute `python3 -m http.server 8000` na raiz e abra `http://localhost:8000`.
