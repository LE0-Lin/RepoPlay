export class ProductError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
export function errorResponse(error: unknown) {
  if (error instanceof ProductError) return Response.json({ code: error.code, message: error.message }, { status: error.status });
  // Keep stack traces, source text, upstream responses and credentials out of the UI.
  return Response.json({ code: "UNAVAILABLE", message: "This request could not be completed. Please try again." }, { status: 502 });
}
