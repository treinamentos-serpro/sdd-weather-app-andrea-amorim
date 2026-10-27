<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Executando a UI com mock

A entrada [src/main.tsx](src/main.tsx) monta [App](src/App.tsx) e carrega os
[estilos globais Tailwind](src/styles/index.css). Execute `pnpm dev` para abrir
a interface completa, sem depender da API.

- O header reúne a marca WeatherView, busca e controle de unidade.
- A tela começa em `idle`. O painel **Modo de demonstração · sem API** permite
  escolher `idle`, `loading`, `empty`, `error` e `success`. O carregamento
  permanece ativo até selecionar outro estado; nesse estado, a busca é bloqueada.
- Qualquer busca válida exibe o mock de **São Paulo**, independentemente do
  termo digitado; não simula dados de outras cidades. “Tentar novamente” também
  exibe esse mock. Não há rede, atraso artificial ou falha aleatória.
- Os dados são fictícios e fixos, de **27 a 31/10/2026**. A tela informa essa
  limitação e não os apresenta como clima de hoje.
- `unit` é estado de UI, começa em Celsius e permanece selecionado entre os
  estados. A conversão ocorre na renderização, sem alterar o mock nem consultar
  a API. Loading, vazio e erro substituem os dados anteriores.

Esta é uma composição demonstrativa: a busca real, seleção de cidade e consulta
Open-Meteo continuam fora desta etapa.

### Verificações de acessibilidade e responsividade

As correções da UI incluem nomes acessíveis contendo os rótulos visíveis °C/°F,
foco com separação visual nos botões selecionados e retorno do foco ao conteúdo
após “Tentar novamente”. Busca vazia devolve o foco ao campo inválido.
Controles do painel têm alvos de pelo menos 44 × 44 px. Métricas do clima atual
usam uma coluna no mobile, duas a partir de `sm` e quatro a partir de `lg`; a
previsão mantém as 2/3/5 colunas especificadas.

[Os testes E2E](tests/e2e/app-mock.spec.ts) verificam no Chromium:
fluxo por teclado e skip link, foco após recuperação, preferência de movimento
reduzido, ausência de rolagem horizontal em 320/768/1280 px e reflow a 320 px com
texto a 200% e nomes longos. Medidas de contraste dos estilos computados:
borda do input **3,98:1**, texto do input **18,93:1** e texto do botão de unidade
ativo **5,39:1**. Os testes exigem pelo menos 3:1 para a borda e 4,5:1 para
esses textos.

Essas verificações não certificam conformidade WCAG completa. Ainda é necessário
validar os anúncios com leitores de tela reais, zoom do navegador e a matriz
de navegadores aprovada, incluindo Safari/iOS e Firefox.

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

### Formulário de busca

[SearchBar](src/components/SearchBar.tsx) recebe `onSearch(city: string)` e
`disabled?: boolean` (padrão `false`). O formulário tem `role="search"`, campo
com label visível e envio por botão ou Enter. A cidade enviada passa por
`trim()`; entradas vazias exibem orientação sem chamar o callback. Quando
desabilitado, bloqueia edição e envio. O componente não acessa a API.

### Controle de unidade

[UnitToggle](src/components/UnitToggle.tsx) recebe `unit: Unit` e
`onChange(unit: Unit)`, com valores `celsius` ou `fahrenheit`. O componente é
controlado: a seleção muda quando a prop `unit` é atualizada pelo consumidor,
que deve iniciar em `celsius` na ausência de preferência. Os botões °C/°F
anunciam a seleção com `aria-pressed` dentro de um grupo acessível. Use Tab e
Shift+Tab para navegar, Enter ou Espaço para ativar. O componente não converte
valores, persiste preferências ou consulta a API.

### Clima atual

[CurrentWeather](src/components/CurrentWeather.tsx) recebe `city: City`,
`current: CurrentWeather` e `unit: Unit`. Exibe temperatura, sensação térmica,
condição WMO em pt-BR e métricas de umidade, vento (km/h), precipitação (mm) e
pressão (hPa), em um cartão glassmorphism responsivo.

[temperature](src/lib/temperature.ts) converte temperaturas canônicas em
Celsius para a unidade recebida, preservando `null`.
[weatherCodes](src/lib/weatherCodes.ts) fornece rótulos e ícones para os códigos
WMO, incluindo céu limpo noturno e condição desconhecida. Ícones são decorativos,
pois a condição também é apresentada em texto. Valores indisponíveis mostram
“—”; números usam pt-BR com até uma casa decimal, apenas na apresentação.
O componente não consulta a API nem mantém cópias dos dados em estado.

### Previsão diária

[ForecastList](src/components/ForecastList.tsx) recebe `days: ForecastDay[]` e
`unit: Unit`. Renderiza os dias fornecidos na mesma ordem, sem filtrar pelo
relógio do navegador, em grid de 2, 3 ou 5 colunas conforme o viewport. Para
exibir os cinco dias do mock, passe `days={mockWeatherData.forecastDays}`.
Uma lista vazia apresenta “Nenhuma previsão disponível.”.

[ForecastCard](src/components/ForecastCard.tsx) recebe `day: ForecastDay` e
`unit: Unit`. Exibe dia da semana e data, condição e ícone WMO, máxima, mínima e
probabilidade de chuva. Temperaturas são convertidas pelos helpers existentes;
campos `null` mostram “—”.

[format](src/lib/format.ts) centraliza números em pt-BR e rótulos de datas no
formato “terça-feira, 27/10”. As datas `YYYY-MM-DD` representam o calendário da
cidade e são formatadas sem deslocamento pelo fuso do navegador. Datas inválidas
lançam `RangeError`; o helper não cria rótulos relativos ao relógio, como “Hoje”.

### Estados de consulta

- [LoadingState](src/components/states/LoadingState.tsx): sem props; anuncia
  “Carregando dados meteorológicos...” com `role="status"`. O indicador
  decorativo só gira quando a preferência de movimento permite.
- [ErrorState](src/components/states/ErrorState.tsx): recebe `message: string`
  (mensagem orientada à pessoa usuária, sem payload técnico) e
  `onRetry: () => void`. Anuncia a falha com `role="alert"` e oferece o botão
  “Tentar novamente”, acessível por teclado, sem submeter formulários.
- [EmptyState](src/components/states/EmptyState.tsx): recebe `title?: string`
  e `hint?: string`. Por padrão, anuncia “Nenhuma cidade encontrada” e orienta
  a revisar o nome ou buscar outra localização, com `role="status"`.

Os três componentes são apenas de apresentação. O consumidor deve renderizar
somente o estado correspondente à consulta e remover o carregamento ao terminar.

### Dados mock para desenvolver a UI

Os contratos estão em [src/types/weather.ts](src/types/weather.ts). Para
desenvolver componentes sem consultar a API, importe o objeto tipado:

```ts
import { mockWeatherData } from './src/mocks/weather';
```

Ajuste o caminho relativo ao arquivo consumidor. O mock exportado por
[src/mocks/weather.ts](src/mocks/weather.ts) contém São Paulo, condições atuais
e exatamente cinco dias de previsão (27 a 31 de outubro de 2026), com condições
WMO variadas. Os dados são fictícios e as datas são fixas para manter os testes
determinísticos; não representam o clima de hoje. Temperaturas estão em
Celsius, vento em km/h, precipitação em mm e pressão em hPa. O fuso é
`America/Sao_Paulo`; campos meteorológicos indisponíveis aceitam `null` nos
contratos. O mock não faz requisições e não é conectado automaticamente à UI.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
