/**
 * H0 — DIVERGENT COMMERCIAL HYPOTHESIS GENERATION.
 *
 * An H0 is an UNVALIDATED COMMERCIAL HYPOTHESIS with ZERO EVIDENTIARY WEIGHT.
 * It is E0 in the Master Codex grading: "a model/human believes something may be
 * true." Generating one is free and carries no claim about demand.
 *
 * WHY THIS FILE EXISTS: Factory spent its entire history so far without a single
 * populated E0. EXPERIMENTAL_PROTOCOL.md §2 forbids advancing E0 -> E1 without
 * retrieved evidence, which is correct — but that rule was applied to the
 * GENERATION of ideas rather than their PROMOTION. The result was that the
 * dataset generated the ideas, and datasets describe PLATFORMS, not OFFERS.
 * Every candidate produced was a marketplace rather than a thing to sell.
 *
 * THE RULE, restated so it cannot be re-broken:
 *   Generating an H0 requires NO evidence.
 *   Promoting an H0 to E1 requires retrieved, semantically-verified evidence.
 *   An H0 may never be cited as evidence for anything, including itself.
 */

export interface H0 {
  id: string;
  /** 1. What exactly is being sold. Concrete artefact, not a category. */
  sells: string;
  /** 2. Who pays. A specific buyer, not a demographic. */
  buyer: string;
  /** 3. The problem being solved. */
  problem: string;
  /** 4. Why pay rather than use a free alternative. */
  whyPay: string;
  /** 5. Candidate Stranger Arrival Mechanism — a named surface. */
  arrival: string;
  /** 6. How Factory could cheaply look for DISCONFIRMING evidence. */
  disconfirmTest: string;
  /** 7. Can fulfilment be highly automated? */
  fulfilment: string;

  // --- cheap-rejection flags, set at generation time -----------------------
  perOrderHumanWork: boolean;
  ongoingServiceObligation: boolean;
  namedArrivalSurface: boolean;
  testCostUsd: number;
  legalOrIpRisk: 'none' | 'low' | 'material';
  daysToFirstSignal: number;
  dataAccessBlocked: boolean;
  category: string;
}

/** Cheap-rejection criteria. Fixed before generation. */
export const REJECT = {
  maxTestCostUsd: 20,
  maxDaysToFirstSignal: 60,
};

const H: H0[] = [
  // ---------- Digital documents / operational tools ------------------------
  { id:'h01', category:'operational document',
    sells:'Fillable move-out inspection + deposit-itemisation pack for small landlords, per US state deposit rules',
    buyer:'Owners of 1-4 rental units who self-manage',
    problem:'Deposit disputes hinge on documented condition and statutory itemisation deadlines that vary by state',
    whyPay:'Free templates are generic and ignore state deadlines; getting it wrong forfeits the deposit',
    arrival:'Etsy search "move out inspection checklist landlord"; Gumroad Discover',
    disconfirmTest:'List 3 state variants at $6; measure Etsy impressions -> orders over 21 days',
    fulfilment:'Instant download, zero touch',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.6, legalOrIpRisk:'low', daysToFirstSignal:21, dataAccessBlocked:false },

  { id:'h02', category:'operational document',
    sells:'Food-truck event P&L calculator: per-event cost, breakeven covers, ingredient yield',
    buyer:'Food truck operators booking festivals and private events',
    problem:'Deciding whether an event fee is worth it requires modelling covers, waste and staffing',
    whyPay:'Generic budget templates do not model per-event covers or spoilage',
    arrival:'Etsy search "food truck profit calculator"; food-truck subreddit resource threads',
    disconfirmTest:'Single $9 listing; measure impressions -> clicks -> orders over 21 days',
    fulfilment:'Instant spreadsheet download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.2, legalOrIpRisk:'none', daysToFirstSignal:21, dataAccessBlocked:false },

  { id:'h03', category:'operational document',
    sells:'Freelance quarterly estimated-tax workbook, per US state, with safe-harbour calc',
    buyer:'US freelancers in their first profitable year',
    problem:'Estimated tax underpayment penalties; unclear how much to set aside',
    whyPay:'Free calculators are single-shot; this tracks the year and the safe harbour',
    arrival:'Etsy search "freelancer tax spreadsheet"; Gumroad Discover',
    disconfirmTest:'3 state variants at $12; 21-day funnel',
    fulfilment:'Instant download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.6, legalOrIpRisk:'low', daysToFirstSignal:21, dataAccessBlocked:false },

  { id:'h04', category:'operational document',
    sells:'HOA reserve-study tracking workbook: component life, funding %, special-assessment forecast',
    buyer:'Volunteer HOA treasurers of small associations',
    problem:'Reserve underfunding causes surprise assessments; professional studies cost thousands',
    whyPay:'A $5k consultant study vs a $25 workbook for a 40-unit association',
    arrival:'Etsy + Google search "HOA reserve study spreadsheet"',
    disconfirmTest:'$25 listing; 30-day funnel; high price tests willingness directly',
    fulfilment:'Instant download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.2, legalOrIpRisk:'low', daysToFirstSignal:30, dataAccessBlocked:false },

  { id:'h05', category:'operational document',
    sells:'Salon stylist commission + tip reconciliation workbook (booth rent vs commission models)',
    buyer:'Independent salon owners with 2-8 stylists',
    problem:'Payroll splits across commission tiers, product charges and tip pooling are error-prone',
    whyPay:'Salon software is $50+/mo; this is a one-time file for a small shop',
    arrival:'Etsy search "salon commission spreadsheet"',
    disconfirmTest:'$14 listing; 21-day funnel',
    fulfilment:'Instant download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.2, legalOrIpRisk:'none', daysToFirstSignal:21, dataAccessBlocked:false },

  // ---------- Data products ------------------------------------------------
  { id:'h06', category:'data product',
    sells:'Structured dataset of US farmers-market schedules, locations and seasons (CSV + JSON)',
    buyer:'App developers, food-brand marketers, route planners',
    problem:'Source data is scattered across state agencies in inconsistent formats',
    whyPay:'Cleaning it costs days; buying it costs minutes',
    arrival:'Google search "farmers market dataset"; data marketplace listings',
    disconfirmTest:'Publish a free 1-state sample and paid full set; measure sample->paid',
    fulfilment:'Instant download, periodic regeneration automated',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'low', daysToFirstSignal:45, dataAccessBlocked:false },

  { id:'h07', category:'data product',
    sells:'Newly-licensed contractor lists by state, refreshed monthly, from public licensing boards',
    buyer:'Suppliers, insurers and lead-gen firms selling to new contractors',
    problem:'New licensees are the highest-intent buyers and are hard to find quickly',
    whyPay:'Direct access to a time-sensitive B2B list',
    arrival:'Cold outbound to suppliers; B2B data marketplaces',
    disconfirmTest:'Check licensing-board terms first; if permitted, offer one state free to 20 prospects',
    fulfilment:'Automated scrape -> clean -> deliver',
    perOrderHumanWork:false, ongoingServiceObligation:true, namedArrivalSurface:false,
    testCostUsd:0, legalOrIpRisk:'material', daysToFirstSignal:45, dataAccessBlocked:true },

  { id:'h08', category:'data product',
    sells:'Dataset: US municipal building-permit fee schedules, normalised per project type',
    buyer:'Construction estimators and permit-expediting software',
    problem:'Fee schedules live in PDFs per municipality; estimating is manual',
    whyPay:'Replaces hours of PDF hunting per bid',
    arrival:'Google search "building permit fee database"; estimator forums',
    disconfirmTest:'Free 10-city sample gated behind an email; measure requests',
    fulfilment:'Automated extraction, instant delivery',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'low', daysToFirstSignal:45, dataAccessBlocked:false },

  // ---------- Micro-tools --------------------------------------------------
  { id:'h09', category:'micro-tool',
    sells:'Web calculator comparing dimensional-weight shipping cost across carriers for a given box',
    buyer:'Small ecommerce sellers choosing packaging',
    problem:'Dim-weight rules make the cheapest carrier non-obvious and box size changes the answer',
    whyPay:'Free calculators do one carrier; this compares and suggests box changes',
    arrival:'Google search "dimensional weight calculator compare carriers"',
    disconfirmTest:'Free tool, paid export/bulk; measure use->upgrade. SEO is slow, so measure use first',
    fulfilment:'Fully automated web tool',
    perOrderHumanWork:false, ongoingServiceObligation:true, namedArrivalSurface:true,
    testCostUsd:12, legalOrIpRisk:'none', daysToFirstSignal:90, dataAccessBlocked:false },

  { id:'h10', category:'micro-tool',
    sells:'Solar payback calculator keyed to actual utility rate schedules and net-metering rules',
    buyer:'Homeowners evaluating solar quotes',
    problem:'Vendor payback estimates are optimistic and ignore local rate structure',
    whyPay:'Independent numbers before a five-figure purchase',
    arrival:'Google search "solar payback calculator [utility]"',
    disconfirmTest:'Free calculator, paid detailed report; measure conversion',
    fulfilment:'Automated',
    perOrderHumanWork:false, ongoingServiceObligation:true, namedArrivalSurface:true,
    testCostUsd:12, legalOrIpRisk:'low', daysToFirstSignal:90, dataAccessBlocked:false },

  // ---------- Developer utilities -----------------------------------------
  { id:'h11', category:'developer tool',
    sells:'Self-hosted licence-key server, one-time purchase, for indie devs selling desktop software',
    buyer:'Indie developers who do not want a SaaS licensing dependency',
    problem:'Licensing SaaS charges a revenue percentage forever',
    whyPay:'One-time fee replaces a permanent revenue share',
    arrival:'GitHub topic search; Hacker News Show HN; indie dev communities',
    disconfirmTest:'Publish free core on GitHub, paid pro binary; measure stars->purchases',
    fulfilment:'Instant download + licence generation, automated',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'none', daysToFirstSignal:45, dataAccessBlocked:false },

  { id:'h12', category:'developer tool',
    sells:'CLI converting design tokens to platform theme files (iOS/Android/CSS/Tailwind)',
    buyer:'Design-system maintainers at small product teams',
    problem:'Token sync between design and code is manual and drifts',
    whyPay:'Existing tools are complex; this is one command',
    arrival:'npm registry search; GitHub topics; design-system newsletters',
    disconfirmTest:'Free npm package, paid enterprise features; measure installs->conversions',
    fulfilment:'Automated',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'none', daysToFirstSignal:60, dataAccessBlocked:false },

  // ---------- Information products ----------------------------------------
  { id:'h13', category:'information product',
    sells:'Exam-prep question bank for a specific niche professional certification',
    buyer:'Candidates sitting a low-volume certification with poor study material',
    problem:'Major prep vendors ignore small certifications; failing costs a retake fee',
    whyPay:'Retake fees often exceed the price of the prep material',
    arrival:'Google search "[cert name] practice questions"; professional forums',
    disconfirmTest:'Sample 20 free questions, paid full bank; measure sample->purchase',
    fulfilment:'Instant download or hosted quiz, automated',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.2, legalOrIpRisk:'low', daysToFirstSignal:30, dataAccessBlocked:false },

  { id:'h14', category:'information product',
    sells:'"Passing your first health inspection" playbook for a specific food-business type',
    buyer:'New food business owners before their opening inspection',
    problem:'Failing delays opening and costs revenue daily',
    whyPay:'A one-day opening delay costs more than the guide',
    arrival:'Etsy + Google search "restaurant health inspection checklist"',
    disconfirmTest:'$15 listing, 21-day funnel',
    fulfilment:'Instant download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.2, legalOrIpRisk:'low', daysToFirstSignal:21, dataAccessBlocked:false },

  // ---------- Productized services ----------------------------------------
  { id:'h15', category:'productized service',
    sells:'Automated podcast show-notes, chapters and timestamps generated from an episode URL',
    buyer:'Independent podcasters without an editor',
    problem:'Show notes are tedious and usually skipped, hurting discoverability',
    whyPay:'Cheaper than a VA, faster than doing it',
    arrival:'Fiverr gig search "podcast show notes"',
    disconfirmTest:'List a Fiverr gig; measure impressions->clicks->orders over 30 days',
    fulfilment:'Fully automated pipeline; delivery via platform',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'low', daysToFirstSignal:30, dataAccessBlocked:false },

  { id:'h16', category:'productized service',
    sells:'Bulk product-image background removal + per-marketplace resizing, delivered as a zip',
    buyer:'Ecommerce sellers migrating a catalogue between marketplaces',
    problem:'Each marketplace has different image specs; manual editing does not scale',
    whyPay:'Hours of manual work removed for a fixed fee',
    arrival:'Fiverr gig search "product image background removal bulk"',
    disconfirmTest:'Fiverr gig; 30-day funnel',
    fulfilment:'Automated image pipeline',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'low', daysToFirstSignal:30, dataAccessBlocked:false },

  { id:'h17', category:'productized service',
    sells:'Accessibility audit report for a single URL with prioritised WCAG fixes',
    buyer:'Small agencies whose client just received an accessibility complaint',
    problem:'Legal exposure; agencies lack in-house accessibility expertise',
    whyPay:'Consultant audits cost hundreds to thousands',
    arrival:'Fiverr gig search "accessibility audit WCAG"',
    disconfirmTest:'Fiverr gig at $35; 30-day funnel',
    fulfilment:'Automated scan + generated report',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'low', daysToFirstSignal:30, dataAccessBlocked:false },

  // ---------- Niche API / SaaS --------------------------------------------
  { id:'h18', category:'niche API',
    sells:'API returning US school-district calendars as iCal/JSON',
    buyer:'Family-scheduling apps, childcare providers, tutoring platforms',
    problem:'District calendars are PDFs on thousands of separate sites',
    whyPay:'Nobody wants to maintain thousands of scrapers',
    arrival:'RapidAPI marketplace listing; Google search "school calendar API"',
    disconfirmTest:'List on an API marketplace with a free tier; measure signups->paid',
    fulfilment:'Automated, but uptime is an obligation',
    perOrderHumanWork:false, ongoingServiceObligation:true, namedArrivalSurface:true,
    testCostUsd:12, legalOrIpRisk:'low', daysToFirstSignal:60, dataAccessBlocked:false },

  { id:'h19', category:'niche API',
    sells:'Change-monitoring alerts for government permit and licensing portals',
    buyer:'Permit expediters and compliance teams',
    problem:'Rule and form changes are announced inconsistently and missing one is costly',
    whyPay:'Missing a rule change costs a rejected application',
    arrival:'Cold outbound; industry association newsletters',
    disconfirmTest:'Free monitor for 5 portals, paid for more; measure conversion',
    fulfilment:'Automated monitoring',
    perOrderHumanWork:false, ongoingServiceObligation:true, namedArrivalSurface:false,
    testCostUsd:12, legalOrIpRisk:'low', daysToFirstSignal:60, dataAccessBlocked:false },

  // ---------- Media assets -------------------------------------------------
  { id:'h20', category:'media asset',
    sells:'Sound-effect packs tailored to a specific game genre (e.g. cosy farming sim UI sounds)',
    buyer:'Solo indie game developers',
    problem:'Generic SFX libraries do not fit a genre and licensing is unclear',
    whyPay:'Genre-matched and licence-clear beats hunting free libraries',
    arrival:'itch.io asset search; Unity Asset Store',
    disconfirmTest:'itch.io listing at $8; measure views->purchases',
    fulfilment:'Instant download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0, legalOrIpRisk:'low', daysToFirstSignal:30, dataAccessBlocked:false },

  { id:'h21', category:'media asset',
    sells:'Laser-cut SVG file packs for a specific maker niche (e.g. beehive components)',
    buyer:'Hobbyist makers with a laser cutter',
    problem:'Designing parametric parts is slow; free files are often untested',
    whyPay:'Tested, dimensioned files that actually cut correctly',
    arrival:'Etsy search "laser cut SVG [niche]"',
    disconfirmTest:'$7 listing; 21-day funnel',
    fulfilment:'Instant download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.2, legalOrIpRisk:'low', daysToFirstSignal:21, dataAccessBlocked:false },

  // ---------- Automation templates ----------------------------------------
  { id:'h22', category:'automation template',
    sells:'Pre-built automation blueprint packs for a specific vertical workflow',
    buyer:'Small-business owners using Make/Zapier who cannot design flows',
    problem:'Automation platforms are powerful but blank-page hard',
    whyPay:'A working blueprint beats hours of trial and error',
    arrival:'Make/Zapier template galleries; Etsy search "Make.com template"',
    disconfirmTest:'Publish free blueprint to the gallery, paid pack elsewhere; measure',
    fulfilment:'Instant download',
    perOrderHumanWork:false, ongoingServiceObligation:false, namedArrivalSurface:true,
    testCostUsd:0.2, legalOrIpRisk:'none', daysToFirstSignal:30, dataAccessBlocked:false },

  // ---------- Deliberately weak controls ----------------------------------
  { id:'h23', category:'CONTROL - expected reject',
    sells:'Bespoke logo design',
    buyer:'Anyone starting a business',
    problem:'They need a logo',
    whyPay:'Free generators look generic',
    arrival:'Social media',
    disconfirmTest:'Post about it',
    fulfilment:'Human designs each one',
    perOrderHumanWork:true, ongoingServiceObligation:false, namedArrivalSurface:false,
    testCostUsd:0, legalOrIpRisk:'low', daysToFirstSignal:30, dataAccessBlocked:false },

  { id:'h24', category:'CONTROL - expected reject',
    sells:'A general-purpose CRM for small business',
    buyer:'Small businesses',
    problem:'They need to track customers',
    whyPay:'Ours would be simpler',
    arrival:'SEO and content marketing',
    disconfirmTest:'Build it and see',
    fulfilment:'SaaS with support obligations',
    perOrderHumanWork:false, ongoingServiceObligation:true, namedArrivalSurface:false,
    testCostUsd:200, legalOrIpRisk:'low', daysToFirstSignal:365, dataAccessBlocked:false },
];

interface Verdict { id: string; passed: boolean; reasons: string[]; h: H0 }

function screen(h: H0): Verdict {
  const r: string[] = [];
  if (h.perOrderHumanWork) r.push('per-order human work — recurring OPERATING labour');
  if (h.ongoingServiceObligation) r.push('ongoing service/uptime obligation — recurring burden');
  if (!h.namedArrivalSurface) r.push('no named arrival surface — fails Stranger Arrival Test on its face');
  if (h.testCostUsd > REJECT.maxTestCostUsd) r.push(`test cost $${h.testCostUsd} exceeds $${REJECT.maxTestCostUsd}`);
  if (h.daysToFirstSignal > REJECT.maxDaysToFirstSignal) r.push(`${h.daysToFirstSignal}d to signal exceeds ${REJECT.maxDaysToFirstSignal}d`);
  if (h.legalOrIpRisk === 'material') r.push('material legal/IP risk');
  if (h.dataAccessBlocked) r.push('required data access prohibited or unavailable');
  return { id: h.id, passed: r.length === 0, reasons: r, h };
}

const verdicts = H.map(screen);
const survivors = verdicts.filter((v) => v.passed);
const rejected = verdicts.filter((v) => !v.passed);

const L: string[] = [];
L.push('# H0 Portfolio — Divergent Commercial Hypotheses\n');
L.push(`**Generated:** ${new Date().toISOString()} · **Cost: $0.00**\n`);
L.push('> **Every item here is E0: an UNVALIDATED hypothesis with ZERO evidentiary weight.**');
L.push('> None of it is evidence. None may be cited as evidence. Promotion to E1 requires');
L.push('> retrieved, semantically-verified external evidence.\n');
L.push(`**${H.length} generated → ${survivors.length} survive cheap rejection → ${rejected.length} rejected**\n`);
L.push('## Cheap-rejection criteria (fixed before generation)\n');
L.push('Reject on ANY of: per-order human work · ongoing service obligation · no named arrival');
L.push(`surface · test cost > $${REJECT.maxTestCostUsd} · > ${REJECT.maxDaysToFirstSignal} days to first signal ·`);
L.push('material legal/IP risk · required data access blocked.\n');
L.push('## Survivors\n');
L.push('| id | Category | What is sold | Buyer | Test cost | Days |');
L.push('|---|---|---|---|---|---|');
for (const v of survivors) {
  L.push(`| \`${v.id}\` | ${v.h.category} | ${v.h.sells} | ${v.h.buyer} | $${v.h.testCostUsd.toFixed(2)} | ${v.h.daysToFirstSignal} |`);
}
L.push('\n## Rejected\n');
L.push('| id | What is sold | Rejected because |');
L.push('|---|---|---|');
for (const v of rejected) L.push(`| \`${v.id}\` | ${v.h.sells} | ${v.reasons.join('; ')} |`);

L.push('\n## Survivor detail\n');
for (const v of survivors) {
  L.push(`### \`${v.id}\` — ${v.h.sells}\n`);
  L.push(`- **Buyer:** ${v.h.buyer}`);
  L.push(`- **Problem:** ${v.h.problem}`);
  L.push(`- **Why pay:** ${v.h.whyPay}`);
  L.push(`- **Arrival:** ${v.h.arrival}`);
  L.push(`- **Disconfirming test:** ${v.h.disconfirmTest}`);
  L.push(`- **Fulfilment:** ${v.h.fulfilment}`);
  L.push('');
}
L.push('## What happens next\n');
L.push('Survivors are **still E0**. Nothing here has been validated. The next step is evidence');
L.push('retrieval against the survivors, each passing the Evidence Semantics Gate before any');
L.push('number is treated as support.\n');

import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('state', { recursive: true });
writeFileSync('state/H0_PORTFOLIO.md', L.join('\n'));
writeFileSync('state/h0-portfolio.json', JSON.stringify({ generatedAt: new Date().toISOString(), criteria: REJECT, verdicts }, null, 2));
console.log(`${H.length} generated, ${survivors.length} survive, ${rejected.length} rejected`);
for (const v of rejected) console.log(`  REJECT ${v.id}: ${v.reasons[0]}`);
