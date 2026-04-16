import "@testing-library/jest-dom";
import { vi } from "vitest";

const tMock = vi.fn((key) => key);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: tMock,
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: "en"
    }
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {}
  }
}));
