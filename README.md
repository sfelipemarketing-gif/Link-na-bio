# Seu link na bio

Uma página pessoal de links, gratuita, sem dependências e com layout próprio inspirado no formato de link na bio. Fundo preto com estrelas em camadas, brilho suave e estrelas cadentes ao rolar, foto quadrada, botões flutuantes, ondas a cada toque, compartilhamento e quantos links você quiser. Funciona no GitHub Pages.

## Personalizar

Abra `config.js` e altere nome, usuário, descrição e destinos. Os botões sem URL aparecem desativados e uma mensagem identifica a prévia. A mensagem desaparece quando todos os destinos estão preenchidos; você também pode remover os botões que não vai usar.

Exemplos de destinos:

- Instagram: `https://www.instagram.com/SEU_USUARIO/`
- WhatsApp: `https://wa.me/55DDDNUMERO` (somente números, incluindo país e DDD)
- YouTube: `https://www.youtube.com/@SEU_CANAL`
- E-mail: `mailto:voce@exemplo.com`

Para usar sua foto, adicione `foto.jpg` na mesma pasta e configure `avatar: "foto.jpg"`. Deixe vazio para usar suas iniciais. A cor de destaque usa formato hexadecimal, por exemplo `#a6dcff`.

A logo enviada está em `logo.jpg` e aparece no lugar do nome escrito, mantendo o nome acessível aos leitores de tela. O arquivo original foi preservado; o enquadramento e a integração do fundo preto são feitos pelo CSS. Para voltar ao nome em texto, configure `logo: ""`.

Para usar sua música, adicione um áudio como `musica.mp3` e configure `music: "musica.mp3"`. Use um arquivo que você possa publicar. Os navegadores normalmente bloqueiam áudio automático: a música tenta começar no primeiro toque/clique, com volume inicial de 35% e botão para pausar. Sem arquivo configurado, não aparece controle de música. Arquivos enviados ao repositório público também podem ser acessados pelo público.

As estrelas acompanham suavemente o movimento do ponteiro e a rolagem. Estrelas cadentes aparecem durante a navegação e ocasionalmente enquanto a página está aberta. Há um botão para pausar os efeitos. As animações também respeitam a preferência do dispositivo por movimento reduzido e param quando a aba fica oculta. As ondas não bloqueiam a rolagem nem os botões.

Os ícones disponíveis são `chat`, `instagram`, `globe`, `video` e `mail`. Copie um objeto da lista `links` para adicionar um botão. `featured: true` destaca o botão. Preserve as aspas e vírgulas do JavaScript.

## Publicar grátis no GitHub Pages

1. No seu GitHub, crie um repositório **público**, por exemplo `link-na-bio`.
2. Envie todos os arquivos desta pasta para a raiz do repositório, incluindo `index.html`, `styles.css`, `script.js`, `config.js`, `icon.svg` e `.nojekyll`.
3. Abra **Settings → Pages → Build and deployment**.
4. Em **Source**, selecione **Deploy from a branch**.
5. Selecione a branch **main** e a pasta **/ (root)**. Clique em **Save**.
6. Aguarde a publicação. O endereço será `https://SEU_USUARIO.github.io/link-na-bio/`.
7. Cole esse endereço na bio do Instagram ou de outra rede social.

Se o repositório tiver o nome `SEU_USUARIO.github.io`, a página ficará em `https://SEU_USUARIO.github.io/`. Alterações enviadas à branch publicada atualizam a página automaticamente.

O subdomínio `github.io` e a hospedagem de uma página pessoal no plano gratuito não exigem mensalidade, dentro dos limites do GitHub Pages. Domínio próprio é opcional e pode ter custo. Todos os arquivos do repositório público ficam visíveis: não inclua dados privados.

## Ver antes de publicar

Abra `index.html` no navegador ou, com Python instalado, execute nesta pasta:

```sh
python3 -m http.server 8000
```

Acesse `http://localhost:8000`. O compartilhamento usa o endereço publicado; ao testar localmente, o endereço copiado será o de teste.

Esta versão reúne seus links. Não inclui painel com login ou estatísticas de cliques. Para editar a página publicada, altere `config.js` no próprio GitHub e salve a alteração.
