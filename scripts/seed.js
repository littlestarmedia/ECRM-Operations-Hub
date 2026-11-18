// Seeds the work-item and decision tracker from the existing ECRM source
// material (the "ECRM operating view" artifact, as at 17 Nov 2026) rather
// than inventing anything. Every row keeps its original wording and its
// source code (SOURCES below) in source_context. Safe to re-run: it only
// inserts when the table is empty.
const db = require('../server/db');

const SOURCES = {
  WB: "eCRM As-Is Map workbook: Danny's breakdown (10 Nov), PMO list, open questions",
  BAU: 'Email: BAU Work Changes (Danny, 20 Oct)',
  CEP: 'Email: CRM/CEP related Projects (Danny, 20 Oct)',
  SMS: 'Email: SMS deliverability (Danny, 4 Nov)',
  MT: 'ECRM weekly catch-up, 17 Nov (transcript)',
  CD: "Caroline's decisions on Danny's breakdown (17 Nov)",
  CA: "Caroline's direction (17 Nov): process allocation; welcome series move to Twilio",
};

const PRIORITY_LABEL = {
  now: 'Now: Nov–Jan',
  next: 'Next: Jan–Mar',
  ongoing: 'Ongoing',
  later: 'Later: scope only',
  hold: 'Hold',
};
const STATUS_FOR_H2 = { ongoing: 'in_progress', hold: 'parked' };

// [title, work_area, do, achieves/benefit, impact note, owner, deps, h2, src, route]
const PLAN = [
  ['SCRAM: get visibility and control back', 'SCRAM',
    'Round table with Engineering; live rules documented with exclusion counts; Twilio and SCRAM reporting requested; agree the route for query changes; time for Simon to learn DataGrip; Engineering work and training so SCRAM SMS build can move to Amy, with Paige’s support.',
    'Restores the list-tuning loop ECRM ran on VooDoo; lets ECRM test rule changes such as those in the SFB SMS proposal. Likely the biggest lever on SMS, but not measured. Needs VooDoo-era vs SCRAM-era delivery and revenue per send (John’s follow-up).',
    'Caroline to convene; Simon (audience and list work); Engineering (rules, queries, training)', 'Engineering time; tickets through PMO / WOB / BOB', 'now', 'MT; CEP #4, #7; BAU #6', null],
  ['Opt-out and suppression framework', 'CEP',
    'Map every opt-out and resubscribe route; single master suppression record; two-way SendGrid sync; reconciliation reporting; VooDoo blacklist migration check; end-to-end SMS opt-out test; tamper-proof audit ledger.',
    'Provable compliance (sending to opted-out contacts is a PECR breach); recovers resubscribed contacts who are silently blocked. Risk reduction. Recovered contacts not sized: needs a count of resubscribed-but-blocked contacts.',
    'Framework: Cat leads, Danny as resource (PMO list). Process: CRM, Compliance and Contact DB owners', 'Engineering, Data, Compliance', 'now', 'CEP #2; WB PMO list', 'PMO / WOB / BOB'],
  ['Incident response and live monitoring', 'BAU',
    'Agree triggers (e.g. delivery drop, Twilio error 30007, seed flags, rising bounces, Gmail spam rate above 0.3%), who can pause a send, escalation to Twilio and SendGrid, recovery steps. Confirm who watches each send.',
    'Problems found and contained before they cost revenue; under the Twilio model nobody else raises the alarm. Not quantified. Needs past incidents with revenue lost per incident.',
    'Danny and Simon (current cover); owner to agree', 'Monitoring data', 'now', 'BAU #8, #1; SMS; WB Q2', null],
  ['SFSG email deliverability fix + HTTPS link tracking', 'Deliverability',
    'Investigate and fix the SFSG email deliverability problem; configure SendGrid branded link tracking over HTTPS before Phoenix goes live.',
    'Restores SFSG email revenue at risk; stops email links breaking at Phoenix go-live. Revenue at risk not sized. Needs SFSG email revenue before and after the issue; link tracking is a hard deadline.',
    'Danny (technical); To confirm', 'Phoenix go-live date: To confirm', 'now', 'CEP #1', null],
  ['Welcome series: move SFSG and SFB from VooDoo to Twilio, with the Zapier rebuild', 'CEP',
    'Move the SFSG and SFB SMS welcome series from VooDoo to Twilio. Rebuild the welcome Zaps at the same time: they will need Twilio links, plus fault tolerance and alerting. Move links off VooDoo’s flagged short-link domain; build on Simon’s failure-tracking prototype.',
    'Welcome SMS volume counts towards the quarterly Twilio send commitments; welcome failures spotted within a day rather than weeks; ends daily manual Zapier checks; removes a known spam trigger. Commitments: size of the quarterly commitment and the current shortfall To confirm. Zapier: Simon estimates failures have cost thousands, possibly tens of thousands (unvalidated); welcomes stated at around 50k a month on 17 Nov (unit and basis To confirm). Needs a failure log with dates and leads lost.',
    'Technical input: Danny and Simon (To confirm); who fixes Zaps: owner to agree', 'Twilio set-up for welcomes; Zapier expertise; SMS welcome series owner', 'now', 'CA; CEP #3; BAU #5; WB PMO list; MT', 'PMO / WOB / BOB (Zapier alerting)'],
  ['SMS deliverability actions', 'Deliverability',
    'Decide: smaller daily sends instead of large sends every two days; STOP keyword instead of an opt-out link (technical work done); standby short-link domains with a dedicated welcome domain. Then: click rate by UK network, seed handsets, content and spam root cause.',
    'Steadier sending pattern and one link per SMS reduce spam signals; quicker proof of network-level blocking. Plausible reach recovery (early Twilio sends performed best) but not measured. Needs click rate by network and seed results.',
    'Decisions: Caroline; technical: Danny; copy testing: Experience Team (new process); domain names: To confirm', 'Twilio ticket outcome; network data', 'now', 'SMS; CEP #5; BAU #7', null],
  ['Agree the attribution window', 'BAU',
    'Settle one window (8–12 vs 8–10 days) and owner; review every 3–6 months.',
    'Sends judged on settled revenue, so stop and scale calls are right. No direct uplift; prevents wrong decisions on every send.',
    'Owner to agree (Danny: Engineering analysis, Data reporting); used by Amy and Simon in reporting', 'Data, Power BI', 'now', 'BAU #3; WB', null],
  ['Messaging platform evaluation', 'Commercial improvement',
    'Review Segment, Customer.io, Optimove and others; urgent output is a realistic time and effort estimate.',
    'Decides whether to stop investing in SCRAM or invest to keep it workable. Avoids spend on the wrong option; no uplift estimate in the sources.',
    'To confirm', 'Engineering, IT, Data, Finance', 'next', 'CEP #10', null],
  ['SCRAM audience: remaining items', 'SCRAM',
    'Welcome-series delay before general sends; stop invalid UK mobiles getting through; SFB/SFSG list separation (Amy’s request).',
    'Stops paying for invalid numbers; avoids clashes with the welcome series. Small cost saving: invalid-number failure count is low.',
    'Simon, with Engineering', 'SCRAM round table', 'next', 'CEP #7', null],
  ['Operational blueprint and handover', 'BAU',
    'Document BAU controls, monitoring standards, metrics and response plans; train receiving owners; periodic audit points.',
    'BAU moves to agreed owners; less reliance on individuals. Continuity, not uplift.',
    'To confirm', 'Owners agreed for each control', 'ongoing', 'CEP #9; BAU email', null],
  ['Ongoing BAU controls', 'BAU',
    'Resilience monitoring of SMS sends; SCRAM health checks; deliverability monitoring (SMS and email); list hygiene and engagement optimisation.',
    'Keeps sends safe and lists clean while the work above lands. Protects existing revenue; not quantified.',
    'Danny and Simon (current cover)', 'Their time', 'ongoing', 'BAU #1, #2, #4, #6', null],
  ['Monitoring dashboards (beyond Zapier and SCRAM needs)', 'Deliverability',
    'Cross-system health dashboard and Twilio error logging.',
    'Turns manual log checking into something that can be handed over. Time saved and faster detection; not quantified.',
    'Danny / Engineering', 'PMO prioritisation', 'later', 'CEP #4; WB PMO list', 'PMO / WOB / BOB'],
  ['Email sending infrastructure isolation', 'Deliverability',
    'Separate sending subdomains, authentication and IPs per product, with phased warm-up; possibly standby warmed IPs.',
    'Stops one brand’s problems damaging the others. Resilience. Benefit depends on whether the SFSG issue came from shared infrastructure.',
    'Danny (IT)', 'Outcome of the SFSG fix', 'later', 'CEP #6', null],
  ['Legacy (Acoustic) list reactivation', 'Commercial improvement',
    'Hold. Email test run in November.',
    'CEP described potential revenue as ‘believed to be high’. Evidence against: second SFSG round opened below 1%; about £230 from about 114k emails (as quoted 17 Nov), after paying to verify about half a million records. Team view: not worth extending to SMS. Any restart needs approval from the CEO, Executive Director, Compliance and DPO.',
    '—', '—', 'hold', 'CEP #8; MT', null],
];

// [title, next_action, work_area]
const FIRST = [
  ['Arrange the SCRAM round table with Engineering', 'Get the live rules documented with exclusion counts, and agree the route for query changes.', 'SCRAM'],
  ['Confirm who watches each send now', 'Then agree incident triggers and who can pause a send.', 'Deliverability'],
  ['Define the suppression process with CRM, Compliance and Contact DB owners', 'Including customer removals, and whether SMS removals cover SCRAM sends.', 'CEP'],
  ['Plan the move of SCRAM SMS build to Amy', 'With Paige’s support: the Engineering work and training needed.', 'SCRAM'],
  ['Ask the Experience Team to write the copy-testing process', 'Testing copy against spam measures before sends.', 'Deliverability'],
  ['Put SCRAM, Twilio and Zapier needs through PMO / WOB / BOB', 'The agreed route for requests to Engineering, with Omar.', 'SCRAM'],
  ['Scope the move of the SFSG and SFB welcome series from VooDoo to Twilio', 'With Danny and Simon, alongside the Zapier rebuild; check the effect on quarterly Twilio send commitments.', 'CEP'],
  ['Confirm what else still sends through VooDoo', 'And whether welcome SMS costs are in Orbit.', 'CEP'],
  ['Set the Amy and Paige split for the send cycle', 'As Paige’s Marketing time increases.', 'BAU'],
];

const DECISIONS = [
  ['SMS sending practice: smaller daily sends, STOP keyword opt-out, standby short-link domains, monitoring thresholds', 'Caroline (asked by Danny, 4 Nov)'],
  ['One attribution window, and who owns it', 'Caroline with Engineering and Data'],
  ['Who fixes Zapier workflows, and technical resource for the welcome move to Twilio', 'Caroline; resource via Rob / PMO'],
  ['SCRAM direction: invest in SCRAM or commit to a new platform', 'Rob, after the round table and CEP #10'],
  ['Legacy reactivation: hold', 'CEO, Executive Director, Compliance and DPO (send approvers)'],
];

function srcContext(codes, route) {
  const named = codes.split(';').map((c) => c.trim()).map((c) => {
    const code = c.split(' ')[0].replace('#', '').replace(/\d+$/, '').trim() || c;
    return SOURCES[code] ? `${c} (${SOURCES[code]})` : c;
  }).join('; ');
  return route ? `${named} — route: ${route}` : named;
}

async function main() {
  const { rows: existing } = await db.query('SELECT count(*) FROM work_items');
  if (Number(existing[0].count) > 0) {
    console.log('work_items already has data — skipping seed.');
  } else {
    let position = 0;
    for (const [title, area, doText, benefit, owner, deps, h2, src, route] of PLAN) {
      await db.query(
        `INSERT INTO work_items
           (title, work_area, owner, status, priority, next_action, dependencies,
            expected_benefit, source_context, position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [title, area, owner, STATUS_FOR_H2[h2] || 'backlog', PRIORITY_LABEL[h2],
          doText, deps, benefit, srcContext(src, route), position++]
      );
    }
    for (const [title, nextAction, area] of FIRST) {
      await db.query(
        `INSERT INTO work_items
           (title, work_area, owner, status, priority, next_action, source_context, position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [title, area, 'To confirm', 'backlog', PRIORITY_LABEL.now, nextAction,
          'Attention-first list, ECRM operating view (17 Nov 2026)', position++]
      );
    }
    console.log(`Seeded ${PLAN.length + FIRST.length} work items.`);
  }

  const { rows: existingDecisions } = await db.query('SELECT count(*) FROM decisions');
  if (Number(existingDecisions[0].count) > 0) {
    console.log('decisions already has data — skipping seed.');
  } else {
    for (const [text, decider] of DECISIONS) {
      await db.query('INSERT INTO decisions (text, decider, status) VALUES ($1,$2,$3)', [text, decider, 'open']);
    }
    console.log(`Seeded ${DECISIONS.length} decisions.`);
  }

  await db.pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
