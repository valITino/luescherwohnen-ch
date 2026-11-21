import { expect, test, type Page } from '@playwright/test';
import { AT_REST, PROD, layOutAll, nextFrames, placeAt, scrollToY } from './helpers.ts';

/**
 * Bewegung mit dem Scrollen (scroll.css): Der Mensch bewegt, die Seite antwortet.
 *
 * Was beim Scrollen ins Bild kommt, hängt an der Scrollposition und nie an einem Zeitgeber. Der
 * Zustand der Seite ist darum eine Frage der Stelle, an der sie steht: Die Tests scrollen an eine
 * Stelle und lesen ihn ab, ohne auf einen Ablauf zu warten.
 */

async function openHome(page: Page) {
  await page.goto(`${PROD}/`);
  await page.evaluate(() => document.fonts.ready);
  await layOutAll(page);
}

const translateOf = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).translate);

/** Verschiebung nach unten in Pixeln («none» ist 0) */
const shiftOf = async (page: Page, selector: string) => {
  const value = await translateOf(page, selector);
  return value === 'none' ? 0 : Number.parseFloat(value.split(' ')[1] ?? '0');
};

test.describe('Bewegung folgt dem Scrollen', () => {
  test('Am gebauten Stand hängt jede dieser Bewegungen an der Scrollposition', async ({
    page,
    isMobile,
  }) => {
    await openHome(page);
    // Der CSS-Minifier darf keine dieser Regeln so umschreiben, dass der Browser sie verwirft
    // (das ist beim Umbau passiert): Jede Bewegung hat einen Namen und eine eigene Zeitleiste.
    const rules: [selector: string, pseudo: string | null, name: string][] = [
      ['.hero', null, 'sc-leave'],
      ['#sortiment', null, 'sc-leave'],
      ['#sortiment .section-lead', null, 'sc-rise'],
      ['#sortiment-title .sc-wi', null, 'sc-word'],
      ['#aktuell .story-photo', null, 'sc-zoom'],
      ['.hero-orb', null, 'hero-near'],
      ['.ticker-row', null, 'band-left'],
      ['.ticker-row-reverse', null, 'band-right'],
      ['.statement-text .w', null, 'say'],
      ['.process', '::after', 'draw-down'],
      ['.process-step', '::before', 'dot-on'],
      ['.portrait-corner', null, 'focus-in'],
      ['.footer-word-img', null, 'word-up'],
      // Die Scheibe im Kontakt gibt es erst ab 64rem.
      ...(isMobile ? [] : ([['.kontakt-disc', null, 'disc-open']] as [string, null, string][])),
    ];
    for (const [selector, pseudo, name] of rules) {
      const style = await page
        .locator(selector)
        .first()
        .evaluate((element, at) => {
          const computed = getComputedStyle(element, at);
          return { name: computed.animationName, timeline: computed.animationTimeline };
        }, pseudo);
      expect(style.name, selector).toBe(name);
      expect(style.timeline, selector).not.toBe('auto');
    }
    // Jede dieser Bewegungen misst sich an der Seite, nicht an einem Kasten dazwischen: Ein
    // Rahmen mit `overflow: hidden` wäre ein eigener Scrollbereich, und was darin am Scrollen
    // hängt, bliebe stehen (so standen beim Umbau die Fotos). Darum schneiden Rahmen mit `clip` ab.
    const sources = await page.evaluate(() => {
      const scroller = document.scrollingElement;
      const all = document
        .getAnimations()
        .filter((animation) => animation.timeline !== null && 'source' in animation.timeline);
      return {
        count: all.length,
        elsewhere: all
          .filter(
            (animation) =>
              (animation.timeline as unknown as { source: Element }).source !== scroller,
          )
          .map((animation) => (animation as CSSAnimation).animationName),
      };
    });
    expect(sources.count).toBeGreaterThan(40);
    expect(sources.elsewhere).toEqual([]);

    // Die Strecke des Bogens: von «Unterkante am unteren Fensterrand» bis «Bogen ganz draussen».
    const range = await page.locator('#sortiment').evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.animationRangeStart, style.animationRangeEnd];
    });
    expect(range[0]).toBe('entry-crossing 100%');
    expect(range[1]).toMatch(/^cover( 100%)?$/);
    // Der letzte Bogen bleibt nicht zurück, und das schmale Band zieht ganz durch.
    expect(
      await page.locator('#kontakt').evaluate((element) => getComputedStyle(element).animationName),
    ).toBe('none');
    expect(
      await page
        .locator('[data-ticker]')
        .evaluate((element) => getComputedStyle(element).getPropertyValue('--sc-leave').trim()),
    ).toBe('0');
  });

  test('In der Lesezone steht alles still, und kein Text ist je blass', async ({ page }) => {
    await openHome(page);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.round((await page.evaluate(() => window.innerHeight)) * 0.45);
    for (let y = 0; y < height; y += step) {
      await scrollToY(page, y);
      const found = await page.evaluate((rest) => {
        const atRest = new RegExp(rest);
        const layoutTop = (element: HTMLElement) => {
          let top = -window.scrollY;
          for (
            let node: HTMLElement | null = element;
            node;
            node = node.offsetParent as HTMLElement | null
          ) {
            top += node.offsetTop;
          }
          return top;
        };
        // Oberhalb von 70 % der Fensterhöhe ist jeder Auftritt zu Ende (scroll.css).
        const zone = window.innerHeight * 0.7;
        const moving = [...document.querySelectorAll<HTMLElement>('main .sc-rise, main .sc-wi')]
          .filter((element) => {
            const top = layoutTop(element);
            return top > 0 && top < zone && !atRest.test(getComputedStyle(element).translate);
          })
          .map((element) => `${element.className}: ${getComputedStyle(element).translate}`);
        // Text blendet nie ein. Einzige Ausnahme sind die drei Sätze der Haltung, deren Wörter
        // erst mit dem Scrollen dunkel werden (ein Stilmittel, kein Fliesstext). Der Hero hat
        // seinen Auftakt beim Laden (nach Zeit, eigene Tests) und zählt hier nicht.
        const pale = [
          ...document.querySelectorAll<HTMLElement>(
            'main > :not([data-hero]) :is(h2, h3, p, li, dd, dt)',
          ),
        ]
          .filter((element) => {
            if (element.closest('.statement-text, [aria-hidden="true"]')) return false;
            const rect = element.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight || rect.height === 0) return false;
            for (let node: Element | null = element; node; node = node.parentElement) {
              if (Number(getComputedStyle(node).opacity) < 0.99) return true;
            }
            return false;
          })
          .map((element) => element.className || element.tagName);
        return { moving, pale };
      }, AT_REST.source);
      expect(found, `bei ${y} px`).toEqual({ moving: [], pale: [] });
    }
  });

  test('Auftritt: tiefer herein, dann am Platz, und zurück genau wie hin', async ({ page }) => {
    await openHome(page);
    const lead = '#sortiment .section-lead';
    const viewport = await page.evaluate(() => window.innerHeight);
    // Gerade unter der Fensterkante hereingekommen: Der Block steht noch tiefer als sein Platz.
    await placeAt(page, lead, viewport - 30);
    const entering = await shiftOf(page, lead);
    expect(entering).toBeGreaterThan(8);
    // Auf halber Höhe des Fensters steht er an seinem Platz.
    await placeAt(page, lead, viewport * 0.5);
    expect(await translateOf(page, lead)).toMatch(AT_REST);
    // Zurück an dieselbe Stelle: derselbe Zustand, auf den Pixel. Kein Zeitgeber, kein «schon gespielt».
    await placeAt(page, lead, viewport - 30);
    expect(await shiftOf(page, lead)).toBeCloseTo(entering, 1);
    // Und ohne zu scrollen bewegt sich nichts weiter.
    await page.waitForTimeout(400);
    expect(await shiftOf(page, lead)).toBeCloseTo(entering, 1);
  });

  test('Überschrift: Die Wörter steigen aus ihrer Maske, der Name bleibt ein Satz', async ({
    page,
  }) => {
    await openHome(page);
    const title = page.locator('#sortiment-title');
    // Für Screenreader ein Name, nicht vier Stücke; die Sektion heisst danach.
    await expect(title).toHaveAttribute('aria-label', 'Alles für Ihr Zuhause.');
    await expect(title.locator('.sc-words')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('heading', { name: 'Alles für Ihr Zuhause.' })).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Alles für Ihr Zuhause.' })).toHaveCount(1);
    await expect(title.locator('.sc-wi')).toHaveText(['Alles', 'für', 'Ihr', 'Zuhause.']);
    // Weiche Trennstriche stehen nur in der Anzeige, nicht im Namen.
    await expect(page.locator('#ueber-title')).toHaveAttribute(
      'aria-label',
      'Ein Familienunternehmen aus Baden.',
    );

    const viewport = await page.evaluate(() => window.innerHeight);
    const lift = () =>
      title
        .locator('.sc-w')
        .first()
        .evaluate((mask) => {
          const word = mask.querySelector('.sc-wi')!;
          return Math.round(word.getBoundingClientRect().top - mask.getBoundingClientRect().top);
        });
    // An der Fensterkante steckt das Wort noch in seiner Maske (sie schneidet es ab) …
    await placeAt(page, '#sortiment-title', viewport - 12);
    const hidden = await lift();
    // … weiter oben steht es an seinem Platz in der Maske.
    await placeAt(page, '#sortiment-title', viewport * 0.5);
    const shown = await lift();
    expect(hidden - shown).toBeGreaterThan(10);
    expect(await translateOf(page, '#sortiment-title .sc-wi')).toMatch(AT_REST);
    expect(
      await title
        .locator('.sc-w')
        .first()
        .evaluate((mask) => getComputedStyle(mask).overflowY),
    ).toBe('clip');
  });

  test('Fotos sind vom ersten Pixel an ganz zu sehen und setzen sich aus einem leichten Zoom', async ({
    page,
  }) => {
    await openHome(page);
    const photo = '#aktuell .story-photo';
    const viewport = await page.evaluate(() => window.innerHeight);
    const state = () =>
      page
        .locator(photo)
        .first()
        .evaluate((img) => {
          const style = getComputedStyle(img);
          return {
            scale: style.scale === 'none' ? 1 : Number.parseFloat(style.scale),
            opacity: style.opacity,
            clip: style.clipPath,
            loaded:
              (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
          };
        });
    // Noch unter dem Fenster: Das Bild ist weder durchsichtig noch beschnitten, darum lädt der
    // Browser es rechtzeitig vor (loading="lazy").
    await placeAt(page, photo, viewport + 250);
    await expect.poll(async () => (await state()).loaded).toBe(true);
    // An der Kante: ganz sichtbar, leicht vergrössert (der Rahmen schneidet ab).
    await placeAt(page, photo, viewport - 40);
    const entering = await state();
    expect(entering.opacity).toBe('1');
    expect(entering.clip).toBe('none');
    expect(entering.scale).toBeGreaterThan(1.1);
    // Mitten im Fenster: in voller Ruhe.
    await placeAt(page, photo, viewport * 0.25);
    expect((await state()).scale).toBeCloseTo(1, 3);
  });

  test('Der Hero hält das Scrollen nicht an, und der nächste Bogen schiebt sich über ihn', async ({
    page,
  }) => {
    await openHome(page);
    const top = () => page.locator('.hero-title').evaluate((el) => el.getBoundingClientRect().top);
    const start = await top();
    // Die ersten Pixel: Die Seite folgt sofort, eins zu eins (kein angehaltener Hero).
    await scrollToY(page, 120);
    expect((await top()) - start).toBeCloseTo(-120, 0);
    expect(await translateOf(page, '.hero')).toMatch(AT_REST);

    // Sobald der nächste Bogen unten hereinkommt, bleibt der Hero zurück …
    const viewport = await page.evaluate(() => window.innerHeight);
    await placeAt(page, '#sortiment', viewport * 0.5);
    const lag = await shiftOf(page, '.hero');
    expect(lag).toBeGreaterThan(40);
    // … und der Bogen liegt über ihm: In der unteren Fensterhälfte trifft man das Sortiment.
    const hit = await page.evaluate(
      (y) => document.elementFromPoint(window.innerWidth / 2, y)?.closest('section')?.id,
      viewport * 0.75,
    );
    expect(hit).toBe('sortiment');
    // Das runde Foto rückt dabei näher.
    expect(
      await page
        .locator('.hero-orb')
        .evaluate((orb) => Number.parseFloat(getComputedStyle(orb).scale)),
    ).toBeGreaterThan(1.03);

    // Steht der Bogen oben, ist der Hero vorbei; wieder ganz oben steht er wie am Anfang.
    await scrollToY(page, 0);
    expect(await top()).toBeCloseTo(start, 0);
    expect(await translateOf(page, '.hero')).toMatch(AT_REST);
  });

  test('Band: zieht mit dem Scrollen, die Reihen gegenläufig, nichts läuft von selbst', async ({
    page,
  }) => {
    await openHome(page);
    const viewport = await page.evaluate(() => window.innerHeight);
    const rows = () =>
      page
        .locator('.ticker-row')
        .evaluateAll((elements) => elements.map((row) => row.getBoundingClientRect().left));
    await placeAt(page, '[data-ticker]', viewport * 0.8);
    const early = await rows();
    // Ohne Scrollen steht das Band.
    await page.waitForTimeout(500);
    expect(await rows()).toEqual(early);
    await placeAt(page, '[data-ticker]', viewport * 0.3);
    const late = await rows();
    // Obere Reihe nach links, untere nach rechts.
    expect(late[0]! - early[0]!).toBeLessThan(-20);
    expect(late[1]! - early[1]!).toBeGreaterThan(20);
    // Kein Knopf zum Anhalten: Es gibt nichts anzuhalten (WCAG 2.2.2 betrifft Bewegung, die von
    // selbst läuft).
    await expect(page.locator('[data-ticker] button')).toHaveCount(0);
    const timed = await page
      .locator('[data-ticker]')
      .evaluate(
        (band) =>
          band
            .getAnimations({ subtree: true })
            .filter((animation) => animation.timeline instanceof DocumentTimeline).length,
      );
    expect(timed).toBe(0);
    // Die Reihen füllen die ganze Breite, in jeder Lage.
    const edges = await page.locator('.ticker-row').evaluateAll((elements) =>
      elements.map((row) => {
        const rect = row.getBoundingClientRect();
        return rect.left <= 0 && rect.right >= window.innerWidth;
      }),
    );
    expect(edges).toEqual([true, true]);
  });

  test('Haltung: Die Wörter werden mit dem Scrollen dunkel, in der Mitte steht der Satz', async ({
    page,
  }) => {
    await openHome(page);
    const viewport = await page.evaluate(() => window.innerHeight);
    const words = () =>
      page
        .locator('.statement-text')
        .first()
        .evaluate((text) =>
          [...text.querySelectorAll('.w')].map((word) => Number(getComputedStyle(word).opacity)),
        );
    await placeAt(page, '.statement-text', viewport * 0.82);
    const entering = await words();
    expect(entering.length).toBe(8);
    // Von vorn nach hinten: Kein Wort ist dunkler als das Wort vor ihm, und noch nicht alle sind da.
    expect(entering).toEqual([...entering].sort((a, b) => b - a));
    expect(entering.at(-1)).toBeLessThan(0.5);
    // In der Fenstermitte ist der ganze Satz da (voller Kontrast).
    await placeAt(page, '.statement-text', viewport * 0.45);
    expect(await words()).toEqual(Array(8).fill(1));
    // Der Satz bleibt ein Satz: ein Absatz, die Wörter im Fluss.
    await expect(page.locator('.statement-text').first()).toHaveText(
      'Wir nehmen uns Zeit für all Ihre Anliegen.',
    );
  });

  test('Service: Die Linie wächst mit dem Scrollen, ihre Spitze bleibt auf Lesehöhe', async ({
    page,
  }) => {
    await openHome(page);
    const viewport = await page.evaluate(() => window.innerHeight);
    const tip = () =>
      page.locator('.process').evaluate((list) => {
        const rect = list.getBoundingClientRect();
        const scale = getComputedStyle(list, '::after').scale;
        const grown = scale === 'none' ? 1 : Number.parseFloat(scale.split(' ')[1] ?? scale);
        return { y: rect.top + rect.height * grown, grown };
      });
    // Bevor die Schritte auf Lesehöhe sind: noch keine Linie.
    await placeAt(page, '.process', viewport * 0.7);
    expect((await tip()).grown).toBe(0);
    // Unterwegs steht die Spitze bei 58 % der Fensterhöhe, wo man liest.
    for (const fromTop of [0.4, 0.2, 0]) {
      await placeAt(page, '.process', viewport * fromTop);
      const { y, grown } = await tip();
      expect(grown).toBeGreaterThan(0);
      expect(grown).toBeLessThan(1);
      expect(Math.abs(y - viewport * 0.58), `Spitze bei ${Math.round(y)} px`).toBeLessThan(4);
    }
    // Jeder Punkt wird grün, wenn die Spitze ihn erreicht: darüber voll, darunter noch klein.
    const dots = await page.locator('.process-step').evaluateAll(
      (steps, line) =>
        steps.map((step) => ({
          above: step.getBoundingClientRect().top < (line as number) - 60,
          below: step.getBoundingClientRect().top > (line as number) + 20,
          scale: getComputedStyle(step, '::before').scale,
        })),
      viewport * 0.58,
    );
    for (const dot of dots) {
      if (dot.above) expect(dot.scale === 'none' || Number.parseFloat(dot.scale) === 1).toBe(true);
      if (dot.below) expect(Number.parseFloat(dot.scale)).toBeLessThan(0.5);
    }
    // Am Ende steht die ganze Linie.
    await placeAt(page, '.delivery', viewport * 0.4);
    expect((await tip()).grown).toBe(1);
  });

  test('Tastatur: Was der nächste Bogen verdeckt, kommt beim Fokus wieder ins Bild', async ({
    page,
  }) => {
    await openHome(page);
    const viewport = await page.evaluate(() => window.innerHeight);
    // Das Sortiment liegt schon halb über dem Hero: Der letzte Link des Heros ist verdeckt.
    await placeAt(page, '#sortiment', viewport * 0.45);
    const link = page.locator('.hero .visit-links a').last();
    const covered = () =>
      link.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return !element.contains(hit);
      });
    expect(await covered()).toBe(true);
    // Mit der Tastatur zurück: vom ersten Knopf des Sortiments zum letzten Link des Heros.
    await page.locator('#sortiment .room-btn').first().focus();
    await page.keyboard.press('Shift+Tab');
    await expect(link).toBeFocused();
    await nextFrames(page);
    // Die Seite ist so weit zurückgegangen, dass der Hero wieder frei steht: Der Link ist zu sehen.
    expect(await covered()).toBe(false);
    expect(await shiftOf(page, '.hero')).toBeLessThan(1);
  });

  test('Ohne Unterstützung im Browser steht alles, und das Band bricht um', async ({ page }) => {
    // Browser ohne scrollgekoppelte Animationen (Firefox, Safari vor 26) lesen den Block nicht.
    // Nachgestellt, indem die Bedingung im ausgelieferten CSS unerfüllbar wird.
    await page.route('**/*.css', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replaceAll('animation-timeline:view()', 'x-none:view()');
      await route.fulfill({ response, body });
    });
    await openHome(page);
    const viewport = await page.evaluate(() => window.innerHeight);
    await placeAt(page, '#sortiment', viewport * 0.5);
    expect(await translateOf(page, '.hero')).toMatch(AT_REST);
    await placeAt(page, '#sortiment .section-lead', viewport - 30);
    expect(await translateOf(page, '#sortiment .section-lead')).toMatch(AT_REST);
    expect(await translateOf(page, '#sortiment-title .sc-wi')).toMatch(AT_REST);
    // Das Band: eine ruhige Liste, alle Wörter sichtbar, nichts doppelt.
    const band = await page.locator('[data-ticker]').evaluate((element) => ({
      wrap: getComputedStyle(element.querySelector('.ticker-list')!).flexWrap,
      copy: getComputedStyle(element.querySelector('.ticker-copy')!).display,
      inside: [...element.querySelectorAll('.ticker-list:not(.ticker-copy) .pill')].every(
        (pill) => {
          const rect = pill.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= window.innerWidth;
        },
      ),
    }));
    expect(band).toEqual({ wrap: 'wrap', copy: 'none', inside: true });
    // Die Haltung steht in voller Deckkraft.
    await placeAt(page, '.statement-text', viewport * 0.85);
    expect(
      await page
        .locator('.statement-text .w')
        .last()
        .evaluate((word) => getComputedStyle(word).opacity),
    ).toBe('1');
  });
});
