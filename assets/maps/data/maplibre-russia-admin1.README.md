# Russia Admin-1 Source

`maplibre-russia-admin1.geojson` is derived from Natural Earth `ne_10m_admin_1_states_provinces` GeoJSON:

https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson

Natural Earth data is public domain.

Notes:

- The file is filtered to the internationally recognized Russian federal subjects used by Atlas Quest MVP political-division activities.
- The source contains Crimea and Sevastopol under Russia; those are intentionally omitted for this MVP pass.
- Donetsk, Luhansk, Zaporizhzhia, and Kherson are not included in these MVP activities.
- TODO: Disputed/occupied-territory handling needs an app-wide policy.
- Several Natural Earth names differ from the user-facing Atlas Quest labels. The activity data uses stable Atlas Quest target IDs and user-facing names while retaining source names in feature properties.

