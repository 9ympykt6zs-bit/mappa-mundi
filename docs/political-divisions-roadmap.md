# Atlas Quest Political Divisions Roadmap

This document tracks first-level political divisions beneath modern countries: states, provinces, territories, prefectures, federal subjects, regions, autonomous communities, and similar admin-1 units.

Planning rules:

- Activities should generally stay at 10 targets or fewer.
- Countries with more than 10 divisions should be split into regional activities.
- Use real boundary data only. Do not fake shapes.
- Every implemented political-division activity should eventually appear in Free Play, Study Mode, the relevant journey, and Settings / Study Targets.
- Keep historical geography separate from modern political geography.

## Tracking Table

| Country | Division type | Approx. target count | Needs regional split? | Planned activity IDs | Current status | Data source | Journey placement | Free Play placement | Study Mode placement | Settings / Study Targets placement | Notes / TODOs |
|---|---:|---:|---|---|---|---|---|---|---|---|---|
| United States | States | 50 states, plus capitals in current activities | Yes | `us-states-capitals-01` through `us-states-capitals-10` | Done | Existing app data / U.S. state polygons | United States journey | North America -> United States -> States & Capitals | United States journey study list | Political Divisions / United States; Cities & Capitals / United States Capitals | Current activities pair states with capitals. Keep future pure-state or capital-only variants separate if needed. |
| Canada | Provinces & territories | 13 | Yes | `canada-atlantic-provinces`, `canada-central-canada`, `canada-prairie-provinces`, `canada-western-northern`, `canada-provinces-territories` | Done | Natural Earth admin-1 source used by current app | North America journey | North America -> Canada | North America journey study list | Political Divisions / Canada Provinces; Political Divisions / Canada Territories | Full review activity remains a review path; regional activities are the main learning path. |
| Mexico | States / federal entities | 32 | Yes | `mexico-northwest`, `mexico-northeast`, `mexico-west-bajio`, `mexico-central`, `mexico-south-gulf-yucatan`, `mexico-states` | Done | Natural Earth admin-1 source used by current app | North America journey | North America -> Mexico | North America journey study list | Political Divisions / Mexico | Full review activity remains a review path; regional activities are the main learning path. |
| Australia | States & mainland territories | 8 | No | `australia-states-territories` | Done | Natural Earth admin-1 source filtered to internal states/territories | Oceania journey | Australia / Oceania -> Australia States & Territories | Oceania journey study list | Political Divisions / Australia | External territories are excluded from the MVP activity unless later supported cleanly. |
| China | Provinces, autonomous regions, municipalities, SARs | 33 | Yes | `china-north-northeast-political-divisions`, `china-east-political-divisions`, `china-south-central-political-divisions`, `china-southwest-political-divisions`, `china-northwest-political-divisions` | Done | Natural Earth admin-1 source; Hong Kong SAR aggregated from district polygons | Asia journey | Asia -> China: Provinces, Regions, Municipalities & SARs | Asia journey study list | Political Divisions / China / regional groups | Taiwan and disputed/special features are intentionally skipped pending an app-wide policy. |
| Russia | Federal subjects | 83 | Yes | `russia-central-federal-subjects`, `russia-more-central-federal-subjects`, `russia-northwest-federal-subjects`, `russia-more-northwest-federal-subjects`, `russia-southern-federal-subjects`, `russia-north-caucasus-federal-subjects`, `russia-volga-federal-subjects`, `russia-more-volga-federal-subjects`, `russia-ural-federal-subjects`, `russia-siberia-federal-subjects`, `russia-far-east-federal-subjects`, `russia-more-far-east-federal-subjects` | Done | Natural Earth admin-1 source filtered to internationally recognized federal subjects | Russia journey | Russia -> Russia: Federal Subjects | Russia journey study list | Political Divisions / Russia / regional groups | Crimea, Sevastopol, Donetsk, Luhansk, Zaporizhzhia, and Kherson are excluded pending an app-wide disputed/occupied-territory policy. |
| India | States & union territories | 36 | Yes | `india-north-political-divisions`, `india-west-central-political-divisions`, `india-east-political-divisions`, `india-northeast-political-divisions`, `india-south-political-divisions`, `india-islands-political-divisions` | Done | Natural Earth admin-1 source filtered to India states and union territories | India journey; Asia journey | Asia -> India: States & Union Territories | India and Asia journey study lists | Political Divisions / India / regional groups | Source geometry is used as-is; disputed/border sensitivity needs an app-wide policy if custom handling is required later. |
| Brazil | States & federal district | 27 | Yes | `brazil-north-political-divisions`, `brazil-northeast-political-divisions`, `brazil-central-west-political-divisions`, `brazil-southeast-political-divisions`, `brazil-south-political-divisions` | Done | Natural Earth admin-1 source filtered to Brazil states and Federal District | Brazil journey; South America journey | South America -> Brazil: States & Federal District | Brazil and South America journey study lists | Political Divisions / Brazil / regional groups | Distrito Federal is included as `Distrito Federal / Federal District`; Portuguese diacritics are preserved in user-facing labels. |
| Japan | Prefectures | 47 | Yes | `japan-hokkaido-tohoku-political-divisions`, `japan-kanto-political-divisions`, `japan-chubu-political-divisions`, `japan-kansai-political-divisions`, `japan-chugoku-shikoku-political-divisions`, `japan-kyushu-okinawa-political-divisions` | Done | Natural Earth admin-1 source filtered to Japan prefectures | Japan journey; Asia journey | Asia -> Japan: Prefectures | Japan and Asia journey study lists | Political Divisions / Japan / regional groups | User-facing labels use common English forms without macrons; Natural Earth source names are preserved in source properties. |
| Germany | States / Länder | 16 | Yes | `germany-north-east-political-divisions`, `germany-south-west-political-divisions` | Done | Natural Earth admin-1 source filtered to Germany states | Germany journey; Europe journey | Europe -> Germany: States / Länder | Germany and Europe journey study lists | Political Divisions / Germany / regional groups | User-facing labels use common English names where helpful; `Baden-Württemberg` keeps standard German spelling. |
| France | Regions | 13 metropolitan regions implemented; 5 overseas regions planned | Yes | `france-northern-eastern-regions-political-divisions`, `france-southern-regions-political-divisions`; TODO `france-overseas-regions-political-divisions` | Done | Natural Earth France departments aggregated into metropolitan regions | France journey; Europe journey | Europe -> France: Regions | France and Europe journey study lists | Political Divisions / France / regional groups | Overseas regions are left as TODO to avoid distorting the Europe/France camera; add them later as a special activity with deliberate overseas-region handling. |
| Spain | Autonomous communities and autonomous cities | 19 | Yes | `spain-northern-central-political-divisions`, `spain-southern-eastern-political-divisions` | Done | Natural Earth Spain provinces aggregated into autonomous communities and cities | Spain journey; Europe journey | Europe -> Spain: Autonomous Communities & Cities | Spain and Europe journey study lists | Political Divisions / Spain / regional groups | Ceuta and Melilla are included in the southern/eastern activity as autonomous-city targets. |
| Italy | Regions | 20 | Yes | `italy-northern-regions-political-divisions`, `italy-central-southern-regions-political-divisions`, `italy-islands-political-divisions` | Done | Natural Earth Italy provinces aggregated into regions | Italy journey; Europe journey | Europe -> Italy: Regions | Italy and Europe journey study lists | Political Divisions / Italy / regional groups | Islands are split into a short focused activity for Sicily and Sardinia. |
| United Kingdom | Countries | 4 | No | `united-kingdom-countries-political-divisions` | Done | Natural Earth map units filtered to England, Scotland, Wales, and Northern Ireland | United Kingdom journey; Europe journey | Europe -> United Kingdom: Countries | United Kingdom and Europe journey study lists | Political Divisions / United Kingdom / Countries | MVP scope is only the four UK countries; counties, councils, and local authorities are intentionally deferred. |

## Implementation Checklist For Each Country

1. Confirm the modern admin-1 scope and target names.
2. Choose or import a compatible real boundary data source.
3. Split into activities with no more than 10 targets where practical.
4. Add activity JSON files with stable target IDs and label anchors.
5. Add or reuse a centralized admin-1 source in the MapLibre runner.
6. Add the activities to Free Play.
7. Add the activities to the relevant journey preset.
8. Confirm Study Mode lists the activities from the journey.
9. Add Settings / Study Targets grouping under `Political Divisions / [Country]`.
10. Verify chips, labels, read-aloud, difficulty, and completion behavior.

## Data Source Notes

- Current North America political-division activities use the app's existing admin-1 source.
- Australia uses a filtered Natural Earth Admin 1 States/Provinces source.
- Future countries should prefer a consistent open admin-1 source where possible, but each source must be checked for modern boundaries, naming, disputed areas, and license compatibility before import.

