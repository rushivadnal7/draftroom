export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { message: error.message, code: error.code } },
      { status: error.status }
    );
  }
  console.error(error);
  return Response.json(
    { error: { message: "Internal server error" } },
    { status: 500 }
  );
}
