/**
 * Casos E2E Playwright — dependentes de T-008 (shell da Bancada).
 * Requer: Playwright configurado + `playwright` como devDependency.
 * Gate pendente até T-008 `done`.
 *
 * Para rodar: pnpm --filter bancada test:e2e
 */
import { test, expect } from "@playwright/test";

test.describe("Reset Local do Peer (E2E)", () => {
  test("8: cria dado em OPFS, chama window.__bancada.reset(), verifica limpeza", async ({
    page,
  }) => {
    await page.goto("/");

    // Cria arquivo em OPFS
    await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      const file = await root.getFileHandle("test.txt", { create: true });
      const writable = await file.createWritable();
      await writable.write("dados de teste");
      await writable.close();
    });

    // Verifica que o arquivo existe
    const existsBefore = await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      try {
        await root.getFileHandle("test.txt");
        return true;
      } catch {
        return false;
      }
    });
    expect(existsBefore).toBe(true);

    // Aciona reset via window.__bancada
    await page.evaluate(() => window.__bancada.reset());

    // Verifica que OPFS está vazio após reset
    const existsAfter = await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      try {
        await root.getFileHandle("test.txt");
        return true;
      } catch {
        return false;
      }
    });
    expect(existsAfter).toBe(false);
  });

  test("9: botão Reset deste peer visível e funcional", async ({ page }) => {
    await page.goto("/");

    const button = page.getByRole("button", { name: "Reset deste peer" });
    await expect(button).toBeVisible();

    // Cria dado em OPFS antes de resetar via botão
    await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      const file = await root.getFileHandle("draft.md", { create: true });
      const writable = await file.createWritable();
      await writable.write("rascunho");
      await writable.close();
    });

    await button.click();

    // Aguarda botão voltar a estado não-disabled (reset concluído)
    await expect(button).toBeEnabled();

    // Verifica limpeza
    const existsAfter = await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      try {
        await root.getFileHandle("draft.md");
        return true;
      } catch {
        return false;
      }
    });
    expect(existsAfter).toBe(false);
  });
});
