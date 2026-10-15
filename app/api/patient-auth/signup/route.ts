import { z } from "zod";
import { prisma } from "../../../../src/lib/db";
import { AppError } from "../../../../src/lib/errors";
import { handle, json, readJson } from "../../../../src/lib/http";
import { assertPatientAuthConfigured, hashPassword, normalizeEmail, patientCookie } from "../../../../src/lib/patient-auth";

const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(12).max(128) });

export function POST(request: Request) {
  return handle(async () => {
    const data = schema.safeParse(await readJson(request));
    if (!data.success) throw new AppError("VALIDATION_ERROR", "Enter a valid email and a password with at least 12 characters.", 400);
    assertPatientAuthConfigured();
    const email = normalizeEmail(data.data.email);
    const passwordHash = await hashPassword(data.data.password);
    try {
      await prisma.patient.create({ data: { email, passwordHash } });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw new AppError("CONFLICT", "An account already exists for this email. Please sign in.", 409);
      }
      throw error;
    }
    const response = json({ patient: { email } }, 201);
    response.cookies.set(patientCookie.name, patientCookie.value(email), patientCookie.options);
    return response;
  });
}
