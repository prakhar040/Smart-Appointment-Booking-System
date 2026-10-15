import { handle, json } from "../../../../src/lib/http";
import { patientCookie, patientEmailFromRequest } from "../../../../src/lib/patient-auth";

export function GET(request: Request) {
  return handle(async () => json({ email: patientEmailFromRequest(request) }));
}

export function DELETE() {
  return handle(async () => {
    const response = json({ signedOut: true });
    response.cookies.set(patientCookie.name, "", { ...patientCookie.options, maxAge: 0 });
    return response;
  });
}
