// Match the most specific applicable user-agent group and longest Allow/Disallow rule.
export function isAllowedByRobots(robots: string, target: URL, userAgent = 'gooddayafishabot') {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group = { agents: [] as string[], rules: [] as { allow: boolean; path: string }[] };
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (group.rules.length) { groups.push(group); group = { agents: [], rules: [] }; }
      group.agents.push(value.toLowerCase());
    } else if (group.agents.length && (key === 'allow' || key === 'disallow')) {
      group.rules.push({ allow: key === 'allow', path: value });
    }
  }
  groups.push(group);
  const specificity = (agents: string[]) => Math.max(-1, ...agents.map(agent => agent === '*' ? 0 : agent && userAgent.toLowerCase().includes(agent) ? agent.length : -1));
  const best = Math.max(-1, ...groups.map(item => specificity(item.agents)));
  let matchLength = -1;
  let allowed = true;
  for (const item of groups) {
    if (best < 0 || specificity(item.agents) !== best) continue;
    for (const rule of item.rules) {
      if (!rule.path) continue;
      const anchored = rule.path.endsWith('$');
      const pattern = (anchored ? rule.path.slice(0, -1) : rule.path).split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      if (!new RegExp(`^${pattern}${anchored ? '$' : ''}`).test(target.pathname + target.search)) continue;
      const length = rule.path.replace(/\*/g, '').length;
      if (length > matchLength || length === matchLength && rule.allow) { matchLength = length; allowed = rule.allow; }
    }
  }
  return allowed;
}
