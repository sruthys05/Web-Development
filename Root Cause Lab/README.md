# Accessibility Bug Reproduction and Root-Cause Lab

Open `index.html` (no install). Left = broken, right = fixed.

    index.html      side-by-side viewer
    broken/         19 deliberate bugs
    fixed/          same page, each fix marked  FIX nn  in the code
    BUGS.md         write-up: steps, DevTools trace, WCAG, severity, fix

## How to use it
1. Open `broken/index.html` in its own tab. Do NOT read BUGS.md yet.
2. Spend 20 minutes finding issues with keyboard, then DevTools, then Lighthouse/axe.
3. Compare with BUGS.md. Note what you missed and which tool would have caught it.
4. Diff `broken/` and `fixed/` to see each change.

## DevTools toolkit
Chrome / Edge
- Elements > Accessibility pane: name, role, state, ARIA attributes of the selected node
- Elements > Event Listeners: who handles click/keydown (finds div buttons and traps)
- Elements > Properties/Computed: tabindex, outline, colour
- Inspect a colour swatch: contrast ratio is shown in the picker
- Settings > Experimental or Customize > "Full accessibility tree" toggle in the Accessibility pane
- Rendering tab: emulate vision deficiencies, prefers-reduced-motion
- Lighthouse > Accessibility, and the axe DevTools extension

Firefox
- Accessibility panel: full tree, "Check for issues" (Contrast, Keyboard, Text Labels)
- Inspector > Events badge ("ev") next to a node shows its listeners
- Accessibility panel > "Simulate" for colour-blindness

Manual
- Keyboard: Tab, Shift+Tab, Enter, Space, Esc, arrows
- Screen reader: NVDA (Windows), VoiceOver (Cmd+F5), TalkBack
- Zoom to 200% and 400%
