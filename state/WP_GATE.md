# Data Economics Gate — WordPress search space

**Run:** 2026-08-18T22:43:07.216Z  
**Candidates:** 60 WordPress-native, stratified  
**Cost:** $0.00  

## Verdict: **PASS**

> Evaluated with **unchanged** `GATE_CRITERIA` against a WordPress-native candidate
> universe. The general-set result (49% zeros, long-tail median 0) stands in the
> record and is not withdrawn — see `state/DATA_ECONOMICS_PROBE.md`. That set asked
> the WordPress plugin directory about pottery and nail salons, which measures a
> category mismatch rather than the space. See `src/evidence/wp-candidates.ts` for
> the generation rule and the guards fixed before this set was written.

| Check | Value | Threshold | Result |
|---|---|---|---|
| coverage | 1.00 | 0.6 | PASS |
| distinctCount | 26.00 | 15 | PASS |
| stratumSeparation | 50.00 | 5 | PASS |
| zeroShare | 0.13 | 0.4 | PASS |
| modeShare | 0.13 | 0.4 | PASS |
| longTailMedian | 800.00 | > 0 | PASS |

## Signal by stratum

| Stratum | n | Median active installs | Zero count |
|---|---|---|---|
| HEAD | 20 | 5000000 | 0 |
| MID | 20 | 100000 | 0 |
| LONG_TAIL | 20 | 800 | 8 |

## Per-candidate

| Stratum | Query | Top plugin active installs |
|---|---|---|
| HEAD | contact form | 10,000,000 |
| HEAD | backup | 3,000,000 |
| HEAD | seo | 10,000,000 |
| HEAD | security firewall | 5,000,000 |
| HEAD | caching | 7,000,000 |
| HEAD | image optimization | 7,000,000 |
| HEAD | analytics | 5,000,000 |
| HEAD | spam protection | 5,000,000 |
| HEAD | page builder | 10,000,000 |
| HEAD | newsletter signup | 1,000,000 |
| HEAD | social sharing | 3,000,000 |
| HEAD | cookie consent | 1,000,000 |
| HEAD | redirect manager | 3,000,000 |
| HEAD | sitemap | 10,000,000 |
| HEAD | user registration | 200,000 |
| HEAD | multilingual translation | 900,000 |
| HEAD | gallery slider | 800,000 |
| HEAD | custom fields | 2,000,000 |
| HEAD | ecommerce store | 10,000,000 |
| HEAD | booking appointments | 90,000 |
| MID | woocommerce abandoned cart recovery | 300,000 |
| MID | restaurant menu display | 10,000 |
| MID | membership subscription content | 7,000,000 |
| MID | event calendar tickets | 600,000 |
| MID | real estate property listings | 10,000 |
| MID | job board listings | 80,000 |
| MID | donation fundraising | 100,000 |
| MID | course learning management | 100,000 |
| MID | directory listings business | 20,000 |
| MID | invoice quotes client | 30,000 |
| MID | live chat support | 900,000 |
| MID | product reviews ratings | 900,000 |
| MID | wholesale pricing customer group | 10,000 |
| MID | inventory stock management | 20,000 |
| MID | gdpr data request | 1,000,000 |
| MID | staff directory team | 10,000 |
| MID | pdf invoice packing slip | 300,000 |
| MID | shipping rates calculator | 5,000,000 |
| MID | affiliate referral program | 200,000 |
| MID | podcast episode player | 30,000 |
| LONG_TAIL | allergen labels restaurant menu items | 5,000 |
| LONG_TAIL | recurring donation receipt annual statement nonprofit | 0 |
| LONG_TAIL | qr code ticket check in door scanning | 4,000 |
| LONG_TAIL | veterinary appointment reminder sms | 20,000 |
| LONG_TAIL | church sermon archive audio series | 1,000 |
| LONG_TAIL | gym class capacity waitlist booking | 300 |
| LONG_TAIL | school parent permission slip signature | 0 |
| LONG_TAIL | winery wine club shipment scheduling | 0 |
| LONG_TAIL | salon stylist commission tracking | 2,000 |
| LONG_TAIL | trade show exhibitor floor plan booth | 20,000 |
| LONG_TAIL | boat marina slip reservation | 0 |
| LONG_TAIL | farm csa share subscription box weekly | 0 |
| LONG_TAIL | dental patient intake form hipaa | 800 |
| LONG_TAIL | photographer client proofing gallery download | 300,000 |
| LONG_TAIL | auto repair shop service history vehicle | 0 |
| LONG_TAIL | library book lending due date | 200 |
| LONG_TAIL | brewery tap list beer abv update | 0 |
| LONG_TAIL | tutoring session scheduling recurring student | 2,000 |
| LONG_TAIL | equipment rental availability calendar deposit | 50,000 |
| LONG_TAIL | hoa dues payment tracking resident | 0 |

## Reading the zeros

A zero means the directory returned **no matching plugin**. That is a real answer, not
a gap: nobody has built for that query. It is simultaneously the most interesting
signal (an unserved niche) and the least useful for ranking, since zeros cannot be
ordered against each other. The gate treats a high zero share as failure for exactly
that reason — a screen that cannot rank cannot drive a search.

Fetch failures (not zeros): 0.