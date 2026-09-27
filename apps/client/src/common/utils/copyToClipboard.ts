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

/**
 * Copy text which is not yet available (eg: pending a network request) and safely ignore errors
 * Safari only allows clipboard writes started synchronously within a user gesture,
 * so this must be called from the event handler before any await
 */
export function safeCopyPendingToClipboard(text: Promise<string>): void {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    text.then(safeCopyToClipboard).catch(() => {
      // Silently ignore errors
    });
    return;
  }

  const item = new ClipboardItem({ 'text/plain': text.then((value) => new Blob([value], { type: 'text/plain' })) });
  navigator.clipboard.write([item]).catch(() => {
    // Silently ignore errors
  });
}
