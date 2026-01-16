export function getResourceUrl(
  baseUrl: string,
  content: string,
  resourcePaths?: Map<number, string>,
) {
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return content;
  }
  if (content.startsWith('/')) {
    return `${baseUrl}/resources${content}`;
  }
  const asNumber = Number(content);
  if (Number.isFinite(asNumber) && resourcePaths) {
    const knownPath = resourcePaths.get(asNumber);
    if (knownPath) {
      return `${baseUrl}/resources${knownPath}`;
    }
  }
  return `${baseUrl}/resources/${content}`;
}
