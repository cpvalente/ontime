/**
 * copy text to clipboard
 * @throws if not supported or permission denied
 */
export async function copyToClipboard(text: string) {
  await navigator.clipboard?.writeText(text);
}

/**
 * Copy to clipboard but safely ignore errors
 */
export async function safeCopyToClipboard(text: string): Promise<void> {
  try {
    await copyToClipboard(text);
  } catch {
    // Silently ignore errors
  }
}
