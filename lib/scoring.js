/**
 * scoring.js
 * Domain scoring algorithm for determining which domain gets a task today.
 */

const PRIORITY_WEIGHTS = {
  high: 2,
  medium: 1,
  low: 0.5,
};

const STAGE_WEIGHTS = {
  foundation: 1.5,
  skill: 1.2,
  mastery: 1,
};

/**
 * Calculate a score for a domain to determine task priority.
 * Higher score = more urgent to assign a task to this domain.
 *
 * @param {Object} domain - Domain row from Supabase
 * @param {string|null} lastDomainId - ID of the last domain that got a task (to avoid repeating)
 * @returns {number} score
 */
export function scoreDomain(domain, lastDomainId = null) {
  // Never repeat the last domain
  if (String(domain.id) === String(lastDomainId)) return -Infinity;

  const priority = (domain.priority || "medium").toLowerCase();
  const stage = (domain.stage || "foundation").toLowerCase();

  const priorityWeight = PRIORITY_WEIGHTS[priority] ?? 1;
  const stageWeight = STAGE_WEIGHTS[stage] ?? 1;

  const lastDone = domain.last_done ? new Date(domain.last_done) : null;
  const now = new Date();
  const daysSinceLastDone = lastDone
    ? Math.max(0, (now - lastDone) / (1000 * 60 * 60 * 24))
    : 7; // If never done, treat as 7 days ago to boost it

  const streak = domain.streak || 0;

  const score =
    daysSinceLastDone * priorityWeight * stageWeight + streak * 0.2;

  return score;
}

/**
 * Pick the best domain to assign a task to today.
 * @param {Array} domains - All user domains
 * @param {string|null} lastDomainId - Last domain used
 * @returns {Object|null} Best domain
 */
export function pickBestDomain(domains, lastDomainId = null) {
  if (!domains || domains.length === 0) return null;

  const scored = domains.map((d) => ({
    domain: d,
    score: scoreDomain(d, lastDomainId),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].domain;
}
