/**
 * Kleiner Client für einen Formular-Empfänger.
 * Ist `url` leer, wird nichts gesendet: Die Antwort ist simuliert (Vorschau, Entwicklung, Tests).
 */

export interface ApiResult {
  ok: boolean;
  /** HTTP-Status; 0 bei Netzwerkfehler oder Zeitüberschreitung */
  status: number;
  /** Fehlercode des Empfängers, z. B. `invalid_payload` oder `rate_limited` */
  error?: string;
  /** `true`, wenn die Antwort simuliert wurde */
  mock?: boolean;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function postJson(
  url: string,
  body: unknown,
  options: { timeout?: number } = {},
): Promise<ApiResult> {
  if (!url) {
    await wait(700);
    return { ok: true, status: 200, mock: true };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 12_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    let error: string | undefined;
    if (!response.ok) {
      try {
        const data = (await response.json()) as { error?: unknown };
        if (typeof data.error === 'string') error = data.error;
      } catch {
        // Antwort ohne JSON: der Status genügt.
      }
    }
    return { ok: response.ok, status: response.status, ...(error ? { error } : {}) };
  } catch {
    return { ok: false, status: 0, error: 'network' };
  } finally {
    clearTimeout(timer);
  }
}
