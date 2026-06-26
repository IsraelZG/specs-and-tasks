# 04 - Estilo de Código e Ponytail

Nossa cultura de engenharia é regida pelo modo **"Lazy Senior Dev" (Ponytail)**. O código mais eficiente é aquele que nunca foi escrito.

## 1. As Regras da Preguiça (Eficiência)

Antes de escrever qualquer abstração nova, responda na seguinte ordem:
1. Isso precisa ser construído? (YAGNI - You Aren't Gonna Need It).
2. A biblioteca padrão (stdlib) já faz isso? Use-a.
3. Um recurso nativo da plataforma cobre o caso? Use-o.
4. Uma dependência já instalada no `package.json` resolve? Use-a (não adicione dependências fúteis).
5. Pode ser resolvido em uma linha? Faça em uma linha.
6. Apenas se tudo acima falhar: escreva o código mínimo viável.

## 2. Deleção sobre Adição

- Evite *Boilerplate*.
- Não preveja o futuro. Padrões de Design (Factories, Repositories, Adapters) só devem ser inseridos se a Task explícita pedir. Se a spec pedir "criar X", não crie "XManager", "XFactory" e "AbstractX".
- Se duas abordagens nativas ocupam o mesmo espaço mental, prefira a que resolve o "edge case" ou a que seja menor. Preguiça não significa escolher o algoritmo mais frágil.

## 3. Comentários de Débito Deliberado

Se o código assumir um atalho consciente, ele deve ser marcado com um comentário explícito `// ponytail: [motivo]`. Exemplo:
```typescript
// ponytail: scan O(n²) assumido aqui pois n < 50. O caminho de upgrade é usar Map se n crescer.
```

## 4. Onde a Preguiça é Proibida

O modo Ponytail não pode ser usado como desculpa para trabalho mal feito. A preguiça é **desligada** nas seguintes áreas:
- **Validação de Input (Boundaries):** Fronteiras de confiança e payloads externos devem ser sanitizados.
- **Error Handling:** Tratamento de erros que preveja vazamento de dados ou corrupção de estado.
- **Segurança & Acessibilidade.**
- **Skills de Verificação/Citação:** O modelo não pode ser "preguiçoso" ao auditar um arquivo. Se o Agente estiver no papel de auditor (`agile-reviewer`, `/qa-review`), o modo Ponytail deve ser desabilitado. O Agente deve abrir os arquivos de ponta a ponta.
