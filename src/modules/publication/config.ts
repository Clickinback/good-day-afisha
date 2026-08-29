export const PUBLICATION_POLICY_VERSION="publish-policy-v1";
export const publicationConfig={thresholds:{autoPublish:.90,moderation:.65},weights:{aiConfidence:.50,sourceTrust:.35,completeness:.15},corroboration:{perAdditionalSource:.04,maxBonus:.08}} as const;
