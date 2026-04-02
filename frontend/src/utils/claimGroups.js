function bucketTimestamp(value, bucketMinutes = 60) {
  if (!value) {
    return "unknown";
  }

  const date = new Date(value);
  const bucketMs = bucketMinutes * 60 * 1000;
  return String(Math.floor(date.getTime() / bucketMs) * bucketMs);
}

export function groupClaimsByIncident(claims = [], options = {}) {
  if (!claims) {
    return [];
  }
  const bucketMinutes = options.bucketMinutes || 60;
  const groups = new Map();

  for (const claim of claims) {
    const incidentTriggers = claim.decision_breakdown?.incident_triggers || [claim.trigger_type];
    const key = [
      claim.worker_id || claim.worker_name || "worker",
      claim.zone || "zone",
      bucketTimestamp(claim.created_at, bucketMinutes),
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        worker_id: claim.worker_id,
        worker_name: claim.worker_name,
        zone: claim.zone || null,
        status: null,
        created_at: claim.created_at,
        review_deadline: claim.review_deadline || null,
        claim_count: 0,
        trigger_types: [],
        claims: [],
        total_calculated_payout: 0,
        total_final_payout: 0,
        max_fraud_score: null,
        max_fraud_probability: null,
        avg_final_score: 0,
        overdue_count: 0,
        top_factors: [],
        fraud_model_version: null,
        fraud_fallback_used: null,
        _statuses: new Set(),
      });
    }

    const group = groups.get(key);
    const fraudModel = claim.fraud_model || claim.decision_breakdown?.fraud_model || {};
    group.claim_count += 1;
    if (claim.status) {
      group._statuses.add(claim.status);
    }
    group.claims.push(claim);
    group.trigger_types = Array.from(new Set([...group.trigger_types, ...incidentTriggers].filter(Boolean)));
    group.total_calculated_payout += Number(claim.calculated_payout || 0);
    group.total_final_payout += Number(claim.final_payout || 0);
    group.avg_final_score += Number(claim.final_score || 0);
    group.max_fraud_score = group.max_fraud_score === null
      ? Number(claim.fraud_score || 0)
      : Math.max(group.max_fraud_score, Number(claim.fraud_score || 0));
    if (fraudModel.fraud_probability !== null && fraudModel.fraud_probability !== undefined) {
      const fraudProbability = Number(fraudModel.fraud_probability || 0);
      group.max_fraud_probability = group.max_fraud_probability === null
        ? fraudProbability
        : Math.max(group.max_fraud_probability, fraudProbability);
    }
    if ((!group.top_factors || !group.top_factors.length) && Array.isArray(fraudModel.top_factors)) {
      group.top_factors = fraudModel.top_factors.slice(0, 3);
    }
    if (!group.fraud_model_version && fraudModel.model_version) {
      group.fraud_model_version = fraudModel.model_version;
    }
    if (group.fraud_fallback_used === null && fraudModel.fallback_used !== undefined) {
      group.fraud_fallback_used = Boolean(fraudModel.fallback_used);
    }

    if (claim.review_deadline && (!group.review_deadline || new Date(claim.review_deadline) < new Date(group.review_deadline))) {
      group.review_deadline = claim.review_deadline;
    }
    if (claim.created_at && new Date(claim.created_at) < new Date(group.created_at)) {
      group.created_at = claim.created_at;
    }
    if (claim.is_overdue) {
      group.overdue_count += 1;
    }
  }

  return Array.from(groups.values())
    .map((group) => {
      const statuses = group._statuses;
      let status = "approved";
      if (statuses.has("rejected")) {
        status = "rejected";
      } else if (statuses.has("delayed")) {
        status = "delayed";
      }
      return {
        ...group,
        status,
        avg_final_score: group.claim_count ? group.avg_final_score / group.claim_count : 0,
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}
