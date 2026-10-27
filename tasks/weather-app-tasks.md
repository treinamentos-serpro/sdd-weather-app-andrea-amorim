# Backlog de Tarefas — Weather App

Backlog derivado de [plano técnico](../plans/weather-app-plan.md) e
[especificação](../specs/weather-app-spec.md). A ordem das entregas segue
**decisões/tipos → funções puras → services → hook → componentes → integração
→ testes → hardening**. Cada dependência aponta para uma tarefa necessária e
concluída antes do início da tarefa dependente.

## Legenda de prioridade e tamanho

- **P0:** bloqueia a primeira entrega funcional do fluxo principal.
- **P1:** necessário para completar a cobertura de aceite e a qualidade antes
  de uma entrega estável.
- **P2:** decisão ou hardening que pode ser adiado sem bloquear a primeira
  demonstração, desde que o escopo correspondente permaneça fora da entrega.
- **P:** pequena, normalmente um arquivo e um comportamento/teste focado.
- **M:** média, envolve integração ou múltiplos cenários, ainda dentro do escopo
  de uma tarefa executável isoladamente.
- **G:** grande, abrange uma matriz ampla de validação ou várias condições de
  ambiente; considerar subdivisão caso seja atribuída a uma iteração curta.

As estimativas são relativas e indicam esforço/risco, não duração em horas.
Prioridade não substitui dependências: nenhuma tarefa dependente deve começar
antes de seus pré-requisitos.

## Entrega 1 — Decisões e contratos de tipos

### T-01 — Definir os campos e a granularidade do clima

- **Descrição:** Resolver OQ1, OQ2 e OQ3 para fixar os dados e a identificação
  das cidades usados por implementação e fixtures.
- **Critérios de aceite:**
  - OQ1 e OQ2 deixam de estar pendentes na spec e registram a lista nominal de
    campos atuais/forecast e a granularidade escolhida.
  - OQ3 deixa de estar pendente e registra os atributos exibidos para
    diferenciar cidades homônimas.
  - Os campos, granularidade e atributos no plano coincidem com as decisões da
    spec; não há campos ou experiências adicionais sem requisito aprovado.
- **Rastreabilidade:** OQ1, OQ2, OQ3; prepara AC1.2, AC2.1–AC2.3 e AC3.1–AC3.3.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`,
  `plans/weather-app-plan.md`.
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** M

### T-02 — Definir política de consulta e formatos locais

- **Descrição:** Resolver OQ6, OQ7 e OQ11 para erros, timeout, atualidade,
  fuso e formatos de data, hora e número.
- **Critérios de aceite:**
  - OQ6, OQ7 e OQ11 deixam de estar pendentes e cada decisão registra
    comportamentos e formatos concretos na spec.
  - Plano e spec concordam sobre timeout, cancelamento, recuperação, fuso e
    formatos; cache/retry só constam como comportamento se aprovados em OQ6.
- **Rastreabilidade:** OQ6, OQ7, OQ11; prepara AC3.1, AC5.4, RNF4 e RNF8.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`,
  `plans/weather-app-plan.md`.
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** M

### T-03 — Registrar decisões de escopo fora do fluxo principal

- **Descrição:** Resolver OQ4, OQ5 e OQ10, mantendo explícito se
  geolocalização, persistência local e metas de disponibilidade ficam fora do
  escopo.
- **Critérios de aceite:**
  - OQ4, OQ5 e OQ10 deixam de estar pendentes; cada uma registra decisão e
    impacto de escopo na spec.
  - O plano não inclui qualquer comportamento que a decisão correspondente
    tenha mantido fora de escopo.
- **Rastreabilidade:** OQ4, OQ5, OQ10; relacionadas a RNF7 e RNF9.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`,
  `plans/weather-app-plan.md`.
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** P

### T-04 — Definir critérios de compatibilidade e qualidade

- **Descrição:** Resolver OQ8 e OQ9 para que os testes de compatibilidade,
  acessibilidade, responsividade e desempenho tenham parâmetros aprovados.
- **Critérios de aceite:**
  - OQ8 e OQ9 deixam de estar pendentes; spec registra navegadores/versões,
    orientações suportadas, critérios de acessibilidade e metas/condições de
    medição de desempenho aprovados.
  - Plano relaciona cada critério aprovado a uma verificação automatizada ou
    identifica explicitamente o que exige verificação manual.
- **Rastreabilidade:** OQ8, OQ9; RNF1, RNF2, RNF3, RNF5.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`,
  `plans/weather-app-plan.md`.
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M

### T-05 — Definir os tipos de domínio meteorológico

- **Descrição:** Criar contratos TypeScript para cidade, unidade, clima,
  previsão e estados de consulta.
- **Critérios de aceite:**
  - TypeScript aceita os tipos de City, Unit, CurrentWeather, ForecastDay,
    WeatherData e QueryState descritos no plano atualizado por T-01.
  - Campos meteorológicos esperados aceitam `null`; QueryState discrimina
    `idle`, `loading`, `success`, `empty` e `error` sem estado impossível.
  - Tipos de temperatura são Celsius e tipos não importam React, `fetch` ou
    serviços.
- **Rastreabilidade:** AC2.1–AC2.3, AC3.1–AC3.3.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

## Entrega 2 — Funções puras

### T-06 — Implementar conversão de temperatura

- **Descrição:** Implementar conversão pura entre Celsius e Fahrenheit.
- **Critérios de aceite:**
  - `convertTemperature(0, "fahrenheit")` retorna 32;
    `convertTemperature(100, "fahrenheit")` retorna 212;
    `convertTemperature(-40, "fahrenheit")` retorna -40.
  - Conversão inversa de 32, 212 e -40 Fahrenheit retorna 0, 100 e -40 Celsius,
    respectivamente; `null` retorna indisponível.
  - A função é pura e não importa React, `fetch` ou serviços.
- **Rastreabilidade:** AC4.1–AC4.4.
- **Dependências:** T-05.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

### T-07 — Implementar formatação localizada

- **Descrição:** Implementar funções puras de formatação de data, hora e número
  conforme decisões aprovadas.
- **Critérios de aceite:**
  - Para cada formato aprovado em T-02, a função aceita o tipo de entrada
    definido e retorna exatamente o formato documentado na spec.
  - Valores ausentes não são formatados como valores numéricos ou datas válidos.
  - As funções são puras e não importam React, `fetch` ou serviços.
- **Rastreabilidade:** OQ7, OQ11; RNF8.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/localization.ts`.
- **Tipo:** Data
- **Prioridade:** P1
- **Tamanho:** P

## Entrega 3 — Services

### T-08 — Implementar geocodificação Open-Meteo

- **Descrição:** Implementar a busca de cidades e seu mapeamento para o tipo
  interno.
- **Critérios de aceite:**
  - `fetch` recebe GET para o endpoint de geocoding e query params `name`,
    `count`, `language` e `format` com os valores aprovados em T-01.
  - Um termo fixtureado como “São Paulo” chega ao parâmetro `name` sem perda
    de caracteres; cada resultado válido produz exatamente um `City` com
    coordenadas e atributos aprovados.
  - Resposta `results: []` retorna lista vazia; não lança erro.
- **Rastreabilidade:** AC1.1–AC1.3.
- **Dependências:** T-01, T-05.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-09 — Implementar consulta de forecast Open-Meteo

- **Descrição:** Implementar request meteorológico e mapeamento da resposta
  para os tipos internos aprovados.
- **Critérios de aceite:**
  - `fetch` recebe GET para forecast com latitude/longitude da cidade fornecida
    e todos os campos, granularidade, fuso e unidades aprovados em T-01/T-02.
  - Cada item de forecast mapeado conserva a associação por índice/data da
    fixture; campos esperados ausentes ou null resultam em `null`.
  - Resposta sem estrutura obrigatória aprovada (por exemplo `current` ou a
    estrutura de forecast decidida) é rejeitada como resposta inválida.
  - Cobrir todos os campos consumidos no inventário de nulabilidade da spec,
    incluindo arrays nulos/curtos, tipos incorretos, zeros e números não finitos.
    Validar datas antes de entregar a previsão aos componentes.
  - Formatadores e componentes não exibem NaN/undefined/infinito nem inventam
    zeros; testar medições ausentes em Celsius e Fahrenheit e data inválida
    recebida diretamente pelo card.
- **Rastreabilidade:** AC2.1–AC2.3, AC3.1–AC3.3.
- **Dependências:** T-01, T-02, T-05.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-10 — Implementar classificação de falhas e cancelamento

- **Descrição:** Tratar erros HTTP, rede, timeout, resposta inválida e
  cancelamento nas chamadas Open-Meteo.
- **Critérios de aceite:**
  - Testes com resposta fixtureada demonstram as classificações distintas para
    HTTP não-2xx, rejeição de rede, timeout e JSON/estrutura inválidos.
  - Cancelamento manual por troca de cidade não resulta em `QueryState.error`;
    timeout resulta no erro aprovado em T-02.
  - Mensagem exposta ao usuário não inclui corpo/payload retornado pelo provedor.
  - Recorte aprovado nesta implementação: usar `fetchJsonWithTimeout` nas duas
    consultas, com `AbortController` e prazo de 10 segundos até concluir a
    leitura do JSON; distinguir timeout, rede (inclusive corpo interrompido),
    HTTP e JSON inválido, limpando o timer no `finally`.
  - Mensagens amigáveis por categoria orientam a recuperação e o timeout
    informa o limite de 10 segundos. Cancelamento manual fica fora do recorte.
  - Validar com timers falsos o limite exato, corpo lento/interrompido e limpeza
    do timer em sucesso e falha, sem chamadas reais à API.
- **Rastreabilidade:** AC5.4; RNF4.
- **Dependências:** T-02, T-08, T-09.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 4 — Hook de orquestração

### Refinamento de UX de baixo risco

- Derivar `aria-busy` no conteúdo durante loading e devolver foco ao conteúdo
  após busca/seleção/retry, sem roubar foco de outro controle durante a espera.
- Aplicar hover somente em busca habilitada e preservar contraste no toggle
  selecionado. Validar loading, conclusão, troca de unidade e foco preservado
  com Vitest e Playwright.
- Não memoizar sem evidência de custo relevante; manter os formatadores Intl
  compartilhados existentes.

### T-11 — Orquestrar busca de cidades no hook

- **Descrição:** Implementar estado e ação de busca, incluindo validação,
  loading, vazio e erro.
- **Critérios de aceite:**
  - Testes de hook verificam estado inicial `idle`, transição para `loading` e
    resolução em `success`, `empty` ou `error`.
  - Termo `""` e `"   "` não chamam geocoding; cidade atualmente selecionada
    permanece igual.
  - Resposta de geocoding `[]` não chama forecast e não limpa cidade/dados já
    selecionados.
- **Rastreabilidade:** AC1.3–AC1.4, AC5.1–AC5.4.
- **Dependências:** T-05, T-08.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-12 — Orquestrar seleção e consulta meteorológica

- **Descrição:** Implementar seleção de cidade, consulta de forecast e
  invalidação de respostas obsoletas.
- **Critérios de aceite:**
  - Selecionar fixture de cidade B chama forecast com as coordenadas de B e
    coloca sua resposta em `success`.
  - Com requests de A e B pendentes, resolver B e depois A mantém B como cidade
    e dados exibidos.
  - Em falha para B, dados de A não permanecem apresentados como dados atuais.
  - O botão “Tentar novamente” repete a última busca completa ou apenas a
    consulta da cidade selecionada, com os mesmos argumentos, sem retry
    automático e sem aceitar resultados obsoletos.
  - Testes simulam rede offline na busca e no forecast, repetição de falha e
    recuperação pelo botão; loading não mantém dados antigos nem o botão.
- **Rastreabilidade:** AC2.1–AC2.3, AC3.1–AC3.3, AC5.1–AC5.4.
- **Dependências:** T-05, T-09, T-10, T-11.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-13 — Orquestrar a unidade de temperatura

- **Descrição:** Manter a unidade escolhida como estado de apresentação sem
  duplicar ou requisitar dados.
- **Critérios de aceite:**
  - Sem preferência, o estado inicial é `celsius`; a ação de alternância muda
    para `fahrenheit` e permite retornar a `celsius`.
  - Estado meteorológico permanece idêntico em Celsius antes e depois da troca.
  - Spy dos serviços registra zero chamadas adicionais na troca; não há
    armazenamento entre recargas sem aprovação em T-03.
- **Rastreabilidade:** AC4.1–AC4.4; RNF9.
- **Dependências:** T-06, T-12.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

## Entrega 5 — Componentes

### T-14 — Criar formulário de busca acessível

- **Descrição:** Implementar campo e envio de busca via props/callbacks, sem
  acesso a serviços.
- **Critérios de aceite:**
  - Testing Library localiza o campo e botão por label/nome acessível; ambos
    podem ser usados com `user-event` por teclado.
  - Submeter `""` ou `"   "` apresenta orientação e mantém callback não chamado.
  - Submeter `"São Paulo"` chama callback exatamente uma vez com o mesmo texto.
- **Rastreabilidade:** AC1.4, RNF2, RNF8.
- **Dependências:** T-03, T-11.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-15 — Criar lista de resultados de cidade

- **Descrição:** Apresentar resultados e encaminhar a seleção exata escolhida.
- **Critérios de aceite:**
  - Com fixture de N resultados, DOM contém exatamente N opções selecionáveis.
  - Para dois resultados homônimos, textos de desambiguação aprovados em T-01
    estão visíveis e são distinguíveis.
  - Ativar a segunda opção por teclado invoca callback uma vez com ID e
    coordenadas da segunda fixture.
- **Rastreabilidade:** AC1.1–AC1.2, RNF2.
- **Dependências:** T-01, T-05, T-11.
- **Arquivos prováveis:** `src/components/CityResults.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-16 — Criar apresentação acessível dos estados

- **Descrição:** Apresentar loading, vazio e erro sem confundir busca vazia com
  falha de serviço.
- **Critérios de aceite:**
  - Estado `loading` renderiza indicador com anúncio acessível; em
    success/error ele deixa de estar no DOM.
  - Estado `empty` e cada classe de erro apresentam mensagens distintas; texto
    de erro não contém payload fixtureado e inclui o próximo passo aprovado.
  - Loading, vazio e erro são localizáveis semanticamente por role ou live
    region.
- **Rastreabilidade:** AC5.1–AC5.4, RNF2, RNF4.
- **Dependências:** T-05, T-11, T-12.
- **Arquivos prováveis:** `src/components/QueryStatus.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-17 — Criar apresentação do clima atual

- **Descrição:** Renderizar cidade e campos atuais aprovados, com temperaturas
  na unidade recebida por props.
- **Critérios de aceite:**
  - Renderizar fixture de cidade/campos aprovados produz a identificação da
    cidade e o texto exato para cada valor presente.
  - Para cada campo null da fixture, aparece “—”; campos não nulos continuam
    presentes.
  - Casos 0 °C e 100 °C renderizados em Fahrenheit mostram 32 °F e 212 °F;
    rótulo corresponde à prop `unit`.
- **Rastreabilidade:** AC2.1–AC2.3, AC4.1–AC4.3.
- **Dependências:** T-05, T-06, T-12, T-13.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-18 — Criar apresentação da previsão

- **Descrição:** Renderizar o período e a granularidade aprovados para o
  forecast.
- **Critérios de aceite:**
  - Com relógio/fuso e fixture de T-01/T-02 fixos, são renderizadas exatamente
    as datas D, D+1, D+2, D+3 e D+4; nenhuma outra data aparece.
  - Em granularidade diária, cada um dos cinco dias aparece uma vez; em outra
    granularidade, o total e sequência renderizados correspondem à fixture
    aprovada em T-01.
  - Campos null exibem “—”, campos presentes exibem seus valores, e temperaturas
    usam formato e unidade passados por props.
- **Rastreabilidade:** AC3.1–AC3.3, AC4.1–AC4.3.
- **Dependências:** T-01, T-02, T-05, T-06, T-07, T-12, T-13.
- **Arquivos prováveis:** `src/components/Forecast.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-19 — Criar controle acessível de unidade

- **Descrição:** Implementar controle Celsius/Fahrenheit sem persistência
  implícita.
- **Critérios de aceite:**
  - Renderização sem preferência marca Celsius como selecionado e o anuncia
    no nome/estado acessível.
  - `user-event` consegue selecionar cada unidade por teclado;
    `document.activeElement` identifica o controle focado e o estilo mostra
    foco visível.
  - Seleção chama callback com `fahrenheit`/`celsius`; o componente não importa
    nem invoca serviço.
- **Rastreabilidade:** AC4.1–AC4.4, RNF2.
- **Dependências:** T-05, T-13.
- **Arquivos prováveis:** `src/components/TemperatureUnitToggle.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

## Entrega 6 — Integração da aplicação

### T-20 — Inicializar a aplicação e compor busca/seleção

- **Descrição:** Criar o shell executável da aplicação e ligar formulário,
  resultados e estados de busca às ações e dados do hook.
- **Critérios de aceite:**
  - O ponto de entrada Vite monta `App` sem erro e renderiza a área de busca
    antes de depender da implementação meteorológica completa.
  - Ao submeter termo fixtureado, App chama a ação do hook; resultado success
    apresenta opções e empty/error apresenta o estado correspondente.
  - Selecionar uma opção chama ação de seleção com a mesma cidade/ID da opção.
  - App e componentes não importam `src/services/openMeteo`.
- **Rastreabilidade:** AC1.1–AC1.4, AC5.1–AC5.4.
- **Dependências:** T-11, T-12, T-14, T-15, T-16.
- **Arquivos prováveis:** `src/app/App.tsx`, ponto de entrada Vite existente
  (por exemplo, `src/main.tsx`).
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-21 — Compor a apresentação meteorológica

- **Descrição:** Ligar seleção, consulta e estados meteorológicos à
  apresentação de clima atual e forecast.
- **Critérios de aceite:**
  - Estado success de fixture da cidade B renderiza B e os valores de B em
    CurrentWeather/Forecast.
  - Durante loading e error de B, UI não rotula dados anteriores de A como
    atuais; estado de erro fica visível e distinto.
  - Componentes de apresentação recebem dados/ações por props e não importam
    hook nem serviço.
- **Rastreabilidade:** AC2.1–AC2.3, AC3.1–AC3.3, AC5.4.
- **Dependências:** T-12, T-17, T-18, T-20.
- **Arquivos prováveis:** `src/app/App.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-22 — Integrar o controle de unidade à aplicação

- **Descrição:** Ligar o controle Celsius/Fahrenheit à aplicação já composta
  para busca e apresentação meteorológica.
- **Critérios de aceite:**
  - Com fixture de temperatura 0 °C e 100 °C, selecionar Fahrenheit mostra
    32 °F e 212 °F em todos os componentes de temperatura visíveis e não
    aumenta o contador de requests forecast.
  - Selecionar Celsius restaura 0 °C e 100 °C sem alterar os dados meteorológicos
    canônicos nem iniciar nova requisição.
  - Controle e valores apresentados são encontrados no DOM após a composição.
  - Não se adiciona backend, autenticação ou estado global.
- **Rastreabilidade:** RF4; AC4.1–AC4.4.
- **Dependências:** T-13, T-19, T-20, T-21.
- **Arquivos prováveis:** `src/app/App.tsx`.
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 7 — Testes

### T-23 — Testar conversão de temperatura

- **Descrição:** Criar testes unitários dedicados à conversão Celsius/Fahrenheit,
  sem interface ou rede.
- **Critérios de aceite:**
  - Vitest passa asserts exatos 0 °C → 32 °F, 100 °C → 212 °F e -40 °C → -40 °F,
    mais 32 °F → 0 °C, 212 °F → 100 °C e -40 °F → -40 °C.
  - Testes confirmam que `null` segue indisponível e que o valor de entrada
    continua igual após a conversão.
  - O arquivo roda sem DOM, rede ou mocks.
- **Rastreabilidade:** AC4.2–AC4.4.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-24 — Testar formatação localizada

- **Descrição:** Verificar os formatos determinísticos aprovados para a
  apresentação local.
- **Critérios de aceite:**
  - Para cada formato de data, hora e número decidido em T-02, existe ao menos
    um assert de saída literal, usando fixture fixa.
  - Há asserts para valores inválidos/ausentes conforme o contrato aprovado.
  - O arquivo roda sem DOM, rede ou mocks.
- **Rastreabilidade:** OQ7, OQ11; RNF8.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/lib/localization.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P


### T-25 — Testar o serviço de geocodificação

- **Descrição:** Criar testes unitários do service de geocoding com `fetch`
  mockado, sem chamadas à rede.
- **Critérios de aceite:**
  - Vitest verifica método, host/path e igualdade dos query params esperados
    para uma busca fixtureada, incluindo termo com acento.
  - Fixture com N resultados produz N cidades com os campos aprovados; fixture
    vazia produz `[]`.
  - O mock de `fetch` é configurado para cada resposta; nenhum teste acessa
    Open-Meteo real.
- **Rastreabilidade:** AC1.1–AC1.3.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/services/openMeteo.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-26 — Testar o serviço de previsão

- **Descrição:** Criar testes unitários do service de forecast com `fetch`
  mockado, sem chamadas à rede.
- **Critérios de aceite:**
  - Vitest compara URL/parâmetros da request com coordenadas e opções fixtureadas.
  - Fixture com pelo menos dois itens prova que datas e valores permanecem
    alinhados; fixture parcial prova `null` nos campos ausentes e preservação
    dos presentes.
  - Fixtures reproduzem a granularidade aprovada; o mock de `fetch` é usado em
    todos os cenários e nenhum teste chama API real.
  - Cobertura complementar: `daily.time` ausente, nulo, vazio, tipo incorreto
    ou com quatro datas produz `invalid-response`; E2E cobre também ausência
    de `current`/`daily`, erro amigável e recuperação pelo retry.
- **Rastreabilidade:** AC2.1–AC2.3, AC3.1–AC3.3.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/unit/services/openMeteo.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-27 — Testar falhas e cancelamento dos serviços

- **Descrição:** Testar classificação de falhas e cancelamento de requests.
- **Critérios de aceite:**
  - Existe ao menos um teste para HTTP não-2xx, rejeição de `fetch`, timeout,
    falha de parse/estrutura e cancelamento.
  - As expectativas verificam o tipo de erro aprovado para cada falha;
    cancelamento intencional não produz estado de erro.
  - `fetch` é mockado em todos os cenários.
- **Rastreabilidade:** AC5.4; RNF4.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/services/openMeteo.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-28 — Testar busca e estados no hook

- **Descrição:** Testar busca válida, inválida, vazia e falha do hook com
  serviço mockado.
- **Cobertura complementar dos edge cases:**
  - Vitest valida caracteres especiais no formulário e codificação da URL,
    incluindo acentos, apóstrofo, Unicode e caracteres reservados.
  - Playwright valida busca vazia/só espaços após sucesso sem nova requisição
    nem perda dos dados; `results` ausente ou vazio sem consultar forecast;
    caracteres especiais preservados até a API e resultados exibidos.
- **Pendência de aderência à spec:** o edge case de geocoding sem resultados
  pede preservar dados anteriores, mas `useWeather` e seu teste existente
  limpam esses dados. Os novos testes de resultado vazio partem de `idle`;
  não comprovam preservação após sucesso. Resolver a divergência de contrato
  antes de considerar esse requisito integralmente coberto.
- **Critérios de aceite:**
  - Testes verificam `idle → loading → success`, `idle → loading → empty` e
    `idle → loading → error`.
  - Buscas `""` e `"   "` produzem zero chamadas; resultado `[]` produz zero
    chamadas de forecast e mantém a cidade previamente selecionada.
  - Testes verificam a saída de loading no sucesso, vazio e erro.
- **Rastreabilidade:** AC1.3–AC1.4, AC5.1–AC5.4.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-29 — Testar seleção e concorrência no hook

- **Descrição:** Testar consulta da cidade selecionada e descarte de resposta
  obsoleta.
- **Critérios de aceite:**
  - Ao selecionar B, argumento de latitude/longitude do mock é igual às
    coordenadas fixtureadas de B e a UI-state associa a resposta a B.
  - Teste controla a ordem de resolução A/B; ao resolver A por último, estado
    selecionado e dados permanecem de B.
  - Em erro de B, estado não informa dados de A como atuais.
- **Rastreabilidade:** AC2.1–AC2.3, AC5.4.
- **Dependências:** T-12.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-30 — Testar unidade no hook

- **Descrição:** Garantir que a mudança de unidade não refaz consultas.
- **Critérios de aceite:**
  - Estado inicial verificado como Celsius; teste alterna para Fahrenheit e de
    volta para Celsius.
  - Contadores dos mocks de geocoding e forecast não aumentam em nenhuma troca.
  - Dados canônicos permanecem inalterados nos dois sentidos.
- **Rastreabilidade:** AC4.1–AC4.4.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P


### T-31 — Testar busca e seleção de cidades

- **Descrição:** Testar interação do formulário e da lista de resultados com
  Testing Library e `user-event`.
- **Critérios de aceite:**
  - CitySearch tem testes para submit `"São Paulo"`, `""` e `"   "`; CityResults
    com N opções renderiza N e seleção da segunda chama callback com a segunda
    entidade.
  - Testes usam queries por role/label e `user-event` para teclado.
- **Rastreabilidade:** AC1.1–AC1.4, RNF2.
- **Dependências:** T-14, T-15.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`,
  `tests/components/CityResults.test.tsx`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-32 — Testar apresentação dos estados

- **Descrição:** Criar testes de componente dedicados aos estados loading,
  erro e vazio.
- **Critérios de aceite:**
  - Teste de loading encontra o indicador acessível enquanto a consulta está
    pendente e confirma que ele desaparece ao resolver.
  - Teste de vazio encontra a mensagem sem resultados e confirma que a mensagem
    de erro não está presente.
  - Teste de erro encontra a mensagem de falha e confirma que a mensagem de
    vazio não está presente; os estados são localizáveis semanticamente.
- **Rastreabilidade:** AC5.1–AC5.4, RNF2.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/components/QueryStatus.test.tsx`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-33 — Testar apresentação do clima atual

- **Descrição:** Testar valores, cidade, indisponibilidade e unidade do clima
  atual.
- **Critérios de aceite:**
  - Com fixture conhecida, testes comparam texto renderizado com valor,
    cidade e unidade esperados.
  - Fixture com um campo null mostra “—” nesse campo e preserva ao menos um
    campo preenchido.
  - Fixture de temperaturas 0 °C/100 °C em Fahrenheit exibe 32 °F/212 °F.
- **Rastreabilidade:** AC2.1–AC2.3, AC4.1–AC4.3.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/components/CurrentWeather.test.tsx`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-34 — Testar apresentação da previsão

- **Descrição:** Testar período, granularidade, campos ausentes e temperaturas
  do forecast.
- **Critérios de aceite:**
  - Com relógio e fuso fixos, teste verifica o conjunto exato de datas D a D+4
    e ausência de itens externos ao período.
  - Teste compara quantidade/ordem dos itens à fixture da granularidade
    aprovada; campo null mostra “—”.
  - Casos 0 °C/100 °C exibem 32 °F/212 °F com unidade Fahrenheit.
- **Rastreabilidade:** AC3.1–AC3.3, AC4.1–AC4.3.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/components/Forecast.test.tsx`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-35 — Testar controle de unidade

- **Descrição:** Testar acessibilidade, teclado e mudança de unidade no
  controle.
- **Critérios de aceite:**
  - `user-event` seleciona Celsius e Fahrenheit somente pelo teclado e verifica
    o callback com cada valor.
  - Query semântica verifica o estado selecionado; teste de foco confirma que
    o controle recebe foco e que o estilo focado está aplicado.
- **Rastreabilidade:** AC4.1–AC4.4, RNF2.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/components/TemperatureUnitToggle.test.tsx`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P


### T-36 — Testar fluxo E2E de sucesso

- **Descrição:** Criar teste E2E dedicado ao fluxo principal em viewport desktop
  e mobile, com APIs interceptadas.
- **Critérios de aceite:**
  - Playwright executa busca, seleção, apresentação de clima e previsão, e
    alternância Celsius/Fahrenheit com fixture de duas cidades.
  - O cenário passa em viewport desktop e em viewport mobile de 320 px de
    largura; em ambos verifica cidade/valores e ausência de rolagem horizontal.
  - Alternar para Fahrenheit valida as conversões e não aumenta a contagem de
    requests forecast.
  - Rotas Open-Meteo são interceptadas; não há chamadas externas reais.
- **Rastreabilidade:** AC1.1–AC2.2, AC3.1–AC3.3, AC4.1–AC4.4.
- **Dependências:** T-22.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-37 — Testar cenário E2E sem resultados

- **Descrição:** Validar o fluxo de geocodificação bem-sucedida sem cidades.
- **Critérios de aceite:**
  - Fixture interceptada `results: []` faz Playwright encontrar a mensagem
    empty e não encontrar a mensagem de erro.
  - Contador da rota forecast permanece em zero; com uma cidade previamente
    selecionada, a seleção exibida não muda.
  - Nenhum request externo fica sem interceptação.
- **Rastreabilidade:** AC1.3, AC5.3.
- **Dependências:** T-22.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-38 — Testar falha de API ponta a ponta

- **Descrição:** Validar feedback de erro visível quando uma consulta falha.
- **Critérios de aceite:**
  - Resposta HTTP de falha interceptada resulta em mensagem de erro e ausência
    de indicador loading após resolução; estado empty não é exibido.
  - Com dados anteriores carregados, a falha seguinte não os identifica como
    atuais.
  - Nenhum request externo fica sem interceptação.
- **Rastreabilidade:** AC5.1–AC5.4.
- **Dependências:** T-22.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

## Entrega 8 — Hardening

### T-39 — Testar responsividade em viewports aprovados

- **Descrição:** Executar hardening E2E de responsividade para os três viewports
  previstos pela spec, além do fluxo mobile já coberto em T-36.
- **Critérios de aceite:**
  - Em cada viewport 320, 768 e 1280 px, `document.documentElement.scrollWidth`
    é menor ou igual a `window.innerWidth`.
  - Em cada viewport, busca, opção de cidade, resultado meteorológico e
    controle de unidade permanecem visíveis e o fluxo principal conclui.
  - Testes rodam nos navegadores definidos em T-04, ou listam os não
    executáveis por limitação documentada do ambiente.
- **Rastreabilidade:** RNF1, RNF5.
- **Dependências:** T-22, T-36.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Tipo:** Test
- **Prioridade:** P2
- **Tamanho:** G

### T-40 — Testar fluxo E2E por teclado

- **Descrição:** Verificar que o fluxo principal pode ser concluído sem mouse.
- **Critérios de aceite:**
  - Playwright conclui busca, seleção de resultado e alternância de unidade
    usando apenas teclas; verifica foco visível em cada controle.
  - Loading, empty e error são localizáveis por role/live region e têm nomes/
    mensagens não vazios.
  - Todas as rotas externas usadas no cenário estão interceptadas.
- **Rastreabilidade:** RNF2; AC1.1–AC1.4, AC5.1–AC5.4.
- **Dependências:** T-36, T-37, T-38.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M


## Sequência sugerida em fatias verticais

Priorize um fluxo utilizável em cada incremento, sem esperar por hardening não
bloqueante. A ordem abaixo mostra as tarefas que cada fatia consome; pré-
requisitos compartilhados são feitos uma vez.

1. **Preparação mínima:** T-01, T-02, T-05, T-08, T-09, T-10, T-11 e T-12.
   Fechar contratos e estabelecer geocodificação, seleção e estado da consulta.
2. **Fatia vertical 1 — pesquisar e escolher uma cidade:** T-14, T-15, T-16 e
   T-20, com testes T-25, T-28 e T-31. Resultado demonstrável: a pessoa digita
   uma cidade e vê/seleciona resultados com feedback de vazio e erro.
3. **Fatia vertical 2 — clima atual e previsão:** T-02, T-07, T-09, T-10,
   T-12, T-13, T-17, T-18 e T-21; verificar com T-24, T-26, T-27, T-29, T-33
   e T-34. Resultado demonstrável: selecionar cidade mostra dados atuais e
   previsão no período/granularidade aprovados.
4. **Fatia vertical 3 — alternância Celsius/Fahrenheit:** T-19 e T-22;
   verificar com T-23, T-30, T-35 e T-36. Confirmar que todas as temperaturas
   visíveis mudam e o contador de requests meteorológicos permanece igual.
5. **Hardening e release:** T-03 e T-04 conforme decisões de escopo, mais T-37
   a T-40. Aplicar retry/cache ou persistência somente se suas OQs aprovarem;
   fechar estados de falha E2E, responsividade, compatibilidade e teclado.

**Entrega incremental:** T-20 cria a aplicação executável junto à busca e
seleção, permitindo demonstrar a primeira fatia antes da integração do clima.
T-21 acrescenta a apresentação meteorológica; T-22 acrescenta a unidade. Os
testes unitários e de componentes podem acompanhar as implementações que
verificam; os E2E completos aguardam T-22.

## Rastreabilidade dos requisitos funcionais

| Requisito da spec | Tarefas de implementação | Tarefas de verificação | Cobertura / observação |
|---|---|---|---|
| **RF1 — Buscar e selecionar cidade** | T-08 geocodificação; T-11 busca no hook; T-14 formulário; T-15 resultados; T-20 composição da busca. | T-25 service de geocodificação; T-28 hook de busca; T-31 componentes de busca/seleção; T-36 fluxo E2E; T-37 cenário sem resultados. | Cobertura mapeada para AC1.1–AC1.4. |
| **RF2 — Consultar clima atual** | T-09 request e mapeamento meteorológico; T-12 seleção e consulta no hook; T-17 apresentação do clima atual; T-21 composição meteorológica. | T-26 service; T-29 seleção/concorrência no hook; T-33 componente de clima atual; T-36 fluxo E2E. | Cobertura mapeada para AC2.1–AC2.3. |
| **RF3 — Consultar previsão de cinco dias** | T-09 request e mapeamento da previsão; T-12 consulta no hook; T-18 apresentação da previsão; T-21 composição meteorológica. | T-26 service; T-29 hook; T-34 componente de previsão; T-36 fluxo E2E. | Cobertura mapeada para AC3.1–AC3.3; campos e granularidade aguardam OQ1/OQ2 (T-01), e fuso aguarda OQ7 (T-02). |
| **RF4 — Alternar unidade de temperatura** | T-06 conversão; T-13 unidade no hook; T-17/T-18 renderização das temperaturas; T-19 controle; T-22 composição. | T-23 testes unitários de conversão; T-30 hook; T-33/T-34 componentes; T-35 controle; T-36 fluxo E2E. | Cobertura mapeada para AC4.1–AC4.4; persistência após recarga depende de OQ5 e não faz parte do requisito garantido atualmente. |
| **RF5 — Comunicar estados da consulta** | T-10 classificação de falhas; T-11 estados da busca; T-12 estados da consulta meteorológica; T-16 apresentação dos estados; T-20/T-21 composição. | T-27 testes de falhas nos services; T-28 hook de busca; T-32 componente loading/erro/vazio; T-37 vazio E2E; T-38 falha E2E. | Cobertura mapeada para AC5.1–AC5.4. Política de retry/cache permanece condicionada à OQ6 (T-02). |

### Lacunas identificadas

- **RF1–RF5:** todos têm tarefas de implementação e verificação correspondentes
  para o escopo funcional atualmente definido.
- **Comportamento condicional de RF5:** a spec deixa retry/cache dependentes da
  OQ6. T-02 decide essa política, mas não há tarefa de implementação dedicada
  caso a decisão aprove retry ou cache; se isso for aprovado, adicionar as
  tarefas correspondentes antes de iniciar essa parte do requisito.
- **Detalhes ainda não decididos:** T-01 e T-02 são gates de decisão, não
  implementação; as tarefas consumidoras devem usar os campos, granularidade,
  fuso e formatos aprovados antes de fixar código e fixtures.
