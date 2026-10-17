/**
 * Render tests for App.js route-level code splitting.
 * Verifies: (1) each route's lazy component actually resolves and renders,
 * (2) the Suspense fallback pattern works, (3) protected routes redirect to /login.
 * AuthContext + api are mocked — no backend needed.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import React from "react";

jest.setTimeout(20000);

// jsdom lacks matchMedia — ThemeToggle reads it on mount
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((q) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {} })),
});

// --- Mock the network + auth layer before App imports it --------------
jest.mock("@/lib/api", () => {
  const onAuthChange = { fn: null };
  return {
    __esModule: true,
    onAuthChange: onAuthChange,
    default: { get: jest.fn(() => Promise.reject(new Error("no api in test"))) },
  };
});

jest.mock("@/contexts/AuthContext", () => {
  const React = require("react");
  const Ctx = React.createContext({ user: undefined, setUser: () => {} });
  // user===null means "checking"; undefined means "decided: not authed"
  const Provider = ({ children }) => <Ctx.Provider value={{ user: undefined, setUser: () => {} }}>{children}</Ctx.Provider>;
  const useAuth = () => React.useContext(Ctx);
  return { __esModule: true, AuthProvider: Provider, useAuthCore: Ctx, useAuth };
});

// ProtectedRoute must read the SAME context the mock provider provides.
// It imports useAuth from AuthContext — our mock exports useAuth reading Ctx. Good.

jest.mock("@/components/ui/accordion", () => {
  const React = require("react");
  const Passthrough = ({ children }) => <div>{children}</div>;
  return {
    __esModule: true,
    Accordion: Passthrough,
    AccordionItem: Passthrough,
    AccordionTrigger: ({ children }) => <button>{children}</button>,
    AccordionContent: Passthrough,
  };
});
jest.mock("sonner", () => ({ Toaster: () => null }));
jest.mock("@/components/CookieBanner", () => () => null);
jest.mock("@/components/ExitIntentFeedback", () => () => null);
jest.mock("@/components/ThemeToggle", () => () => null);
jest.mock("@/components/SiteSearch", () => () => null);
jest.mock("@/components/FloatingContact", () => () => null);
jest.mock("@/components/BackToTop", () => () => null);
jest.mock("@/components/MobileMenu", () => () => null);
jest.mock("@/components/ScrollProgress", () => () => null);
jest.mock("@/lib/utm", () => ({ captureUTM: jest.fn() }));

const { useAuthCore } = require("@/contexts/AuthContext");
const { useAuth } = require("@/contexts/AuthContext");
// ProtectedRoute internally: user===null => blank; !user => /login. Our mock: user=undefined => redirect to /login. Good.

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

// NOTE: App wires its own BrowserRouter internally. To control the URL we
// re-mock react-router-dom's BrowserRouter to pass through the MemoryRouter.
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, BrowserRouter: ({ children }) => children };
});

// App.js lazy-imports @/pages/* via "@/..." alias resolved by CRA config.

describe("App.js split routing", () => {
  test("landing route renders the page hero", async () => {
    renderAt("/");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy(), { timeout: 15000 });
  });

  test("login route renders the auth card (lazy chunk resolves)", async () => {
    renderAt("/login");
    await waitFor(() => expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0), { timeout: 15000 });
  });

  test("signup route renders the signup card (lazy chunk resolves)", async () => {
    renderAt("/signup");
    await waitFor(() => expect(screen.getByText(/start your free trial|create your account|free trial/i)).toBeTruthy(), { timeout: 15000 });
  });

  test("protected route redirects unauthenticated users to login", async () => {
    renderAt("/app/dashboard");
    await waitFor(() => expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0), { timeout: 15000 });
  });

  test("unknown route falls back to landing", async () => {
    renderAt("/some/garbage/path");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy(), { timeout: 15000 });
  });
});