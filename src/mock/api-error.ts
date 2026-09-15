/**
 * HTTP-style error for the mock backend. The api-client fallback interceptor
 * converts these into error responses with the correct status code, so the UI
 * surfaces real messages like "email already exists" instead of "Network Error".
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
