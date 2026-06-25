import { test, expect } from "@playwright/test";

test.describe("Bancada smoke", () => {
  test("pagina carrega sem erros de console", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    expect(errors).toHaveLength(0);
  });

  test("manifest link presente no head", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('head link[rel="manifest"]');
    await expect(link).toHaveAttribute("href", "/manifest.json");
  });

  test("navegacao sequencial por todas as 6 abas nao dispara erro", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    const tabs = ["Identidade", "Rede", "Sync", "Auth", "Dados", "Cenários"];
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await expect(page.locator(`button.active:has-text("${tab}")`)).toBeVisible();
    }
    expect(errors).toHaveLength(0);
  });

  test("service worker registra com sucesso", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    const sw = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        return reg ? "registered" : "none";
      }
      return "unsupported";
    });
    expect(sw).toBe("registered");
  });

  test("manifest.json eh JSON valido com campos obrigatorios", async ({ page, request }) => {
    const resp = await request.get("/manifest.json");
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.name).toBe("Bancada");
    expect(json.short_name).toBe("Bancada");
    expect(json.start_url).toBe("/");
    expect(json.display).toBe("standalone");
    expect(Array.isArray(json.icons)).toBe(true);
    expect(json.icons.length).toBeGreaterThanOrEqual(1);
  });
});
