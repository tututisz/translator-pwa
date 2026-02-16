# Translator PWA

Um app web PWA de tradução em tempo real com suporte a áudio para conversas presenciais. Suporta português, inglês, espanhol, francês e coreano.

## Recursos

- **Transcrição de Fala**: Converte áudio em texto usando Web Speech API
- **Tradução Automática**: Traduz entre 5 idiomas usando MyMemory API
- **Text-to-Speech**: Reproduz as traduções em áudio
- **PWA**: Funciona como app nativo no celular
- **Modo Offline**: Funciona sem internet (com cache)
- **Interface Minimalista**: Design limpo e focado na usabilidade

## Idiomas Suportados

- 🇧🇷 Português (pt-BR)
- 🇺🇸 English (en-US)
- 🇪🇸 Español (es-ES)
- 🇫🇷 Français (fr-FR)
- 🇰🇷 한국어 (ko-KR)

## Instalação Local

```bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## Deploy no Netlify

### Opção 1: Conectar GitHub

1. Faça push do código para um repositório GitHub
2. Acesse [netlify.com](https://netlify.com)
3. Clique em "New site from Git"
4. Selecione seu repositório
5. Configure:
   - Build command: `pnpm build`
   - Publish directory: `dist/public`
6. Clique em "Deploy"

### Opção 2: Deploy Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login no Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Como Usar

1. **Selecione os idiomas**: Escolha o idioma de entrada (esquerda) e saída (direita)
2. **Clique em "Start Recording"**: Comece a falar no microfone
3. **Fale naturalmente**: O app transcreverá sua fala
4. **Clique em "Stop Recording"**: Finalize a gravação
5. **Veja a tradução**: A tradução aparecerá no painel direito e será reproduzida automaticamente
6. **Troque de turno**: Agora a outra pessoa pode falar no idioma traduzido

## Requisitos

- Navegador moderno com suporte a:
  - Web Speech API
  - Web Audio API
  - Service Workers
  - Acesso ao microfone

## Tecnologias

- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Web Speech API
- Web Audio API
- Service Workers (PWA)

## Notas Importantes

- A transcrição de fala funciona melhor em navegadores Chrome/Edge
- A tradução usa MyMemory API (gratuita, com limite de requisições)
- O app requer permissão para acessar o microfone
- Funciona melhor com fones de ouvido para evitar feedback

## Troubleshooting

### Microfone não funciona
- Verifique se o navegador tem permissão para acessar o microfone
- Tente recarregar a página
- Verifique se há outro app usando o microfone

### Tradução não funciona
- Verifique sua conexão com internet
- Aguarde alguns segundos (limite de requisições da API)
- Tente com um texto mais curto

### PWA não instala
- Use um navegador moderno (Chrome, Edge, Firefox)
- Acesse via HTTPS (necessário para PWA)
- Tente em modo incógnito

## Licença

MIT

## Autor

Criado com ❤️ para conversas multilíngues
