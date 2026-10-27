# Accessible Job Application Portal

Open `index.html` in any browser. No install, no libraries.

## Files
- index.html – semantic structure, labels, hints, ARIA
- style.css – high-contrast, mobile-friendly, visible focus
- script.js – validation, error summary, progress, text size

## Accessibility features
- Every input has a real <label>; hints and errors linked with aria-describedby
- aria-invalid set on bad fields; errors say what is wrong and how to fix it
- Error summary (role="alert") gets focus on failed submit; each item jumps to its field
- Skip link, landmarks (header/main), fieldset + legend grouping
- Full keyboard use; 3px focus ring; 44-48px touch targets
- autocomplete / inputmode attributes for faster, easier entry
- Text size buttons (A, A+, A++) with aria-pressed
- prefers-reduced-motion respected; responsive down to 320px

## Test it yourself
1. Keyboard only: Tab, Shift+Tab, Space, Enter, arrow keys in the select. Never touch the mouse.
2. Screen reader: NVDA (Windows), VoiceOver (Cmd+F5 on Mac, triple-click side button on iPhone), TalkBack (Android). Check each field is announced with its label, hint and error.
3. Zoom to 200% and 400%; the layout must not scroll sideways.
4. Contrast: check colours at webaim.org/resources/contrastchecker.
5. Run Lighthouse (Chrome DevTools) or the axe DevTools extension.

## Apple role connection (interview talking points)
- You can explain WCAG 2.2 basics: labels, focus, contrast, error identification, target size.
- You tested with VoiceOver, Apple's own screen reader.
- You can say which issues automated tools miss (e.g. confusing error wording, focus order).
