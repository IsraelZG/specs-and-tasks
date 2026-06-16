---
name: profile-de-modulo
title: "Profile de Módulo (Delegado Compartimentado)"
aliases: ["profile de módulo", "módulo-profile", "delegado de módulo", "delegado compartimentado"]
tags: [governance, modulos, segurança]
---

# Profile de Módulo

## Definição

Não existe um profile de sistema global com acesso irrestrito. Cada par **(usuário × módulo)** possui um **profile-delegado** próprio, escopado por um `ASSET:ROLE` restrito aos dados daquele usuário naquele módulo específico. Operações cross-user rodam estritamente com as permissões de leitura do próprio usuário solicitante. O contrato completo está em `caderno-4-governance/02b-modulos-profiles-mensageria.md §3`.

## Ver também
- [[modulo-lente-e-ator]] — O módulo como ator com profile
- [[agente-de-ia]] — Também atua via delegação de persona
- [[modalidade-de-rede]] — Governa a visibilidade e auditoria de perfis em implementações gerenciadas
