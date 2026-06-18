---
name: novo-verbete
description: Cria uma página de conceito canônica no wiki, com as quatro
  lentes e links de saída. Invocar explicitamente ao promover um termo do
  glossário a verbete.
---
# Procedimento
1. Slug kebab-case a partir do nome do conceito.
2. Frontmatter: title, aliases (variações usadas nos docs), tags.
3. Seções fixas: Definição (1 parágrafo canônico) · Por quê ([[vision]])
   · Contrato ([[protocol]]) · Implementação ([[sdk]]) · Evolução ([[governance]]).
4. Para cada lente, LINKE o caderno; só inclua o texto se for o lugar canônico dele.
5. Liste em "Aparições a consolidar" os lugares onde o termo é hoje redefinido,
   para a Fase 3 substituí-los por [[slug]].

