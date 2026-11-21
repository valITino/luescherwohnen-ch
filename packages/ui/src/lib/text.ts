/**
 * Text ohne weiche Trennstriche: für Namen, die vorgelesen oder verglichen werden (aria-label).
 * In der Anzeige bleiben sie stehen, damit lange Wörter an der Silbengrenze umbrechen.
 */
export const plainText = (text: string): string => text.replaceAll('­', '');
