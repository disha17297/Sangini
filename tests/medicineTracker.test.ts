import { describe, it, expect } from "vitest";
import { Medicine } from "../src/types";

function calculateAdherence(medicines: Medicine[]): number {
  if (medicines.length === 0) return 100;
  const takenCount = medicines.filter((m) => m.takenToday).length;
  return Math.round((takenCount / medicines.length) * 100);
}

describe("Medicine Tracker & Adherence Engine", () => {
  const sampleMeds: Medicine[] = [
    {
      id: "med-1",
      name: "Amlodipine",
      hindiName: "एम्लोडिपिन (ब्लड प्रेशर)",
      dosage: "5mg",
      timeOfDay: "morning",
      timeLabel: "Morning (8:00 AM)",
      takenToday: true,
      withFood: true,
      notes: "Take after breakfast with a glass of water",
    },
    {
      id: "med-2",
      name: "Metformin",
      hindiName: "मेटफॉर्मिन (शुगर)",
      dosage: "500mg",
      timeOfDay: "morning",
      timeLabel: "Morning (8:30 AM)",
      takenToday: false,
      withFood: true,
      notes: "Take with food",
    },
    {
      id: "med-3",
      name: "Shelcal 500",
      hindiName: "शेलकल (कैल्शियम)",
      dosage: "1 Tablet",
      timeOfDay: "afternoon",
      timeLabel: "Afternoon (1:30 PM)",
      takenToday: false,
      withFood: true,
      notes: "Take after lunch",
    },
  ];

  it("should calculate correct percentage of taken medications", () => {
    // 1 of 3 is taken -> 33%
    const rate = calculateAdherence(sampleMeds);
    expect(rate).toBe(33);
  });

  it("should return 100% when all medications are marked taken", () => {
    const allTaken = sampleMeds.map((m) => ({ ...m, takenToday: true }));
    expect(calculateAdherence(allTaken)).toBe(100);
  });

  it("should correctly group medicines by time slots", () => {
    const morningMeds = sampleMeds.filter((m) => m.timeOfDay === "morning");
    const afternoonMeds = sampleMeds.filter((m) => m.timeOfDay === "afternoon");

    expect(morningMeds.length).toBe(2);
    expect(afternoonMeds.length).toBe(1);
  });

  it("should provide bilingual names and details for each medicine", () => {
    for (const med of sampleMeds) {
      expect(med.name).toBeTruthy();
      expect(med.hindiName).toBeTruthy();
      expect(med.dosage).toBeTruthy();
      expect(med.timeLabel).toBeTruthy();
    }
  });
});

