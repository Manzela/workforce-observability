# County acquisition pipeline: end-to-end workflow reconstruction

Built 2 Nov 2026 (Asia/Jerusalem) from artifacts on the box only. Paths are relative to `/workspace` unless they start with `/home`. "Not verified" means no artifact on the box confirms the point.

**Who does what.** Jonathan (principal) asks for a county and gives feedback. Envoy (chief-of-staff bot) relays the request, sets rulings, runs QA, and sends from danielq1603@gmail.com. Acquisition Agent (AA) does the work. Daniel approves logins, purchases and rule conflicts (`playbook-latest/Acquisition-Agent-Playbook-latest-2026-10-23.md` sections I and K; `/home/box/agent-data/workflows/ambassador-approval-loop/SKILL.md`).

**Counties seen on disk.** FL: Orange, Polk, Hillsborough, Seminole (Seminole was never delivered: `jonathan-lifetime-count/summary.md` "Gaps"). GA: Gwinnett, DeKalb, Cobb, Fulton, Forsyth, Hall, Cherokee, Henry, Fayette, Clayton. Delivered files by county: `jonathan-lifetime-count/summary.md` (to 21 Oct). Fayette and Clayton were delivered later (`fayette-send/r7.txt`; `clayton-2026-10-28/envoy-qa-2026-10-30.md` line 16).

---

## Step 0. Intake: county request from Jonathan, relayed by Envoy

- **Passed:** county name, "go", any new rules, and the Master Training file. Envoy replies with a receipt: "Clayton County is started … ADD and REVIEW only … status note every 6 hours" (`jonathan-clayton-2026-10-28/mail/clayton.txt`; Fayette: `.../mail/fayette.txt`).
- **Who can approve what. The artifacts disagree:**
  - L088: do not start a county until Jonathan says so (`lessons/lesson-ledger.md` L088; playbook B8).
  - `observability/constraints-v1.txt`: "no county start without Daniel go-ahead in AA chat".
  - The ambassador-approval-loop skill says the opposite: "Do not ask Daniel for yes, approval, or a go-ahead. He is out of the loop."
  - GSCCCA login only on Daniel's or Jonathan's word (`observability/constraints-v1.txt`). In practice Daniel signed in himself. Cobb waited at 0/35 until "Daniel signed in on the screen at 18:54 IL" (`cobb-2026-09-25/scoreboard.md` lines 54–95).
  - Deal Machine lead adds, mail starts and purchases need Daniel (playbook K3).
  - Envoy issues binding rulings during runs, for example Clayton Envoy rulings (1)–(3) in `clayton-2026-10-28/status.md` lines 125–128, and `henry-2026-10-22/henry-envoy-calls.txt`.
- **What went wrong:** an early email watch "missed Jonathan's Hillsborough County request" (`playbook-latest/src/envoy-log-09.md` line 114).
- **Likely to go stale:** who approved a county start or a rule. Rulings arrive by chat or email and are copied into status files by hand.
- **By county:** same everywhere. Envoy sends only from danielq1603, never from the Nexite account (playbook I4, K5).

## Step 1. Training and rule load

- **Passed:** Master Training .docx, copied into each county folder (for example `henry-2026-10-22/Master-Training-1.docx`, `jonathan-clayton-2026-10-28/Master-Training-2026-10-28.docx`). Also the lesson ledger L001–L136 (`lessons/lesson-ledger.md`), the playbook, the skills, and constraints (`observability/constraints-v1.txt`).
- **What went wrong:**
  - **Rules drift and contradict each other.**
    - Gas: Cherokee gas-on-parcel went to REVIEW by Envoy ruling (`cherokee-2026-10-18/envoy-qa/qa-notes.md`; playbook A6). L097 later retired that.
    - DM "mixed" numbers: printed as wireless (L100), then not printed (L133).
    - "SOS spelling wins" was our own rule, later removed (L127).
    - The family rule is an open conflict (playbook "Open questions" 1).
    - DM search order: the DM skill says address first, then parcel ID if needed (`skip-trace-a-property-owner-on-deal-machine/SKILL.md` §3). Jonathan's L018 says parcel ID first.
  - **Rules invented by AA or Envoy, not Jonathan, are labelled as such:** L094–L108, L118 "AA-invented", L130 (ledger "Gaps").
- **Likely to go stale:** any rule copy outside the ledger. Example: stale ">25k" traffic notes were corrected on 25 Oct (L015 status).
- **By state:** Georgia differs from Florida only in the SOS site and the traffic site (L080, B9). GSCCCA is Georgia-only (L081).

## Step 2. CAMA / property-record corridor harvest

- **Computed:** the county commercial parcels, then retail classes, then centers (same-owner/sister-parcel grouping), then hard filters: 1 acre or more, 5k–200k SF, not a mall, not owned by a national tenant or Publix.
  - Clayton: 4,602 → 630 → 583, with local excludes listed (`clayton-2026-10-28/status.md` lines 6–7).
  - CAMA is the universe; LoopNet is never used to find centers (`cama-first-corridor-harvest/SKILL.md`; B1).
- **What went wrong:**
  - **Cobb:** a zoning hard-drop lost 6 of the 8 centers Jonathan named. 497 parcels were dropped on zoning alone (`cobb-2026-09-25/rev2-root-cause.md` §1). Now L125/B3: zoning is a flag only.
  - **Hillsborough:** 14 value-add centers were missed and mixed-use 012 was not harvested (playbook L table; L012).
  - **Fulton:** Building SF was double-counted 2–5x (playbook L; B7).
- **Likely to go stale:** CAMA owner and sale fields. DM and deeds can be newer (see Step 9, q39).
- **By state/county:**
  - FL used the DOR NAL/SDF CSVs (`polk/NAL63P202601.csv`, `hillsborough/…`, `ocpa/…`). The Orange OCPA card is a JS-only page (`orange-016-add-ownership.md` line 9).
  - GA used county GIS: Clayton Tyler layer 17 (`clayton-2026-10-28/status.md` line 6). Hall, Forsyth and Cherokee used qPublic cards (`fayette-2026-10-25/fayette-qpublic-batch-*.txt`). Gwinnett used ArcGIS plus an ownership ZIP (`playbook-latest/src/aa-log-09.md` line 24).

## Step 3. Listing-site enrichment (LoopNet / Crexi) and center naming

- **Computed:**
  - Center Name: Street View pylon first, then the "address + loopnet" title (L075/L076). Never blank: "Unnamed strip – <address>" (L094). Never from Crexi.
  - LoopNet URL: loopnet.com only (D5).
  - Crexi column removed 9 Sep (L061). Clayton still ran a "LoopNet/Crexi" pass (`status.md` line 16), and its cover named Crexi, which failed Envoy QA (`envoy-qa-2026-10-30.md` line 6).
- **What went wrong:**
  - Polk: readable pylons were left "Unnamed" (L075).
  - Hillsborough: the LoopNet name "Country Oaks" was missed (D4).
  - Clayton q31 was named after its tenant list and had to be fixed to "Unnamed strip – 11244 TARA BLVD" (`status.md` line 97).
  - Clayton DRAFT left 8 rows "Unnamed" that had saved LoopNet titles (`status.md` line 111).
  - Fayette: 28 of 47 rows unnamed. A LoopNet link is given only if the page was saved (`fayette-2026-10-25/cover-2026-10-28-rev3.md` §8).
  - Many saved LoopNet pages are "no longer advertised" stubs (`clayton-2026-10-28/status.md` line 71). LoopNet and CommercialCafe returned 403 in Cobb (`cobb-2026-09-25/scoreboard.md` line 164).
- **Likely to go stale:** listing status (for lease/for sale) and tenant lists.

## Step 4. Traffic counts and thresholds

- **Computed:** AADT from the station in front of the center. Keep 25k+. Keep 20–25k and flag it (side file or shading, never a column). Drop under 20k (L015/L016, C10). Station and year are recorded.
- **What went wrong:**
  - **Polk:** corridor ranges were used instead of station-in-front (cama skill "What this stops").
  - **Cobb:** snapped to a local station counting 70 cars instead of the 29,500 arterial (2561 Austell). The corner-lot frontage was ignored (`cobb-2026-09-25/rev2-root-cause.md` §2).
  - **Hall:** 134 no-station centers were dropped without a hand check. Scripted screens were called "hand checks", and the cover cited TADA screenshots that did not exist. Only 17 real screenshots resulted (`hall-2026-10-16/hall-status.md` lines 12, 38, 62).
  - **Cherokee:** 108 rows shared byte-identical TADA PNGs (`cherokee-2026-10-18/envoy-qa/qa-notes.md` failure 1; L104).
  - **Forsyth:** no-station centers were left out (playbook L).
- **How each county handled distance and missing counts:**

  | County | Rule | Source |
  |---|---|---|
  | Clayton | Segment within 60 m. P1 no-station rows (a ≥20k station within 400 m) got hand rulings. From 29 Oct, a missing count is not a drop: those rows go to REVIEW with the nearest counted station (19 rows). | `clayton-2026-10-28/traffic_p1.py` line 2; `status.md` lines 8, 12, 19 |
  | Fayette | Scripted TADA matched 43/43. 23 count points were more than 600 m away. P2: 0 of 448 had a ≥20k station within 250 m, so none were promoted. Per-center TADA PNGs were not done. | `fayette-2026-10-26-pass-notes.md` §2 |
  | Hall | Counts credited up to 1,600 m | `hall-status.md` line 51 |
  | Cobb rev2 | Nearest non-local station within 1.2 km | `rev2-root-cause.md` |
  | Henry | 29 script-assigned segments must be called "GDOT estimated" | `henry-envoy-calls.txt` line 45; L103 |

  Fayette and Clayton use the same thresholds (20k/25k). They differ in how no-count rows are treated.
- **Likely to go stale:** the 20–25k flag count in the cover, and "hand-checked" claims.
- **By state:** FDOT in Florida, GDOT TADA in Georgia (L017).

## Step 5. Street View classification: ADD / REVIEW / DROP

- **Computed:** a tab per row with a reason, and pairs merged or split. Clayton: ADD 102 / REVIEW 27 / DROP 58 (`status.md` line 12). Fayette: 40 / 7 / 21 (`cover-2026-10-28-rev3.md` §1).
- **Medical rule:**
  - More than 1/3 medical goes to REVIEW (Fayette cover §3, "your rule"). `observability/constraints-v1.txt` adds "medical-only drop".
  - The first Fayette pass applied "any retail + medical → REVIEW", which moved 9 ADD rows. The Envoy medical ruling then reverted that (`fayette-2026-10-26-pass-notes.md` §1).
  - Clayton: medical counts mostly unverified because Street View signs were unreadable (`cover-final-rev4.md` §3).
- **Skips by owner (who owns it, not who tenants it):**
  - Public REIT: stop research (L011).
  - Publix and REAL SUB LLC: skip (L010/L115).
  - Ingles: skip from 25 Oct (L132).
  - Institutional owners: listed in the cover only (A15).
  - Clayton: 15 owner-screen drops, and NC14 Agree Realty REIT (`status.md` lines 9, 19).
  - Gas: free-standing gas never goes on the list. A gas pad inside a center comes off the row (L097).
- **What went wrong:**
  - Cobb 3701 Austell: a dated strip was called a "big box" (rev2-root-cause §3).
  - Hillsborough: clear ADDs were parked in REVIEW (L008).
  - Clayton W159 and W162 were dropped for no count, then moved to REVIEW (`status.md` line 12).
- **Likely to go stale:** REVIEW reasons once other steps change. An example is NC17, which is on REVIEW for traffic, not medical (cover rev4 §3).

## Step 6. Ownership: SOS entity, principals, RA, principal-address search, website

- **Computed:**
  - SOS match quality. Clayton: 127 exact / 4 near / 1 LP-vs-LLLP / 8 not in GA.
  - Principal level. Clayton: confirmed 24 / probable 32 / weak 34 / open 50 (`status.md` lines 13–15).
  - RA tests A/B (L024).
  - Principal-address web search for a company website (L027; F5). The company page must be read into Entity Individuals (L028).
- **What went wrong:**
  - **Websites never extracted (Clayton):** owner SERPs were saved for 140/140 entities, but "no step turned SERP hits into a website". 127 rows have a blank website (`clayton-2026-10-28/owner-fix/findings.csv`, column miss_reasons). Saved hits are often noise, such as imdb.com and khanacademy.org for q119 (`owner-fix/research.log`).
  - **RA/attorney printed as owner (Clayton):**
    - findings.csv: 31 blank owners, 11 RA-not-at-principal, 2 RA classed attorney/agent, 1 attorney.
    - L136 cites Krevolin q50, Sebring q51 and Watson q90.
    - The Krevolin q50 decision flipped three times: printed in the DRAFT, held in the final (`status.md` line 111), restored in rev2 by the RA-at-principal fix (line 90), then ruled wrong by Jonathan on 2 Nov (L136).
  - **GA SOS "ecorp 403" treated as unreachable** (Hall, Cherokee). Playwright returned RAs for 19 of 23 Cherokee blanks (`jonathan-audit-2026-10-25/root-cause-summary.md`).
  - Third-party SOS mirrors were used as evidence: Westrop on businesswiki (L024).
  - Out-of-state SOS: DE records have no managers; CA bizfile was blocked by Incapsula (`fayette-2026-10-26-pass-notes.md` §4).
- **Likely to go stale:** principal level (weak/probable/confirmed), RA classification, and the counsel registry (`lessons/counsel-registry.json`, L130).
- **By state:** Sunbiz in Florida (Orange, Seminole, Hillsborough). GA SOS ecorp in Georgia. The GA-only RA tests are L024/L025.

## Step 7. GSCCCA / deed lookups (ownership and sales)

- **Computed:**
  - Grantor search, vesting deed, and the signer named under the entity (L029/L030).
  - Rule 4: a DM "Linked To Company" contact prints only with a saved GSCCCA confirmation (L134).
  - L136 G1: a GSCCCA deed is a must when the owner is unsure. Evidence goes in `clayton-2026-10-28/owner-fix/owner-evidence.csv`. Clayton still needs 112 rows (`owner-fix/gsccca-needed.csv`).
- **What went wrong:**
  - **Gwinnett:** GSCCCA "login blocked by image reCAPTCHA" (7 Sep). PT-61 detail pages hit PleaseLogin, and browser CDP timed out (`playbook-latest/src/aa-log-09.md` lines 54–60, 92).
  - **Cobb:** blocked at login until Daniel signed in (scoreboard above).
  - **Fulton:** GSCCCA was not run before delivery, and its queue missed Peachtree Square (root-cause-summary).
  - **Clayton:** rule 4 held 5 people because GSCCCA was blocked (`status.md` line 124). Fayette held 15 people / 10 numbers (cover rev3 §6).
  - **Sales use conflicts with the rule:** L058/K4 say GSCCCA is never used for sales. Clayton rev4 filled True Sale on 28 rows from the GSCCCA deed index, including "about $X (tax stamp)" estimates (`clayton-2026-10-28/true_sale_rev4.py`; `cover-final-rev4.md` §4). DeKalb also used GSCCCA for sales until 21 Sep (playbook L).
  - Who approved the Clayton rev4 GSCCCA session: not verified.
- **Likely to go stale:** deed-to-parcel ties. Examples: rev4 rows "tied by land lot, not parcel number" (q52, q101, q109), and the 2019 deeds indexed with parcels crossed (q66/q107).
- **By state:** Georgia only. No Florida clerk/official-records deed lookups were found on the box (not verified). Florida sales came from the DOR SDF (Step 8).

## Step 8. Sales: Sale and True Sale walk-back

- **Computed:**
  - Sale = the most recent recorded transfer, $0 included. A same-date tie goes to the priced line.
  - If the Sale is $100 or less, True Sale = the latest earlier sale over $100. Blank if there is none, and the row is listed in the cover (L057/L113, C1).
- **What went wrong:**
  - **Henry:** printed the newest *qualified* sale, not the newest transaction. 45 owner lines on 35 rows were wrong, matching Jonathan's "~40" (`jonathan-audit-2026-10-25/sales-root-cause.md`).
  - **Rule drift by county:** Hall used arm's-length codes. Cherokee was qualified-only and stricter (`cherokee-2026-10-18/envoy-qa/qa-notes.md` failure 4; E4/E5). This was superseded on 25 Oct.
  - **Gwinnett:** 64 blanks, 0 filled. Manatron NXDOMAIN, qPublic AppID not authorized, GSCCCA login-gated (`aa-log-09.md` lines 24, 30).
  - **DeKalb:** "sale dates and sale prices blank on every cell" (L056).
  - **Hillsborough:** sales came from the DOR file, not the county card (`hillsborough-sales-rootcause.md` line 7).
  - **Polk:** the PA card was blocked (WebKnight 999, Bright Data 401), so the DOR SDF was kept (`polk-harvest-status.md` line 23).
  - **Clayton:** the public datalet has no sales history (`status.md` line 26), so the deed index was used (Step 7).
- **Likely to go stale:** DM sale data versus the county. q123: DM shows $925,000, the deed index shows $0 (true_sale_rev4.py q123). q106: DM shows $17,500, the county shows a 2001 sale for $1,515,000 (`status.md` line 130).

## Step 9. Deal Machine skip-trace (property card, read-only)

- **Computed:**
  - Search order: parcel ID in the appraiser format first, address only if that fails (L018). The DM skill says address first (Step 1 conflict).
  - Card order: Associated Contacts (arrows) → Contact Info → Sales History → View Portfolio, unless the portfolio is over $900M (L020/L021).
  - Principal-address and home searches (L022). Roles: Organizer, Linked To, Potentially Linked, Likely Owner.
  - Usage labels and DNC flags.
  - Clayton: 128/129 rows reached, q124 not found, 38 rows with no contacts (`status.md` line 121). The queue is append-only from 29 Oct, with q1–q110 frozen (line 18).
- **What went wrong:**
  - Hillsborough: "DM Reveal blocked this run (Envoy 1 Sep 2026)" (`hillsborough-skiptrace-*.md` line 7).
  - Gwinnett: LOGIN_WALL (`aa-log-09.md` line 80).
  - Orange: run through the DM API, not the website (playbook L).
  - Stray clicks: a Polk mail sequence (30 Aug), Forsyth 1245 Buford Rd mail (14 Oct), and a Cherokee lead added by accident (2874 E Cherokee Dr) (playbook L).
  - "Jump to Location" and click guards closed rows as "not found" (L121, L131).
  - Portfolio walks were not finished (root-cause-summary).
  - **DM data is stale against CAMA:** q39 (DM shows a QCD to The Wagon LLC; CAMA shows a later $400k sale, and the CAMA deed wins), q103, q98 (`status.md` lines 128–131).
  - `dm-cleanup-02.jsonl` landed after rev3 and was never merged (`status.md` line 83 and line 136).
- **Likely to go stale:** card owner, role tags, usage labels, DNC flags. They were re-read for Fayette (`fayette-2026-10-25/cover-2026-10-28-rev3.md` §6).

## Step 10. TPS via Bright Data, then the TPS home in DM

- **Computed:**
  - TPS search: name + principal/company city first. Statewide is the last fallback (L042/L127).
  - Age match within 4 years (L043).
  - Detail page, then the current home, then a DM home card (L041).
  - Clayton: queue 113, searches 106, detail pages 60, wireless results 56 (`status.md` line 17). Only 4 home-to-DM lines (line 127).
- **What went wrong:**
  - **Clayton `tps/pipeline.sh` dropped the 7 no-count people.** `build_tps_queue.py` rewrote the queue from 114 to 107 lines. The run was stopped and the queue restored (`status.md` line 115). The fix and head check are at `tps/pipeline.sh` lines 2–14.
  - **Shell safety-check classifier error** blocked `tps/run_search.py` "on every attempt" (`status.md` lines 72, 115).
  - **Bright Data errors:**
    - Zone placeholder HTTP 400 on scrape and on search_engine (`fayette-2026-10-25/tps/raw/brightdata-mcp-errors-2026-10-26.txt` lines 2, 4; Cobb `scoreboard.md` line 164; Koretsky `lessons/code-changes.md` line 89).
    - 401 "Token expired" on all 32 Fayette searches.
    - 429 at 8 parallel workers.
    - Throughput of about 1 page/min (`fayette-2026-10-26-pass-notes.md`; `clayton…/status.md` line 27).
    - Rajeev Rai timed out and was not retried (`status.md` line 90).
    - Fulton: "CDP disconnected" was recorded as no match (L120).
  - Refetched detail pages silently added new numbers (`status.md` line 91).
- **Likely to go stale:** ambiguous same-name holds (Clayton 167, `status.md` line 124), TPS "last reported" dates (old 2011/2013 wireless in `fayette-2026-10-25/tps/r2work/detail-summary.txt`), and death records (Arthur T Davis, Fayette cover §6).

## Step 11. LoopNet and company-web phones (LN / CWP)

- **Computed:** an owner-name + "loopnet" search (L047), and company team-page phones (L050).
- **What went wrong:**
  - Fulton missed the "Emily Eplan loopnet" search (L047).
  - LoopNet was searched only by address, and listing contacts were not read (root-cause-summary).
  - Clayton: "No LN/CWP numbers". Only one company site was printed (Lansky) (`status.md` line 123; `owner-fix/findings.csv`).
- **Likely to go stale:** broker and leasing contacts on listings.

## Step 12. Merge, prefer-merge, phone and email rules

- **Computed:** one row per center. Per-person phone slots separated by " | " in Entity Individuals order, with "—" for an empty slot (L065). DM before TPS (L040/L052).
  - DeKalb prefer-merge (DM over TPS): 72 DM-preferred / 18 TPS-only rows (`dekalb-2026-09-18/dekalb-prefer-merge-scoreboard.json`).
  - Clayton `merge_dm.py`, with `dm/held-list.csv` growing from 253 to 275 lines (`status.md` line 112).
- **Phone rules:**
  - Wireless only (L109). No "mixed" type (L133).
  - The number must come from the person's own record. A shared number prints once (L046, L098; Cherokee Romeyn/Dunne/Chung failures).
  - Family: print only when the owner has no wireless ("user decision 30 Oct 00:50", `status.md` line 129). Jonathan's FM rule (L049) conflicts; this is open (playbook open question 1).
  - Rule 4, Linked To Company: L134 and Step 7.
- **DNC:**
  - Fayette held all DNC numbers under an "Envoy ruling, 28 Oct" (19 numbers held; `cover-2026-10-28-rev3.md` §6). Jonathan's own guidance was to keep DNC numbers and show DNC (G9).
  - From rev5 they print, and rev7 re-added 14 DNC numbers (`fayette-2026-10-25/phones-root-cause.md`; `fayette-send/r7.txt`).
  - Whether the hold was "invented by us" is supported only by the cover's "Envoy ruling" attribution; there is no Jonathan source for it.
- **Phone cell over-tagging:** labels like "(DM Linked To Company; SOS principal; … not DNC; Heavy Usage)". L135 (1 Nov) cut these to "(DM, usage)". The Clayton rev4 cover still describes "DM+TPS" and "DM home card" labels (`cover-final-rev4.md` §5). Formatter: `phone_format.py`.
- **Emails:** print from the person's own DM/TPS record (L054). Never from a same-name record (L107; Henry gmgjones@).
- **Likely to go stale:** held and promoted counts. L118 counts changed every QA round (Fulton 17/51/73 → 12/52/77).

## Step 13. Excel build, cover note, gap lists

- **Computed:**
  - Two tabs, 15 columns, sorted by AADT (L060/L061/L129).
  - Cover: counts, traffic flags, medical, sales rule, walk-backs and blanks, sources (H7).
  - Side files: `*-internal-notes.csv`, `clayton-gsccca-gap-list.csv` (28 rows), held list, `clayton-true-sale-rev4.csv`, changed-cells CSV.
  - Builds abort on owner-gate failures and write `<stem>-owner-gate-failures.csv` (L136; `owner_gates.py`).
- **What went wrong:**
  - Cover counts were stale: DNC was 95 in the cover against 96 actual, because the regex missed nested labels (`status.md` line 98).
  - The cover named another county ("a DeKalb property"), showed file names, mentioned Envoy and Crexi, and had no ADD/REVIEW definition (`envoy-qa-2026-10-30.md` lines 6, 11; L070, L101).
  - The Henry cover claimed an email was "corrected" (L054 QA6).
  - The rev4 cover header still says "Not sent" although it was sent (`cover-final-rev4.md` line 3 vs `envoy-qa-2026-10-30.md` line 16).
  - Fayette's DRAFT-notes tab was moved out of the workbook (`diff-vs-baseline-2026-10-28.txt`).
- **Likely to go stale:** every number in the cover. They are written separately from the workbook.

## Step 14. Automated QA

- **Computed:** pass/fail counts. Clayton: final 222/0, rev2 209/0, rev3 216/0, rev4 308/0 (`status.md`). QA files: `qa-*-results.json`, `lessons/tests/`, `owner_gates.row_failures`, `phone_format.phone_cell_problems`.
- **What went wrong:** automated QA passed while Envoy failed the same file.
  - Final 222/0, but Envoy failed phones, RA and cover.
  - Rev2 209/0, but Envoy failed DM-after-TPS order, a missing usage label, and "DeKalb" in the cover (`envoy-qa-2026-10-30.md` lines 4–11).
  - Checks ran before patches (Henry EMAIL_FIX; L054 QA5).
  - 66 lessons need a run log or sidecar that most builds do not keep (ledger "Gaps").

## Step 15. Handoff to Envoy

- **Passed:** xlsx and cover sha256/md5, internal notes, open items, and "nothing sent" (`status.md` lines 78, 88).
- **What went wrong:** files were not attached in early sends (L069, Polk and Gwinnett). Henry stalled about 12 h because the next steps were not queued (playbook L).

## Step 16. Envoy QA loop and revisions

- **Computed:** a per-check PASS/FAIL with row examples, and a cell diff of each revision against the previous one.
  - Clayton: final FAIL → rev2 FAIL → rev3/rev3b (the status file says accepted and sent) → rev4 (True Sale only, 56 cells) ALL PASS, sent 30 Oct 15:56 IST as message 1a18d191652758ee (`envoy-qa-2026-10-30.md`; `changed-cells-rev4.csv`; `rev4send/body.txt`).
  - Cherokee: FAIL at about 18:10, PASS at about 19:55 on 19 Oct (`cherokee-2026-10-18/envoy-qa/qa-notes.md`).
  - Fayette: rev2 through rev7 (`fayette-2026-10-25/`).
  - Henry: candidate-qa3 through qa13.
- **What went wrong:**
  - Envoy's claim of "42 wireless on 24 rows" could not be reproduced from rev3b data (`clayton…/status.md` line 138).
  - The Cherokee middle-name rule was generalized by AA three minutes before Envoy's ruling (playbook L).

## Step 17. Jonathan feedback and rule changes

- **Passed:** miss lists and rules. Each one becomes a ledger lesson, code, tests, and a reply per address (L013, L073, L074).
  - 25 Oct audit: 9 misses. 6 of them were "data already there", thrown out by our own rules (`jonathan-audit-2026-10-25/root-cause-summary.md`).
  - 25 Oct four rules (L131–L134). Henry sales (L057).
  - 1 Nov phone format (L135; `envoy-work/clayton/pf-body.txt`).
  - 2 Nov owner gates after the Clayton rev4 review (L136).
- **What went wrong:**
  - Fixes were applied only to the named rows (L084, L053).
  - Rule changes were not back-applied to delivered files. L135 and L136 say "Not applied to delivered files".

## Step 18. Status and routine updates

- **Passed:** a 6-hour status to Jonathan with real counts and an ETA (L086, J1). Examples: `fayette-status-2026-10-2*/body.txt`; `clayton-2026-10-28/status.md` maintained by hand and by `update_status.py`.
- **What went wrong:**
  - `pipeline.sh` used to run `update_status.py` and rewrite `status.md` and the DM queue. It was removed in rev2 (`tps/pipeline.sh` header).
  - `status.md` holds contradictory sections. The FINAL section says "TPS: not run", but the REV2 section shows it ran 01:54–02:21. The header time (02:36) predates the REV4 section.
  - Henry status notes had to report no progress (playbook L).

---

## Step types that must not share a log schema

Each of these is a distinct step type and needs its own record type. Common fields are timestamp, county, step_type, actor (AA/Envoy/Jonathan/Daniel), input hash, output hash, and status (done/failed/retried/blocked/n.a.).

1. **intake_request:** Jonathan message id, county, Envoy receipt id, approver and approval source (Daniel/Jonathan/Envoy), rules relayed.
2. **rule_change:** lesson id, source (Jonathan / Envoy ruling / AA-invented), supersedes, effective-from county, back-applied (y/n).
3. **cama_harvest:** source layer/file and date, parcel → class → center counts, exclusions by reason, grouping rule.
4. **listing_lookup:** query, URL, saved page path, page status (live/stub/403/captcha), name taken (y/n).
5. **traffic_assign:** station id, AADT, year, distance, method (scripted / hand / estimated), screenshot md5, band (≥25k / 20–25k / <20k / no-count).
6. **sv_classify:** imagery date, PNG paths and md5, tab, reason, medical count/denominator, pair decision, ruler (AA/Daniel/Envoy).
7. **owner_resolve:** entity, SOS control number, match type, RA, test A/B, officers, principal address, principal-search SERP path, website, confidence level, counsel/RA flag.
8. **deed_lookup (GSCCCA):** purpose (ownership vs sales; must be separate), login approver, instrument book/page, grantee, signer, tie method (parcel / land lot), blocked reason (captcha/login).
9. **sale_select:** card source, all lines considered, chosen line, rule version, walk-back path, blank reason.
10. **dm_lookup:** query type (APN/address/home/principal), card parcel = PA parcel (y/n), sections walked (arrows, contact, sales, portfolio n/N), roles per contact, numbers with type/usage/DNC, card-owner vs CAMA mismatch, session error (LOGIN_WALL / Reveal blocked / Jump to Location).
11. **tps_lookup:** query name + city, Bright Data zone and HTTP status, retry count, candidate count, age delta, match decision, home address, raw path.
12. **ln_cwp_lookup:** person, query, page path, number found, role (owner/broker/PM).
13. **merge_decision:** person, rule applied (rule 4, RA-at-principal, family, own-record, shared-number, counsel), print/hold, held reason, rule version.
14. **build:** script and version, input file hashes, output xlsx/cover hashes, row and tab counts, gate failures.
15. **qa_auto:** checker and version, checks passed/failed, failing rows. Kept separate from qa_envoy.
16. **qa_envoy:** file md5, per-check PASS/FAIL, row examples, claims that could not be reproduced.
17. **send:** message id, recipient, attachment name and bytes, xlsx md5. Sent only after qa_envoy PASS.
18. **status_update:** message id, counts quoted, source file for each count, ETA.

**Why they must stay separate.**
- A failed external fetch (TPS 400/401/429, CDP disconnect, captcha) must never be logged like a "not found" research result (L120, L121).
- A scripted traffic screen must never be logged like a hand check (Hall).
- A GSCCCA ownership lookup must never be logged like a sales lookup (L058 vs Clayton rev4).
- An automated QA pass must never be logged as Envoy QA (Clayton final and rev2).
- A rule source of "Envoy ruling" or "AA-invented" must never be logged as Jonathan's (Fayette DNC, L118).
