# U.S. capital-location city choices

Authored and source-checked 2026-09-06. `src/atlas/us-capital-location-city-choices.js` supplies display/input context for each of the 50 states: its existing capital and two non-capital cities. These city choices are not activity targets, evidence concepts, or new atlas entities. No D.C. record is included.

## Selection and sources

The fixed baseline is **2020 Census population**, not a claim about current annual population rankings. For each state, deduplicate Census place rows by seven-digit GEOID, exclude nonfunctioning entities (`FUNCSTAT = N`) and the capital, sort by `POP100` descending (GEOID ascending breaks ties), and take two places. Use incorporated places, including consolidated city-government balances; exclude metropolitan-area populations, county subdivisions/townships, and CDPs. Hawaii is the explicit exception: use CDPs and exclude Urban Honolulu, which represents the capital in Census place data. Its choices are East Honolulu and Pearl City.

The source is the Census Bureau's archived **2020 Census** TIGERweb state place tables, preserved in the `acs24` file directory. That directory name is the publication wrapper; the table headings identify January 1, 2020 geography and `POP100` is the 2020 Census count, not an ACS estimate. For example: [Alabama incorporated places](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs24/tigerweb_acs24_incplace_2020_tab20_al.html), [Louisiana incorporated places](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs24/tigerweb_acs24_incplace_2020_tab20_la.html), [Rhode Island incorporated places](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs24/tigerweb_acs24_incplace_2020_tab20_ri.html), [Delaware incorporated places](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs24/tigerweb_acs24_incplace_2020_tab20_de.html), and [Hawaii CDPs](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs24/tigerweb_acs24_cdp_2020_tab20_hi.html).

The same URL pattern covers all other states: replace the final state abbreviation with the lowercase `stateCode` in the module. Each distractor retains its Census name, GEOID, and `POP100` as `population2020`, making the selection auditable. All 50 state source tables were downloaded and ranked during authoring; no live network fetch is required by the app or checker.

## Coordinates and naming

Distractor longitude/latitude come directly from each source row's `INTPTLON` / `INTPTLAT`. These are real representative points inside Census place geography, **not surveyed downtown markers**. Consolidated places can cover large areas: Anchorage's representative point lies east of downtown, and Augusta's and Louisville's cover their government balance areas. The renderer must not imply street-level precision. Census explains representative coordinates in its [Gazetteer files documentation](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2020.html).

Short display names replace Augusta-Richmond County consolidated government (balance), Louisville/Jefferson County metro government (balance), and Lexington-Fayette with Augusta, Louisville, and Lexington. New York displays as New York City. Source names remain alongside them.

Two source details require care on refresh:

- Massachusetts includes a duplicate Worcester row; deduplication by GEOID prevents presenting Worcester twice.
- [Kentucky's table](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs24/tigerweb_acs24_incplace_2020_tab20_ky.html) separates nonfunctioning Louisville city (246,161) from its government balance (386,884). The module keeps the latter source row and its literal population and excludes the former. Their sum, 633,045, is the commonly reported Louisville figure, as described in [Louisville Metro's 2022–2023 budget](https://louisvilleky.gov/sites/default/files/2022-08/2022-2023%20LOUISVILLE%20METRO%20APPROVED%20BUDGET.pdf). Either convention selects Louisville and Lexington; do not interpret 386,884 as the combined municipal total.

Capital names, IDs, and coordinates are copied exactly from `assets/maps/data/us-capitals.json`. `capitalId` is the atlas relationship ID; `capitalActivityIds` preserves both the global and section activity IDs. Global and section capital coordinates differ in existing content; this module does not replace or reconcile those source coordinates. A renderer with an active capital feature should retain that feature's existing position. Saint Paul remains the global source spelling; section content uses St. Paul.

## Contract and verification

`US_CAPITAL_LOCATION_CITY_CHOICES` and both lookup helpers return deeply frozen records. `getUsCapitalLocationCityChoices(stateId)` accepts a state ID. `getUsCapitalLocationCityChoicesForCapital(capitalId)` accepts an atlas capital ID or an exact global/section activity ID. Unknown or non-string IDs return `null`.

Run `node scripts/check-us-capital-location-city-choices.mjs` to check all 50 canonical state/capital identities and global coordinates, all section ID aliases, the reviewed 100 city names, finite and distinct coordinates, population ordering, immutable lookup safety, and absence of distractor evidence/target IDs. This offline structural check does not re-download or independently recalculate population rankings. Data refreshes must rerun the documented source selection process and review changed rankings and points. Browser marker spacing and camera behavior belong to runtime integration checks.
