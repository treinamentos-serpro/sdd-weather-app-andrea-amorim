Você é o Coding Agent do SDD Weather App. Execute somente a tarefa T-01:
definir os campos de clima, a granularidade da previsão e os atributos para
distinguir cidades homônimas. Atualize os documentos de especificação e plano
para que expressem as mesmas decisões.

## Arquivos de entrada e saída

Leia antes de editar:
- `tasks/weather-app-tasks.md` — tarefa T-01 e seus critérios de aceite.
- `specs/weather-app-spec.md` — requisitos, critérios de aceite e OQs.
- `plans/weather-app-plan.md` — contratos, parâmetros da API e estrutura proposta.

Altere somente:
- `specs/weather-app-spec.md`
- `plans/weather-app-plan.md`

Não altere código, testes, tarefas ou outros arquivos.

## Contexto do produto

O Weather App é uma SPA web responsiva em pt-BR. A pessoa pesquisa cidades,
escolhe um resultado e consulta o clima atual e a previsão de hoje mais os
quatro dias seguintes. A fonte de geocodificação e meteorologia é Open-Meteo.

RF1 exige busca e seleção de cidade. RF2 exige clima atual. RF3 exige previsão
para cinco dias. A lista de campos atuais ainda depende de OQ1, a granularidade
da previsão depende de OQ2 e os atributos para diferenciar cidades homônimas
dependem de OQ3. Os critérios AC1.2, AC2.1–AC2.3 e AC3.1–AC3.3 dependem dessas
decisões.

O plano já propõe um modelo de dados e parâmetros para geocodificação e
forecast, mas declara essas escolhas pendentes. Use essas propostas como ponto
de partida; confirme que são coerentes entre si e com os requisitos antes de
formalizá-las.

## Trabalho solicitado

1. Resolva OQ1, OQ2 e OQ3 com decisões explícitas, justificadas brevemente e
   compatíveis com o escopo atual.
2. Como baseline, considere manter as propostas existentes no plano:
   - **Clima atual:** temperatura, sensação térmica, umidade relativa, código
     WMO, precipitação, velocidade e direção do vento, pressão ao nível do mar
     e indicador dia/noite.
   - **Previsão:** código WMO, temperaturas mínima/máxima, precipitação
     acumulada e probabilidade máxima de precipitação.
   - **Granularidade:** previsão diária para hoje e os quatro dias seguintes.
   - **Desambiguação:** mostrar nome da cidade, região administrativa e país;
     cada resultado deve selecionar exatamente a localidade e coordenadas
     correspondentes. A ativação da opção individual de resultado confirma a
     seleção; não adicionar modal ou etapa extra sem requisito.
3. Se a análise do plano revelar uma razão concreta para não manter algum
   baseline, escolha a alternativa mais simples compatível com RF1–RF3, explique
   a razão nos documentos e atualize todos os contratos afetados. Não invente
   requisitos nem amplie o produto.
4. Atualize a spec: substitua o texto de OQ1–OQ3 por decisões resolvidas, ajuste
   os critérios de aceite afetados para que sejam testáveis e mantenha
   rastreabilidade entre RFs, ACs e decisões.
5. Atualize o plano de forma consistente, incluindo, onde aplicável:
   - tipos internos e campos normalizados;
   - campos e unidades pedidos à Open-Meteo;
   - mapeamentos das respostas;
   - apresentação/desambiguação dos resultados;
   - estratégia de fixture e cenários de teste derivados das decisões.
6. Remova a indicação de pendência de OQ1/OQ2/OQ3 apenas nos trechos afetados.
   Não altere a estrutura do backlog nem resolva outras perguntas abertas.

## Critérios de aceite verificáveis

- OQ1, OQ2 e OQ3 não aparecem mais como perguntas pendentes na spec: cada
  decisão está registrada explicitamente.
- Os campos de clima atual e forecast estão nomeados sem ambiguidade, com
  unidades e tratamento de campo ausente/null coerentes com AC2.3 e AC3.3.
- A granularidade da previsão está definida; se diária for mantida, o contrato
  descreve exatamente hoje e os quatro dias seguintes, coerente com AC3.1.
- Os atributos de desambiguação estão nomeados e os documentos explicam como
  a seleção identifica o resultado/localização exatos, coerente com AC1.2.
- Campos, granularidade e desambiguação descritos na spec e no plano coincidem.
  Não há divergência entre tipos internos, parâmetros da API e mapeamentos.
- RF1, RF2 e RF3 permanecem dentro do escopo atual. Não foram adicionadas
  funcionalidades sem requisito aprovado.
- OQ4–OQ11 permanecem pendentes/inalteradas, exceto referências estritamente
  necessárias para remover afirmações que ficaram incompatíveis com OQ1–OQ3.
- Nenhum arquivo fora dos dois documentos indicados foi alterado.

## Limites

- Esta tarefa é de decisão e documentação; não implemente `src/` nem `tests/`.
- Não resolva OQ4–OQ11, não acrescente persistência, geolocalização, cache,
  retry, backend ou autenticação.
- Não considere as propostas do plano aprovadas sem verificá-las contra a spec.
- Preserve o idioma pt-BR e a estrutura/estilo existentes nos documentos.

## Verificação e resposta final

- Revise os trechos relacionados na spec e no plano para confirmar consistência.
- Execute `git diff --check`.
- Não rode lint, build ou testes de código: a tarefa não altera código nem testes.
- Ao concluir, informe as decisões tomadas para OQ1–OQ3, os arquivos alterados,
  o resultado de `git diff --check` e qualquer OQ que permaneça pendente.