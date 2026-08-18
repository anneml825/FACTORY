/**
 * H0 v2 — BROADENED DIVERGENT GENERATION.
 *
 * v1 produced 24 hypotheses, almost all "sell a digital artefact on a
 * marketplace". That narrowness was structural, not accidental:
 *
 *   - The Stranger Arrival Test rewards surfaces with measurable built-in
 *     discovery, and marketplaces satisfy it trivially. The gate biased
 *     generation toward marketplaces.
 *   - Generation never asked what FACTORY uniquely has. Factory's advantage is
 *     marginal cost approaching zero for research, writing, code, personalization,
 *     variation and digital fulfilment. Business models that are uneconomic for
 *     HUMANS BECAUSE OF LABOUR COST are precisely the interesting ones, and that
 *     was never a selection criterion.
 *   - Campaign discipline was read as "find the one right niche" rather than
 *     "run many cheap assets".
 *
 * THE CENTRAL ASYMMETRY, which shapes this whole file:
 *   AI collapses CREATION cost to ~zero. It does NOT collapse DISTRIBUTION cost.
 *   So a portfolio model only works where distribution is ALSO near-zero
 *   marginal cost per asset — marketplace discovery, or programmatic surfaces
 *   where one system yields many indexed pages, or feeds.
 *
 * Every entry is E0: zero evidentiary weight. Generation requires no evidence.
 * Promotion requires retrieved, semantically-verified evidence (§16, §17).
 */

export type Family =
  | 'downloadable-doc' | 'personalized-output' | 'micro-tool' | 'programmatic-site'
  | 'data-product' | 'automated-audit' | 'affiliate-asset' | 'lead-gen'
  | 'ad-supported' | 'educational' | 'developer-asset' | 'media-asset'
  | 'automation-template' | 'content-to-commerce' | 'niche-api' | 'other';

export type Monetization =
  | 'one-time-download' | 'per-output-fee' | 'paid-tier' | 'affiliate-commission'
  | 'lead-fee' | 'ad-revenue' | 'data-subscription' | 'one-time-license' | 'marketplace-sale';

/** How a stranger arrives, classified by who pays the distribution cost. */
export type ArrivalClass =
  | 'MARKETPLACE_BUILTIN'   // platform supplies discovery; per-asset cost ~0
  | 'PROGRAMMATIC_SEARCH'   // one system -> many indexed pages; shared cost
  | 'DIRECTORY_LISTING'     // submitted to aggregators that already have traffic
  | 'PLATFORM_GALLERY'      // template/asset gallery inside a product
  | 'FEED_OR_INTEGRATION'   // appears inside another product's surface
  | 'NONE_IDENTIFIED';

export interface H0v2 {
  id: string; family: Family; sells: string; buyer: string; problem: string;
  monetization: Monetization; arrival: ArrivalClass; arrivalDetail: string;
  fulfilment: 'instant-file' | 'generated-on-demand' | 'hosted-page' | 'api' | 'human';
  perOrderHuman: boolean;
  uptimeObligation: boolean;
  testableBeforeBuild: boolean;   // can the OFFER be tested before the product exists?
  portfolioScalable: boolean;     // can Factory run 50+ of these?
  testCostUsd: number; daysToSignal: number;
  legalRisk: 'none' | 'low' | 'material';
}

const h = (
  id: string, family: Family, sells: string, buyer: string, problem: string,
  monetization: Monetization, arrival: ArrivalClass, arrivalDetail: string,
  fulfilment: H0v2['fulfilment'], perOrderHuman: boolean, uptimeObligation: boolean,
  testableBeforeBuild: boolean, portfolioScalable: boolean,
  testCostUsd: number, daysToSignal: number, legalRisk: H0v2['legalRisk'],
): H0v2 => ({ id, family, sells, buyer, problem, monetization, arrival, arrivalDetail,
  fulfilment, perOrderHuman, uptimeObligation, testableBeforeBuild, portfolioScalable,
  testCostUsd, daysToSignal, legalRisk });

const M = 'MARKETPLACE_BUILTIN' as const, P = 'PROGRAMMATIC_SEARCH' as const,
      D = 'DIRECTORY_LISTING' as const, G = 'PLATFORM_GALLERY' as const,
      F = 'FEED_OR_INTEGRATION' as const, N = 'NONE_IDENTIFIED' as const;

export const H0V2: H0v2[] = [
// ---- F1 downloadable operational documents --------------------------------
h('a01','downloadable-doc','Per-state freelance quarterly tax workbook with safe-harbour tracking','US freelancers','penalty risk from underpaying estimated tax','one-time-download',M,'Etsy search "freelancer tax spreadsheet"','instant-file',false,false,true,true,0.2,28,'low'),
h('a02','downloadable-doc','Salon commission + tip reconciliation workbook','small salon owners','payroll splits across tiers are error-prone','one-time-download',M,'Etsy search "salon commission spreadsheet"','instant-file',false,false,true,true,0.2,28,'none'),
h('a03','downloadable-doc','Etsy shop bookkeeping + COGS workbook for makers','Etsy sellers','tracking true per-item margin incl. fees','one-time-download',M,'Etsy search "etsy bookkeeping spreadsheet"','instant-file',false,false,true,true,0.2,28,'none'),
h('a04','downloadable-doc','Airbnb co-host payout split + cleaning schedule workbook','short-let co-hosts','splitting revenue across owners and cleaners','one-time-download',M,'Etsy search "airbnb spreadsheet"','instant-file',false,false,true,true,0.2,28,'none'),
h('a05','downloadable-doc','Wedding photographer shot-list + timeline pack per ceremony type','wedding photographers','missing must-have shots is unrecoverable','one-time-download',M,'Etsy search "wedding shot list"','instant-file',false,false,true,true,0.2,28,'none'),
h('a06','downloadable-doc','Small-flock poultry laying + feed-cost tracker','backyard poultry keepers','feed cost per egg is invisible','one-time-download',M,'Etsy search "chicken flock tracker"','instant-file',false,false,true,true,0.2,28,'none'),
h('a07','downloadable-doc','Youth sports team season budget + fundraising tracker','volunteer team managers','tracking dues and fundraising across families','one-time-download',M,'Etsy search "team budget spreadsheet"','instant-file',false,false,true,true,0.2,28,'none'),

// ---- F2 personalized generated output (input -> custom artefact) -----------
h('b01','personalized-output','Personalized 12-week strength programme from a lift-history input','recreational lifters','generic programmes ignore current maxes','per-output-fee',M,'Etsy search "custom workout plan"','generated-on-demand',false,false,true,true,0.2,28,'low'),
h('b02','personalized-output','Custom garden planting calendar from ZIP + bed dimensions','home gardeners','frost dates and spacing vary by location','per-output-fee',M,'Etsy search "custom planting calendar"','generated-on-demand',false,false,true,true,0.2,28,'none'),
h('b03','personalized-output','Personalized baby-name shortlist honouring family naming constraints','expecting parents','reconciling family traditions and preferences','per-output-fee',M,'Etsy search "personalized baby name list"','generated-on-demand',false,false,true,true,0.2,21,'none'),
h('b04','personalized-output','Custom RV/van electrical system diagram + parts list from load inputs','van converters','sizing batteries and wire gauge is error-prone','per-output-fee',M,'Etsy search "van electrical diagram"','generated-on-demand',false,false,true,true,0.2,28,'low'),
h('b05','personalized-output','Personalized estate-inventory workbook from asset checklist','executors of small estates','probate inventories are tedious and easy to get wrong','per-output-fee',M,'Etsy search "estate inventory"','generated-on-demand',false,false,true,true,0.2,28,'low'),
h('b06','personalized-output','Custom D&D encounter set balanced to party level and composition','tabletop DMs','balancing encounters takes prep hours','per-output-fee',M,'itch.io + Etsy search "custom dnd encounter"','generated-on-demand',false,false,true,true,0.2,21,'low'),
h('b07','personalized-output','Personalized meal plan from macro targets + allergen exclusions','people with dietary restrictions','generic plans ignore allergens','per-output-fee',M,'Etsy search "custom meal plan"','generated-on-demand',false,false,true,true,0.2,28,'low'),
h('b08','personalized-output','Custom crochet/knit pattern graded to measured gauge and size','garment crafters','patterns rarely fit non-standard sizes','per-output-fee',M,'Etsy search "custom knitting pattern"','generated-on-demand',false,false,true,true,0.2,28,'none'),

// ---- F3 micro-tools where the web app IS the product -----------------------
h('c01','micro-tool','Dimensional-weight shipping comparator across carriers','small ecommerce sellers','cheapest carrier depends on box size','paid-tier',P,'programmatic pages per box-size/carrier pair','hosted-page',false,true,true,true,12,90,'none'),
h('c02','micro-tool','Lease-vs-buy calculator per equipment category','small business owners','financing comparisons are opaque','ad-revenue',P,'programmatic pages per equipment type','hosted-page',false,true,true,true,12,90,'low'),
h('c03','micro-tool','Unit-conversion + yield calculator for commercial baking scaling','bakery operators','scaling recipes changes hydration and yield','paid-tier',P,'programmatic pages per recipe type','hosted-page',false,true,true,true,12,90,'none'),
h('c04','micro-tool','Board-foot and cut-list optimizer for a given project','woodworkers','minimising waste from stock sizes','paid-tier',P,'programmatic pages per project type','hosted-page',false,true,true,true,12,90,'none'),
h('c05','micro-tool','Aquarium stocking + bioload calculator by species','fishkeepers','overstocking kills fish','ad-revenue',P,'programmatic pages per species combination','hosted-page',false,true,true,true,12,90,'none'),
h('c06','micro-tool','Tile/flooring layout waste calculator by room shape','DIY renovators','over/under-ordering material','affiliate-commission',P,'programmatic pages per material type','hosted-page',false,true,true,true,12,90,'none'),
h('c07','micro-tool','Freight class + NMFC lookup helper','small shippers','misclassification causes rebills','paid-tier',P,'programmatic pages per commodity','hosted-page',false,true,true,true,12,90,'low'),
h('c08','micro-tool','Septic/well maintenance interval planner by household size','rural homeowners','neglect causes expensive failures','affiliate-commission',P,'programmatic pages per system type','hosted-page',false,true,true,true,12,90,'low'),

// ---- F4 programmatic reference / directory sites ---------------------------
h('d01','programmatic-site','Structured directory of US state licensing requirements per trade','people entering a licensed trade','requirements scattered across state boards','ad-revenue',P,'one page per trade x state','hosted-page',false,true,false,true,12,90,'low'),
h('d02','programmatic-site','Comparison pages: which POS systems support a given niche need','small retailers','vendor sites hide limitations','affiliate-commission',P,'one page per feature x vertical','hosted-page',false,true,false,true,12,90,'low'),
h('d03','programmatic-site','Reference: which materials are accepted by each municipal recycling programme','residents and small businesses','rules differ per municipality','ad-revenue',P,'one page per municipality','hosted-page',false,true,false,true,12,90,'low'),
h('d04','programmatic-site','Directory of grant programmes by sector and eligibility','small nonprofits','grants are scattered and poorly indexed','lead-fee',P,'one page per sector x region','hosted-page',false,true,false,true,12,90,'low'),
h('d05','programmatic-site','Which pet insurers cover a given breed-specific condition','pet owners','exclusions are buried in policy text','affiliate-commission',P,'one page per breed x condition','hosted-page',false,true,false,true,12,90,'material'),
h('d06','programmatic-site','Compatibility reference: which accessories fit which equipment model','equipment owners','fitment is hard to verify','affiliate-commission',P,'one page per model','hosted-page',false,true,false,true,12,90,'low'),
h('d07','programmatic-site','Reference of school-district calendars rendered as pages + iCal','parents, tutors','district PDFs are unusable','ad-revenue',P,'one page per district','hosted-page',false,true,false,true,12,90,'low'),
h('d08','programmatic-site','Directory of niche trade associations, dues and member benefits','sole traders','membership value is opaque','affiliate-commission',P,'one page per trade','hosted-page',false,true,false,true,12,90,'low'),

// ---- F5 data products and feeds -------------------------------------------
h('e01','data-product','Normalised dataset of US farmers-market schedules','app developers, food brands','source data is scattered and messy','data-subscription',D,'dataset aggregator listings','instant-file',false,false,true,true,0,45,'low'),
h('e02','data-product','Cleaned municipal building-permit fee schedules','construction estimators','fee tables live in PDFs','data-subscription',D,'dataset aggregator listings','instant-file',false,false,true,true,0,45,'low'),
h('e03','data-product','Historical public-holiday + school-term dataset by country/region','scheduling software vendors','recurring integration need','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,45,'low'),
h('e04','data-product','Structured dataset of EV charging incentive programmes by region','EV apps, installers','incentives change and are scattered','data-subscription',D,'dataset aggregator listings','instant-file',false,false,true,true,0,45,'low'),
h('e05','data-product','Curated dataset of trail conditions/closures by park system','outdoor apps','parks publish inconsistently','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,45,'low'),
h('e06','data-product','Standardised dataset of small-airport fuel prices and services','pilots, flight planners','data is fragmented','data-subscription',D,'aviation tool directories','instant-file',false,false,true,true,0,45,'low'),
h('e07','data-product','Dataset of allergen/ingredient declarations for a product category','food apps','labels are unstructured','data-subscription',D,'dataset aggregator listings','instant-file',false,false,true,true,0,45,'material'),

// ---- F6 automated audits and generated reports -----------------------------
h('f01','automated-audit','Accessibility audit report for a URL with prioritised WCAG fixes','small agencies','legal exposure, no in-house expertise','per-output-fee',D,'agency tool directories + programmatic pages','generated-on-demand',false,false,true,true,12,45,'low'),
h('f02','automated-audit','Etsy/marketplace listing SEO audit from a shop URL','marketplace sellers','listings underperform for unclear reasons','per-output-fee',M,'Etsy search "shop audit" + seller directories','generated-on-demand',false,false,true,true,0.2,28,'low'),
h('f03','automated-audit','Menu pricing + margin audit from an uploaded menu','independent restaurants','pricing set by intuition not cost','per-output-fee',D,'restaurant supplier directories','generated-on-demand',false,false,true,true,0,45,'low'),
h('f04','automated-audit','Website performance + Core Web Vitals report with fix list','small business owners','slow sites lose customers','per-output-fee',P,'programmatic pages per platform','generated-on-demand',false,false,true,true,12,60,'none'),
h('f05','automated-audit','Job-listing quality audit scoring inclusivity and clarity','small employers','poor listings suppress applications','per-output-fee',D,'HR tool directories','generated-on-demand',false,false,true,true,0,45,'low'),
h('f06','automated-audit','Lease agreement plain-language summary + clause flags','small commercial tenants','leases are long and opaque','per-output-fee',D,'small-business resource directories','generated-on-demand',false,false,true,true,0,45,'material'),
h('f07','automated-audit','Nutrition-label compliance pre-check for cottage food producers','cottage food sellers','labelling rules vary and errors are costly','per-output-fee',M,'Etsy search + maker directories','generated-on-demand',false,false,true,true,0.2,45,'material'),
h('f08','automated-audit','Podcast feed health audit (tags, artwork, enclosure errors)','independent podcasters','feed errors silently break distribution','per-output-fee',D,'podcast tool directories','generated-on-demand',false,false,true,true,0,45,'none'),

// ---- F7 affiliate / comparison assets --------------------------------------
h('g01','affiliate-asset','Structured comparison of equipment options for a specific hobby task','hobbyists mid-purchase','specs do not map to use cases','affiliate-commission',P,'programmatic pages per task','hosted-page',false,true,false,true,12,90,'low'),
h('g02','affiliate-asset','"Which X fits my Y" fitment finder with buy links','owners of specific equipment','compatibility uncertainty blocks purchase','affiliate-commission',P,'programmatic pages per model','hosted-page',false,true,false,true,12,90,'low'),
h('g03','affiliate-asset','Starter-kit bundles for a hobby at three budget tiers','beginners','decision paralysis at entry','affiliate-commission',P,'programmatic pages per hobby','hosted-page',false,true,false,true,12,90,'low'),
h('g04','affiliate-asset','Replacement-part identifier for discontinued appliance models','homeowners repairing appliances','finding the right part number','affiliate-commission',P,'programmatic pages per model','hosted-page',false,true,false,true,12,90,'low'),
h('g05','affiliate-asset','Software comparison pages for a narrow feature requirement','small business buyers','vendor marketing obscures gaps','affiliate-commission',P,'programmatic pages per feature','hosted-page',false,true,false,true,12,90,'low'),
h('g06','affiliate-asset','Gift-finder for a specific relationship + interest combination','gift buyers','open-ended search is exhausting','affiliate-commission',P,'programmatic pages per combination','hosted-page',false,true,false,true,12,90,'low'),
h('g07','affiliate-asset','Course/certification comparison for a niche profession','career changers','providers are hard to compare','affiliate-commission',P,'programmatic pages per profession','hosted-page',false,true,false,true,12,90,'low'),

// ---- F8 lead generation -----------------------------------------------------
h('i01','lead-gen','Qualified quote-request routing for a niche trade service','local trade businesses','buying leads is standard practice','lead-fee',P,'programmatic pages per service x city','hosted-page',false,true,false,true,12,90,'material'),
h('i02','lead-gen','Estimate-request tool for specialist restoration work','restoration contractors','high-value jobs, scarce leads','lead-fee',P,'programmatic pages per damage type','hosted-page',false,true,false,true,12,90,'material'),
h('i03','lead-gen','Comparison + enquiry form for niche B2B equipment rental','equipment rental firms','buyers do not know suppliers','lead-fee',P,'programmatic pages per equipment','hosted-page',false,true,false,true,12,90,'material'),
h('i04','lead-gen','Specialist referral matcher for uncommon professional services','boutique professional firms','clients cannot find specialists','lead-fee',D,'professional directories','hosted-page',false,true,false,true,12,90,'material'),
h('i05','lead-gen','Waitlist aggregator for oversubscribed local services','service providers','demand exceeds capacity','lead-fee',P,'programmatic pages per service x area','hosted-page',false,true,false,true,12,90,'material'),
h('i06','lead-gen','Quote comparison for niche insurance riders','insurance brokers','riders are poorly explained','lead-fee',P,'programmatic pages per rider','hosted-page',false,true,false,true,12,90,'material'),

// ---- F9 ad-supported utilities ---------------------------------------------
h('j01','ad-supported','Free recurring-date calculator (nth weekday, business days) with locale rules','schedulers, planners','date arithmetic is fiddly','ad-revenue',P,'programmatic pages per rule type','hosted-page',false,true,false,true,12,120,'none'),
h('j02','ad-supported','Free unit converter for an underserved technical domain','trade professionals','domain converters are rare','ad-revenue',P,'programmatic pages per unit pair','hosted-page',false,true,false,true,12,120,'none'),
h('j03','ad-supported','Free printable generator (grids, planners, labels) with custom dimensions','teachers, makers','specific sizes are hard to find','ad-revenue',P,'programmatic pages per format','hosted-page',false,true,false,true,12,120,'none'),
h('j04','ad-supported','Free readability + reading-level analyser for a document','teachers, writers','matching text to audience','ad-revenue',P,'programmatic pages per level','hosted-page',false,true,false,true,12,120,'none'),
h('j05','ad-supported','Free colour-contrast + palette accessibility checker','designers','WCAG compliance checking','ad-revenue',P,'programmatic pages per palette type','hosted-page',false,true,false,true,12,120,'none'),

// ---- F10 educational / reference products ----------------------------------
h('k01','educational','Question bank for a low-volume professional certification','certification candidates','major vendors ignore small certs','one-time-download',M,'Etsy + Gumroad search "[cert] practice questions"','instant-file',false,false,true,true,0.2,30,'low'),
h('k02','educational','Practice-problem sets for a specific engineering licensure section','licensure candidates','section-specific practice is scarce','one-time-download',M,'Gumroad Discover + Etsy','instant-file',false,false,true,true,0.2,30,'low'),
h('k03','educational','Visual reference cards for identifying a species group','naturalists, students','field guides are bulky','one-time-download',M,'Etsy search "identification cards"','instant-file',false,false,true,true,0.2,30,'low'),
h('k04','educational','Structured curriculum pack for a niche homeschool subject','homeschool parents','mainstream curricula skip niches','one-time-download',M,'Etsy search "homeschool curriculum"','instant-file',false,false,true,true,0.2,30,'low'),
h('k05','educational','Scenario workbook for a specific professional soft skill','trainers','generic material lacks scenarios','one-time-download',M,'Etsy + Gumroad','instant-file',false,false,true,true,0.2,30,'none'),
h('k06','educational','Language phrasebook for a specific occupational context','workers in bilingual workplaces','general phrasebooks miss jargon','one-time-download',M,'Etsy search "occupational phrasebook"','instant-file',false,false,true,true,0.2,30,'none'),
h('k07','educational','Exam-day logistics + checklist pack for a high-stakes test','test candidates','avoidable admin mistakes','one-time-download',M,'Etsy search','instant-file',false,false,true,true,0.2,30,'none'),

// ---- F11 developer assets ---------------------------------------------------
h('l01','developer-asset','Self-hosted licence-key server sold once, no revenue share','indie desktop devs','licensing SaaS takes a permanent cut','one-time-license',G,'GitHub topics + package registry','instant-file',false,false,true,true,0,45,'none'),
h('l02','developer-asset','Design-token to platform-theme CLI','design-system maintainers','token drift between design and code','one-time-license',G,'npm registry search','instant-file',false,false,true,true,0,60,'none'),
h('l03','developer-asset','Test-fixture generator for a widely-used API schema','backend developers','writing fixtures is tedious','one-time-license',G,'package registry + GitHub topics','instant-file',false,false,true,true,0,60,'none'),
h('l04','developer-asset','Migration toolkit between two specific frameworks','teams migrating stacks','migration is manual and risky','one-time-license',G,'GitHub topics','instant-file',false,false,true,true,0,60,'none'),
h('l05','developer-asset','Pre-built CI pipeline templates for a niche language/toolchain','small teams','CI setup is repetitive','one-time-download',G,'CI marketplace gallery','instant-file',false,false,true,true,0,60,'none'),
h('l06','developer-asset','Typed SDK generated for a poorly-documented public API','developers using that API','official docs are inadequate','one-time-license',G,'package registry search','instant-file',false,false,true,true,0,60,'low'),

// ---- F12 media / creative assets --------------------------------------------
h('m01','media-asset','Genre-specific UI sound-effect pack for indie games','solo game devs','generic libraries do not fit genre','marketplace-sale',M,'itch.io + Unity Asset Store search','instant-file',false,false,true,true,0,30,'low'),
h('m02','media-asset','Laser-cut SVG pack for a specific maker niche','laser-cutter hobbyists','free files are untested','marketplace-sale',M,'Etsy search "laser cut svg"','instant-file',false,false,true,true,0.2,21,'low'),
h('m03','media-asset','Tileset/sprite pack for an underserved game genre','indie game devs','art is the bottleneck','marketplace-sale',M,'itch.io asset search','instant-file',false,false,true,true,0,30,'low'),
h('m04','media-asset','Print-ready pattern pack for a specific craft technique','crafters','patterns must be dimensionally exact','marketplace-sale',M,'Etsy search','instant-file',false,false,true,true,0.2,21,'low'),
h('m05','media-asset','Ambient loop pack for a specific environment type','video editors, devs','licensing clarity','marketplace-sale',M,'itch.io + asset marketplaces','instant-file',false,false,true,true,0,30,'low'),
h('m06','media-asset','Icon set for an underserved professional domain','product designers','domain icons do not exist','marketplace-sale',M,'design asset marketplaces','instant-file',false,false,true,true,0,30,'low'),

// ---- F13 automation templates -----------------------------------------------
h('n01','automation-template','Automation blueprint pack for a vertical workflow','small business owners','blank-page problem in automation tools','one-time-download',G,'Make/Zapier template galleries','instant-file',false,false,true,true,0.2,30,'none'),
h('n02','automation-template','Spreadsheet-to-invoice automation blueprint','freelancers','manual invoicing','one-time-download',G,'template galleries','instant-file',false,false,true,true,0.2,30,'none'),
h('n03','automation-template','Notion/Obsidian system for a specific professional workflow','knowledge workers','building a system takes hours','one-time-download',M,'Etsy + template galleries','instant-file',false,false,true,true,0.2,30,'none'),
h('n04','automation-template','Airtable base template for a niche operational process','small teams','schema design is the hard part','one-time-download',G,'Airtable universe gallery','instant-file',false,false,true,true,0,30,'none'),
h('n05','automation-template','Home Assistant blueprint pack for a specific automation goal','smart-home owners','YAML authoring is a barrier','one-time-download',G,'HA blueprint exchange','instant-file',false,false,true,true,0,30,'none'),

// ---- F14 content-to-commerce -------------------------------------------------
h('o01','content-to-commerce','Free calculator that upsells a detailed downloadable report','same user, mid-task','wants the full answer','paid-tier',P,'programmatic pages per calculation','hosted-page',false,true,true,true,12,90,'low'),
h('o02','content-to-commerce','Free checklist page gating an expanded paid workbook','task-doers','partial answer creates demand','paid-tier',P,'programmatic pages per task','hosted-page',false,true,true,true,12,90,'low'),
h('o03','content-to-commerce','Free single-record lookup upselling a bulk dataset','researchers','one record proves value','data-subscription',P,'programmatic pages per record','hosted-page',false,true,true,true,12,90,'low'),
h('o04','content-to-commerce','Free template preview with paid full pack','template seekers','sample demonstrates quality','one-time-download',P,'programmatic pages per template','hosted-page',false,true,true,true,12,90,'none'),
h('o05','content-to-commerce','Free audit summary upselling the full remediation report','site owners','summary reveals problems','per-output-fee',P,'programmatic pages per audit type','hosted-page',false,true,true,true,12,90,'low'),

// ---- F15 niche API -----------------------------------------------------------
h('p01','niche-api','API converting messy address strings to service-area boundaries','logistics tools','geocoding to service areas is manual','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,60,'low'),
h('p02','niche-api','API returning fee schedules for a regulated process','compliance software','fees change per jurisdiction','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,60,'low'),
h('p03','niche-api','API generating compliant document templates per jurisdiction','legal-tech tools','templates vary by jurisdiction','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,60,'material'),
h('p04','niche-api','API normalising units and product codes for a trade sector','ERP integrators','code mapping is manual','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,60,'low'),
h('p05','niche-api','API scoring text against a named readability/compliance standard','edtech, govtech','standards checking is manual','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,60,'low'),
h('p06','niche-api','API returning seasonal/agronomic windows by crop and region','agtech tools','agronomic data is fragmented','data-subscription',D,'API marketplace listing','api',false,true,true,true,12,60,'low'),

// ---- F16 other shapes --------------------------------------------------------
h('q01','other','Paid newsletter digesting a narrow regulatory change stream','compliance officers','monitoring is tedious','data-subscription',D,'newsletter directories','generated-on-demand',false,false,true,true,0,60,'low'),
h('q02','other','Monitoring alerts for changes to specific public documents','professionals tracking rules','changes are announced inconsistently','data-subscription',D,'professional directories','api',false,true,true,true,12,60,'low'),
h('q03','other','White-label report generator licensed to small agencies','agencies','they want branded deliverables','one-time-license',D,'agency tool directories','generated-on-demand',false,false,true,true,0,60,'low'),
h('q04','other','Print-on-demand niche apparel for a hobby subculture','subculture members','identity goods','marketplace-sale',M,'POD marketplace search','instant-file',false,false,true,true,0,30,'low'),
h('q05','other','Sponsored placement on a genuinely useful free reference asset','vendors in that niche','they want qualified attention','ad-revenue',P,'programmatic reference pages','hosted-page',false,true,false,true,12,120,'low'),
h('q06','other','Bulk-generated personalised gift artefacts from a name/date input','gift buyers','personalisation is the product','per-output-fee',M,'Etsy search "personalized gift"','generated-on-demand',false,false,true,true,0.2,21,'low'),
];

// ---------------------------------------------------------------------------
// Cheap filter. Constraints unchanged; NEW criteria reflect portfolio economics.
// ---------------------------------------------------------------------------
const MAX_TEST_USD = 20, MAX_DAYS = 95;

interface V { id: string; passed: boolean; reasons: string[]; h: H0v2 }
const screen = (x: H0v2): V => {
  const r: string[] = [];
  if (x.perOrderHuman) r.push('per-order human work');
  if (x.arrival === 'NONE_IDENTIFIED') r.push('no arrival mechanism');
  if (x.testCostUsd > MAX_TEST_USD) r.push(`test cost $${x.testCostUsd} > $${MAX_TEST_USD}`);
  if (x.daysToSignal > MAX_DAYS) r.push(`${x.daysToSignal}d to signal > ${MAX_DAYS}d`);
  if (x.legalRisk === 'material') r.push('material legal/regulatory risk');
  if (!x.portfolioScalable) r.push('not portfolio-scalable');
  return { id: x.id, passed: r.length === 0, reasons: r, h: x };
};

const vs = H0V2.map(screen);
const survivors = vs.filter((v) => v.passed);
const killed = vs.filter((v) => !v.passed);

const count = <K extends string>(xs: K[]) => xs.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {} as Record<string, number>);
const diversity = {
  family: count(H0V2.map((x) => x.family)),
  monetization: count(H0V2.map((x) => x.monetization)),
  arrival: count(H0V2.map((x) => x.arrival)),
  fulfilment: count(H0V2.map((x) => x.fulfilment)),
};
const reasonTally = count(killed.flatMap((k) => k.reasons.map((r) => r.replace(/\$?\d+/g, 'N'))));

const L: string[] = [];
L.push('# H0 Portfolio v2 — Broadened Generation\n');
L.push(`**Generated:** ${new Date().toISOString()} · **Cost: $0.00**\n`);
L.push('> Every entry is **E0: zero evidentiary weight.** Generation requires no evidence.\n');
L.push(`**${H0V2.length} generated → ${survivors.length} survive → ${killed.length} killed**\n`);
L.push('## Diversity\n');
for (const [dim, tally] of Object.entries(diversity)) {
  L.push(`**${dim}** — ` + Object.entries(tally).map(([k, n]) => `${k}: ${n}`).join(' · ') + '\n');
}
L.push('## Kill reasons\n');
L.push('| Reason | Count |'); L.push('|---|---|');
for (const [r, n] of Object.entries(reasonTally).sort((a, b) => b[1] - a[1])) L.push(`| ${r} | ${n} |`);
L.push('\n## Survivors\n');
L.push('| id | Family | Sells | Monetization | Arrival | Test $ | Days |');
L.push('|---|---|---|---|---|---|---|');
for (const v of survivors) L.push(`| \`${v.id}\` | ${v.h.family} | ${v.h.sells} | ${v.h.monetization} | ${v.h.arrival} | $${v.h.testCostUsd} | ${v.h.daysToSignal} |`);
L.push('\n## Killed\n');
L.push('| id | Sells | Reason |'); L.push('|---|---|---|');
for (const k of killed) L.push(`| \`${k.id}\` | ${k.h.sells} | ${k.reasons.join('; ')} |`);

import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('state', { recursive: true });
writeFileSync('state/H0_PORTFOLIO_V2.md', L.join('\n'));
writeFileSync('state/h0-portfolio-v2.json', JSON.stringify({ generatedAt: new Date().toISOString(), diversity, verdicts: vs }, null, 2));
console.log(`${H0V2.length} generated, ${survivors.length} survive, ${killed.length} killed`);
console.log('families:', Object.keys(diversity.family).length, '| monetization:', Object.keys(diversity.monetization).length, '| arrival:', Object.keys(diversity.arrival).length);
console.log('kill reasons:', JSON.stringify(reasonTally));
