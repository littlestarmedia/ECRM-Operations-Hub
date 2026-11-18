/* Static ECRM process/ownership/meetings content, ported from the "ECRM operating
   view" artifact (as at 17 Nov 2026). Read-only reference material — editable
   work and decisions live in the database via the API (see app.js). */

const SOURCES = {
  WB: "eCRM As-Is Map workbook: Danny's breakdown (10 Nov), PMO list, open questions",
  BAU: "Email: BAU Work Changes (Danny, 20 Oct)",
  CEP: "Email: CRM/CEP related Projects (Danny, 20 Oct)",
  SMS: "Email: SMS deliverability (Danny, 4 Nov)",
  GD: "Process guides (11 Nov): scheduling, briefing, tracking links, customer removal, invoices",
  ORB: "Orbit process (updated, Nov)",
  SL: "Simon's task list (eCRM-tasks.doc)",
  CA: "Caroline's direction (17 Nov): process allocation; welcome series move to Twilio",
  CD: "Caroline's decisions on Danny's breakdown (17 Nov)",
  MT: "ECRM weekly catch-up, 17 Nov (transcript)",
  PN: "Project notes: team decisions (Oct–Nov)"
};

const SCRAM_NOW = [
  ["Built and run by Engineering (Dev) as an MVP for bulk SMS after the move from VooDoo to Twilio. Engineering own the code and the audience queries.", "MT"],
  ["Builds each SMS send list from the Contact DB using rules Engineering replicated from Simon's VooDoo set-up: a 365-day cut-off (SFSG) plus exclusions for undelivered welcomes, contacts expired after 30 days, not delivered in the last 2 days, and no click in the last 10 sends. The SFSG list comes out at about 86–87k.", "MT"],
  ["SCRAM SMS sends are set up by Danny and Simon, about every other day. Messages go out through Twilio with Shlink short links.", "CD; MT; SL"],
  ["Independent health checks are in place; Engineering are to be asked to run their own. Danny holds the infrastructure uptime view, with thresholds still to agree with Engineering.", "BAU #2; WB"],
  ["SFB bulk SMS is currently paused.", "MT; PN"]
];
const SCRAM_ISSUES = [
  ["No delivery data from Twilio", "Non-delivered counts and failure reasons are gathered by hand by Simon and Danny: laborious and inaccurate.", "MT"],
  ["No view of what the rules do", "Nobody in ECRM can see how many contacts each SCRAM rule removes from a send.", "MT"],
  ["ECRM can't change the queries", "Simon is learning DataGrip to query the Contact DB. Progress has been slow for several weeks, and he is wary of working on the live master database.", "MT"],
  ["No route for a new query into SCRAM", "Nobody in ECRM knows how a query gets into SCRAM. Engineering would need to do it at first, then train ECRM.", "MT"],
  ["List tuning has stopped", "On VooDoo, Simon used delivery quality to adjust the list rules. That loop has been lost since the move to SCRAM.", "MT"],
  ["Welcome-failure rule", "The VooDoo rule that kept contacts with 3+ undelivered welcomes out of bulk may not be applied in SCRAM. To confirm with Engineering.", "MT"],
  ["Requests not picked up", "Requests for SCRAM views were raised verbally and not actioned. They need to go in as written briefs or tickets.", "MT"],
  ["No plan beyond the MVP", "There is no agreed plan to move SCRAM from MVP to a more manageable version.", "MT"],
  ["Performance hard to read", "Phoenix, SCRAM and the sending changes landed at the same time. John's analysis shows results changed once SCRAM started; a follow-up is needed.", "MT"]
];
const SCRAM_NEXT = [
  ["ECRM can see the live rules and how many contacts each one excludes per send", "Engineering to document the rules; Simon to set out what the rules should be", "MT"],
  ["Twilio delivery data and SCRAM views available without manual collection", "Written requirements and tickets; part of CEP #4 (views of SCRAM and Twilio)", "MT; CEP #4"],
  ["Someone with ECRM knowledge can adjust queries safely, with a known route into SCRAM", "Time for Simon to learn DataGrip; Engineering to run the route first, then train", "MT"],
  ["An agreed plan from MVP to a manageable solution", "Round table with Engineering, arranged by Caroline", "MT"],
  ["A decision on SCRAM's future", "Danny: SCRAM can't stay as it is for another 3–5 months. Either commit to a new platform or invest in SCRAM now", "CEP #10"],
  ["Current rules written down as the 'engagement-based frequency' for the policy question", "Simon's version, checked against what Engineering actually run", "MT"],
  ["SCRAM SMS build moves to Amy, with Paige's support", "Agreed. Needs Engineering work and training first", "CD"]
];

const STAGES = [
 { name:"Plan the month", owner:"Amy and Paige",
   what:["Build the monthly send plan on the CRM Jira Board: product, brand, offer, send date, running-order page.","Plan tests (e.g. US send times, SFSG split into 17:00 and 19:00 sends).","Prepare revenue forecasts for the revenue forecast board."],
   who:[["Amy and Paige","Monthly board (Amy's time first)"],["Amy and Simon","Forecasts"],["Caroline","eCRM strategy (acting Head of eCRM)"]],
   involved:[["Commercial","Offers, operator terms, budget approvals"],["Marketing","Proposition alignment: To confirm"]],
   tech:["Jira (CRM Jira Board)"],
   handoff:"Completed board → briefing and tracking links",
   gaps:["How offers are agreed and entered on the board: To confirm","No documented route from results back into the plan"],
   src:"PN; MT; GD; CD" },
 { name:"Prepare audiences and data", owner:"Simon · Engineering (SMS rules) · Data",
   what:["SMS: SCRAM builds each send list from Engineering's queries on the Contact DB.","Email: Data uploads new leads to SendGrid every Thursday; SendGrid lists and segments are used per send, with exclusions and unsubscribe groups.","Database queries, list management and list hygiene for SMS and email.","Customer removals each Monday (urgent cases immediately): SendGrid and VooDoo on the ECRM side, Contact DB by Dev. Opt-outs reviewed daily via Customer Experience."],
   who:[["Simon","Audience strategy, list builds, segmentation, hygiene, queries (with Executive Director / CEO at strategic level)"],["Engineering (Dev)","SCRAM audience rules and queries"],["Data","Weekly lead upload"],["Dev (Adam Brooks)","Contact DB removals"],["To confirm","ECRM-side customer removals"]],
   involved:[["CRM, Compliance, Contact DB owners","Suppression process (to be defined, owned jointly)"]],
   tech:["Contact DB","SCRAM","SendGrid","VooDoo","DataGrip","Removal requests sheet"],
   handoff:"Send-ready lists → build and schedule",
   gaps:["Suppression process to be defined and owned jointly by CRM, Compliance and Contact DB owners (agreed)","SMS removal step only covers VooDoo; whether SCRAM sends are covered: To confirm","ECRM can't see or change SCRAM rules (see SCRAM section)"],
   src:"MT; PN; SL; GD; WB; CD" },
 { name:"Brief, create and sign off", owner:"Amy (Paige supports)",
   what:["Export the board to Confluence and raise Jira briefs on the Experience board (one per mailer; one SMS brief per sprint week).","Create tracking links: PUP for SFSG and US states, Phoenix for SFB.","Experience Team drafts SMS copy and mailer designs; mailer designs uploaded to SendGrid.","Daily sign-off: offer, T&Cs, age rating, links. Compliance reviews SMS content."],
   who:[["Amy","Briefing; sign-off"],["Amy and Paige","Tracking links (Amy mostly)"],["Experience Team","SMS copy and mailer designs"]],
   involved:[["CEO, Executive Director, Compliance and DPO","Approve high-risk, cold, legacy and re-engagement sends, and spend"],["Compliance","SMS content review"],["Commercial","Told about T&C mismatches"],["Fisher","T&C queries (role: To confirm)"]],
   tech:["Jira","Confluence","Excel","PUP","Phoenix","SendGrid Design Library"],
   handoff:"Signed-off brief (status: CRM Scheduling) → build and schedule",
   gaps:["Copy testing against spam measures: new process to be written and owned by the Experience Team","Who writes mailer copy and subject lines: To confirm"],
   src:"GD; CA; PN; WB; CD" },
 { name:"Build, schedule and send", owner:"Email: Amy and Paige · SMS: Danny and Simon",
   what:["Email (daily): request the running order from Commercial, build single sends in SendGrid, schedule (UK SFSG 17:00/19:00, SFB 19:00; US on test times), send SL resends for Bets, update Jira and the board.","SMS: Danny and Simon set up SCRAM sends and scheduling about every other day; sends go through Twilio. SFB bulk SMS is paused."],
   who:[["Amy and Paige","Email build and scheduling (Amy first)"],["Danny and Simon","SCRAM SMS set-up and scheduling"]],
   involved:[["Commercial","Running order each morning"],["Engineering (Dev)","SCRAM audience behind each SMS send"]],
   tech:["SendGrid","Teams","Jira","SCRAM","Twilio","Shlink"],
   handoff:"Sends out → delivery and monitoring",
   gaps:["No written SCRAM send procedure; the scheduling guide only has VooDoo SMS steps","SCRAM SMS build to move to Amy with Paige's support (agreed); needs Engineering work and training first","Paige's ECRM time reducing as Marketing needs more of her: capacity on Amy To confirm"],
   src:"GD; CA; SL; MT; WB; CD" },
 { name:"Welcome journeys and lead capture", owner:"Email: Amy and Paige · SMS: To confirm",
   what:["Email welcome autos: built and sent manually every Friday from Thursday's leads. The guide says these should be automated.","SMS welcome series: Zapier lead-capture flows feed welcome sends through VooDoo.","Danny checks Zapier error logs daily."],
   who:[["Amy and Paige","Email welcome autos"],["Danny","Daily Zapier log checks (current cover)"],["To confirm","SMS welcome series owner and Zapier fixes"]],
   involved:[["Data","Thursday lead upload"]],
   tech:["SendGrid","Zapier","VooDoo","Twilio (target for SMS welcomes)"],
   handoff:"Welcomed leads → bulk lists",
   gaps:["SFSG and SFB SMS welcome series still send through VooDoo. Moving them to Twilio is needed to help maintain quarterly Twilio send commitments; this needs technical input and overlaps with the Zapier rebuild, as the Zaps will need Twilio links","Nobody has the expertise to fix Zapier workflows","About 22,000 SFB Facebook leads (mid-Aug to 10 Nov) went to bulk, not the welcome series, and have had no SMS while SFB bulk is paused","Updated Orbit process skips VooDoo, so welcome SMS cost may be missing: To confirm"],
   src:"GD; BAU #5; WB; MT; ORB; CA" },
 { name:"Deliver and monitor", owner:"Simon · Danny · Engineering",
   what:["Email deliverability: Simon analyses SendGrid delivery daily and checks Gmail Postmaster.","SMS delivery data from Twilio gathered by hand by Simon and Danny.","Danny handles platform admin and investigates escalated gateway, carrier and authentication faults; he has a Twilio ticket open on SMS filtering.","Engineering fix SCRAM and Shlink issues via tickets."],
   who:[["Simon","Email deliverability; manual SMS data"],["Danny","Platforms; escalated technical faults"],["Engineering (Dev)","SCRAM and Shlink fixes"]],
   involved:[["Twilio and SendGrid support","Vendor escalation"]],
   tech:["SendGrid","Postmaster Tools","Twilio","SCRAM","Shlink","Cloudflare"],
   handoff:"Issues → Danny (technical) or Engineering (SCRAM); results data → measure",
   gaps:["Live send monitoring: workbook says it stopped after migration; Simon's task list shows SCRAM and Twilio monitoring about every other day. To confirm","Incident triggers, response plan and who can pause a send: not yet defined","Seed handset testing not established","Requests to Engineering: agreed through PMO / WOB / BOB"],
   src:"SL; MT; WB; BAU #8; SMS; CD" },
 { name:"Measure, report and review", owner:"Amy and Simon → Caroline",
   what:["Amy and Simon report performance and forecasts to Caroline in weekly meetings and the end-of-month presentation.","Simon reviews Power BI daily.","Orbit supplier costs every Monday before 12pm and monthly; SMS invoices checked monthly with Finance.","End-of-month presentation (monthly review with Caroline, Rob and the FD)."],
   who:[["Amy and Simon","Performance reporting and forecasts to Caroline"],["Amy and Paige","Orbit (Amy first)"],["Amy","SMS invoice checks"]],
   involved:[["Finance","Invoices and Orbit"],["Data","Power BI"],["Engineering (Dev)","Ongoing attribution analysis (Danny's view)"]],
   tech:["Power BI","Orbit","Invoice sheet","SendGrid stats","SCRAM send runs"],
   handoff:"Results and tests → next month's plan (route: To confirm)",
   gaps:["Attribution window: 8–12 days (workbook) vs 8–10 days (BAU email); owner to agree","Twilio quarterly send commitments: tracking requested in the new dashboard"],
   src:"CD; PN; SL; ORB; GD; CA; WB; BAU #3; MT" }
];

/* chg: stay | ecrm (bring into ECRM) | danny (move off Danny) | agree (owner to agree)
   st: agreed | direction (Caroline's direction) | oct (Oct BAU plan) | dproposal (Danny's proposal) | agree */
const OWNX = [
 ["ECRM planning and requirements","eCRM strategy","Caroline (acting Head of eCRM)","Head of eCRM","stay","","agreed","PN"],
 ["ECRM planning and requirements","Plan and improve email and SMS","Amy and Paige","Amy and Paige (Paige as support)","stay","","agreed","PN; CA"],
 ["ECRM planning and requirements","Performance reporting and forecasts","Amy and Paige (Nov decision); Simon drafts KPIs","Amy and Simon, reporting to Caroline weekly and at the end-of-month presentation","stay","","agreed","CD"],
 ["ECRM planning and requirements","Audience strategy, list builds, segmentation","Simon; SCRAM rules with Engineering","Simon, with the Executive Director and CEO at strategic level","stay","Danny says this sits outside IT.","agreed","CD"],
 ["ECRM planning and requirements","Tests, lead-quality tests and new audience strategies","Amy and Paige plan them; any SMS audience change goes through Engineering","ECRM, able to change SMS audiences without waiting on Engineering","ecrm","Tests and new strategies depend on changing who gets a send quickly. Lead-quality testing is harder on SCRAM than it was on VooDoo.","direction","MT"],
 ["SCRAM audience rules and queries","SCRAM audience rules (who gets each send)","Engineering (Dev), replicating Simon's VooDoo rules","ECRM (Simon, who owns list and data work); Engineering supports the platform","ecrm","ECRM set and tuned these rules on VooDoo. Today ECRM can't see what each rule removes or change it.","direction","MT"],
 ["SCRAM audience rules and queries","Writing and testing Contact DB queries","Engineering; Simon learning DataGrip","ECRM (Simon), with a safe way to test","ecrm","Rule changes, such as those in the SFB SMS proposal, need new queries.","direction","MT"],
 ["SCRAM audience rules and queries","Getting a new or changed query into SCRAM","Engineering (route not known to ECRM)","ECRM, once Engineering have trained them","ecrm","Simon: Engineering to run it at first, then train ECRM.","direction","MT"],
 ["SCRAM audience rules and queries","SCRAM code, platform, bug fixes, Shlink","Engineering","Engineering","stay","","agreed","WB"],
 ["Build, QA, schedule and deploy","Briefing, sign-off, tracking links, email build and scheduling, welcome autos, Orbit, invoices","Amy and Paige (Amy first)","Amy and Paige (Amy first)","stay","","agreed","CA"],
 ["Build, QA, schedule and deploy","SCRAM SMS send set-up and scheduling","Danny and Simon","Amy, with Paige's support","danny","Needs Engineering work and training first; no written SCRAM procedure today.","agreed","CD"],
 ["Build, QA, schedule and deploy","SMS welcome series (journey owner)","No named owner; runs through Zapier and VooDoo","ECRM owns the journey; Danny and Engineering provide the technical build (move to Twilio)","ecrm","Welcome series is a key revenue stream and needs to move to Twilio.","agree","CA; WB; CEP #3"],
 ["Build, QA, schedule and deploy","Copy and creative","Experience Team","Experience Team","stay","","agreed","PN"],
 ["Monitoring and deliverability","Live send monitoring","Unclear: stopped after migration (workbook); Simon about every other day (task list)","ECRM routine checks, escalating technical issues to Danny","ecrm","Under the Twilio model nobody else raises the alarm.","oct","WB; SL; PN"],
 ["Monitoring and deliverability","Deliverability monitoring, seed handsets, incident triggers (BAU #1, #4, #7, #8)","Danny and Simon (current cover)","ECRM routine monitoring and first response; Danny for technical escalation","danny","Danny's BAU email: hand to the best-placed team once documented. Oct plan: routine monitoring to the ECRM team.","oct","BAU; PN"],
 ["Monitoring and deliverability","Delivery data back into list rules (Twilio → SCRAM)","Simon and Danny, by hand","ECRM, with Twilio and SCRAM reporting","danny","The tuning loop ECRM ran on VooDoo; inaccurate when done by hand.","direction","MT"],
 ["Monitoring and deliverability","Copy review for deliverability (inbox placement)","No owner for review; notes record Danny updating SMS content guidance","Experience Team: new process to test copy against spam measures","danny","Danny says commercial deliverability is not IT. Process still to be written.","agreed","CD"],
 ["Monitoring and deliverability","Daily Zapier log checks","Danny (current cover)","Automated alerting; ECRM watches welcome performance","danny","Danny marks it as not meant to be his, pending Zapier alerting.","dproposal","WB"],
 ["Monitoring and deliverability","Fixing Zapier workflows","Nobody has the expertise","To agree: Engineering, Danny or a specialist","agree","Needed for the Zapier rebuild and welcome move to Twilio.","agree","WB"],
 ["Monitoring and deliverability","Raising requests with Engineering","Via Danny","Agreed through PMO / WOB / BOB","danny","Danny: migration is complete. Verbal requests haven't been picked up.","agreed","CD; WB"],
 ["Contact data","Contact DB operation, changes and removals","Engineering, with Data","Engineering, with Data","stay","","agreed","WB"],
 ["Contact data","List management, hygiene and opt-out review","Simon","Simon","stay","Confirmed with Danny's list and data work moving away from IT.","agreed","CD; SL"],
 ["Contact data","Weekly lead upload; Power BI","Data","Data","stay","","agreed","GD; WB"],
 ["Contact data","Suppression and opt-out processing","Contested","CRM, Compliance and Contact DB owners: process to be defined and owned cross-functionally","agree","PECR risk. Process still to be defined.","agreed","CD"],
 ["Contact data","Attribution analysis","Engineering and Data (Danny's view); Simon (project notes)","To agree","agree","Every test and plan is judged on it.","agree","WB; PN; BAU #3"],
 ["Platforms, approvals and compliance","Platform admin, infrastructure, authentication, uptime, escalated faults, access, security","Danny (IT Operations and InfoSec)","Danny (IT Operations and InfoSec)","stay","","agreed","WB"],
 ["Platforms, approvals and compliance","Offers, operator terms, budget approvals","Commercial and Marketing owners","Commercial and Marketing owners","stay","","agreed","PN"],
 ["Platforms, approvals and compliance","Send approvals: spend, high-risk, cold, legacy, re-engagement","No owner","CEO, Executive Director, Compliance and DPO","agree","Danny says he has no role here.","agreed","CD"],
 ["Platforms, approvals and compliance","SMS content compliance review","Compliance","Compliance","stay","","agreed","PN"]
];
const CHG = { stay:["Stays where it is","success","check"], ecrm:["Bring into ECRM","info","arrow-down-to-line"], danny:["Move off Danny","warning","arrow-right-from-line"], agree:["Owner to agree","danger","gavel"] };
const OST = { agreed:["Agreed","success"], direction:["Caroline's direction","info"], oct:["Oct BAU plan","info"], dproposal:["Danny's proposal, not agreed","neutral"], agree:["To agree","warning"] };

const DANNY_IT = [
  ["Platform administration","Twilio, SendGrid, Cloudflare, Zapier: configuration, API keys, admin access, vendor escalation. Technical functionality only, not commercial deliverability."],
  ["Infrastructure and authentication","SPF, DKIM, DMARC, IP pools, relays, DNS."],
  ["Technical uptime monitoring","SCRAM infrastructure view; thresholds to agree with Engineering."],
  ["Escalated platform and gateway faults","Gateway errors, carrier rejections, authentication failures. List, data, content and SCRAM code issues go to their owners."],
  ["Access governance","Access reviews and account auditing, with Cat's governance direction."],
  ["Security baselines","System admin and security baselines."]
];
const DANNY_ELSE = [
  ["Campaign operations","Email and SendGrid operations","Amy and Paige (Amy first)","Agreed"],
  ["Send approvals","Spend, high-risk, cold, legacy, re-engagement","CEO, Executive Director, Compliance and DPO","Agreed"],
  ["Commercial deliverability and content","Copy review for inbox placement","Experience Team: new process to test copy against spam measures","Process to be written"],
  ["Audience strategy and list/data work","Strategy, list builds, segmentation, hygiene","Simon, with the Executive Director and CEO at strategic level","Agreed"],
  ["Suppression operations","Day-to-day suppression and opt-outs","CRM, Compliance and Contact DB owners: cross-functional process","Process to be defined"],
  ["Campaign performance","Performance reporting and forecasts","Amy and Simon, reporting to Caroline weekly and at the end-of-month presentation","Agreed"],
  ["SCRAM SMS build","Currently Danny and Simon","Amy, with Paige's support","Engineering work and training needed — handover needed, not yet moved"],
  ["Requests to Development","Previously routed via Danny","Agreed through PMO / WOB / BOB","Agreed"]
];
const DANNY_COVER = [
  ["Daily Zapier log checks","Current cover since replatforming, pending Zapier alerting (PMO). Handover needed once alerting lands; fixes need Zapier expertise nobody has.","Current cover"],
  ["Seed handset testing","Not an established process; Danny has used personal handsets ad hoc. Whether to set it up and who runs it: owner to agree.","Owner to agree"],
  ["Live send monitoring","Done by Simon, Dev and Danny during migration; stopped once the platform was stable. Who watches sends now: To confirm.","To confirm"],
  ["Attribution","IT assessment complete (8–12 day baseline). Ongoing analysis: Engineering; reporting: Data (Danny's view). Owner to agree.","Owner to agree"],
  ["Eight BAU controls (Oct email)","Danny and Simon cover them until documented, likely a few months. Danny suggests about three staff long term, possibly a developer.","Handover needed"],
  ["Routing ECRM requests to Engineering","Done during migration. Now agreed through PMO / WOB / BOB.","Agreed"]
];
const PMO = [
  ["Zapier alerting and centralised monitoring","Danny"],
  ["Twilio error logging (possibly via SIEM)","Danny / Cat"],
  ["Cross-system health dashboard (SCRAM, Contact DB, Twilio)","Danny / Dev"],
  ["Opt-out and suppression technical framework","Cat (Danny as resource)"],
  ["Twilio SSO via Microsoft accounts","Danny"],
  ["Network access control (e.g. Tailscale)","Danny"]
];

const TO_CONFIRM = [
  "How offers are agreed and entered on the board, and proposition alignment with Marketing",
  "Who processes customer removals on the ECRM side, and whether SCRAM sends are covered",
  "Who watches live sends now (workbook vs Simon's task list)",
  "What still sends through VooDoo, and whether welcome SMS costs are in Orbit",
  "Phoenix go-live date (deadline for HTTPS link tracking)",
  "Who writes mailer copy and subject lines; Fisher's role on T&C queries",
  "Whether the VooDoo welcome-failure rule is applied in SCRAM",
  "The basis of the 'around 50k a month' welcome figure",
  "Twilio quarterly send commitment, and current volume against it",
  "Paige's ECRM share as Marketing needs more of her time"
];

const MEET_PERF = {
  title:"ECRM performance and commercial results", cadence:"Weekly: Amy and Simon report performance and forecasts to Caroline, plus the end-of-month presentation (agreed). Sends take 8–12 days to settle, so weekly results should focus on settled sends.",
  agenda:["Product snapshot: SFSG, SFB, Bets by channel, for settled sends","Best and worst sends; loss-makers and why","Forecast vs actual; Twilio quarterly send commitments","Tests: results and what changes","Next period's plan and actions"],
  measures:[
   ["Sends and volume by product and channel","Base for every other figure","Available"],
   ["Commission or revenue by product and channel","What the business earns","Available (Power BI; confirm at send level)"],
   ["Clicks and click rate","Earliest sign a send worked","To confirm for SMS (no Shlink/SCRAM reporting)"],
   ["Registrations and FTDs","FTDs are what operators pay on","To confirm"],
   ["Gross profit and profit per send","Shows loss-makers; send cost rates are in the Orbit process","To confirm"],
   ["Cost per FTD (lower is better)","Efficiency of spend","To confirm"],
   ["Forecast vs actual","Are we on track for the revenue forecast board","To confirm"],
   ["Twilio sends vs quarterly commitment","Avoid missing committed volume","To confirm (requested in new dashboard)"]]
};
const MEET_OPS = {
  title:"Operations, delivery and planned work", cadence:"Weekly.",
  agenda:["Send issues and incidents since last meeting","Operational and compliance checks (below)","Suppression and customer removals","Work plan: progress, blockers, PMO items","Hand-offs and decisions needed"],
  measures:[
   ["Delivery rate by platform","Twilio 'delivered' only means the network accepted it","Available"],
   ["SMS non-delivered and failure reasons","Basis for list rules","To confirm (manual today)"],
   ["Email bounce rate","List quality","Available (SendGrid)"],
   ["Gmail spam rate (Danny's trigger: above 0.3%)","Inbox filtering risk","Available (Postmaster)"],
   ["Twilio filtering errors (e.g. 30007)","Carrier filtering","To confirm"],
   ["Seed handset spam flags","Early warning on spam flagging","To confirm (not established)"],
   ["Opt-outs and unsubscribes per send","Compliance and list fatigue","To confirm"],
   ["Removals processed and any mismatches with Dev","Opt-outs honoured","To confirm"],
   ["Workflow failures: Zapier, SCRAM, Shlink","Fragility of the send chain","To confirm (Zapier checked manually)"]]
};
