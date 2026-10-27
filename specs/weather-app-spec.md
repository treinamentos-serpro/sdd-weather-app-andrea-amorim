# Especificação de Produto — Weather App

## Overview

Aplicação web responsiva, em pt-BR, para pesquisar uma cidade e consultar seu
clima atual e a previsão de hoje mais os quatro dias seguintes. O usuário pode
alternar temperaturas entre Celsius e Fahrenheit. A fonte de geocodificação e
dados meteorológicos é a Open-Meteo; não há autenticação.

**Status:** módulo 3 concluído. A spec contém a definição inicial do produto,
requisitos, histórias, critérios de aceite, casos de borda, riscos e escopo. As
perguntas abertas são pendências intencionais para refinamento nos módulos
seguintes; este status não declara a especificação pronta para produção.

## Functional Requirements

- **RF1 — Buscar e selecionar cidade:** permitir que o usuário pesquise cidades
  por texto e selecione a localização desejada entre os resultados.
- **RF2 — Consultar clima atual:** após a seleção de uma cidade, consultar e
  apresentar os dados de clima atual correspondentes à localização selecionada.
  Os campos exibidos serão definidos em OQ1.
- **RF3 — Consultar previsão de cinco dias:** apresentar a previsão para hoje e
  os quatro dias seguintes. A granularidade será definida em OQ2.
- **RF4 — Alternar unidade de temperatura:** permitir alternar entre Celsius e
  Fahrenheit em todos os valores de temperatura visíveis. Celsius é a unidade
  inicial quando não há preferência anterior; alternar unidade não deve
  solicitar novamente os dados meteorológicos.
- **RF5 — Comunicar estados da consulta:** apresentar estados de carregamento,
  busca sem resultados e falha ao consultar os dados. O comportamento de nova
  tentativa e cache depende de OQ6.

## User Stories

- **US1** — Como pessoa que planeja atividades da semana, quero pesquisar uma
  cidade e selecioná-la para consultar a previsão do local onde pretendo
  realizar atividades. (RF1, RF3)
- **US2** — Como pessoa que planeja atividades da semana, quero ver a previsão
  de hoje e dos quatro dias seguintes para identificar um dia adequado para
  atividades ao ar livre na cidade selecionada. (RF1, RF3)
- **US3** — Como pessoa que decide o que vestir no dia, quero consultar o clima
  atual da cidade em que estou para me preparar antes de sair. (RF1, RF2)
- **US4** — Como pessoa que decide o que vestir no dia, quero alternar entre
  Celsius e Fahrenheit para interpretar a temperatura na unidade que prefiro.
  (RF4)
- **US5** — Como pessoa viajante, quero distinguir e selecionar a cidade correta
  entre resultados semelhantes para consultar o clima do destino planejado.
  (RF1, RF2)
- **US6** — Como pessoa viajante, quero saber quando uma consulta está carregando
  ou falhou para entender se os dados do destino estão disponíveis. (RF5)

## Acceptance Criteria

Os critérios usam respostas controladas e resultados observáveis. Critérios
marcados com OQ dependem de aprovação antes de virarem testes de aceite finais.

### RF1 — Buscar e selecionar cidade (US1, US3, US5)

- **AC1.1 — Given** a geocodificação retorna N cidades para um termo não vazio,
  **When** o usuário envia esse termo,
  **Then** a lista contém exatamente N resultados selecionáveis, cada um
  correspondente a um resultado da resposta.
- **AC1.2 — Given** a geocodificação retorna dois resultados distintos para o mesmo
  termo,
  **When** o usuário seleciona o segundo resultado,
  **Then** a cidade selecionada corresponde ao identificador/localização do
  segundo resultado. A opção apresenta os atributos de desambiguação aprovados
  em OQ3.
- **AC1.3 — Given** a geocodificação retorna zero resultados,
  **When** a busca termina,
  **Then** a interface apresenta o estado sem resultados e não inicia consulta
  meteorológica.
- **AC1.4 — Given** o campo contém uma string vazia ou apenas espaços,
  **When** o usuário aciona a busca,
  **Then** a interface não envia uma consulta de geocodificação e apresenta a
  orientação de que é necessário informar um termo.

### RF2 — Consultar clima atual (US3, US5)

- **AC2.1 — Given** a cidade selecionada tem a localização L e a resposta de clima atual
  contém os campos definidos em OQ1 com valores de teste conhecidos,
  **When** a consulta termina com sucesso,
  **Then** a consulta usa L e a interface identifica L e exibe, para cada campo
  aprovado em OQ1, o valor correspondente à resposta de teste.
- **AC2.2 — Given** a cidade A está exibida e o usuário seleciona a cidade B,
  **When** a resposta de clima atual de B é apresentada,
  **Then** a identificação exibida corresponde a B e os campos de clima atual
  aprovados em OQ1 correspondem à resposta de B, não à resposta de A.
- **AC2.3 — Given** a resposta omite um campo definido como esperado em OQ1,
  **When** os dados são apresentados,
  **Then** o campo ausente mostra “—”, os demais campos presentes mantêm seus
  valores e a tela continua utilizável.

### RF3 — Consultar previsão de cinco dias (US2)

- **AC3.1 — Given** o relógio de teste indica a data D no fuso definido em OQ7 e a
  resposta contém previsões para D até D+4,
  **When** a previsão é apresentada,
  **Then** ela cobre exatamente as cinco datas locais D, D+1, D+2, D+3 e D+4,
  sem incluir datas anteriores ou posteriores.
- **AC3.2 — Given** uma resposta de previsão contendo dados na granularidade aprovada em
  OQ2,
  **When** a previsão é apresentada,
  **Then** cada item renderizado corresponde a um dado da resposta nessa
  granularidade, sem substituir a granularidade por outra.
- **AC3.3 — Given** uma resposta de previsão sem um campo definido como esperado em OQ1,
  **When** a previsão é apresentada,
  **Then** o campo ausente mostra “—” e os demais valores disponíveis são
  exibidos sem interromper a previsão.

### RF4 — Alternar unidade de temperatura (US4)

- **AC4.1 — Given** não há unidade previamente selecionada,
  **When** uma temperatura é exibida,
  **Then** a unidade selecionada é Celsius e o rótulo identifica Celsius.
- **AC4.2 — Given** as temperaturas de teste incluem 0 °C, 100 °C e -40 °C,
  **When** o usuário seleciona Fahrenheit,
  **Then** todos os valores de temperatura visíveis são convertidos para 32 °F,
  212 °F e -40 °F, respectivamente, e os rótulos identificam Fahrenheit.
- **AC4.3 — Given** as temperaturas de teste incluem 32 °F, 212 °F e -40 °F,
  **When** o usuário seleciona Celsius,
  **Then** todos os valores de temperatura visíveis são convertidos para 0 °C,
  100 °C e -40 °C, respectivamente, e os rótulos identificam Celsius.
- **AC4.4 — Given** a tela exibe dados meteorológicos carregados,
  **When** o usuário alterna a unidade,
  **Then** os valores são convertidos sem uma nova requisição meteorológica.

### RF5 — Comunicar estados da consulta (US6)

- **AC5.1 — Given** uma consulta de geocodificação ou meteorológica permanece pendente,
  **When** a interface aguarda a resposta,
  **Then** o estado de carregamento é exibido até a consulta resolver ou falhar.
- **AC5.2 — Given** uma consulta pendente recebe uma resposta bem-sucedida,
  **When** a resposta é apresentada,
  **Then** o estado de carregamento não está mais visível.
- **AC5.3 — Given** a geocodificação responde com zero resultados,
  **When** a consulta termina,
  **Then** a interface exibe o estado sem resultados de RF1 e não exibe o estado
  de erro de serviço.
- **AC5.4 — Given** a geocodificação ou a consulta meteorológica responde com falha,
  **When** a falha é processada,
  **Then** a interface exibe uma mensagem de falha, encerra o estado de
  carregamento, não apresenta dados como atuais e mantém o erro distinguível do
  estado sem resultados. Nova tentativa e cache dependem de OQ6.

## Non-Functional Requirements

- **RNF1 — Responsividade:** em viewports de 320 px, 768 px e 1280 px, os fluxos de
  busca, seleção, consulta e troca de unidade não devem exigir rolagem
  horizontal; validar nas orientações suportadas após definição em OQ8/OQ9.
- **RNF2 — Acessibilidade:** os fluxos principais devem ser operáveis por teclado, ter
  foco visível e nomes acessíveis; loading, vazio, sucesso e erro devem ser
  comunicados a tecnologias assistivas. WCAG 2.2 AA é a meta proposta, sujeita
  à aprovação em OQ9.
- **RNF3 — Desempenho:** medir separadamente o tempo da interface e o tempo da API entre
  a ação de busca e a exibição dos resultados. A meta provisória é p95 de até
  2 segundos em condições de rede definidas; aprovar as condições e a meta em
  OQ9 antes de tratá-la como critério final.
- **RNF4 — Resiliência:** durante consultas, apresentar feedback de carregamento; em
  falhas, informar o problema e um próximo passo. Dados em cache, se aprovados,
  não podem ser apresentados como atuais sem indicação de data e hora.
- **RNF5 — Compatibilidade:** a matriz de navegadores e versões suportados deve ser
  definida e testada antes do fechamento dos critérios, conforme OQ8.
- **RNF6 — Privacidade:** a busca manual não deve depender de geolocalização. Se a
  geolocalização for aprovada, solicitar permissão antes de acessar a posição e
  não persistir a localização sem decisão explícita.
- **RNF7 — Disponibilidade:** a meta da aplicação e o tratamento da dependência da
  Open-Meteo precisam ser definidos em OQ10; a disponibilidade do provedor
  externo não é controlada pelo produto.
- **RNF8 — Idioma e localização:** a interface será em pt-BR. Formatos de data, hora e
  número ainda precisam ser definidos em OQ11.
- **RNF9 — Autenticação e persistência:** não exigir autenticação nem persistir dados
  em servidor. A persistência local da unidade selecionada permanece em aberto
  (OQ5).

## Edge Cases

| Caso | Comportamento esperado |
|---|---|
| Input vazio ou só com espaços | Não enviar requisição de geocodificação; manter a seleção atual inalterada e orientar o usuário a informar um termo. |
| Cidade inexistente ou geocoding sem resultados | Exibir o estado sem resultados; não iniciar consulta meteorológica nem substituir os dados da cidade atualmente selecionada. Não apresentar esse caso como falha de serviço. |
| Cidades homônimas ou resultados semelhantes | Permitir escolher um resultado individual; os atributos usados para distinguir as opções serão definidos em OQ3. |
| Caracteres especiais, acentos ou espaços no termo | Enviar o termo sem perda de caracteres (por exemplo, “São Paulo”) e exibir os resultados recebidos. A aplicação não deve presumir que o serviço encontrará equivalências sem acento. |
| Falha de API | Exibir uma mensagem de que a consulta falhou, encerrar o carregamento e não tratar ausência de resposta como ausência de resultados. Não apresentar dados antigos como atuais; nova tentativa e cache dependem de OQ6. |
| Timeout ou conexão interrompida | Encerrar o carregamento, exibir uma mensagem de falha e não apresentar a consulta como concluída. A duração limite e a ação de recuperação dependem de OQ6. |
| Resposta meteorológica parcial ou campo esperado ausente | Exibir os campos recebidos e, para cada campo esperado ausente, mostrar “—” como dado indisponível; não inventar valores nem interromper a apresentação. A lista de campos esperados depende de OQ1. |
| Mudança de cidade enquanto uma consulta anterior está pendente | Apresentar os dados associados à seleção atual; uma resposta anterior não pode ser identificada como pertencente à cidade recém-selecionada. |
| Dados pertencentes a data ou fuso diferente do usuário | Apresentar datas conforme o fuso e os formatos definidos em OQ7 e OQ11; até lá, essa interpretação permanece pendente. |
| Recarga após alteração da unidade | Aplicar a política de persistência local definida em OQ5; até a decisão, somente Celsius é garantido como padrão de uma sessão sem preferência disponível. |

## Assumptions

- O produto é uma aplicação web responsiva; o briefing não solicita aplicativos
  nativos.
- A busca manual por cidade estará disponível sem exigir permissão de
  geolocalização.
- Open-Meteo será a fonte de geocodificação e dados meteorológicos, sem
  necessidade de API key.
- A previsão cobre hoje mais os quatro dias seguintes; isso define o período,
  mas não sua granularidade.
- Celsius é a unidade inicial e Fahrenheit também estará disponível.
- A interface será em pt-BR.
- Não haverá autenticação nem persistência de dados em servidor.
- Persistência local de preferências, campos meteorológicos, granularidade e
  políticas de erro/cache não são presumidos; dependem das perguntas abertas.

## Risks

| Risco | Probabilidade inicial | Impacto | Mitigação |
|---|---|---|---|
| Indisponibilidade, lentidão ou limite de requisições da Open-Meteo | Média | Alto: consultas podem falhar ou demorar. | Definir timeout, nova tentativa e eventual cache; comunicar falhas e indicar a data/hora de dados antigos. |
| Cidades homônimas ou busca imprecisa | Média | Alto: consulta pode usar a localização errada. | Definir atributos de desambiguação e apresentá-los antes da seleção (OQ3). |
| Dados desatualizados ou horário interpretado no fuso errado | Média | Alto: informação pode parecer atual ou corresponder a outro dia. | Definir o fuso de exibição e comunicar a atualização dos dados (OQ6 e OQ7). |
| Erro de conversão ou rótulo entre Celsius e Fahrenheit | Baixa | Médio: temperatura pode ser interpretada incorretamente. | Verificar matematicamente conversões, valores exibidos e rótulos em ambas as unidades. |
| Incompatibilidade com dispositivos, navegadores ou tecnologias assistivas | Média | Alto: usuários podem não concluir a consulta. | Definir matriz de suporte e critérios de acessibilidade e validar os fluxos prioritários (OQ8 e OQ9). |
| Geolocalização sem expectativa ou consentimento claro | Baixa | Alto: risco à privacidade e à confiança. | Manter a busca manual; se geolocalização for aprovada, solicitar permissão e explicitar o uso da localização. |

## Out of Scope

- Aplicativos nativos para iOS ou Android.
- Autenticação, contas de usuário e persistência de dados em servidor.
- Geolocalização automática no escopo atualmente definido; eventual inclusão
  depende de decisão explícita em OQ4.
- Favoritos, histórico de consultas e sincronização entre dispositivos, não
  solicitados no discovery.
- Alertas, notificações push e recomendações de atividades, não solicitados no
  discovery.
- Idiomas diferentes de pt-BR.
- Garantir disponibilidade do serviço externo Open-Meteo.

## Open Questions

As perguntas abaixo permanecem abertas ao encerrar o módulo 3 e serão
respondidas durante os módulos seguintes, antes de implementar ou validar os
comportamentos afetados. Elas não impedem o fechamento deste módulo.

1. **OQ1 — Quais campos compõem o clima atual e a previsão?** Define quais dados
   serão solicitados, apresentados e tratados em respostas parciais.
2. **OQ2 — A previsão será diária, horária ou incluirá ambos os formatos?**
   Define a granularidade da experiência dentro do período já acordado de cinco
   dias.
3. **OQ3 — Quais atributos distinguem cidades homônimas e como a seleção será
   confirmada?** Afeta a identificação correta da localização.
4. **OQ4 — Geolocalização será oferecida além da busca manual?** Afeta o fluxo
   inicial, as permissões e o tratamento de localização. A busca manual deve
   continuar disponível.
5. **OQ5 — A unidade escolhida será mantida após recarregar a aplicação?**
   Define se haverá persistência local; persistência em servidor está fora do
   escopo.
6. **OQ6 — Como funcionarão nova tentativa, timeout e cache em falhas de rede ou
   da Open-Meteo?** Define recuperação, atualidade dos dados e mensagens de erro.
   Decisão parcial: geocodificação e forecast usam timeout de 10 segundos com
   `AbortController`. `AbortError` gera “A requisição demorou demais.” e falhas
   de rede geram “Falha de rede.”, ambas como `WeatherServiceError`. O timer é
   sempre limpo ao concluir o fetch. Retry e cache continuam pendentes.
7. **OQ7 — Qual fuso horário será usado e como será indicada a data/hora de
   atualização?** Afeta o significado de “hoje” e a interpretação da previsão.
8. **OQ8 — Qual matriz de navegadores e versões será suportada?** Sem essa
   decisão, compatibilidade não pode ser verificada objetivamente.
9. **OQ9 — As metas provisórias de acessibilidade, responsividade e desempenho
   são aceitáveis?** Para desempenho, também é necessário definir as condições
   de rede da medição.
10. **OQ10 — Qual meta de disponibilidade se aplica à aplicação e como será
    tratada a dependência da Open-Meteo?** O provedor externo não está sob
    controle do produto.
11. **OQ11 — Quais formatos de data, hora e número serão usados em pt-BR?** Afeta
    a legibilidade e a interpretação dos dados.

Os critérios vinculados a essas perguntas são uma base para refinamento. As
decisões aprovadas devem ser incorporadas à spec nos módulos correspondentes.

## Rastreabilidade

| User Story | Acceptance Criteria | Requisitos não funcionais relevantes |
|---|---|---|
| US1 — Pesquisar e selecionar cidade para consultar a previsão | AC1.1–AC1.4, AC3.1–AC3.2 | RNF1, RNF2, RNF3, RNF4, RNF5, RNF7, RNF8 |
| US2 — Consultar a previsão de cinco dias | AC1.1–AC1.2, AC3.1–AC3.3 | RNF1, RNF2, RNF3, RNF4, RNF5, RNF7, RNF8 |
| US3 — Consultar o clima atual da cidade | AC1.1–AC1.4, AC2.1–AC2.3 | RNF1, RNF2, RNF3, RNF4, RNF5, RNF7, RNF8 |
| US4 — Alternar Celsius e Fahrenheit | AC4.1–AC4.4 | RNF1, RNF2, RNF5, RNF9 |
| US5 — Distinguir e consultar a cidade de destino | AC1.1–AC1.2, AC2.1–AC2.2, AC5.1–AC5.4 | RNF1, RNF2, RNF3, RNF4, RNF5, RNF7, RNF8 |
| US6 — Entender carregamento ou falha da consulta | AC5.1–AC5.4 | RNF2, RNF4, RNF5, RNF7 |

RNF1–RNF9 estão definidos na seção **Non-Functional Requirements**. Os
identificadores ACx.y apontam para critérios dentro do bloco RFx correspondente.