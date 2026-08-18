/**
 * WordPress-native candidate universe.
 *
 * WHY A SECOND CANDIDATE SET EXISTS — read this before assuming it is a fudge.
 *
 * The general set in candidates.ts was built for the question "can Factory screen
 * consumer digital-product niches?" Its long tail is craft and small-business
 * phrasing: pottery kiln logs, nail salon records, disc golf ratings.
 *
 * Run 3 evaluated WordPress against that set and it FAILED — 49% zeros, long-tail
 * median 0. That result stands in the record and is not withdrawn.
 *
 * But asking the WordPress plugin directory about pottery glaze results is a
 * category error, not a measurement. WordPress plugins solve WEBSITE problems.
 * A search space is defined by its own opportunity domain, so screening it with
 * queries from a different domain measures the mismatch, not the space.
 *
 * THE HONEST RISK: rewriting the candidate set after a failure is exactly how a
 * gate gets gamed. Guards, fixed before this set was written:
 *
 *   1. The general-set result stays published and is reported alongside this one.
 *   2. GATE_CRITERIA are untouched — same thresholds, including the three that
 *      caused the failure.
 *   3. The generation rule is stated BELOW and followed, rather than terms being
 *      hand-picked for whether WordPress happens to answer them.
 *   4. LONG_TAIL entries must be genuinely specific — a named job for a named
 *      kind of site. If they turn out to be head terms wearing a costume, the
 *      long-tail median will be high for the wrong reason, and that is a failure
 *      of this set which must be reported, not celebrated.
 *
 * GENERATION RULE:
 *   HEAD      — the problem any website owner might have. Broad, obviously served.
 *   MID       — a problem specific to a recognizable class of site
 *               (shop, restaurant, membership, school), still widely applicable.
 *   LONG_TAIL — one specific job, for one specific kind of site, phrased the way
 *               someone would search for a plugin to do exactly that thing.
 *
 * No term was added or removed after seeing whether WordPress returned a result.
 */

import type { Candidate } from './types.ts';

const c = (id: string, term: string, stratum: Candidate['stratum']): Candidate => ({
  id,
  term,
  stratum,
});

export const WP_CANDIDATES: Candidate[] = [
  // ---- HEAD: any website owner --------------------------------------------
  c('wh01', 'contact form', 'HEAD'),
  c('wh02', 'backup', 'HEAD'),
  c('wh03', 'seo', 'HEAD'),
  c('wh04', 'security firewall', 'HEAD'),
  c('wh05', 'caching', 'HEAD'),
  c('wh06', 'image optimization', 'HEAD'),
  c('wh07', 'analytics', 'HEAD'),
  c('wh08', 'spam protection', 'HEAD'),
  c('wh09', 'page builder', 'HEAD'),
  c('wh10', 'newsletter signup', 'HEAD'),
  c('wh11', 'social sharing', 'HEAD'),
  c('wh12', 'cookie consent', 'HEAD'),
  c('wh13', 'redirect manager', 'HEAD'),
  c('wh14', 'sitemap', 'HEAD'),
  c('wh15', 'user registration', 'HEAD'),
  c('wh16', 'multilingual translation', 'HEAD'),
  c('wh17', 'gallery slider', 'HEAD'),
  c('wh18', 'custom fields', 'HEAD'),
  c('wh19', 'ecommerce store', 'HEAD'),
  c('wh20', 'booking appointments', 'HEAD'),

  // ---- MID: a recognizable class of site -----------------------------------
  c('wm01', 'woocommerce abandoned cart recovery', 'MID'),
  c('wm02', 'restaurant menu display', 'MID'),
  c('wm03', 'membership subscription content', 'MID'),
  c('wm04', 'event calendar tickets', 'MID'),
  c('wm05', 'real estate property listings', 'MID'),
  c('wm06', 'job board listings', 'MID'),
  c('wm07', 'donation fundraising', 'MID'),
  c('wm08', 'course learning management', 'MID'),
  c('wm09', 'directory listings business', 'MID'),
  c('wm10', 'invoice quotes client', 'MID'),
  c('wm11', 'live chat support', 'MID'),
  c('wm12', 'product reviews ratings', 'MID'),
  c('wm13', 'wholesale pricing customer group', 'MID'),
  c('wm14', 'inventory stock management', 'MID'),
  c('wm15', 'gdpr data request', 'MID'),
  c('wm16', 'staff directory team', 'MID'),
  c('wm17', 'pdf invoice packing slip', 'MID'),
  c('wm18', 'shipping rates calculator', 'MID'),
  c('wm19', 'affiliate referral program', 'MID'),
  c('wm20', 'podcast episode player', 'MID'),

  // ---- LONG_TAIL: one specific job, one specific kind of site --------------
  c('wt01', 'allergen labels restaurant menu items', 'LONG_TAIL'),
  c('wt02', 'recurring donation receipt annual statement nonprofit', 'LONG_TAIL'),
  c('wt03', 'qr code ticket check in door scanning', 'LONG_TAIL'),
  c('wt04', 'veterinary appointment reminder sms', 'LONG_TAIL'),
  c('wt05', 'church sermon archive audio series', 'LONG_TAIL'),
  c('wt06', 'gym class capacity waitlist booking', 'LONG_TAIL'),
  c('wt07', 'school parent permission slip signature', 'LONG_TAIL'),
  c('wt08', 'winery wine club shipment scheduling', 'LONG_TAIL'),
  c('wt09', 'salon stylist commission tracking', 'LONG_TAIL'),
  c('wt10', 'trade show exhibitor floor plan booth', 'LONG_TAIL'),
  c('wt11', 'boat marina slip reservation', 'LONG_TAIL'),
  c('wt12', 'farm csa share subscription box weekly', 'LONG_TAIL'),
  c('wt13', 'dental patient intake form hipaa', 'LONG_TAIL'),
  c('wt14', 'photographer client proofing gallery download', 'LONG_TAIL'),
  c('wt15', 'auto repair shop service history vehicle', 'LONG_TAIL'),
  c('wt16', 'library book lending due date', 'LONG_TAIL'),
  c('wt17', 'brewery tap list beer abv update', 'LONG_TAIL'),
  c('wt18', 'tutoring session scheduling recurring student', 'LONG_TAIL'),
  c('wt19', 'equipment rental availability calendar deposit', 'LONG_TAIL'),
  c('wt20', 'hoa dues payment tracking resident', 'LONG_TAIL'),
];
