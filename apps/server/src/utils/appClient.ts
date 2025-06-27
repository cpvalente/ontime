/**
 * A simple HTTP client utility to abstract fetch and mimic got's behavior for JSON POST requests.
 */

interface PostJsonOptions {
  json: Record<string, unknown>;
  // Add other options here if needed in the future, like headers
}

export async function postJson<T = any>(url: string, options: PostJsonOptions): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other default headers if necessary
      },
      body: JSON.stringify(options.json),
    });

    if (!response.ok) {
      let errorBodyText = '';
      try {
        // Try to parse as JSON first, as it might be structured error info
        const errorBodyJson = await response.json();
        errorBodyText = JSON.stringify(errorBodyJson);
      } catch (e) {
        // If not JSON, try to get it as plain text.
        try {
          errorBodyText = await response.text();
        } catch (textError) {
          // If reading as text also fails, note that.
          errorBodyText = `(Failed to read error response body: ${
            textError instanceof Error ? textError.message : String(textError)
          })`;
        }
      }
      throw new Error(
        `Request to ${url} failed with status ${response.status} (${response.statusText}). Response body: ${errorBodyText}`,
      );
    }

    // got by default parses JSON response
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error) {
      // If it's already an Error (e.g. the one we threw above, or a network error from fetch),
      // re-throw it. We could also choose to wrap it if we wanted to add more context,
      // but for simplicity, re-throwing is fine.
      throw error;
    }
    // For any other type of thrown value, convert to string and wrap in a new Error.
    throw new Error(`Network or unexpected error during request to ${url}: ${String(error)}`);
  }
}
