# Score Parça Reversa — Dashboard

Dashboard do Score Parça Reversa, com duas visões:

- **Visão do parceiro** (`?parceiro=CODIGO`): o parceiro vê só o próprio score, breakdown dos 3 pilares, evolução histórica, dicas de melhoria e o impacto na taxa. **Nunca vê dados de outros parceiros** — a filtragem acontece no servidor, não no navegador.
- **Visão interna** (`?admin=TOKEN`): ranking completo, impacto de receita da carteira, importação de dados e avisos de qualidade de dado.

As regras de nota e faixa (SLA 50%, Agendamento 20%, CSAT 30%, faixas 1-5, consequências de -2% a +2% na taxa) são o **padrão inicial**, mas ficaram configuráveis pela própria tela — veja a seção "Regras configuráveis" abaixo.

---

## Regras configuráveis

A visão interna tem uma aba **"Configurações"** onde dá pra editar, sem mexer em código:

- **Pesos de cada pilar** (SLA, Agendamento, CSAT) — precisam somar 100%, o formulário avisa em tempo real se não somarem.
- **Faixas de nota por pilar** — o % mínimo e máximo de cada nota (1 a 5) em SLA, Agendamento e CSAT.
- **Faixas do score final** — os intervalos de score, nome de cada faixa (Crítico, Insatisfatório, etc.), cor, e o ajuste de taxa em pontos percentuais (positivo = penalidade, negativo = benefício, zero = neutro).

Ao salvar, isso vira `data/config.json`, commitado no GitHub (mesmo mecanismo da importação de dados) — dispara um redeploy automático (~1 minuto). Se `data/config.json` não existir, o dashboard usa os valores oficiais padrão (`DEFAULT_CONFIG` em `src/scoring.js`). Um botão "Restaurar padrão oficial" na própria tela volta pra esses valores a qualquer momento.

A régua ativa (seja a padrão ou a personalizada) é a mesma usada em todo o dashboard — aba "Regras do Score", cálculo do ranking, e visão do parceiro. Não tem duas fontes de verdade.

Nomes de indicador, dicas de melhoria (aba "Como Melhorar" do parceiro) e os critérios de elegibilidade continuam fixos em texto — só a matemática (pesos/faixas/penalidades) é editável, porque só isso tem consequência direta na taxa cobrada.

## Como os dados chegam no dashboard

Não tem planilha "ao vivo" nem link de "Publicar na Web". Em vez disso, existe uma aba **"Importar Dados"** dentro da própria visão interna, com dois jeitos de enviar dado:

**Fluxo recomendado — modelo único:** clique em "Baixar modelo (.xlsx)" na própria tela, peça pro time preencher (já vem com a lista de parceiros, só falta preencher os números do mês), e suba o arquivo de volta na mesma tela. É uma linha por parceiro por mês — sem fórmula, sem nota, sem trimestre, só o dado bruto.

**Fluxo avançado (opcional):** dentro de "Avançado", ainda é possível importar direto das 3 planilhas cruas do Weekly Parça (Indicadores, Faturamento, Taxas), do jeito que era antes. Se você importar por ali, isso passa a valer no lugar do modelo único até você importar um modelo novo.

Por trás dos dois fluxos, o dashboard salva o(s) arquivo(s) no seu repositório do GitHub (pasta `data/`) — e como o Vercel já está conectado a esse repositório, isso dispara um **redeploy automático** (leva ~1 minuto). Depois disso, o dashboard já está servindo os dados novos pra todo mundo. O GitHub funciona como o "banco de dados" aqui — não existe outro serviço externo pra configurar.

### O modelo único (`public/modelo-score-parca.xlsx`)

Uma aba "Instruções" explicando cada coluna, e uma aba "Dados" com uma linha por parceiro (já preenchida com a carteira atual) para o time completar:

| Coluna | O que é |
|---|---|
| Parceiro | Nome do parceiro (não renomeie parceiros existentes — muda o código gerado) |
| Mes | Mês de referência, formato AAAA-MM |
| Faturamento_mes | Faturamento do parceiro no mês, em R$ |
| SLA_pct | % de SLA de coleta do mês |
| Agendamento_pct | % de coletas com agendamento sistêmico do mês |
| CSAT_pct | % de CSAT (notas 4-5) do mês |
| Taxa_Base_pct | Taxa contratada do parceiro naquele mês, em % |
| Elegivel | SIM ou NAO (menu suspenso na própria célula) |

O dashboard calcula tudo o resto (nota por pilar, score do mês, score do trimestre ponderado por faturamento, faixa, impacto na taxa) — a planilha só precisa do dado bruto.

### As 3 fontes do fluxo avançado

O conversor (`src/lib/converterFontes.js`) espera:

1. **Indicadores**: aba do Weekly Parça, com os blocos mensais (JAN–DEZ) de SLA, "% coletas com agendamento sistêmico" e CSAT, por parceiro.
2. **Faturamento**: parceiro × mês, valor em R$.
3. **Taxas**: parceiro × mês, taxa contratada em %. Se um mês não tiver taxa própria, usa a última taxa disponível antes dele (carry-forward).

**Regra de integridade:** se SLA, Agendamento, CSAT ou a taxa de um parceiro não estiverem disponíveis para um mês, esse mês **é excluído** do cálculo do trimestre (nada é estimado ou inventado). Esses casos aparecem na aba "Qualidade de Dados".

**Ano considerado:** o dashboard só processa **meses de 2026** (constante `ANO_CONSIDERADO` em `src/lib/converterFontes.js`). Faturamento e Taxas não têm coluna de ano, então os meses deles são sempre tratados como 2026. Quando o ciclo virar (2027), troque o valor de `ANO_CONSIDERADO` no arquivo.

**Início do programa:** o score só é calculado a partir de **janeiro/2026** (constante `MES_INICIO_PROGRAMA`), mesmo que exista dado disponível para meses anteriores.

**Identificação do parceiro:** a planilha de Faturamento é a fonte "oficial" de quem é parceiro. O `Codigo` de cada parceiro é gerado automaticamente a partir do nome (ex. "Real Moweis" → `REAL_MOWEIS`). **Evite renomear parceiros nas planilhas** — isso muda o código gerado e quebra o link individual já enviado a ele.

**Elegibilidade:** nenhuma das 3 planilhas informa "meses de operação" ou "quantidade de coletas", então hoje todo parceiro é tratado como elegível (`SIM`) por padrão.

---

## 1. Subir o projeto para o GitHub

```bash
cd score-parca
git init
git add .
git commit -m "Score Parça Reversa - dashboard inicial"
git remote add origin https://github.com/SEU_USUARIO/score-parca.git
git branch -M main
git push -u origin main
```

(Alternativa sem terminal: crie o repositório vazio no site do GitHub e use "uploading an existing file" para arrastar o conteúdo da pasta.)

## 2. Gerar o GitHub Token (pro botão Importar funcionar)

1. No GitHub: **Settings → Developer settings → Fine-grained tokens → Generate new token**.
2. Dê um nome (ex. "score-parca-import"), defina expiração (ex. 1 ano).
3. Em **Repository access**, escolha "Only select repositories" e selecione `score-parca`.
4. Em **Permissions → Repository permissions**, defina **Contents: Read and write**.
5. Gere e copie o token (começa com `github_pat_...`) — você só vê ele uma vez.

## 3. Deploy no Vercel

1. No Vercel, **New Project** → importe o repositório `score-parca`.
2. Framework detectado: Vite (automático).
3. Em **Environment Variables**, adicione as 5 do `.env.example`:
   - `ADMIN_TOKEN` (uma senha só sua)
   - `GITHUB_TOKEN` (o token gerado no passo 2)
   - `GITHUB_OWNER` (seu usuário do GitHub)
   - `GITHUB_REPO` (`score-parca`)
   - `GITHUB_BRANCH` (`main`, ou deixe em branco)
4. Deploy.

## 4. Importar os dados pela primeira vez

1. Acesse `https://SEU-PROJETO.vercel.app/?admin=SUA_SENHA`.
2. Vá na aba **"Importar Dados"**.
3. Clique **"Baixar modelo (.xlsx)"**, preencha (ou peça pro time preencher) os dados do mês, e envie o arquivo de volta na mesma tela.
4. Clique **Importar**. Aguarde ~1 minuto e recarregue a página — os dados novos já devem aparecer.

## 5. Distribuir os links dos parceiros

Na aba "Visão Geral", clique **"Copiar link"** na linha de cada parceiro — gera algo como `https://SEU-PROJETO.vercel.app/?parceiro=CODIGO`. Envie individualmente. Esse link é fixo: quando você importar dados novos no próximo ciclo, ele automaticamente mostra os dados atualizados, sem precisar gerar um link novo.

---

## Atualizando a cada ciclo

1. Exporte as 3 planilhas como CSV de novo.
2. Vá em "Importar Dados" e suba os arquivos (pode subir só o que mudou).
3. Espere ~1 minuto e confira a aba "Qualidade de Dados" pra ver se algum parceiro ficou de fora por indicador incompleto.

Nada de código pra mexer nesse fluxo — só as regras de negócio (`src/scoring.js`) ou o formato das planilhas de origem (`src/lib/converterFontes.js`) exigem edição de código, e isso é raro.

## Stack

React 18 + Vite 5 + Recharts + PapaParse, funções serverless Vercel (`api/score.js`, `api/importar.js`) em Node, seguindo o mesmo padrão dos dashboards Weekly Parça e CSAT Parça. O GitHub Contents API é usado como armazenamento — sem banco de dados externo.
