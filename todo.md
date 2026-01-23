# TODO

## Bugs

### Tag Browser - Single-Select Category Enforcement
**Status:** Open  
**Priority:** Medium  
**Date Added:** 2026-01-23

The TagBrowser component allows selecting multiple tags for single-select categories (e.g., Setting, Protagonist, Antagonist, Finale). When used in the Locked Elements section, this creates invalid script configurations.

**Expected behavior:** When clicking a tag in a single-select category, it should replace any existing selection in that category rather than adding to it.

**Current workaround:** Browser mode is disabled for the Locked Elements section; only available for Excluded Elements (where multi-select is always valid).
