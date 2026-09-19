import { describe, it, expect } from "vitest";
import { t } from "../src/translations";

describe("Translations & Localization", () => {
  it("should have the correct tagline in English", () => {
    expect(t.en.tagline).toBe("Har Kadam Aapke Saath");
    expect(t.en.appSubtitle).toContain("Har Kadam Aapke Saath");
  });

  it("should have the correct tagline in Hindi", () => {
    expect(t.hi.tagline).toBe("हर कदम आपके साथ");
    expect(t.hi.appSubtitle).toContain("हर कदम आपके साथ");
  });

  it("should have matching translation keys in both English and Hindi", () => {
    const enKeys = Object.keys(t.en).sort();
    const hiKeys = Object.keys(t.hi).sort();

    expect(enKeys).toEqual(hiKeys);
  });

  it("should have non-empty strings for all critical accessibility labels", () => {
    expect(t.en.readAloud).toBeTruthy();
    expect(t.hi.readAloud).toBeTruthy();
    expect(t.en.emergencySos).toBeTruthy();
    expect(t.hi.emergencySos).toBeTruthy();
    expect(t.en.textSize).toBeTruthy();
    expect(t.hi.textSize).toBeTruthy();
    expect(t.en.contrast).toBeTruthy();
    expect(t.hi.contrast).toBeTruthy();
  });

  it("should contain the 3 Golden Rules for senior digital safety in both languages", () => {
    expect(t.en.rule1).toContain("Never share an OTP");
    expect(t.hi.rule1).toContain("OTP");
    expect(t.en.rule2).toBeTruthy();
    expect(t.hi.rule2).toBeTruthy();
    expect(t.en.rule3).toBeTruthy();
    expect(t.hi.rule3).toBeTruthy();
  });
});
