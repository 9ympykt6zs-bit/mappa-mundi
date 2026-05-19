# China Admin-1 Source

`maplibre-china-admin1.geojson` is derived from Natural Earth `ne_10m_admin_1_states_provinces` GeoJSON:

https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson

Natural Earth data is public domain.

Notes:

- The file is filtered to the China provincial-level targets used by Atlas Quest MVP political-division activities.
- Hong Kong is aggregated into one SAR target from the Natural Earth Hong Kong district polygons because the source does not provide a single Hong Kong SAR admin-1 feature in this layer.
- Macau is included as the single Macau SAR feature present in the source.
- Taiwan is intentionally not included in these MVP activities. Taiwan/disputed-territory handling needs a deliberate app-wide policy before it is added to any China-related activity.
- Paracel Islands and other disputed/special features from the source are not included in these MVP political-division activities.

