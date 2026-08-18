/**
 * H0 v4 — generated exclusively for ZERO-UPFRONT, REVENUE-SHARE surfaces.
 *
 * Selection principle: the platform gets paid only when Factory gets paid.
 * Failed assets stay online at zero carrying cost. Fixed costs do not grow with
 * the number of experiments. See EXPERIMENTAL_PROTOCOL.md §18.
 *
 * All E0. Zero evidentiary weight.
 */
type S = 'KDP'|'GUMROAD'|'ITCH'|'DRIVETHRU'|'PAYHIP'|'POD'|'D2D'|'RAPIDAPI'|'GALLERY'|'REGISTRY';
interface X { id:string; sells:string; buyer:string; surface:S; moat:'BREADTH'|'ASSEMBLY'|'FRESHNESS'|'PER_INPUT'; }
const x=(id:string,sells:string,buyer:string,surface:S,moat:X['moat']):X=>({id,sells,buyer,surface,moat});

export const H4: X[] = [
// KDP — $0 to publish, Amazon search, royalty-only
x('w001','Large-print crossword books themed to a single hobby vocabulary','older hobbyists','KDP','BREADTH'),
x('w002','Reading-log journals per school grade band','parents, teachers','KDP','BREADTH'),
x('w003','Field notebooks pre-formatted per scientific discipline','field researchers','KDP','BREADTH'),
x('w004','Bilingual picture dictionaries for occupational vocabulary','ESL workers','KDP','BREADTH'),
x('w005','Sudoku variants books, one per variant ruleset','puzzle solvers','KDP','BREADTH'),
x('w006','Handwriting practice books per script style','parents, calligraphers','KDP','BREADTH'),
x('w007','Sheet-music manuscript books per instrument staff layout','musicians','KDP','BREADTH'),
x('w008','Trip logbooks per vehicle type (sail, RV, motorcycle)','travellers','KDP','BREADTH'),
x('w009','Medication and symptom trackers per chronic condition','patients, carers','KDP','BREADTH'),
x('w010','Garden journals per climate zone','gardeners','KDP','BREADTH'),
x('w011','Beekeeping hive inspection logbooks','beekeepers','KDP','BREADTH'),
x('w012','Aquarium maintenance logbooks per tank type','fishkeepers','KDP','BREADTH'),
x('w013','Workout logbooks per training methodology','lifters','KDP','BREADTH'),
x('w014','Recipe conversion reference books per cuisine','home cooks','KDP','BREADTH'),
x('w015','Knitting/crochet project journals with gauge pages','fibre crafters','KDP','BREADTH'),
x('w016','Chess opening drill workbooks per opening','club players','KDP','BREADTH'),
x('w017','Birdwatching life-list journals per continent','birders','KDP','BREADTH'),
x('w018','Woodworking project planners with cut-list pages','woodworkers','KDP','BREADTH'),
x('w019','Homeschool portfolio record books per state requirement','homeschoolers','KDP','ASSEMBLY'),
x('w020','Dog training progress journals per discipline','dog owners','KDP','BREADTH'),
x('w021','Astronomy observation logs per telescope class','amateur astronomers','KDP','BREADTH'),
x('w022','Fermentation logs per ferment type','fermenters','KDP','BREADTH'),
x('w023','Pottery firing logs with glaze record pages','potters','KDP','BREADTH'),
x('w024','Model kit build journals per scale','modellers','KDP','BREADTH'),
x('w025','Foraging field journals per region and season','foragers','KDP','ASSEMBLY'),
x('w026','Rock and mineral identification workbooks per region','rockhounds','KDP','ASSEMBLY'),
x('w027','Sourdough starter and bake logs','bakers','KDP','BREADTH'),
x('w028','Motorcycle maintenance logs per engine type','riders','KDP','BREADTH'),
x('w029','Language verb-drill workbooks per tense per language','learners','KDP','BREADTH'),
x('w030','Fishing logs per water type with regulation reference pages','anglers','KDP','ASSEMBLY'),

// GUMROAD — $0, 10%/30% split gives arrival attribution
x('w031','Spreadsheet toolkit for a single trade workflow','tradespeople','GUMROAD','PER_INPUT'),
x('w032','Notion system per professional role','knowledge workers','GUMROAD','BREADTH'),
x('w033','Prompt library curated per professional task','professionals','GUMROAD','BREADTH'),
x('w034','Figma wireframe kits per app category','designers','GUMROAD','BREADTH'),
x('w035','Email sequence templates per business event','small businesses','GUMROAD','BREADTH'),
x('w036','Pitch templates per grant programme structure','nonprofits','GUMROAD','ASSEMBLY'),
x('w037','Financial model templates per business model type','founders','GUMROAD','BREADTH'),
x('w038','Interview question banks per engineering specialism','hiring managers','GUMROAD','BREADTH'),
x('w039','Onboarding checklist packs per role type','small employers','GUMROAD','BREADTH'),
x('w040','Content calendar systems per publishing cadence','creators','GUMROAD','BREADTH'),
x('w041','Lesson slide decks per curriculum unit','teachers','GUMROAD','BREADTH'),
x('w042','Client proposal templates per service business','freelancers','GUMROAD','BREADTH'),
x('w043','Data-cleaning recipe books per messy-data pattern','analysts','GUMROAD','BREADTH'),
x('w044','SQL query cookbooks per analytics question type','analysts','GUMROAD','BREADTH'),
x('w045','Regex pattern libraries per data format','developers','GUMROAD','BREADTH'),
x('w046','Checklist packs per compliance-adjacent operational process','ops managers','GUMROAD','BREADTH'),
x('w047','Pricing model calculators per service business type','service owners','GUMROAD','PER_INPUT'),
x('w048','Capacity planning sheets per studio/clinic type','practice owners','GUMROAD','PER_INPUT'),
x('w049','Inventory par-level calculators per hospitality type','hospitality','GUMROAD','PER_INPUT'),
x('w050','Shift rota templates per staffing pattern','managers','GUMROAD','BREADTH'),

// ITCH — $0, real search for game/creative assets
x('w051','Tileable PBR texture packs per material family','game devs','ITCH','BREADTH'),
x('w052','UI kits per game genre','game devs','ITCH','BREADTH'),
x('w053','Pixel tilesets per biome','game devs','ITCH','BREADTH'),
x('w054','SFX packs per interaction type','game devs','ITCH','BREADTH'),
x('w055','Ambient loops per environment','game devs, editors','ITCH','BREADTH'),
x('w056','Godot/Unity starter templates per genre','game devs','ITCH','BREADTH'),
x('w057','Character sprite sheets per archetype','game devs','ITCH','BREADTH'),
x('w058','Font packs designed for small-resolution UI','game devs','ITCH','BREADTH'),
x('w059','Procedural generation parameter sets per world type','game devs','ITCH','BREADTH'),
x('w060','Particle effect libraries per effect class','game devs','ITCH','BREADTH'),

// DRIVETHRURPG — $0, niche search, PDF buyers pay
x('w061','One-shot adventure modules per system and level band','TTRPG GMs','DRIVETHRU','BREADTH'),
x('w062','NPC stat-block collections per setting genre','GMs','DRIVETHRU','BREADTH'),
x('w063','Random table books per campaign theme','GMs','DRIVETHRU','BREADTH'),
x('w064','Battlemap packs per terrain type','GMs','DRIVETHRU','BREADTH'),
x('w065','Faction and intrigue generators per setting','GMs','DRIVETHRU','PER_INPUT'),
x('w066','Character sheet redesigns per system','players','DRIVETHRU','BREADTH'),
x('w067','Session prep checklists per play style','GMs','DRIVETHRU','BREADTH'),
x('w068','Solo-play journaling supplements per system','solo players','DRIVETHRU','BREADTH'),

// PAYHIP / D2D / POD — $0 entry, revenue share
x('w069','Course workbooks per skill, sold standalone','self-learners','PAYHIP','BREADTH'),
x('w070','Ebook guides distributed to all major stores','readers','D2D','BREADTH'),
x('w071','Audio-adjacent reference cards per profession','professionals','PAYHIP','BREADTH'),
x('w072','Print-on-demand notebooks per hobby subculture','hobbyists','POD','BREADTH'),
x('w073','POD wall charts per technical reference','professionals','POD','ASSEMBLY'),
x('w074','POD apparel per niche in-group phrase','subculture members','POD','BREADTH'),
x('w075','POD posters of assembled reference data','students','POD','ASSEMBLY'),

// RAPIDAPI / REGISTRY / GALLERY — $0 listing
x('w076','API returning normalised holiday/term dates','schedulers','RAPIDAPI','ASSEMBLY'),
x('w077','API converting between industry code systems','integrators','RAPIDAPI','ASSEMBLY'),
x('w078','API scoring text against a named standard','edtech','RAPIDAPI','BREADTH'),
x('w079','API returning unit conversions for a technical domain','engineers','RAPIDAPI','BREADTH'),
x('w080','API for parsing a common messy document format','developers','RAPIDAPI','PER_INPUT'),
x('w081','npm package: config presets per toolchain','developers','REGISTRY','BREADTH'),
x('w082','npm package: fixture generators per schema','developers','REGISTRY','BREADTH'),
x('w083','GitHub Action templates per deploy target','developers','REGISTRY','BREADTH'),
x('w084','Home Assistant blueprints per automation goal','smart-home owners','GALLERY','BREADTH'),
x('w085','Airtable base templates per operational process','small teams','GALLERY','BREADTH'),
x('w086','Make/Zapier blueprint packs per vertical','small businesses','GALLERY','BREADTH'),
x('w087','Obsidian plugin/theme per workflow','note-takers','GALLERY','BREADTH'),
x('w088','VS Code snippet packs per framework','developers','REGISTRY','BREADTH'),
x('w089','Figma community kits per design system pattern','designers','GALLERY','BREADTH'),
x('w090','Notion gallery templates per life/work domain','general','GALLERY','BREADTH'),

// PER_INPUT generators — customer supplies the facts
x('w091','Pattern regraded to submitted measurements','sewers, knitters','GUMROAD','PER_INPUT'),
x('w092','Cut list optimised to submitted stock sizes','woodworkers','GUMROAD','PER_INPUT'),
x('w093','Planting calendar from submitted location and beds','gardeners','GUMROAD','PER_INPUT'),
x('w094','Stocking plan from submitted tank parameters','fishkeepers','GUMROAD','PER_INPUT'),
x('w095','Training block from submitted lift history','lifters','GUMROAD','PER_INPUT'),
x('w096','Wiring diagram from submitted load list','van builders','GUMROAD','PER_INPUT'),
x('w097','Feed ration from submitted herd data','smallholders','GUMROAD','PER_INPUT'),
x('w098','Quilt layout from submitted fabric inventory','quilters','GUMROAD','PER_INPUT'),
x('w099','Layout plan from submitted room dimensions','modellers','GUMROAD','PER_INPUT'),
x('w100','Encounter set from submitted party composition','TTRPG GMs','DRIVETHRU','PER_INPUT'),
];

const c=(a:string[])=>a.reduce((m,k)=>((m[k]=(m[k]??0)+1),m),{} as Record<string,number>);
const L:string[]=[];
L.push('# H0 Portfolio v4 — zero-upfront, revenue-share surfaces only\n');
L.push(`**Generated:** ${new Date().toISOString()} · **Cost: $0.00** · **${H4.length} hypotheses**\n`);
L.push('> E0. Zero evidentiary weight.\n');
L.push('Selection principle: **the platform is paid only when Factory is paid.** Failed assets');
L.push('stay online at zero carrying cost; fixed cost does not grow with experiment count.\n');
L.push('**Upfront cost for every hypothesis here: $0.00.**\n');
L.push('## By surface\n'+Object.entries(c(H4.map(h=>h.surface))).map(([k2,n])=>`**${k2}**: ${n}`).join(' · ')+'\n');
L.push('## By moat\n'+Object.entries(c(H4.map(h=>h.moat))).map(([k2,n])=>`**${k2}**: ${n}`).join(' · ')+'\n');
L.push('## All hypotheses\n');
L.push('| id | Sells | Buyer | Surface | Moat |');
L.push('|---|---|---|---|---|');
for(const h of H4) L.push(`| \`${h.id}\` | ${h.sells} | ${h.buyer} | ${h.surface} | ${h.moat} |`);
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('state',{recursive:true});
writeFileSync('state/H0_PORTFOLIO_V4.md',L.join('\n'));
console.log(`${H4.length} hypotheses, all $0 upfront`);
console.log('surfaces:',JSON.stringify(c(H4.map(h=>h.surface))));
console.log('moats:',JSON.stringify(c(H4.map(h=>h.moat))));
