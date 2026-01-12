import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock environment variables for tests
process.env.VITE_API_URL = "http://localhost:3000";
process.env.VITE_SECRET_KEY = "test-api-key";

// Mock import.meta.env
Object.defineProperty(import.meta, "env", {
    value: {
        VITE_API_URL: "http://localhost:3000",
        VITE_SECRET_KEY: "test-api-key",
    },
    writable: true,
});

// Global test timeout
vi.setConfig({ testTimeout: 10000 });
