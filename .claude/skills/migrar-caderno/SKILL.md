---
name: migrar-caderno
description: Converte um caderno em uma lente do wiki. Para cada conceito que
  já tem verbete em docs/conceitos/, substitui a redefinição inline por um
  wikilink, preservando o ângulo único do caderno. Invocar explicitamente,
  passando o caminho do caderno.
---
# Procedimento — migrar $ARGUMENTS

Trabalhe SOMENTE no caderno indicado em $ARGUMENTS. Um caderno por invocação.

1. Liste os conceitos do `_moc.md` e ache cada ocorrência no caderno.
2. Para cada ocorrência:
   - Se o caderno apenas REDESCREVE o conceito → troque o trecho por [[slug]],
     mantendo só a frase de transição que dá o ângulo daquele nível.
   - Se o trecho é o lugar CANÔNICO do conteúdo (ex.: a matemática do RBSR no
     protocol) → NÃO mova; em vez disso, garanta que o verbete linke para cá.
3. Conteúdo normativo (crypto, invariantes, fórmulas, assinaturas): nunca
   parafraseie de memória. Mova o texto literal ou linke; não reescreva.
4. Não deixe definição duplicada "por segurança" — o git guarda o histórico.
5. Commit único com mensagem "wiki: migra <caderno> para lente".
6. Ao terminar, peça a verificação com o subagent auditor-wiki.
