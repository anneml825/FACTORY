/**
 * H0 v6 — PROBLEM-FIRST GENERATION. Surface selection is FROZEN.
 *
 * Three failures traced to one cause: a marketplace was chosen for being
 * measurable/cheap/searchable, and a product was reverse-engineered to fit it.
 * WordPress -> plugins. itch.io -> game assets. DriveThruRPG -> tabletop PDFs.
 *
 * NOTHING about marketplaces, listing costs, APIs, analytics quality,
 * searchability or platform data entered this file. Not one entry was shaped by
 * where it might be sold. Distribution is evaluated LATER, separately, and only
 * for survivors.
 *
 * Required order:
 *   WHO HAS A PROBLEM -> WHAT IT COSTS THEM -> WHAT FACTORY PRODUCES ->
 *   WHY FACTORY HAS A STRUCTURAL ADVANTAGE -> WHAT THEY WOULD PAY FOR
 *
 * Only after surviving those may Factory ask where these people already go.
 *
 * All E0. Zero evidentiary weight.
 */

export type Advantage = 'BREADTH' | 'ASSEMBLY' | 'FRESHNESS' | 'PER_INPUT' | 'TEDIUM' | 'NONE';
export type CostType = 'MONEY' | 'TIME' | 'RISK' | 'MISSED_OPPORTUNITY';

export interface ProblemH0 {
  id: string;
  who: string;                 // a specific working population
  costsThem: string;           // what the problem actually costs
  costType: CostType;
  factoryProduces: string;     // the artefact that changes it
  advantage: Advantage;        // WHY Factory structurally, not "AI can write"
  wouldPayFor: string;         // the thing money is exchanged for
  alreadySpendsOnAdjacent: boolean;  // do they already pay for something near this?
  factSourceIsCustomer: boolean;     // Verifiable Correctness Constraint
  automatable: boolean;
  regulatedAdvice: boolean;    // would this constitute legal/medical/tax advice?
}

const p = (o: ProblemH0) => o;
const P: ProblemH0[] = [
// --- trades & field services ------------------------------------------------
p({id:'p001',who:'Independent home inspectors',costsThem:'Hours per inspection turning field notes into a client-ready narrative report',costType:'TIME',factoryProduces:'Report generator turning structured findings into a formatted narrative report',advantage:'PER_INPUT',wouldPayFor:'Per-report generation from their own findings',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p002',who:'Small electrical contractors',costsThem:'Re-typing the same scope language into every quote, losing bids to slow turnaround',costType:'MISSED_OPPORTUNITY',factoryProduces:'Scope-library quote builder producing a formatted proposal from a job checklist',advantage:'BREADTH',wouldPayFor:'A scope library covering their trade',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p003',who:'Arborists',costsThem:'Writing tree condition/risk narratives per site visit',costType:'TIME',factoryProduces:'Assessment narrative generator from structured observations',advantage:'PER_INPUT',wouldPayFor:'Per-assessment output',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p004',who:'Pool service route operators',costsThem:'Chemical dosing recalculated per pool volume and reading, by hand',costType:'TIME',factoryProduces:'Dosing worksheet per pool profile from their own readings',advantage:'PER_INPUT',wouldPayFor:'A per-route dosing pack',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p005',who:'Sign makers and print shops',costsThem:'Producing proofs and spec sheets for every quote',costType:'TIME',factoryProduces:'Spec-sheet generator from job parameters',advantage:'PER_INPUT',wouldPayFor:'Per-job spec output',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p006',who:'Fleet maintenance supervisors',costsThem:'Building PM schedules per vehicle class from scattered manufacturer intervals',costType:'TIME',factoryProduces:'Consolidated PM interval reference per vehicle class',advantage:'ASSEMBLY',wouldPayFor:'The consolidated reference',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p007',who:'Commercial cleaning companies',costsThem:'Pricing bids by guesswork; underbidding erodes margin invisibly',costType:'MONEY',factoryProduces:'Bid model from measured square footage, surface mix and frequency',advantage:'PER_INPUT',wouldPayFor:'A bid model tuned to their inputs',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p008',who:'Solar installers',costsThem:'Producing customer-facing production and payback narratives per proposal',costType:'TIME',factoryProduces:'Proposal narrative from their own system design figures',advantage:'PER_INPUT',wouldPayFor:'Per-proposal output',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),

// --- professional services ---------------------------------------------------
p({id:'p009',who:'Small-firm grant writers',costsThem:'Rewriting the same organisational boilerplate to each funder\'s format',costType:'TIME',factoryProduces:'Funder-format converter from a maintained organisational profile',advantage:'BREADTH',wouldPayFor:'Format library across many funders',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p010',who:'Independent recruiters',costsThem:'Writing tailored candidate summaries for every submission',costType:'TIME',factoryProduces:'Submission summary generator from CV plus role spec',advantage:'PER_INPUT',wouldPayFor:'Per-submission output',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p011',who:'Bookkeepers serving many small clients',costsThem:'Building the same month-end reporting pack per client, manually',costType:'TIME',factoryProduces:'Month-end pack generator from exported ledger data',advantage:'PER_INPUT',wouldPayFor:'Per-client monthly pack',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p012',who:'Insurance loss adjusters',costsThem:'Converting inspection notes into structured claim narratives',costType:'TIME',factoryProduces:'Claim narrative generator from structured findings',advantage:'PER_INPUT',wouldPayFor:'Per-claim output',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p013',who:'Technical writers at small firms',costsThem:'Producing release notes from commit and ticket history every cycle',costType:'TIME',factoryProduces:'Release-note generator from their own changelog data',advantage:'PER_INPUT',wouldPayFor:'Per-release output',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p014',who:'Instructional designers',costsThem:'Building assessment items for every learning objective',costType:'TIME',factoryProduces:'Assessment item bank generated per objective set',advantage:'BREADTH',wouldPayFor:'Item bank per curriculum',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p015',who:'Translators and localisers',costsThem:'Building and maintaining glossaries per client domain',costType:'TIME',factoryProduces:'Domain glossary extracted from the client\'s own corpus',advantage:'PER_INPUT',wouldPayFor:'Per-client glossary build',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p016',who:'Independent safety officers',costsThem:'Producing site-specific method statements for every job',costType:'TIME',factoryProduces:'Method-statement generator from task and hazard inputs',advantage:'PER_INPUT',wouldPayFor:'Per-job document',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:true}),

// --- small business operations -----------------------------------------------
p({id:'p017',who:'Independent restaurant owners',costsThem:'Recosting recipes whenever supplier prices move; margin erodes unnoticed',costType:'MONEY',factoryProduces:'Recipe recosting workbook driven by their own invoice data',advantage:'PER_INPUT',wouldPayFor:'A recosting system for their menu',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p018',who:'Small manufacturers',costsThem:'Quoting job cost by intuition, with no per-part labour model',costType:'MONEY',factoryProduces:'Job-cost model from their machine rates and cycle times',advantage:'PER_INPUT',wouldPayFor:'A costing model tuned to their shop',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p019',who:'Independent pharmacies',costsThem:'Tracking which slow-moving stock ties up cash',costType:'MONEY',factoryProduces:'Stock-velocity analysis from their own dispensing export',advantage:'PER_INPUT',wouldPayFor:'Recurring analysis of their data',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p020',who:'Staffing agencies',costsThem:'Rebuilding shift schedules whenever availability changes',costType:'TIME',factoryProduces:'Schedule generator from availability and skill constraints',advantage:'PER_INPUT',wouldPayFor:'Per-period schedule build',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p021',who:'Property managers with mixed portfolios',costsThem:'Producing owner statements per property every month',costType:'TIME',factoryProduces:'Owner-statement generator from their transaction export',advantage:'PER_INPUT',wouldPayFor:'Per-statement generation',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p022',who:'Independent gyms and studios',costsThem:'Attrition invisible until members are gone',costType:'MISSED_OPPORTUNITY',factoryProduces:'Churn-risk analysis from their attendance export',advantage:'PER_INPUT',wouldPayFor:'Recurring churn report',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p023',who:'Small freight brokers',costsThem:'Rebuilding rate sheets per lane from scattered historical data',costType:'MONEY',factoryProduces:'Lane rate analysis from their own booking history',advantage:'PER_INPUT',wouldPayFor:'Per-lane analysis',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p024',who:'Event caterers',costsThem:'Recalculating quantities, staffing and timelines per event size',costType:'TIME',factoryProduces:'Event plan generated from headcount, menu and venue constraints',advantage:'PER_INPUT',wouldPayFor:'Per-event plan',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),

// --- assembly problems: scattered information --------------------------------
p({id:'p025',who:'Construction estimators',costsThem:'Hunting municipal permit fee tables per jurisdiction for every bid',costType:'TIME',factoryProduces:'Normalised permit-fee reference across jurisdictions',advantage:'ASSEMBLY',wouldPayFor:'Access to the assembled reference',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p026',who:'Equipment owners of discontinued models',costsThem:'Hours hunting part numbers and service intervals across forums',costType:'TIME',factoryProduces:'Consolidated service and parts reference per model family',advantage:'ASSEMBLY',wouldPayFor:'The consolidated reference',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p027',who:'Genealogy researchers',costsThem:'Locating which archive holds which record series per locality',costType:'TIME',factoryProduces:'Record-availability guide per locality and period',advantage:'ASSEMBLY',wouldPayFor:'The locality guide',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p028',who:'Amateur radio operators',costsThem:'Assembling band plans, licensing conditions and repeater data per region',costType:'TIME',factoryProduces:'Regional operating reference',advantage:'ASSEMBLY',wouldPayFor:'The regional reference',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p029',who:'Sailors planning coastal passages',costsThem:'Compiling harbour approach details, facilities and hazards per stretch',costType:'TIME',factoryProduces:'Passage reference per coastal stretch',advantage:'ASSEMBLY',wouldPayFor:'The passage reference',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:true}),
p({id:'p030',who:'Small importers',costsThem:'Determining duty classification and documentation per product type',costType:'RISK',factoryProduces:'Classification and documentation guide per product category',advantage:'ASSEMBLY',wouldPayFor:'The category guide',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:true}),

// --- breadth problems: many variants nobody hand-makes ------------------------
p({id:'p031',who:'Music teachers',costsThem:'Producing graded practice material per instrument, level and technique',costType:'TIME',factoryProduces:'Practice exercise sets across the instrument/level/technique grid',advantage:'BREADTH',wouldPayFor:'A set matching their students',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p032',who:'Speech and language practitioners',costsThem:'Creating target-sound practice materials per phoneme and age',costType:'TIME',factoryProduces:'Practice sets across phoneme × age × context',advantage:'BREADTH',wouldPayFor:'Sets matching their caseload',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p033',who:'Driving instructors',costsThem:'Building lesson plans per manoeuvre, learner stage and test format',costType:'TIME',factoryProduces:'Lesson plan library across the grid',advantage:'BREADTH',wouldPayFor:'The plan library',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p034',who:'Youth sports coaches',costsThem:'Planning age-appropriate drills per skill and session length',costType:'TIME',factoryProduces:'Drill library across age × skill × duration',advantage:'BREADTH',wouldPayFor:'The drill library',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p035',who:'ESL teachers',costsThem:'Producing occupation-specific vocabulary material per trade',costType:'TIME',factoryProduces:'Occupational vocabulary sets per trade and level',advantage:'BREADTH',wouldPayFor:'Sets for their learners\' trades',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),
p({id:'p036',who:'Occupational therapists',costsThem:'Building home-exercise handouts per condition and equipment available',costType:'TIME',factoryProduces:'Handout library across condition × equipment',advantage:'BREADTH',wouldPayFor:'The handout library',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:true}),

// --- freshness problems ------------------------------------------------------
p({id:'p037',who:'Compliance officers in a narrow sector',costsThem:'Missing a rule change causes rework or penalty',costType:'RISK',factoryProduces:'Continuously regenerated change digest for a named rule set',advantage:'FRESHNESS',wouldPayFor:'Ongoing digest access',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:true}),
p({id:'p038',who:'Procurement officers at small organisations',costsThem:'Missing tender windows they were eligible for',costType:'MISSED_OPPORTUNITY',factoryProduces:'Regenerated opportunity digest filtered to their eligibility profile',advantage:'FRESHNESS',wouldPayFor:'Ongoing filtered digest',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p039',who:'Collectors in a specific category',costsThem:'Not knowing current realised prices when buying or selling',costType:'MONEY',factoryProduces:'Regenerated realised-price index for the category',advantage:'FRESHNESS',wouldPayFor:'Ongoing index access',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:false}),

// --- consumers who already pay for convenience -------------------------------
p({id:'p040',who:'People clearing a deceased relative\'s estate',costsThem:'Weeks of unfamiliar administrative sequencing at a bad time',costType:'TIME',factoryProduces:'Sequenced action plan from their own situation inputs',advantage:'PER_INPUT',wouldPayFor:'A personalised plan',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:true}),
p({id:'p041',who:'People relocating internationally',costsThem:'Assembling the sequence of registrations and deadlines for a destination',costType:'TIME',factoryProduces:'Destination-specific relocation sequence',advantage:'ASSEMBLY',wouldPayFor:'The destination guide',alreadySpendsOnAdjacent:true,factSourceIsCustomer:false,automatable:true,regulatedAdvice:true}),
p({id:'p042',who:'Family carers managing a relative\'s care',costsThem:'Tracking medications, appointments and changes across providers',costType:'TIME',factoryProduces:'Care-coordination workbook from their own record inputs',advantage:'PER_INPUT',wouldPayFor:'The workbook',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:true}),
p({id:'p043',who:'People preparing a property for sale themselves',costsThem:'Not knowing which repairs return more than they cost',costType:'MONEY',factoryProduces:'Prioritised prep plan from their own condition inputs',advantage:'PER_INPUT',wouldPayFor:'The prioritised plan',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p044',who:'Long-distance hikers planning resupply',costsThem:'Hours planning food drops against distance and calorie needs',costType:'TIME',factoryProduces:'Resupply plan from route, pace and dietary inputs',advantage:'PER_INPUT',wouldPayFor:'The plan',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),

// --- data transformation -----------------------------------------------------
p({id:'p045',who:'Researchers with messy field data',costsThem:'Days cleaning inconsistent spreadsheets before analysis',costType:'TIME',factoryProduces:'Cleaning and normalisation of their own submitted dataset',advantage:'PER_INPUT',wouldPayFor:'Per-dataset cleaning',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p046',who:'Organisations migrating between systems',costsThem:'Mapping fields between two schemas by hand',costType:'TIME',factoryProduces:'Field-mapping and transformation from their two schemas',advantage:'PER_INPUT',wouldPayFor:'Per-migration mapping',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p047',who:'Small publishers with legacy documents',costsThem:'Converting inconsistent legacy files into a clean structured format',costType:'TIME',factoryProduces:'Structured conversion of their own document set',advantage:'PER_INPUT',wouldPayFor:'Per-batch conversion',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),

// --- comparison / decision problems ------------------------------------------
p({id:'p048',who:'Buyers of expensive specialist equipment',costsThem:'A wrong purchase costs thousands and is hard to reverse',costType:'MONEY',factoryProduces:'Structured comparison against their stated constraints',advantage:'PER_INPUT',wouldPayFor:'A decision analysis for their situation',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
p({id:'p049',who:'Small organisations choosing between service providers',costsThem:'Vendor comparison is opaque and time-consuming',costType:'TIME',factoryProduces:'Requirement-weighted comparison from their own criteria',advantage:'PER_INPUT',wouldPayFor:'The comparison',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),

// --- repetitive professional outputs -----------------------------------------
p({id:'p050',who:'Freelance designers',costsThem:'Writing project proposals and scope documents repeatedly',costType:'TIME',factoryProduces:'Proposal generator from project parameters',advantage:'PER_INPUT',wouldPayFor:'Per-proposal output',alreadySpendsOnAdjacent:true,factSourceIsCustomer:true,automatable:true,regulatedAdvice:false}),
];

// ---- CHEAP REJECTION on PROBLEM and ECONOMICS ONLY --------------------------
// No distribution, marketplace, listing-cost or measurability criterion appears here.
interface V { id:string; passed:boolean; reasons:string[]; h:ProblemH0 }
const screen = (h:ProblemH0):V => {
  const r:string[]=[];
  if (h.advantage === 'NONE') r.push('no structural Factory advantage — "AI can write it" is not an advantage');
  if (!h.alreadySpendsOnAdjacent) r.push('buyer does not already spend money nearby — payment is pure speculation');
  if (!h.automatable) r.push('fulfilment not automatable');
  if (h.regulatedAdvice && !h.factSourceIsCustomer) r.push('would constitute regulated advice on facts Factory cannot verify (Verifiable Correctness Constraint)');
  return {id:h.id,passed:r.length===0,reasons:r,h};
};
const vs = P.map(screen);
const surv = vs.filter(v=>v.passed);
const killed = vs.filter(v=>!v.passed);
const c=(a:string[])=>a.reduce((m,k)=>((m[k]=(m[k]??0)+1),m),{} as Record<string,number>);

const L:string[]=[];
L.push('# H0 v6 — problem-first generation (surface selection FROZEN)\n');
L.push(`**Generated:** ${new Date().toISOString()} · **Cost $0.00** · E0, zero evidentiary weight\n`);
L.push('> **No marketplace, platform, listing cost, API, analytics quality or searchability');
L.push('> consideration entered this generation.** Not one entry was shaped by where it might be');
L.push('> sold. Distribution is evaluated separately, later, and only for survivors.\n');
L.push(`**${P.length} generated · ${surv.length} survive · ${killed.length} killed**\n`);
L.push('## Structural advantage distribution\n'+Object.entries(c(P.map(x=>x.advantage))).map(([k2,n])=>`**${k2}**: ${n}`).join(' · ')+'\n');
L.push('## Cost type\n'+Object.entries(c(P.map(x=>x.costType))).map(([k2,n])=>`**${k2}**: ${n}`).join(' · ')+'\n');
L.push('## Kill reasons\n'+Object.entries(c(killed.flatMap(k=>k.reasons))).map(([k2,n])=>`- ${k2} — **${n}**`).join('\n')+'\n');
L.push('## Survivors\n');
L.push('| id | Who has the problem | What it costs them | What Factory produces | Advantage |');
L.push('|---|---|---|---|---|');
for(const v of surv) L.push(`| \`${v.id}\` | ${v.h.who} | ${v.h.costsThem} | ${v.h.factoryProduces} | ${v.h.advantage} |`);
L.push('\n## Killed\n');
for(const v of killed) L.push(`- \`${v.id}\` **${v.h.who}** — ${v.reasons.join('; ')}`);
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('state',{recursive:true});
writeFileSync('state/H0_PORTFOLIO_V6.md',L.join('\n'));
console.log(`${P.length} generated, ${surv.length} survive, ${killed.length} killed`);
console.log('advantages:',JSON.stringify(c(P.map(x=>x.advantage))));
console.log('kills:',JSON.stringify(c(killed.flatMap(k=>k.reasons.map(r=>r.slice(0,40))))));
