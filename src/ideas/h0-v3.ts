/**
 * H0 v3 — GENERATED FROM A DIFFERENT PRINCIPLE.
 *
 * v1 and v2 asked "what could Factory sell?" and produced obvious tools for
 * obvious audiences. Retrieving the competitive set for a03 showed why that
 * fails: the Etsy-profit-workbook niche is saturated, several competitors are
 * FREE, and BOTH claimed differentiators (CSV ingestion, labour costing) already
 * ship in existing products.
 *
 * THE LESSON: anything easy for Factory to build is easy for everyone to build.
 * Competition is fiercest exactly where the opportunity is most obvious.
 *
 * THE GENERATIVE PRINCIPLE FOR v3: only generate hypotheses where the barrier is
 * VOLUME OF WORK rather than insight — because that is the single barrier AI
 * marginal cost actually removes. If one clever person could build it in a
 * weekend, someone already has.
 *
 * Moat types used here:
 *   BREADTH   - value requires N variants nobody will hand-make (per model,
 *               per jurisdiction, per breed, per crop...)
 *   ASSEMBLY  - value is in collating scattered sources into one structure
 *   FRESHNESS - value decays, so it must be regenerated continuously
 *   PER-INPUT - value is unique to each customer's own data
 *
 * Every entry is E0: zero evidentiary weight.
 */

export type Moat = 'BREADTH' | 'ASSEMBLY' | 'FRESHNESS' | 'PER_INPUT';
export interface H3 {
  id: string; family: string; sells: string; buyer: string; moat: Moat;
  arrival: 'MARKETPLACE' | 'PROGRAMMATIC' | 'GALLERY' | 'REGISTRY' | 'DIRECTORY';
  entryCostUsd: number; daysToSignal: number; variantsNeeded: number;
  legalRisk: 'none' | 'low' | 'material';
  factSourceIsCustomer: boolean;  // Verifiable Correctness Constraint
}
const k = (id:string,family:string,sells:string,buyer:string,moat:Moat,arrival:H3['arrival'],
  entryCostUsd:number,daysToSignal:number,variantsNeeded:number,legalRisk:H3['legalRisk'],
  factSourceIsCustomer:boolean):H3=>({id,family,sells,buyer,moat,arrival,entryCostUsd,daysToSignal,variantsNeeded,legalRisk,factSourceIsCustomer});

export const H3S: H3[] = [
// BREADTH — value requires many variants nobody hand-makes
k('v001','media-asset','Seamless tileable textures per material type (200 variants)','game devs, 3D artists','BREADTH','MARKETPLACE',0,30,200,'low',false),
k('v002','media-asset','UI sound sets, one per game genre (40 genres)','indie game devs','BREADTH','MARKETPLACE',0,30,40,'low',false),
k('v003','template','Résumé templates tuned per industry ATS quirk (60 industries)','job seekers','BREADTH','MARKETPLACE',0,30,60,'low',false),
k('v004','template','Pitch-deck skeletons per funding stage and sector (50)','founders','BREADTH','MARKETPLACE',0,30,50,'low',false),
k('v005','printable','Graph/grid paper generator, every ruling and size (300)','students, engineers','BREADTH','PROGRAMMATIC',12,90,300,'none',false),
k('v006','printable','Sewing pattern grading across full size range per garment','home sewers','BREADTH','MARKETPLACE',0,30,80,'none',false),
k('v007','media-asset','Icon sets per professional domain (80 domains)','product designers','BREADTH','MARKETPLACE',0,30,80,'low',false),
k('v008','template','Bill-of-materials templates per maker discipline (40)','makers','BREADTH','MARKETPLACE',0,30,40,'none',false),
k('v009','educational','Flashcard decks per exam section for niche certs (100)','cert candidates','BREADTH','MARKETPLACE',0,30,100,'low',false),
k('v010','media-asset','Ambient loop packs per environment type (60)','video editors','BREADTH','MARKETPLACE',0,30,60,'low',false),
k('v011','template','Checklists per equipment maintenance schedule (150 models)','equipment owners','BREADTH','PROGRAMMATIC',12,90,150,'low',false),
k('v012','developer-asset','Config presets per linter/framework combination (120)','developers','BREADTH','REGISTRY',0,45,120,'none',false),
k('v013','media-asset','Pixel-art tilesets per biome and era (70)','indie game devs','BREADTH','MARKETPLACE',0,30,70,'low',false),
k('v014','printable','Label templates per Avery/equivalent stock code (200)','small businesses','BREADTH','PROGRAMMATIC',12,90,200,'none',false),
k('v015','template','Lesson-plan skeletons per curriculum standard code (250)','teachers','BREADTH','PROGRAMMATIC',12,90,250,'low',false),
k('v016','media-asset','Font pairing packs per industry aesthetic (50)','designers','BREADTH','MARKETPLACE',0,30,50,'low',false),
k('v017','developer-asset','Dockerfile/compose templates per stack combination (100)','developers','BREADTH','REGISTRY',0,45,100,'none',false),
k('v018','template','Board-game print-and-play components per mechanic (40)','tabletop designers','BREADTH','MARKETPLACE',0,30,40,'low',false),
k('v019','printable','Planner inserts per binder size and layout (180)','planner users','BREADTH','MARKETPLACE',0,30,180,'none',false),
k('v020','media-asset','Loop-ready background patterns per craft style (120)','crafters, POD sellers','BREADTH','MARKETPLACE',0,30,120,'low',false),
k('v021','educational','Practice problem sets per math topic and grade (200)','tutors, parents','BREADTH','MARKETPLACE',0,30,200,'low',false),
k('v022','template','Cut lists per common furniture project and timber size (90)','woodworkers','BREADTH','MARKETPLACE',0,30,90,'none',false),
k('v023','developer-asset','API client stubs per public API (60 APIs)','developers','BREADTH','REGISTRY',0,45,60,'low',false),
k('v024','media-asset','Sprite animation sets per character action (100)','game devs','BREADTH','MARKETPLACE',0,30,100,'low',false),
k('v025','printable','Knitting chart symbols per stitch pattern library (150)','knitters','BREADTH','MARKETPLACE',0,30,150,'none',false),

// ASSEMBLY — value is collating scattered sources
k('v026','data-product','Farmers-market schedules normalised nationwide','app devs, brands','ASSEMBLY','DIRECTORY',0,45,1,'low',false),
k('v027','data-product','Building-permit fee schedules per municipality','estimators','ASSEMBLY','DIRECTORY',0,45,1,'low',false),
k('v028','programmatic-site','Accessory fitment reference per equipment model','equipment owners','ASSEMBLY','PROGRAMMATIC',12,90,1,'low',false),
k('v029','data-product','Small-airport fuel prices and services','pilots','ASSEMBLY','DIRECTORY',0,45,1,'low',false),
k('v030','programmatic-site','Municipal recycling acceptance rules per council','residents','ASSEMBLY','PROGRAMMATIC',12,90,1,'low',false),
k('v031','data-product','Public holiday + school term dataset per region','scheduling vendors','ASSEMBLY','DIRECTORY',12,45,1,'low',false),
k('v032','programmatic-site','Which software supports one narrow feature','buyers','ASSEMBLY','PROGRAMMATIC',12,90,1,'low',false),
k('v033','data-product','Trail closure and condition feed per park system','outdoor apps','ASSEMBLY','DIRECTORY',12,45,1,'low',false),
k('v034','programmatic-site','Replacement part numbers per discontinued model','repairers','ASSEMBLY','PROGRAMMATIC',12,90,1,'low',false),
k('v035','data-product','Trade association dues and benefits per trade','sole traders','ASSEMBLY','DIRECTORY',0,45,1,'low',false),
k('v036','programmatic-site','Camp/park amenity comparison per site','campers','ASSEMBLY','PROGRAMMATIC',12,90,1,'low',false),
k('v037','data-product','Open dataset of species range by region','naturalist apps','ASSEMBLY','DIRECTORY',0,45,1,'low',false),
k('v038','programmatic-site','Which adapters connect device A to device B','consumers','ASSEMBLY','PROGRAMMATIC',12,90,1,'low',false),
k('v039','data-product','Standard part dimensions per fastener spec','engineers','ASSEMBLY','DIRECTORY',0,45,1,'low',false),
k('v040','programmatic-site','Venue capacity and layout reference per venue','event planners','ASSEMBLY','PROGRAMMATIC',12,90,1,'low',false),

// FRESHNESS — value decays, must regenerate
k('v041','data-product','Weekly regenerated price index for a hobby resale market','collectors','FRESHNESS','DIRECTORY',12,45,1,'low',false),
k('v042','other','Change-monitoring digest for a narrow standard','professionals','FRESHNESS','DIRECTORY',12,60,1,'low',false),
k('v043','data-product','Rolling availability feed for scarce inventory type','buyers','FRESHNESS','DIRECTORY',12,45,1,'low',false),
k('v044','other','Weekly digest of new grants per sector','nonprofits','FRESHNESS','DIRECTORY',0,60,1,'low',false),
k('v045','data-product','Seasonal agronomic window feed per crop/region','agtech','FRESHNESS','DIRECTORY',12,60,1,'low',false),

// PER_INPUT — value unique to the customer's own data (Verifiable Correctness safe)
k('v046','personalized','Sewing pattern graded to submitted body measurements','home sewers','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v047','personalized','Knit pattern regraded to measured gauge','knitters','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v048','personalized','Cut list optimised for submitted stock sizes','woodworkers','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v049','personalized','Garden planting calendar from ZIP and bed layout','gardeners','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v050','personalized','Aquarium stocking plan from tank volume and species','fishkeepers','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v051','personalized','Strength programme from submitted lift history','lifters','PER_INPUT','MARKETPLACE',0,28,1,'low',true),
k('v052','personalized','Van electrical diagram from submitted load list','van builders','PER_INPUT','MARKETPLACE',0,28,1,'low',true),
k('v053','personalized','Feed ration plan from submitted herd/flock data','smallholders','PER_INPUT','MARKETPLACE',0,28,1,'low',true),
k('v054','personalized','Quilt layout generated from submitted fabric inventory','quilters','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v055','personalized','Model railway layout plan from submitted room dimensions','modellers','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v056','personalized','Terrarium planting plan from vessel dimensions and light','hobbyists','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
k('v057','personalized','Custom D&D encounter set from party composition','tabletop DMs','PER_INPUT','MARKETPLACE',0,28,1,'low',true),
k('v058','personalized','Beer recipe scaled to submitted equipment profile','homebrewers','PER_INPUT','MARKETPLACE',0,28,1,'low',true),
k('v059','personalized','Photo-book layout from submitted image set','hobby photographers','PER_INPUT','MARKETPLACE',0,28,1,'low',true),
k('v060','personalized','Seed-starting schedule from frost dates and species list','gardeners','PER_INPUT','MARKETPLACE',0,28,1,'none',true),
];

const MAX_ENTRY = 20, MAX_DAYS = 95;
interface V { id:string; passed:boolean; reasons:string[]; h:H3 }
const screen = (x:H3):V => {
  const r:string[] = [];
  if (x.entryCostUsd > MAX_ENTRY) r.push(`entry $${x.entryCostUsd} > $${MAX_ENTRY}`);
  if (x.daysToSignal > MAX_DAYS) r.push(`${x.daysToSignal}d > ${MAX_DAYS}d`);
  if (x.legalRisk === 'material') r.push('material legal risk');
  return { id:x.id, passed:r.length===0, reasons:r, h:x };
};
const vs = H3S.map(screen);
const surv = vs.filter(v=>v.passed);
const zeroEntry = surv.filter(v=>v.h.entryCostUsd===0);
const fast = zeroEntry.filter(v=>v.h.daysToSignal<=30);
const cnt = (xs:string[]) => xs.reduce((m,x)=>((m[x]=(m[x]??0)+1),m),{} as Record<string,number>);

const L:string[]=[];
L.push('# H0 Portfolio v3 — generated from the volume-of-work principle\n');
L.push(`**Generated:** ${new Date().toISOString()} · **Cost: $0.00**\n`);
L.push('> E0. Zero evidentiary weight.\n');
L.push('## Why this batch is different\n');
L.push('Retrieving a03\'s competitive set showed the flaw in v1/v2 generation: **anything easy for');
L.push('Factory to build is easy for everyone to build.** The Etsy-profit-workbook niche is');
L.push('saturated, several competitors are free, and both claimed differentiators already ship.\n');
L.push('v3 generates ONLY where the barrier is **volume of work**, the one barrier AI marginal');
L.push('cost actually removes. If one clever person could build it in a weekend, someone has.\n');
L.push(`**${H3S.length} generated · ${surv.length} survive · ${zeroEntry.length} need $0 entry · ${fast.length} give signal in ≤30d**\n`);
L.push('## Moat distribution\n');
L.push(Object.entries(cnt(H3S.map(x=>x.moat))).map(([k2,n])=>`**${k2}**: ${n}`).join(' · ')+'\n');
L.push('## Zero-entry-cost survivors with ≤30 day signal\n');
L.push('| id | Sells | Buyer | Moat | Variants |');
L.push('|---|---|---|---|---|');
for (const v of fast) L.push(`| \`${v.id}\` | ${v.h.sells} | ${v.h.buyer} | ${v.h.moat} | ${v.h.variantsNeeded} |`);
L.push('\n## All survivors\n');
L.push('| id | Sells | Moat | Arrival | Entry $ | Days |');
L.push('|---|---|---|---|---|---|');
for (const v of surv) L.push(`| \`${v.id}\` | ${v.h.sells} | ${v.h.moat} | ${v.h.arrival} | $${v.h.entryCostUsd} | ${v.h.daysToSignal} |`);

import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('state',{recursive:true});
writeFileSync('state/H0_PORTFOLIO_V3.md', L.join('\n'));
writeFileSync('state/h0-portfolio-v3.json', JSON.stringify({generatedAt:new Date().toISOString(),verdicts:vs},null,2));
console.log(`${H3S.length} generated, ${surv.length} survive, ${zeroEntry.length} zero-entry, ${fast.length} fast+free`);
console.log('moats:', JSON.stringify(cnt(H3S.map(x=>x.moat))));
