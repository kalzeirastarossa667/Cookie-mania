# Cookie Empire — Foundation 2.7.2 Feedback Report

Date: 2026-09-30  
Baseline: Foundation 2.7.1 Stable  
Save schema: v7 unchanged

## Goal

Add an in-game **Donner mon avis** section for public testers. Submissions use the project owner's Formspree form at `https://formspree.io/f/mdekjdqz`.

## Architecture

This release changes only presentation/integration code. GameState, Economy, GameEngine, SaveSystem, Content, progression, prestige balance, autosave timing, storage key and save schema are unchanged.

The site remains plain HTML/CSS/Vanilla JavaScript. The form uses native `fetch` + `FormData` instead of adding the optional Formspree CDN library.

Fields:
- pseudonym: optional, max 60 characters;
- rating: optional, 1–5;
- comment: required, 3–2000 characters;
- fixed game version and source metadata.

No cookie balance, save data, generator/research/prestige ownership, localStorage content, e-mail address, password or API secret is attached by Cookie Empire.

## Interaction behavior

The POST request is sent asynchronously to Formspree and the tester stays on the game page. While the request is pending, duplicate submission is blocked. On success the form is cleared and a polite confirmation appears. On failure the comment is retained and the player can retry. Feedback failure never blocks gameplay or saving.

## Red → green evidence

A feedback interface test was committed before runtime implementation. On the untouched Foundation 2.7.1 runtime, the existing Foundation suite remained **220/220 PASS** and then failed exactly on `section de feedback présente`.

After implementation:
- Foundation: **220/220 PASS**;
- targeted interface: PASS;
- Constellation/Horizons DOM: **56/56 PASS**.

The interface suite additionally checks exact endpoint and POST method, JSON negotiation, successful reset, duplicate-submit protection, failed-network behavior, retained comment on error and unchanged gameplay state.

## Browser verification

Playwright intercepts the Formspree endpoint so CI never sends a real comment or e-mail.

Final result:
- desktop Chromium: **6/6 PASS**;
- Pixel 5 emulation: **6/6 PASS**;
- total: **12/12 PASS in 16.4 s**.

The first browser run had 10 passes and 2 failures because an older prestige scenario still required the literal footer string `Foundation 2.7.1 · Stable`. The gameplay path itself was green. Only that stale release-label assertion was updated; the final 12/12 run passed.

## Remaining limits

Automated tests prove the browser request contract but deliberately do not prove delivery into the owner's real mailbox. Formspree availability, quota, spam filtering or policy/CORS changes can affect comment delivery without affecting the game.

Required final manual check after deployment: submit one real comment through the public game and confirm that the expected e-mail arrives.

Pixel 5 coverage is browser emulation, not a physical-phone test.
