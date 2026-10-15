import {handle, json} from "../../../src/lib/http";
import { listProviders } from "../../../src/services/appointments";

export function GET() {
  return handle(async () => {
    const providers = await listProviders();
    return json({ providers });
  });
}