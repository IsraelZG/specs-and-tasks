import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { App } from "../src/App.js";

describe("App (Bancada shell)", () => {
  it("renderiza os 6 botoes de aba com labels exatos", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Identidade" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rede" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Auth" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dados" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cenários" })).toBeInTheDocument();
  });

  it("aba ativa default eh Identidade", () => {
    render(<App />);
    const identidadeBtn = screen.getByRole("button", { name: "Identidade" });
    expect(identidadeBtn.className).toContain("active");
  });

  it("clique no botao Rede troca para aba Rede", () => {
    render(<App />);
    const redeBtn = screen.getByRole("button", { name: "Rede" });
    fireEvent.click(redeBtn);
    expect(redeBtn.className).toContain("active");
    expect(screen.getByRole("button", { name: "Identidade" }).className).not.toContain("active");
  });

  it("cada aba placeholder renderiza texto Em Construção", () => {
    render(<App />);
    expect(screen.getByText("Em Construção")).toBeInTheDocument();
  });

  it("botao Reset deste peer esta presente e visivel", () => {
    render(<App />);
    const resetBtn = screen.getByRole("button", { name: /Reset deste peer/ });
    expect(resetBtn).toBeInTheDocument();
    expect(resetBtn).toBeVisible();
  });

  it("useBancadaReset define window.__bancada.reset", () => {
    render(<App />);
    expect(window.__bancada).toBeDefined();
    expect(typeof window.__bancada.reset).toBe("function");
  });
});
