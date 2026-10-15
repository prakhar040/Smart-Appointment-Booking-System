import { z } from "zod";
import { AppError } from "./errors";

export const bookingSchema = z.object({
  providerId: z.string().uuid("providerId must be a valid UUID"),
  customerName: z.string().trim().min(1, "name is required").max(100),
  customerEmail: z.string().trim().toLowerCase().email("invalid email").max(254),
  // ISO 8601 with offset, e.g. 2030-01-07T10:00:00+05:30 or ...Z
  startTime: z.string().datetime({ offset: true, message: "startTime must be ISO 8601" }),
});

export function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

export function parseInput<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    throw new AppError("VALIDATION_ERROR", message, 400);
  }
  return result.data;
}