import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import { generateSlots, toDateString, validateSlot } from "./slots";

const NOW = new Date("2030-01-01T00:00:00Z");

describe("toDateString", () => {
  it("assigns instants to the IST calendar day, not the UTC day", () => {
    expect(toDateString(new Date("2030-01-06T18:29:59Z"))).toBe("2030-01-06");
    expect(toDateString(new Date("2030-01-06T18:30:00Z"))).toBe("2030-01-07");
  });
});

describe("generateSlots", () => {
  it("returns 16 slots from 10:00 to 18:00 IST on a working day", () => {
    const slots = generateSlots("2030-01-07");
    expect(slots).toHaveLength(16);
    expect(slots[0].start.toISOString()).toBe("2030-01-07T04:30:00.000Z"); // 10:00 IST
    expect(slots[15].start.toISOString()).toBe("2030-01-07T12:00:00.000Z"); // 17:30 IST
    expect(slots[15].end.toISOString()).toBe("2030-01-07T12:30:00.000Z"); // 18:00 IST
  });

  it("returns no slots on Sunday", () => {
    expect(generateSlots("2030-01-06")).toEqual([]);
  });

  it("rejects malformed dates", () => {
    expect(() => generateSlots("2030-02-31")).toThrow(AppError);
    expect(() => generateSlots("07-01-2030")).toThrow(AppError);
  });
});

describe("validateSlot", () => {
  it("accepts a valid future slot and computes the end time", () => {
    const slot = validateSlot(new Date("2030-01-07T04:30:00Z"), NOW);
    expect(slot.end.toISOString()).toBe("2030-01-07T05:00:00.000Z");
  });

  it("accepts the last slot of the day (17:30 IST)", () => {
    expect(() => validateSlot(new Date("2030-01-07T12:00:00Z"), NOW)).not.toThrow();
  });

  it.each([
    ["before opening (09:30 IST)", "2030-01-07T04:00:00Z"],
    ["off the half hour (10:15 IST)", "2030-01-07T04:45:00Z"],
    ["at closing time (18:00 IST)", "2030-01-07T12:30:00Z"],
    ["on a Sunday", "2030-01-06T05:00:00Z"],
  ])("rejects %s", (_label, iso) => {
    expect(() => validateSlot(new Date(iso), NOW)).toThrow(AppError);
  });

  it("rejects past slots, including a slot starting exactly now", () => {
    const start = new Date("2030-01-07T04:30:00Z");
    expect(() => validateSlot(start, new Date("2030-01-07T05:00:00Z"))).toThrow(AppError);
    expect(() => validateSlot(start, start)).toThrow(AppError);
  });

  it("rejects an invalid date", () => {
    expect(() => validateSlot(new Date("nope"), NOW)).toThrow(AppError);
  });
});
