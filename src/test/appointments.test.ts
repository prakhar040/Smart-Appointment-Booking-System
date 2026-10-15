import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import { getAvailability } from "../services/appointments";
import { at, book, cancel, MONDAY, payload, slots, SUNDAY } from "./helpers";

let providerA: string;
let providerB: string;

beforeAll(async () => {
  const upsert = (name: string) =>
    prisma.provider.upsert({ where: { name }, update: {}, create: { name } });
  providerA = (await upsert("Dr. Asha Verma")).id;
  providerB = (await upsert("Dr. Rohan Mehta")).id;
});

beforeEach(async () => {
  await prisma.appointment.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const activeCount = (providerId: string) =>
  prisma.appointment.count({ where: { providerId, status: "BOOKED" } });

describe("successful booking", () => {
  it("returns 201 and persists the appointment", async () => {
    const res = await book(payload(providerA, at("10:00")));

    expect(res.status).toBe(201);
    expect(res.body.appointment.status).toBe("BOOKED");
    expect(res.body.appointment.date).toBe(MONDAY);

    const row = await prisma.appointment.findUnique({
      where: { id: res.body.appointment.id },
    });
    expect(row).not.toBeNull();
    expect(row!.startTime.toISOString()).toBe("2030-01-07T04:30:00.000Z");
    expect(row!.endTime.toISOString()).toBe("2030-01-07T05:00:00.000Z");
  });

  it("ignores a client-supplied endTime and computes it on the server", async () => {
    const res = await book(
      payload(providerA, at("10:00"), { endTime: "2030-01-07T18:00:00Z" }),
    );
    expect(res.status).toBe(201);
    expect(res.body.appointment.endTime).toBe("2030-01-07T05:00:00.000Z");
  });

  it("ignores client-supplied id and status", async () => {
    const res = await book(payload(providerA, at("10:00"), { id: "client-id", status: "CANCELLED" }));
    expect(res.status).toBe(201);
    expect(res.body.appointment.id).not.toBe("client-id");
    expect(res.body.appointment.status).toBe("BOOKED");
  });

  it("allows back-to-back appointments (BR-05)", async () => {
    expect((await book(payload(providerA, at("10:00")))).status).toBe(201);
    expect((await book(payload(providerA, at("10:30")))).status).toBe(201);
  });

  it("keeps availability independent per provider (BR-07)", async () => {
    expect((await book(payload(providerA, at("10:00")))).status).toBe(201);
    expect((await book(payload(providerB, at("10:00")))).status).toBe(201);
  });
});

describe("duplicate bookings", () => {
  it("rejects a second booking for the same provider and slot with 409", async () => {
    const first = await book(payload(providerA, at("10:00")));
    const second = await book(
      payload(providerA, at("10:00"), {
        customerName: "Rohan",
        customerEmail: "rohan@example.com",
      }),
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("SLOT_TAKEN");
    expect(await activeCount(providerA)).toBe(1);
  });

  it("treats the same instant in a different UTC offset as the same slot", async () => {
    await book(payload(providerA, at("10:00")));
    const res = await book(payload(providerA, "2030-01-07T04:30:00Z"));
    expect(res.status).toBe(409);
  });
});

describe("invalid scheduling is rejected", () => {
  it.each([
    ["before opening (09:30)", at("09:30")],
    ["off the half hour (10:15)", at("10:15")],
    ["stray seconds", "2030-01-07T10:00:30+05:30"],
    ["starting at closing time (18:00)", at("18:00")],
    ["on a Sunday", at("10:00", SUNDAY)],
    ["in the past", at("10:00", "2020-01-06")],
  ])("returns 400 for a booking %s", async (_label, startTime) => {
    const res = await book(payload(providerA, startTime));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(await prisma.appointment.count()).toBe(0);
  });

  it("accepts the last slot of the day (17:30)", async () => {
    expect((await book(payload(providerA, at("17:30")))).status).toBe(201);
  });
});

describe("request validation", () => {
  it.each([
    ["empty body", {}],
    ["blank name", payload("x", at("10:00"), { customerName: "   " })],
    ["invalid email", payload("x", at("10:00"), { customerEmail: "nope" })],
    ["non-ISO startTime", payload("x", "tomorrow at 10")],
    ["missing timezone offset", payload("x", "2030-01-07T10:00:00")],
    ["fractional slot seconds", payload("x", "2030-01-07T10:00:00.500+05:30")],
    ["overlong name", payload("x", at("10:00"), { customerName: "A".repeat(101) })],
    ["wrong field types", { providerId: 12, customerName: false, customerEmail: [], startTime: null }],
  ])("returns 400 for %s", async (_label, body) => {
    expect((await book(body)).status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    expect((await book("{bad")).status).toBe(400);
  });

  it.each([["array", "[]"], ["string", '"hello"']])("returns 400 for a JSON %s body", async (_label, body) => {
    const res = await book(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for an unknown provider", async () => {
    const res = await book(
      payload("00000000-0000-4000-8000-000000000000", at("10:00")),
    );
    expect(res.status).toBe(404);
  });
});

describe("availability query validation", () => {
  it.each([undefined, "2030-02-31", "2030-1-7"]) (
    "returns a structured 400 for invalid date %s",
    async (date) => {
      const res = await slots(providerA, date);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({ code: "VALIDATION_ERROR" });
    },
  );
});

describe("cancellation", () => {
  it("releases the slot so it can be rebooked, and keeps the cancelled record", async () => {
    const first = await book(payload(providerA, at("10:00")));
    const id = first.body.appointment.id;

    const cancelled = await cancel(id);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.appointment.status).toBe("CANCELLED");

    const rebooked = await book(
      payload(providerA, at("10:00"), {
        customerName: "Rohan",
        customerEmail: "rohan@example.com",
      }),
    );
    expect(rebooked.status).toBe(201);

    const rows = await prisma.appointment.findMany({ orderBy: { createdAt: "asc" } });
    expect(rows.map((row) => row.status)).toEqual(["CANCELLED", "BOOKED"]);
    expect(rows[0].id).toBe(id);
  });

  it("shows the slot as available after cancellation", async () => {
    const { body } = await book(payload(providerA, at("10:00")));
    const startIso = new Date(at("10:00")).toISOString();
    const find = async () =>
      (await getAvailability(providerA, MONDAY)).slots.find((slot) => slot.start === startIso);

    expect((await find())?.available).toBe(false);
    await cancel(body.appointment.id);
    expect((await find())?.available).toBe(true);
  });

  it("is idempotent: cancelling twice is safe (BR-09)", async () => {
    const { body } = await book(payload(providerA, at("10:00")));
    const other = await book(payload(providerA, at("11:00")));

    const first = await cancel(body.appointment.id);
    const second = await cancel(body.appointment.id);

    expect(first.status).toBe(200);
    expect(first.body.alreadyCancelled).toBe(false);
    expect(second.status).toBe(200);
    expect(second.body.alreadyCancelled).toBe(true);

    const untouched = await prisma.appointment.findUnique({
      where: { id: other.body.appointment.id },
    });
    expect(untouched!.status).toBe("BOOKED");
  });

  it("returns 404 for nonexistent and malformed IDs", async () => {
    expect((await cancel("00000000-0000-4000-8000-000000000000")).status).toBe(404);
    expect((await cancel("not-a-uuid")).status).toBe(404);
  });
});

describe("concurrency (NN-05)", () => {
  it("lets exactly one of 10 simultaneous requests for the same slot succeed", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        book(
          payload(providerA, at("11:00"), {
            customerName: `Racer ${index}`,
            customerEmail: `r${index}@example.com`,
          }),
        ),
      ),
    );
    const statuses = results.map((result) => result.status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(9);
    expect(await activeCount(providerA)).toBe(1);
  });

  it("creates exactly one booking per slot when racing across several slots", async () => {
    const times = ["12:00", "12:30", "13:00"];
    const results = await Promise.all(
      times.flatMap((time) =>
        Array.from({ length: 5 }, (_, index) =>
          book(
            payload(providerA, at(time), {
              customerName: `R${time}-${index}`,
              customerEmail: `r${index}@example.com`,
            }),
          ),
        ),
      ),
    );

    expect(results.every((result) => result.status === 201 || result.status === 409)).toBe(true);
    expect(results.filter((result) => result.status === 201)).toHaveLength(3);
    expect(await activeCount(providerA)).toBe(3);
  });

  it("handles simultaneous cancels of the same booking safely", async () => {
    const { body } = await book(payload(providerA, at("14:00")));
    const results = await Promise.all(
      Array.from({ length: 5 }, () => cancel(body.appointment.id)),
    );

    expect(results.every((result) => result.status === 200)).toBe(true);
    expect(results.filter((result) => result.body.alreadyCancelled === false)).toHaveLength(1);
  });
});
