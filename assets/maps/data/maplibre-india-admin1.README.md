# India Admin-1 Source

`maplibre-india-admin1.geojson` is derived from Natural Earth `ne_10m_admin_1_states_provinces` GeoJSON:

https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson

Natural Earth data is public domain.

Notes:

- The file is filtered to India's 28 states and 8 union territories for Atlas Quest MVP political-division activities.
- Telangana is represented separately from Andhra Pradesh in the source.
- Dadra and Nagar Haveli and Daman and Diu appears as a combined union territory in the source and is used that way here.
- The source geometry is used consistently as-is. TODO: If Atlas Quest later needs explicit disputed-border policy handling, define it app-wide rather than per activity.

