# United States Map Source

This U.S. map is generated from `us-atlas` `states-albers-10m` TopoJSON,
which is derived from U.S. Census Bureau cartographic boundary files. Census
boundary data is public domain.

- Source: https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json
- Projection: D3 Albers USA composite with lower 48, Alaska, and Hawaii insets
- Purpose: keep a stable lon/lat workflow for future capitals and geography features

The dedicated proof-sheet base map is `assets/maps/usa/usa-map.svg`. It is used
by `assets/maps/data/us-states-capitals-01.json`, where state answers target
individual SVG paths and capital answers target projected lon/lat points.

The generated SVG and JSON files are designed so state paths and future point
features can be placed from real geographic coordinates without guessing the
projection later.
