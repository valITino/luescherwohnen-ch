/**
 * Einstieg der Unterseiten: Header mit Menü. Kein Smooth Scroll, keine Scroll-Animationen.
 * Auf Unterseiten bewegt sich nichts dauerhaft; der Schalter «Bewegung pausieren» bleibt darum aus.
 */
import { initMotionToggle } from './chrome.ts';
import { initHeader } from './header.ts';

initHeader(() => null);
initMotionToggle(false);
