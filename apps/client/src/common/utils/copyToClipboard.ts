// we need to this as a promise because safari
export default async function copyToClipboard(text: string) {
  setTimeout(async () => await navigator.clipboard?.writeText(text));
}
