# Bug Report: Orchard Coffee (19 issues)

Severity: **Critical** = blocks a task for some users. **High** = serious barrier. **Medium** = causes confusion. **Low** = annoyance.
Test file: `broken/index.html`. Fixes are marked `FIX nn` in `fixed/`.

| # | Bug | WCAG | Severity |
|---|-----|------|----------|
| 01 | No `lang` on `<html>` | 3.1.1 (A) | Medium |
| 02 | Title is just "Page" | 2.4.2 (A) | Medium |
| 03 | No skip link | 2.4.1 (A) | Medium |
| 04 | Wrong heading order, fake headings, two h1 | 1.3.1 (A), 2.4.6 (AA) | Medium |
| 05 | Low-contrast text and buttons | 1.4.3 (AA) | High |
| 06 | `div` used as "Add to cart" buttons | 2.1.1, 4.1.2 (A) | Critical |
| 07 | Focus outline removed | 2.4.7 (AA) | High |
| 08 | Keyboard trap in offer popup | 2.1.2 (A) | Critical |
| 09 | Images without `alt` | 1.1.1 (A) | High |
| 10 | Icon-only cart button has no name | 4.1.2, 1.1.1 (A) | High |
| 11 | Inputs labelled by placeholder only | 1.3.1, 3.3.2, 4.1.2 (A) | High |
| 12 | Wrong ARIA roles on navigation | 4.1.2, 1.3.1 (A) | Medium |
| 13 | `aria-hidden` on a focusable link | 4.1.2 (A) | High |
| 14 | Error shown by colour only | 1.4.1, 3.3.1 (A) | High |
| 15 | Positive `tabindex` breaks focus order | 2.4.3 (A) | Medium |
| 16 | "Click here" link text | 2.4.4 (A) | Low |
| 17 | Accordion has no expanded state | 4.1.2 (A) | Medium |
| 18 | "Added to cart" message not announced | 4.1.3 (AA) | High |
| 19 | Pinch-zoom disabled | 1.4.4 (AA) | High |

---

## 01 No `lang` attribute
- **Reproduce:** Turn on a screen reader. Text is read with the wrong accent or voice.
- **Trace:** Elements panel > `<html>` has no `lang`. Lighthouse reports "`<html>` element does not have a `[lang]` attribute".
- **Fix:** `<html lang="en">`

## 02 Page title is "Page"
- **Reproduce:** Look at the browser tab, or open several tabs and use a screen reader's window list.
- **Trace:** Elements > `<head><title>`.
- **Fix:** `<title>Orchard Coffee - Small-batch roasts</title>`. Put the page-specific part first on multi-page sites.

## 03 No skip link
- **Reproduce:** Reload and press Tab. You pass the promo, logo, 3 nav links and cart before reaching content, on every page.
- **Trace:** Elements: the first focusable element is the promo link; there is no `href="#main"` anchor.
- **Fix:** First element in `<body>`: `<a class="skip" href="#main">Skip to main content</a>`, plus `<main id="main" tabindex="-1">`. Visible on focus.

## 04 Heading order and fake headings
- **Reproduce:** Screen reader headings list (NVDA: `Insert+F7`; VoiceOver rotor). It reads h1, h4, h2, h1. Product names are not listed.
- **Trace:** Chrome Accessibility pane shows role `paragraph` for "Ember Blend" even though it is styled bold and large. Firefox Accessibility tree makes the order visible. Lighthouse flags heading order.
- **Fix:** One `h1`, then `h2` sections, `h3` product names. Choose heading levels by structure, size with CSS.

## 05 Low contrast
- **Reproduce:** Look at grey text (`#aaa` on near-white, about 2.2:1) and white on `#e8a24a` buttons (about 2.1:1). Squint or lower screen brightness.
- **Trace:** Inspect the element, click the colour swatch in Styles: the picker shows the ratio with a failing mark. Firefox Accessibility > Check for issues > Contrast. Needs 4.5:1 for normal text.
- **Fix:** `#595959` text (7:1) and `#8a4b00` buttons with white text.

## 06 `div` buttons
- **Reproduce:** Press Tab. The "Add to cart" boxes are skipped. Even if focused, Enter/Space do nothing.
- **Trace:** Elements > Event Listeners shows a `click` listener on a `div`, none for `keydown`. Accessibility pane: role `generic`, no name from role, `focusable: false`.
- **Fix:** `<button class="btn" data-name="Ember Blend">`. A native button gives focus, Enter/Space, role and name for free. Do not rebuild it with `role="button"` plus tabindex plus key handlers unless you must.

## 07 Missing focus styles
- **Reproduce:** Tab through the page. You cannot see where focus is.
- **Trace:** Elements > select a link > Styles tab shows `*:focus { outline: none }`. Toggle `:focus` in the `:hov` panel to force the state and look at the computed outline.
- **Fix:** Delete the reset. Add `:focus-visible { outline: 3px solid #0b5cad; outline-offset: 2px }`. Needs 3:1 against its background (2.4.11 in WCAG 2.2).

## 08 Keyboard trap in the offer popup
- **Reproduce:** Tab to "Get 10% off", press Enter. Tab or Shift+Tab cycles between the email field and "Claim offer". Esc does nothing. The only close control is a mouse-only ×.
- **Trace:** Elements > `#modal` > Event Listeners: a `keydown` handler that calls `preventDefault()` on every Tab (see `app.js`). The × is a `div` with a click listener only. Also: `Esc` handler missing, and focus is not returned after closing.
- **Fix:** Use native `<dialog>` with `showModal()`. It traps focus legitimately, closes on Esc, restores focus to the opener, and makes the page behind inert. Add a real `<button aria-label="Close offer">`.

## 09 Images without alt
- **Reproduce:** Screen reader announces "graphic, logo.svg" or the file name.
- **Trace:** Accessibility pane: name is empty or the file name. Lighthouse "Image elements do not have `[alt]` attributes".
- **Fix:** Informative logo: `alt="Orchard Coffee"`. Decorative bag illustration: `alt=""` so it is skipped.

## 10 Icon-only button with no name
- **Reproduce:** Screen reader says just "button".
- **Trace:** Accessibility pane: Name is empty. Children: an SVG with no title.
- **Fix:** `<button aria-label="Cart">` and `aria-hidden="true" focusable="false"` on the decorative SVG. Visible text or a visually hidden span also works.

## 11 Placeholder-only inputs
- **Reproduce:** Type in "Your name". The hint vanishes. Screen reader may say only "edit text".
- **Trace:** Accessibility pane: Name comes from `placeholder` (or is empty), no `<label for>` relationship. Placeholder text is also low contrast.
- **Fix:** `<label for="email">Email address</label>` + `<input id="email" autocomplete="email">`. Keep placeholders for examples only.

## 12 Wrong ARIA roles
- **Reproduce:** Screen reader announces "menu" and expects arrow-key behaviour that does not exist.
- **Trace:** Elements: `<ul role="menu">`, `<li role="menuitem">`. Accessibility tree shows the links nested inside menuitems, hiding their link role. Menu roles mean an application-style menu (like File > Edit) and require arrow keys, Home/End and roving focus.
- **Fix:** Remove the roles. Use `<nav aria-label="Main"><ul><li><a>`. Rule: no ARIA is better than bad ARIA.

## 13 `aria-hidden` on a focusable link
- **Reproduce:** Tab to the promo banner link. Focus lands on it, the screen reader says nothing or "blank".
- **Trace:** Elements: ancestor has `aria-hidden="true"` but contains an `<a href>`. Accessibility pane marks the node ignored while it is still focusable. Lighthouse: "`[aria-hidden="true"]` elements contain focusable descendants".
- **Fix:** Remove `aria-hidden`. If content really must be hidden, hide it with `hidden` / `display:none`, or add `inert`.

## 14 Error shown by colour only
- **Reproduce:** Enter `abc` in Email and press Subscribe. Only the border turns red. Nothing is announced and focus stays on the button.
- **Trace:** Elements: class `bad` added, no text node, no `aria-invalid`, no `aria-describedby`. Rendering tab > Emulate vision deficiency (achromatopsia): the error disappears.
- **Fix:** Show text "Error: enter an email like name@example.com.", link it with `aria-describedby`, set `aria-invalid="true"`, add a thicker border, and move focus to the field.

## 15 Positive `tabindex`
- **Reproduce:** Reload, press Tab once. Focus jumps to "Contact us" in the footer.
- **Trace:** Elements: `tabindex="1"` on the footer link. Search the DOM for `tabindex="`. Accessibility pane does not warn; you find it by tabbing.
- **Fix:** Remove it. Use only `0` (join natural order) or `-1` (focus by script). Fix order with DOM order.

## 16 "Click here" link
- **Reproduce:** Open the screen reader's links list: "Click here". It means nothing out of context.
- **Trace:** Accessibility pane: link name = "Click here".
- **Fix:** "Learn where our beans come from". Link text should make sense alone.

## 17 Accordion without state
- **Reproduce:** Screen reader says "Delivery details, button" with no hint it opens something, and no feedback after pressing.
- **Trace:** Accessibility pane: no `expanded` property, no `controls`. Event Listeners shows an inline `onclick` toggling `hidden`.
- **Fix:** `aria-expanded="false"` and `aria-controls="acc-body"`, updated in JS on each click.

## 18 Status message not announced
- **Reproduce:** With a screen reader on, press Add to cart (use the mouse if needed). Nothing is spoken; sighted users see "Ember Blend added to cart".
- **Trace:** Elements: `<div id="toast">` has no `role="status"` or `aria-live`. In Chrome you can see the text change in the DOM (Break on > subtree modifications).
- **Fix:** `<p id="toast" role="status">` present in the DOM from page load, then change its text. Do not create the live region at the same moment as the message.

## 19 Zoom disabled
- **Reproduce:** On a phone, pinch to zoom: nothing happens. Desktop: Chrome Device Mode shows the same viewport meta.
- **Trace:** Elements > `<meta name="viewport">` contains `maximum-scale=1, user-scalable=no`. Lighthouse: "`[user-scalable="no"]` is used".
- **Fix:** `<meta name="viewport" content="width=device-width, initial-scale=1">`

---

## What automated tools found vs missed (test yourself)
Lighthouse or axe usually catch: 01, 02, 05, 09, 10, 11, 13, 19, and part of 04 and 12.
Usually missed (need manual testing): 03 (partly), 06 root cause, 07, 08, 14, 15, 17, 18.
Learning point: tools find missing attributes; humans find behaviour problems.
