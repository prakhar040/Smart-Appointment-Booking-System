import { NextResponse } from "next/server";
import { AppError } from "./errors";
import type { ApiErrorBody } from "./dto";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(code: string, message: string, status: number) {
  const body: ApiErrorBody = { error: { code, message } };
  return NextResponse.json(body, { status });
}

/** Wraps a route handler so no error ever escapes as an unhandled crash. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) {
      return errorResponse(e.code, e.message, e.status);
    }
    console.error("Unhandled error:", e); // log details server-side only
    return errorResponse("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
  }
}

/** Parse a JSON body; malformed JSON is a 400, not a 500. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400);
  }
}