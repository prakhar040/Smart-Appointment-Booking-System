import { z } from "zod";
import { prisma } from "../../../../src/lib/db";
import { AppError } from "../../../../src/lib/errors";
import { handle, json, readJson } from "../../../../src/lib/http";
import { assertPatientAuthConfigured, normalizeEmail, patientCookie, verifyPassword } from "../../../../src/lib/patient-auth";

const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });

export function POST(request: Request) {
  return handle(async () => {
    const result = schema.safeParse(await readJson(request));
    if (!result.success) throw new AppError("VALIDATION_ERROR", "Enter your email and password.", 400);
    assertPatientAuthConfigured();
    const email = normalizeEmail(result.data.email);
    const patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient || !(await verifyPassword(result.data.password, patient.passwordHash))) {
      throw new AppError("UNAUTHORIZED", "Email or password is incorrect.", 401);
    }
    const response = json({ patient: { email } });
    response.cookies.set(patientCookie.name, patientCookie.value(email), patientCookie.options);
    return response;
  });
}
