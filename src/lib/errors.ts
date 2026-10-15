export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SLOT_TAKEN"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}