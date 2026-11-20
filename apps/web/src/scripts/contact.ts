/**
 * Kontaktformular: Inline-Validierung mit den gemeinsamen Regeln, dann POST an den Empfänger
 * (oder simulierte Antwort in der Vorschau). Eingaben bleiben bei Fehlern erhalten.
 * Wird erst geladen, wenn das Formular in Sicht kommt (home.ts).
 */
import { iconSvg } from '@luescher/ui/icons';
import { postJson } from '@luescher/ui/lib/api';
import {
  isBot,
  normalizeContact,
  validateContact,
  type ContactField,
  type ContactInput,
} from '../lib/contact-form.ts';

const FIELDS: readonly ContactField[] = [
  'name',
  'email',
  'phone',
  'anliegen',
  'nachricht',
  'datenschutz',
];

export function initContact(form: HTMLFormElement): void {
  const panel = form.parentElement;
  const success = panel?.querySelector<HTMLElement>('[data-form-success]');
  const failure = form.querySelector<HTMLElement>('[data-form-error]');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const counter = form.querySelector<HTMLElement>('[data-count-current]');
  if (!success || !failure || !submit || !submitLabel) return;

  const endpoint = form.dataset.endpoint ?? '';
  const idleLabel = submitLabel.textContent ?? '';

  const input = (name: string) => form.elements.namedItem(name);
  const text = (name: string) => (input(name) as HTMLInputElement | HTMLTextAreaElement).value;
  const radios = [...form.querySelectorAll<HTMLInputElement>('input[name="anliegen"]')];
  const chips = form.querySelector<HTMLElement>('.chips');
  const message = input('nachricht') as HTMLTextAreaElement;
  const privacy = input('datenschutz') as HTMLInputElement;

  const read = (): ContactInput => ({
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    anliegen: radios.find((radio) => radio.checked)?.value ?? '',
    nachricht: message.value,
    datenschutz: privacy.checked,
    website: text('website'),
  });

  // --- Fehlermeldungen an den Feldern ---
  const controlsOf = (field: ContactField): HTMLElement[] => {
    if (field === 'anliegen') return radios;
    const control = input(field);
    return control instanceof HTMLElement ? [control] : [];
  };

  const describe = (control: HTMLElement, id: string, add: boolean) => {
    const ids = new Set(
      (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean),
    );
    if (add) ids.add(id);
    else ids.delete(id);
    if (ids.size > 0) control.setAttribute('aria-describedby', [...ids].join(' '));
    else control.removeAttribute('aria-describedby');
  };

  const shown = new Set<ContactField>();

  const setError = (field: ContactField, message: string | undefined) => {
    const box = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    if (!box) return;
    const controls = controlsOf(field);
    if (message) {
      shown.add(field);
      box.innerHTML = iconSvg('circle-alert', { size: 18 });
      const span = document.createElement('span');
      span.textContent = message;
      box.append(span);
      box.hidden = false;
      for (const control of controls) {
        control.setAttribute('aria-invalid', 'true');
        if (field !== 'anliegen') describe(control, box.id, true);
      }
      if (field === 'anliegen') chips?.setAttribute('data-invalid', '');
    } else {
      shown.delete(field);
      box.hidden = true;
      box.replaceChildren();
      for (const control of controls) {
        control.removeAttribute('aria-invalid');
        if (field !== 'anliegen') describe(control, box.id, false);
      }
      if (field === 'anliegen') chips?.removeAttribute('data-invalid');
    }
  };

  const validateField = (field: ContactField) => setError(field, validateContact(read())[field]);

  // Beim Verlassen eines Felds prüfen; bereits gemeldete Fehler beim Tippen laufend aktualisieren.
  form.addEventListener('focusout', (event) => {
    const name = (event.target as HTMLInputElement).name as ContactField | undefined;
    if (!name || !FIELDS.includes(name) || name === 'anliegen' || name === 'datenschutz') return;
    const value = text(name).trim();
    const required = name === 'name' || name === 'email' || name === 'nachricht';
    if (value || (required && shown.has(name))) validateField(name);
  });
  form.addEventListener('input', (event) => {
    const name = (event.target as HTMLInputElement).name as ContactField | undefined;
    if (name && shown.has(name)) validateField(name);
    if (name === 'nachricht' && counter) counter.textContent = String(message.value.length);
  });
  form.addEventListener('change', (event) => {
    const name = (event.target as HTMLInputElement).name as ContactField | undefined;
    if (name && shown.has(name)) validateField(name);
  });
  if (counter) counter.textContent = String(message.value.length);

  // --- Absenden ---
  const setBusy = (busy: boolean) => {
    submit.disabled = busy;
    form.setAttribute('aria-busy', String(busy));
    submitLabel.textContent = busy ? 'Wird gesendet …' : idleLabel;
  };

  const showSuccess = () => {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    failure.hidden = true;

    const data = read();
    const errors = validateContact(data);
    for (const field of FIELDS) setError(field, errors[field]);
    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      controlsOf(firstInvalid)[0]?.focus();
      return;
    }

    // Ein Bot hat das versteckte Feld ausgefüllt: so tun, als wäre alles gut, nichts senden.
    if (isBot(data)) {
      showSuccess();
      return;
    }

    setBusy(true);
    void (async () => {
      try {
        // Honeypot und Bestätigung reisen mit: Der Empfänger muss alles selbst nochmals prüfen.
        const result = await postJson(endpoint, {
          ...normalizeContact(data),
          datenschutz: data.datenschutz,
          website: data.website ?? '',
        });
        if (!result.ok) throw new Error(result.error ?? 'request_failed');
        showSuccess();
      } catch {
        failure.hidden = false;
      } finally {
        setBusy(false);
      }
    })();
  });
}
