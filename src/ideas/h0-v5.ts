/**
 * H0 v5 — COMPLETE BUSINESS HYPOTHESES, not product nouns.
 *
 * The owner's correction: an H0 must be a miniature business, containing
 * BUYER + PROBLEM + OFFER + PRICE + ARRIVAL + FULFILMENT + FACTORY ADVANTAGE +
 * CHEAPEST FALSIFICATION. A product noun is not a hypothesis.
 *
 * HARD CONSTRAINT applied at generation (not merely at filtering):
 *   $0 entry + arrival where the buyer ARRIVES INTENDING TO PAY + paid offer +
 *   automated fulfilment + measurable outcome + low maintenance.
 *
 * The "arrives intending to pay" clause is new and is the lesson from three
 * streetlight failures. Free-norm surfaces (itch.io assets, npm, galleries,
 * WordPress.org) produce adoption, not purchases. Surfaces where the visitor is
 * mid-purchase-decision produce transactions.
 */

export type Moat = 'BREADTH' | 'ASSEMBLY' | 'FRESHNESS' | 'PER_INPUT' | 'TEDIUM';

export interface BusinessH0 {
  id: string;
  buyer: string;
  problem: string;
  offer: string;
  priceUsd: number;
  /** Must name a surface where visitors arrive intending to buy. */
  arrival: string;
  arrivalIsPurchaseIntent: boolean;
  fulfilment: string;
  automatable: boolean;
  factoryAdvantage: string;
  moat: Moat;
  cheapestFalsification: string;
  entryCostUsd: number;
  daysToCommercialSignal: number;
}

const b = (o: BusinessH0) => o;

export const V5: BusinessH0[] = [
b({id:'z01',buyer:'Tabletop GMs running a specific published system',problem:'Prep time per session is hours; system-specific ready-to-run material is scarce for less popular systems',offer:'A ready-to-run one-shot adventure with maps, stat blocks and handouts for a named system and level band',priceUsd:4.95,arrival:'DriveThruRPG category + system search — visitors are browsing a paid PDF store',arrivalIsPurchaseIntent:true,fulfilment:'Instant PDF download',automatable:true,factoryAdvantage:'Producing 50 system/level variants is pure volume work no single author will do',moat:'BREADTH',cheapestFalsification:'Publish 3 variants; if zero sales in 30 days at store-average traffic, kill',entryCostUsd:0,daysToCommercialSignal:30}),
b({id:'z02',buyer:'GMs improvising between sessions',problem:'Running out of NPCs, complications and rumours mid-session',offer:'Random-table supplement of 500 entries themed to one genre',priceUsd:3.95,arrival:'DriveThruRPG supplement category search',arrivalIsPurchaseIntent:true,fulfilment:'Instant PDF',automatable:true,factoryAdvantage:'500 coherent entries is tedium, exactly where AI cost collapses',moat:'TEDIUM',cheapestFalsification:'One title, 30 days',entryCostUsd:0,daysToCommercialSignal:30}),
b({id:'z03',buyer:'Solo TTRPG players',problem:'Most systems assume a group; solo play needs oracle and journalling structure',offer:'Solo-play conversion supplement for a named system',priceUsd:5.95,arrival:'DriveThruRPG solo category — a growing paid category',arrivalIsPurchaseIntent:true,fulfilment:'Instant PDF',automatable:true,factoryAdvantage:'Per-system adaptation across many systems',moat:'BREADTH',cheapestFalsification:'Two systems, 30 days',entryCostUsd:0,daysToCommercialSignal:30}),
b({id:'z04',buyer:'Hobbyists who keep structured records',problem:'No logbook exists formatted for their specific hobby workflow',offer:'Print logbook with hobby-correct fields, sold as a paperback',priceUsd:7.99,arrival:'Amazon search for "[hobby] log book" — searchers are buyers',arrivalIsPurchaseIntent:true,fulfilment:'Print-on-demand by Amazon',automatable:true,factoryAdvantage:'30+ hobby variants is volume work',moat:'BREADTH',cheapestFalsification:'3 hobbies, 45 days',entryCostUsd:0,daysToCommercialSignal:45}),
b({id:'z05',buyer:'Candidates for a low-volume professional certification',problem:'Major prep vendors ignore small certifications; failing costs a retake fee',offer:'Practice question bank with explanations for one named certification',priceUsd:9.99,arrival:'Amazon search "[cert] practice questions"; buyers are actively preparing',arrivalIsPurchaseIntent:true,fulfilment:'Kindle ebook, instant',automatable:true,factoryAdvantage:'Covering many small certifications nobody serves individually',moat:'BREADTH',cheapestFalsification:'2 certifications, 45 days',entryCostUsd:0,daysToCommercialSignal:45}),
b({id:'z06',buyer:'People preparing for a specific practical assessment',problem:'Generic study guides omit the assessment-specific format',offer:'Format-specific drill workbook',priceUsd:8.99,arrival:'Amazon search by assessment name',arrivalIsPurchaseIntent:true,fulfilment:'Print-on-demand or Kindle',automatable:true,factoryAdvantage:'Breadth across many assessments',moat:'BREADTH',cheapestFalsification:'2 titles, 45 days',entryCostUsd:0,daysToCommercialSignal:45}),
b({id:'z07',buyer:'Owners of a specific uncommon equipment model',problem:'Manuals are lost; maintenance intervals scattered across forums',offer:'Consolidated maintenance and spec reference for one model family',priceUsd:6.99,arrival:'Amazon search by model name',arrivalIsPurchaseIntent:true,fulfilment:'Kindle/print',automatable:true,factoryAdvantage:'Assembling scattered sources per model, across many models',moat:'ASSEMBLY',cheapestFalsification:'2 models, 45 days',entryCostUsd:0,daysToCommercialSignal:45}),
b({id:'z08',buyer:'GMs wanting maps without art skill',problem:'Battlemaps are needed constantly and commissioning is expensive',offer:'Battlemap pack for one terrain type, print and VTT ready',priceUsd:4.95,arrival:'DriveThruRPG map category',arrivalIsPurchaseIntent:true,fulfilment:'Instant download',automatable:false,factoryAdvantage:'Volume — but AESTHETIC quality bar, flagged as a Factory weakness',moat:'BREADTH',cheapestFalsification:'One pack, 30 days',entryCostUsd:0,daysToCommercialSignal:30}),
b({id:'z09',buyer:'Language learners at a specific level',problem:'Graded reading material at exactly their level is scarce for less-taught languages',offer:'Graded reader with glossary for one language and CEFR level',priceUsd:6.99,arrival:'Amazon search "[language] graded reader [level]"',arrivalIsPurchaseIntent:true,fulfilment:'Kindle/print',automatable:true,factoryAdvantage:'Language × level grid is large and mostly unserved',moat:'BREADTH',cheapestFalsification:'2 language/level cells, 45 days',entryCostUsd:0,daysToCommercialSignal:45}),
b({id:'z10',buyer:'Hobbyists needing a reference chart at the bench',problem:'Key reference data is buried in books or websites, unusable while working',offer:'Laminated-style reference chart, print-on-demand poster',priceUsd:12.99,arrival:'Amazon search by reference topic',arrivalIsPurchaseIntent:true,fulfilment:'POD print',automatable:true,factoryAdvantage:'Assembly of scattered reference data per domain',moat:'ASSEMBLY',cheapestFalsification:'2 charts, 45 days',entryCostUsd:0,daysToCommercialSignal:45}),
];

interface V { id:string; passed:boolean; reasons:string[]; h:BusinessH0 }
const screen = (h:BusinessH0):V => {
  const r:string[]=[];
  if (!h.arrivalIsPurchaseIntent) r.push('arrival surface is not purchase-intent — free-norm adoption, not payment');
  if (!h.automatable) r.push('fulfilment not automatable, or aesthetic quality bar Factory cannot reliably meet');
  if (h.entryCostUsd > 1) r.push(`entry $${h.entryCostUsd} > $1 pre-revenue target`);
  if (h.daysToCommercialSignal > 60) r.push('commercial signal too slow');
  return {id:h.id,passed:r.length===0,reasons:r,h};
};
const vs = V5.map(screen);
const surv = vs.filter(v=>v.passed);

const L:string[]=[];
L.push('# H0 v5 — complete business hypotheses\n');
L.push(`**Generated:** ${new Date().toISOString()} · **Cost $0.00** · E0, zero evidentiary weight\n`);
L.push('Each entry is a miniature business: buyer, problem, offer, price, arrival, fulfilment,');
L.push('Factory advantage, cheapest falsification.\n');
L.push('**New hard constraint applied at GENERATION:** the arrival surface must be one where the');
L.push('visitor **arrives intending to pay.** Free-norm surfaces produce adoption, not purchases —');
L.push('the lesson from three streetlight failures.\n');
L.push(`**${V5.length} generated · ${surv.length} survive**\n`);
L.push('| id | Buyer | Offer | $ | Arrival | Moat | Days |');
L.push('|---|---|---|---|---|---|---|');
for(const v of surv) L.push(`| \`${v.id}\` | ${v.h.buyer} | ${v.h.offer} | $${v.h.priceUsd} | ${v.h.arrival.split('—')[0]} | ${v.h.moat} | ${v.h.daysToCommercialSignal} |`);
L.push('\n## Killed\n');
for(const v of vs.filter(x=>!x.passed)) L.push(`- \`${v.id}\` ${v.h.offer} — ${v.reasons.join('; ')}`);
L.push('\n## Full detail\n');
for(const v of surv){const h=v.h;
L.push(`### \`${h.id}\`\n`);
L.push(`- **Buyer:** ${h.buyer}`);L.push(`- **Problem:** ${h.problem}`);L.push(`- **Offer:** ${h.offer}`);
L.push(`- **Price:** $${h.priceUsd}`);L.push(`- **Arrival:** ${h.arrival}`);L.push(`- **Fulfilment:** ${h.fulfilment}`);
L.push(`- **Factory advantage:** ${h.factoryAdvantage}`);L.push(`- **Cheapest falsification:** ${h.cheapestFalsification}`);
L.push(`- **Entry cost:** $${h.entryCostUsd} · **Signal:** ${h.daysToCommercialSignal}d\n`);}
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('state',{recursive:true});
writeFileSync('state/H0_PORTFOLIO_V5.md',L.join('\n'));
console.log(`${V5.length} generated, ${surv.length} survive`);
for(const v of vs.filter(x=>!x.passed)) console.log(`  KILL ${v.id}: ${v.reasons[0]}`);
