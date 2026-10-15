import { handle, json } from "../../../../../src/lib/http";
import { getAvailability } from "../../../../../src/services/appointments";

export function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const date = new URL(request.url).searchParams.get("date") ?? "";
    return json(await getAvailability(id, date));
  });
}