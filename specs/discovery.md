# Discovery — Weather App

## Contexto

A empresa solicitou uma aplicação web de previsão do tempo. O briefing pede busca de cidades, consulta do clima atual, previsão para cinco dias, alternância entre Celsius e Fahrenheit e uso em dispositivos móveis. Já foram acordados Open-Meteo como fonte, hoje mais os quatro dias seguintes como período da previsão, Celsius como unidade inicial, ausência de autenticação e persistência em servidor e interface em pt-BR.

Ainda precisam ser definidos o conteúdo meteorológico exibido, a granularidade da previsão, a experiência de busca e a resposta a falhas. Este discovery registra essas lacunas para que a especificação não precise presumir comportamentos de produto.

## Requisitos Funcionais

- Permitir que o usuário pesquise e selecione uma cidade.
- Exibir os dados de clima atual para a cidade selecionada; os campos que compõem essa informação ainda precisam ser definidos.
- Exibir a previsão para hoje e os quatro dias seguintes; a granularidade (diária ou horária) ainda precisa ser definida.
- Permitir alternar a unidade de temperatura entre Celsius e Fahrenheit.
- Comunicar estados de carregamento, busca sem resultados e falha ao consultar os dados; o comportamento de nova tentativa e de dados em cache ainda precisa ser definido.

## Requisitos Não-Funcionais

- **Responsividade:** como meta inicial a validar na especificação, os fluxos principais devem funcionar em viewports de 320 px, 768 px e 1280 px, sem rolagem horizontal nem controles inacessíveis.
- **Acessibilidade:** como meta inicial, os fluxos principais devem ser operáveis por teclado, ter nomes acessíveis nos controles e atender ao WCAG 2.2 nível AA; o escopo de conformidade precisa ser confirmado.
- **Desempenho:** medir o tempo entre a ação de busca e a exibição dos resultados, separando o tempo da interface do tempo da API. Uma meta provisória é p95 de até 2 s em condições de rede definidas; confirmar ou ajustar antes de aprovar a spec.
- **Resiliência:** durante consultas, apresentar feedback de carregamento; em falhas, informar o problema e oferecer um próximo passo. Não apresentar dados em cache como atuais sem indicar sua data/hora.
- **Compatibilidade:** definir e testar a matriz de navegadores e versões suportados antes de fechar os critérios de aceite.
- **Privacidade:** se geolocalização for incluída, solicitar permissão antes de acessar a posição e não persistir a localização sem decisão explícita.
- **Disponibilidade:** definir uma meta para a aplicação e esclarecer como a dependência da Open-Meteo será tratada; o serviço externo não está sob controle da aplicação.

## Riscos

As probabilidades são estimativas iniciais e devem ser revistas conforme a solução técnica for definida.

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Indisponibilidade, lentidão ou limite de requisições da Open-Meteo. | Média | Alto: consultas podem falhar ou demorar. | Tratar timeout e erros, evitar chamadas redundantes e definir nova tentativa e eventual cache; indicar a atualização dos dados em cache. |
| Cidades homônimas ou resultados de busca imprecisos. | Média | Alto: o usuário pode consultar o local errado. | Definir atributos de desambiguação e apresentá-los antes da seleção. |
| Dados desatualizados ou horário interpretado no fuso errado. | Média | Alto: a previsão pode parecer atual ou pertencer a outro dia quando não corresponde à expectativa. | Definir fuso de exibição, apresentar data/hora da atualização e não ocultar o caráter antigo de dados em cache. |
| Erro na conversão ou nos rótulos de Celsius/Fahrenheit. | Baixa | Médio: o usuário pode interpretar incorretamente as temperaturas. | Centralizar conversão e unidade selecionada; testar valores, arredondamento e rótulos. |
| Interface incompatível com alguns dispositivos, navegadores ou tecnologias assistivas. | Média | Alto: alguns usuários podem não conseguir concluir a consulta. | Definir matriz de suporte e critérios de acessibilidade; validar os fluxos nas combinações prioritárias. |
| Uso de geolocalização sem expectativa ou consentimento claro. | Baixa | Alto: pode comprometer privacidade e confiança. | Manter a busca manual funcional; caso geolocalização seja aprovada, pedir permissão e documentar o uso dos dados. |

## Perguntas em Aberto (Open Questions)

1. **Quais campos devem compor o clima atual e a previsão?**
   - Impacto: determina os dados solicitados à API, o modelo de dados e a hierarquia da interface.
2. **A previsão será diária, horária ou incluirá ambos os formatos?**
   - Impacto: altera a quantidade de informação, os endpoints/parâmetros necessários e a organização da interface.
3. **Quais atributos devem distinguir cidades homônimas, e como o usuário confirma a seleção?**
   - Impacto: sem desambiguação adequada, a previsão pode corresponder a outra localização.
4. **A geolocalização será oferecida além da busca manual?**
   - Impacto: afeta o fluxo inicial, permissões e tratamento de localização; a busca manual deve continuar disponível.
5. **O usuário poderá manter uma unidade escolhida após recarregar o app?**
   - Impacto: determina se haverá persistência local; a decisão de não persistir dados em servidor não responde a essa questão.
6. **Como devem funcionar nova tentativa e cache quando a rede ou a Open-Meteo falhar?**
   - Impacto: afeta a experiência durante indisponibilidade e o risco de mostrar dados desatualizados.
7. **Qual fuso horário deve ser usado e como será indicada a hora de atualização?**
   - Impacto: pode levar a datas diárias incorretas para cidades em outros fusos e dificulta avaliar a atualidade dos dados.
8. **Qual matriz de navegadores e versões será suportada?**
   - Impacto: sem esse limite, compatibilidade não pode ser verificada de forma objetiva.
9. **As metas provisórias de acessibilidade, responsividade e desempenho são aceitáveis?**
   - Impacto: metas não aprovadas podem gerar critérios de aceite inadequados ou retrabalho na interface.
10. **Qual meta de disponibilidade se aplica à aplicação, considerando a dependência externa?**
    - Impacto: sem separar disponibilidade da aplicação e do provedor, não é possível definir expectativa de serviço ou contingência.
11. **Quais formatos de data, hora e número devem ser usados além do idioma pt-BR?**
    - Impacto: afeta localização, legibilidade e consistência dos dados apresentados.

## Suposições

- O produto será uma aplicação web responsiva; o briefing não solicita aplicativos nativos.
- A busca manual por cidade estará disponível sem exigir permissão de geolocalização.
- A aplicação depende da Open-Meteo para geocodificação e dados meteorológicos.
- Os alvos numéricos de desempenho e a matriz de compatibilidade são provisórios até serem aprovados na especificação.
- Não haverá autenticação nem persistência em servidor; persistência local de preferências ainda está em aberto.

## Personas

- **Pessoa que planeja atividades da semana:** consulta no desktop ou celular para decidir quando realizar atividades ao ar livre. **Sinal de sucesso:** consegue identificar um dia adequado no período exibido sem consultar outra fonte; definir meta quantitativa em pesquisa com usuários.
- **Pessoa que decide o que vestir no dia:** consulta o clima atual pelo celular antes de sair. **Sinal de sucesso:** identifica rapidamente temperatura, condição e unidade sem confundir a cidade ou o horário.
- **Pessoa viajante:** pesquisa no desktop durante o planejamento e no celular durante a viagem. **Sinal de sucesso:** seleciona a cidade correta entre resultados semelhantes e vê dados associados à localização escolhida.

## Decisões

| Tema | Decisão | Justificativa | Pergunta ou lacuna resolvida |
|---|---|---|---|
| Fonte de dados | Usar Open-Meteo, sem necessidade de API key. | Permite consultar geocodificação e previsão sem exigir uma chave de API na configuração do projeto. | Qual fonte fornecerá geocodificação e dados meteorológicos? É necessária uma API key? |
| Período da previsão | Interpretar cinco dias como hoje mais os quatro dias seguintes. | Define o intervalo do produto e dos critérios de aceite; não define se os dados serão diários ou horários. | Os cinco dias incluem hoje ou começam no dia seguinte? |
| Unidade padrão | Celsius. | Define uma apresentação inicial previsível, mantendo disponível a alternância para Fahrenheit. | Qual unidade será exibida inicialmente? |
| Autenticação e persistência | Não haverá autenticação nem persistência de dados em servidor. | Mantém o escopo focado na consulta meteorológica e evita criar contas ou backend de armazenamento. Persistência local de preferências não está decidida. | O app exigirá autenticação ou armazenará dados do usuário em servidor? |
| Idioma | A interface será em pt-BR. | Alinha textos e experiência ao idioma definido para o treinamento. | Em qual idioma a interface será apresentada? |
