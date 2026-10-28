# Egypt: Hidden Temple Valley — environment brief (2026-10-28)

## Location and story
Fictional, previously undocumented temple hidden approximately 2–3 km from the Valley of the Kings near Luxor. The site is fictional, not a claim of an archaeological discovery. The player's route begins in a plausible Theban limestone desert landscape, then branches into a secluded wadi with a concealed entrance.

## Visual direction
- Reference: real Valley of the Kings / Theban hills; bright cream, pale ochre, warm beige limestone and scree, not dark sci-fi or lunar terrain.
- High steep layered limestone cliffs, irregular eroded faces, fractured ledges, dry gullies, rubble fans, scattered angular stones.
- Valley floor: pale compacted sand and gravel, stone-rich stretches, occasional wind-blown sand pockets; avoid uniform dunes inside steep wadis.
- Natural variation: stony wadi -> narrow winding gorge -> sandy sheltered pocket -> hidden temple approach.
- Strong Egyptian daylight with plausible shadows and mild atmospheric perspective. Avoid exaggerated black/gold procedural noise and overly sharp normal maps.
- The White Desert is a separate location and geological reference only; do not transplant its mushroom-shaped chalk rocks into the Theban Hills.

## Prototype implementation order (Godot 4)
1. Preserve current working 200 m scene and shader as backup before edits.
2. Replace problematic high-frequency procedural material with stable, pale limestone and sand/gravel blend. No procedural NORMAL_MAP until validated.
3. Sculpt large-scale believable cliff silhouettes and talus slopes before adding micro-detail.
4. Add graded rock scattering and localized sand patches, preserving walkable route and collision.
5. Set restrained directional sun, sky, ambient fill and distance haze; check clipping and frame time.
6. Test at walking eye level and compare against photographic references, not generated images alone.
7. Extend route toward a fictional concealed temple 2–3 km away only after the 200 m slice is stable.

## Quality checks
- No black/gold speckles, shimmering, repeating texture or floating rocks.
- Consistent rock scale and contact shadows; physically traversable path.
- Reasonable performance on GTX 1060 3 GB target.
- Keep edits on feature branch; validate Godot scene before merging.
