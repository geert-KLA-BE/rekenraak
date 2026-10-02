# Bugs & known gaps — backlog for a later pass

Found but deliberately **not fixed** in the pass that found them. One line each: where, what,
how to reproduce, and (if known) the fix direction. Remove the line when fixed and log the fix
in [UpdateState.md](UpdateState.md). Agents: append here, never fix silently.

---

## Layout / sheet

- Switching an occupied multi-page worksheet into and out of print media can trigger repeated `useMeasuredHeights` body-first repacks and a measurement cooldown; reproduced with the previous 20mm margins and the new 12mm margins.
- A half-width MAB herkennen block with six 999 exercises in `mab-bw` uses six rows and extends about 59px beyond the page body (seen with the original 1018px block height too); the packer does not split this dense block automatically.

## Docs

- ARCHITECTURE §14 links 13 `src/board/*` files that exist only on branch `whiteboard`
  (2026-09-12). Known; the heading says so.
