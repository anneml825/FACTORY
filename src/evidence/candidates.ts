/**
 * Candidate universe for the Data Economics Probe.
 *
 * COMMITTED BEFORE MEASUREMENT. Selection rules are stated so the set cannot be
 * quietly reshaped afterwards to flatter a source.
 *
 * Selection rules:
 *  1. Stratified HEAD / MID / LONG_TAIL, roughly equal thirds. Free sources
 *     cover head terms well and long-tail terms poorly, and real opportunities
 *     live in the long tail — so aggregate coverage alone would mislead.
 *  2. Spans consumer, prosumer, and developer-facing domains, because the
 *     Campaign surface is not yet chosen and the probe must not presuppose it.
 *  3. Chosen as plausible digital-product niches, NOT chosen for whether any
 *     particular API happens to cover them.
 *  4. No candidate was added or removed after any measurement was seen.
 */

import type { Candidate } from './types.ts';

function c(
  id: string,
  term: string,
  stratum: Candidate['stratum'],
  extra: { wikiTitle?: string; packageName?: string } = {},
): Candidate {
  return { id, term, stratum, ...extra };
}

export const CANDIDATES: Candidate[] = [
  // ---- HEAD: broad, high-interest topics -----------------------------------
  c('h01', 'meal planning', 'HEAD', { wikiTitle: 'Meal_preparation' }),
  c('h02', 'budgeting', 'HEAD', { wikiTitle: 'Budget' }),
  c('h03', 'resume writing', 'HEAD', { wikiTitle: 'Résumé' }),
  c('h04', 'yoga', 'HEAD', { wikiTitle: 'Yoga' }),
  c('h05', 'sourdough bread', 'HEAD', { wikiTitle: 'Sourdough' }),
  c('h06', 'wedding planning', 'HEAD', { wikiTitle: 'Wedding_planner' }),
  c('h07', 'home schooling', 'HEAD', { wikiTitle: 'Homeschooling' }),
  c('h08', 'photography', 'HEAD', { wikiTitle: 'Photography' }),
  c('h09', 'personal finance', 'HEAD', { wikiTitle: 'Personal_finance' }),
  c('h10', 'gardening', 'HEAD', { wikiTitle: 'Gardening' }),
  c('h11', 'invoicing', 'HEAD', { wikiTitle: 'Invoice', packageName: 'invoice' }),
  c('h12', 'project management', 'HEAD', { wikiTitle: 'Project_management' }),
  c('h13', 'time tracking', 'HEAD', { wikiTitle: 'Timesheet' }),
  c('h14', 'inventory management', 'HEAD', { wikiTitle: 'Inventory_management_software' }),
  c('h15', 'email marketing', 'HEAD', { wikiTitle: 'Email_marketing' }),
  c('h16', 'search engine optimization', 'HEAD', { wikiTitle: 'Search_engine_optimization' }),
  c('h17', 'bookkeeping', 'HEAD', { wikiTitle: 'Bookkeeping' }),
  c('h18', 'meditation', 'HEAD', { wikiTitle: 'Meditation' }),
  c('h19', 'language learning', 'HEAD', { wikiTitle: 'Language_acquisition' }),
  c('h20', 'woodworking', 'HEAD', { wikiTitle: 'Woodworking' }),
  c('h21', 'typescript', 'HEAD', { wikiTitle: 'TypeScript', packageName: 'typescript' }),
  c('h22', 'data visualization', 'HEAD', { wikiTitle: 'Data_and_information_visualization', packageName: 'd3' }),
  c('h23', 'pdf generation', 'HEAD', { wikiTitle: 'PDF', packageName: 'pdfkit' }),
  c('h24', 'web scraping', 'HEAD', { wikiTitle: 'Web_scraping', packageName: 'cheerio' }),
  c('h25', 'spreadsheet', 'HEAD', { wikiTitle: 'Spreadsheet', packageName: 'xlsx' }),
  c('h26', 'markdown', 'HEAD', { wikiTitle: 'Markdown', packageName: 'marked' }),
  c('h27', 'authentication', 'HEAD', { wikiTitle: 'Authentication', packageName: 'passport' }),
  c('h28', 'image compression', 'HEAD', { wikiTitle: 'Image_compression', packageName: 'sharp' }),
  c('h29', 'calendar scheduling', 'HEAD', { wikiTitle: 'Calendaring_software' }),
  c('h30', 'podcasting', 'HEAD', { wikiTitle: 'Podcast' }),
  c('h31', 'knitting', 'HEAD', { wikiTitle: 'Knitting' }),
  c('h32', 'meal prep for athletes', 'HEAD', { wikiTitle: 'Sports_nutrition' }),
  c('h33', 'real estate investing', 'HEAD', { wikiTitle: 'Real_estate_investing' }),
  c('h34', 'dropshipping', 'HEAD', { wikiTitle: 'Drop_shipping' }),

  // ---- MID: specific but recognizable niches -------------------------------
  c('m01', 'sourdough starter troubleshooting', 'MID', { wikiTitle: 'Sourdough' }),
  c('m02', 'freelance contract templates', 'MID', { wikiTitle: 'Freelancer' }),
  c('m03', 'etsy shop seo', 'MID', { wikiTitle: 'Etsy' }),
  c('m04', 'notion templates', 'MID', { wikiTitle: 'Notion_(productivity_software)' }),
  c('m05', 'airbnb host checklist', 'MID', { wikiTitle: 'Airbnb' }),
  c('m06', 'dungeons and dragons campaign notes', 'MID', { wikiTitle: 'Dungeons_%26_Dragons' }),
  c('m07', 'sneaker reselling', 'MID', { wikiTitle: 'Sneaker_collecting' }),
  c('m08', 'van life conversion', 'MID', { wikiTitle: 'Vandwelling' }),
  c('m09', 'aquascaping', 'MID', { wikiTitle: 'Aquascaping' }),
  c('m10', 'bullet journaling', 'MID', { wikiTitle: 'Bullet_journal' }),
  c('m11', 'sous vide cooking', 'MID', { wikiTitle: 'Sous_vide' }),
  c('m12', 'urban beekeeping', 'MID', { wikiTitle: 'Urban_beekeeping' }),
  c('m13', 'wedding seating chart', 'MID', { wikiTitle: 'Wedding_reception' }),
  c('m14', 'toddler sleep training', 'MID', { wikiTitle: 'Sleep_training' }),
  c('m15', 'ham radio licensing', 'MID', { wikiTitle: 'Amateur_radio_licensing_in_the_United_States' }),
  c('m16', 'birdwatching life list', 'MID', { wikiTitle: 'Birdwatching' }),
  c('m17', 'home lab server', 'MID', { wikiTitle: 'Home_server' }),
  c('m18', 'mechanical keyboard building', 'MID', { wikiTitle: 'Keyboard_technology' }),
  c('m19', 'cold plunge therapy', 'MID', { wikiTitle: 'Cold_shower' }),
  c('m20', 'foraging mushrooms', 'MID', { wikiTitle: 'Mushroom_hunting' }),
  c('m21', 'rate limiting middleware', 'MID', { packageName: 'express-rate-limit' }),
  c('m22', 'csv parsing', 'MID', { packageName: 'papaparse' }),
  c('m23', 'cron scheduling', 'MID', { packageName: 'node-cron' }),
  c('m24', 'feature flags', 'MID', { packageName: 'unleash-client' }),
  c('m25', 'database migrations', 'MID', { packageName: 'node-pg-migrate' }),
  c('m26', 'invoice pdf template', 'MID', { packageName: 'pdfmake' }),
  c('m27', 'ical parsing', 'MID', { packageName: 'ical' }),
  c('m28', 'barcode generation', 'MID', { packageName: 'bwip-js' }),
  c('m29', 'currency formatting', 'MID', { packageName: 'dinero.js' }),
  c('m30', 'timezone conversion', 'MID', { packageName: 'luxon' }),
  c('m31', 'small business payroll', 'MID', { wikiTitle: 'Payroll' }),
  c('m32', 'restaurant menu design', 'MID', { wikiTitle: 'Menu' }),
  c('m33', 'nonprofit grant writing', 'MID', { wikiTitle: 'Grant_writing' }),

  // ---- LONG_TAIL: where real opportunities live, and where free sources
  //      are most likely to fail. Deliberately specific.
  c('t01', 'sourdough hydration calculator for rye flour', 'LONG_TAIL'),
  c('t02', 'etsy digital download tax spreadsheet for uk sellers', 'LONG_TAIL'),
  c('t03', 'dog grooming appointment reminder templates', 'LONG_TAIL'),
  c('t04', 'crossfit gym class booking spreadsheet', 'LONG_TAIL'),
  c('t05', 'montessori toddler activity rotation planner', 'LONG_TAIL'),
  c('t06', 'sailboat provisioning checklist offshore', 'LONG_TAIL'),
  c('t07', 'beekeeping hive inspection log printable', 'LONG_TAIL'),
  c('t08', 'freelance photographer model release generator', 'LONG_TAIL'),
  c('t09', 'wedding videographer shot list template', 'LONG_TAIL'),
  c('t10', 'food truck cost per plate calculator', 'LONG_TAIL'),
  c('t11', 'airbnb cleaning turnover checklist multi property', 'LONG_TAIL'),
  c('t12', 'aquarium water change schedule tracker', 'LONG_TAIL'),
  c('t13', 'homeschool transcript generator for college applications', 'LONG_TAIL'),
  c('t14', 'small batch soap lye calculator', 'LONG_TAIL'),
  c('t15', 'disc golf course rating spreadsheet', 'LONG_TAIL'),
  c('t16', 'vintage watch servicing record book', 'LONG_TAIL'),
  c('t17', 'allotment crop rotation planner uk', 'LONG_TAIL'),
  c('t18', 'physical therapy home exercise handout builder', 'LONG_TAIL'),
  c('t19', 'tattoo artist aftercare instruction cards', 'LONG_TAIL'),
  c('t20', 'mobile car detailing pricing calculator', 'LONG_TAIL'),
  c('t21', 'estate sale inventory pricing sheet', 'LONG_TAIL'),
  c('t22', 'church volunteer rota scheduler', 'LONG_TAIL'),
  c('t23', 'youth soccer coach practice plan library', 'LONG_TAIL'),
  c('t24', 'reptile husbandry humidity log', 'LONG_TAIL'),
  c('t25', 'sourdough bakery wholesale order form', 'LONG_TAIL'),
  c('t26', 'freelance translator rate card template', 'LONG_TAIL'),
  c('t27', 'bicycle touring gear weight spreadsheet', 'LONG_TAIL'),
  c('t28', 'nail salon client allergy record', 'LONG_TAIL'),
  c('t29', 'community garden plot assignment tracker', 'LONG_TAIL'),
  c('t30', 'indie game playtest feedback form', 'LONG_TAIL'),
  c('t31', 'horse boarding stable feed schedule', 'LONG_TAIL'),
  c('t32', 'drone real estate shoot checklist faa', 'LONG_TAIL'),
  c('t33', 'pottery kiln firing log glaze results', 'LONG_TAIL'),
];

export function candidateCounts() {
  const by: Record<string, number> = {};
  for (const c of CANDIDATES) by[c.stratum] = (by[c.stratum] ?? 0) + 1;
  return { total: CANDIDATES.length, byStratum: by };
}
