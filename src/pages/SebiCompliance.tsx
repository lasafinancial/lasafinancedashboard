import {
  Scale,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  Lock,
  AlertTriangle,
  Eye,
  RefreshCcw,
  Megaphone,
  ShieldAlert,
  ClipboardList,
  MessageSquareWarning,
  BookOpen,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const REG_NO = "INH000030144";
const ANALYST_NAME = "Dheeraj Sogani";
const FIRM_NAME = "Lasa Research";
const OFFICE_ADDRESS = "L1604, Ajnara Grand Heritage, Sector 74, Noida, Uttar Pradesh";
const GRIEVANCE_EMAIL = "dheeraj_sogani@yahoo.com";
const COMPLIANCE_PHONE = "+91 95551 51691";
const JURISDICTION = "Noida, Uttar Pradesh";

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5">{children}</div>
);
const List = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

interface PolicySection {
  id: string;
  icon: React.ElementType;
  title: string;
  body: React.ReactNode;
}

const POLICIES: PolicySection[] = [
  {
    id: "terms",
    icon: FileText,
    title: "Terms & Conditions",
    body: (
      <Section>
        <p>
          These Terms govern your access to and use of the {FIRM_NAME} website, dashboard, and any
          research reports, screeners, or trade ideas we provide (the "Services"). By creating an
          account or subscribing to a paid plan, you agree to be bound by these Terms.
        </p>
        <p>
          {FIRM_NAME} is a research-only service provider — we do not execute trades, manage funds,
          or guarantee any return. All scans and trade ideas are generated end-to-end by proprietary
          algorithmic and AI-based methodologies, reviewed and approved by {ANALYST_NAME}, who remains
          the Research Analyst responsible for the research.
        </p>
        <p className="font-semibold text-foreground/90">
          Read the full Terms & Conditions on the{" "}
          <a href="/terms" className="text-primary underline underline-offset-2">
            dedicated Terms page
          </a>
          .
        </p>
      </Section>
    ),
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy Policy",
    body: (
      <Section>
        <p>
          {FIRM_NAME} collects personal information (name, email, phone), payment data processed
          through PCI-DSS-compliant gateways, and technical data (IP address, browser, usage
          activity) to deliver and improve the Services, process payments, communicate updates, meet
          SEBI/KYC obligations, and detect fraud.
        </p>
        <p><strong className="text-foreground/90">We do not sell your personal data.</strong> Information is shared only with:</p>
        <List
          items={[
            "Service vendors (hosting, payment processing, support) bound by confidentiality obligations",
            "Regulators, courts, or authorities when legally required (e.g. SEBI)",
            "A successor entity in the event of a merger or business transfer, with prior notice to you",
          ]}
        />
        <p>
          Data is retained only as long as necessary to provide the Services or comply with legal
          requirements, then deleted. We use SSL/HTTPS encryption and restrict server access, though
          no method of electronic transmission is completely secure.
        </p>
        <p>
          You may request access to, correction of, deletion of, or portability of your personal
          data by writing to{" "}
          <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-primary underline underline-offset-2">
            {GRIEVANCE_EMAIL}
          </a>
          . The Services are intended for individuals 18 years and older; we do not knowingly collect
          data from minors.
        </p>
      </Section>
    ),
  },
  {
    id: "disclaimer",
    icon: AlertTriangle,
    title: "Disclaimer",
    body: (
      <Section>
        <p className="font-semibold text-foreground/90">
          Registration granted by SEBI, and certification from NISM, in no way guarantee the
          performance of the Research Analyst or provide any assurance of returns to investors.
        </p>
        <p>
          {FIRM_NAME} provides technical and algorithmically-derived research — reports, screeners,
          scans, and charts — intended to highlight market patterns and historical price behaviour.
          Information is believed to be reliable and drawn from publicly available sources, but we do
          not warrant its accuracy or completeness.
        </p>
        <List
          items={[
            "Investment in securities markets is subject to market risk; past performance is not indicative of future results.",
            "Recommendations are general in nature and are not personalized investment advice — evaluate your own circumstances and consult a SEBI-registered advisor before acting.",
            `${ANALYST_NAME} and ${FIRM_NAME} bear no liability for losses arising from errors, omissions, or reliance on any information, view, or opinion provided.`,
            "Research content is for subscribers only and may not be reproduced, redistributed, or shared without prior written consent.",
          ]}
        />
      </Section>
    ),
  },
  {
    id: "disclosure",
    icon: Eye,
    title: "Disclosure",
    body: (
      <Section>
        <p>
          Pursuant to SEBI (Research Analysts) Regulations, 2014, {FIRM_NAME} makes the following
          disclosures:
        </p>
        <List
          items={[
            <>
              <strong className="text-foreground/90">Registration:</strong> SEBI Research Analyst
              Registration No. {REG_NO}, held by {ANALYST_NAME} (proprietor). NISM certification:{" "}
              <em>[NISM Series-XV certification number — to be added]</em>.
            </>,
            <>
              <strong className="text-foreground/90">Financial interest &amp; conflict of interest:</strong>{" "}
              Unless specifically disclosed within an individual research report, {ANALYST_NAME} does
              not hold a financial interest, or beneficial ownership exceeding 1%, in the securities
              covered by that report as of its publication date.
            </>,
            <>
              <strong className="text-foreground/90">Compensation:</strong> {FIRM_NAME}'s only source
              of revenue from research activity is subscription fees paid by clients. No compensation
              is received from the companies covered in research reports, and {FIRM_NAME} has not
              managed or co-managed any public offering for any subject company.
            </>,
            <>
              <strong className="text-foreground/90">Use of technology:</strong> Screeners, scans, and
              trade-idea shortlists on the platform are generated using proprietary algorithmic and
              AI-assisted methodologies; every output is reviewed and approved by {ANALYST_NAME}, who
              remains responsible for the research produced.
            </>,
            <>
              <strong className="text-foreground/90">Disciplinary history:</strong>{" "}
              <em>[Disclosure of any pending litigation, enforcement action, or disciplinary history, if any — to be confirmed and completed by the Analyst/Compliance Officer]</em>.
            </>,
          ]}
        />
      </Section>
    ),
  },
  {
    id: "refund",
    icon: RefreshCcw,
    title: "Refund Policy",
    body: (
      <Section>
        <p>
          This policy covers paid subscriptions and research access on the {FIRM_NAME} platform. It
          does not cover investment outcomes or market-related losses, which are independent of any
          refund obligation.
        </p>
        <p className="font-semibold text-foreground/90">Eligible for a refund:</p>
        <List
          items={[
            "Non-delivery of a paid service within the promised timeline, due to our fault",
            "Cancellation within 7 working days of subscribing, provided the paid tier's features were not accessed",
            "Early termination — pro-rata refund for unused full months remaining in the subscription",
            "Unresolved technical issues blocking access, persisting beyond 7 working days",
            "Duplicate billing, or fees charged in excess of SEBI-prescribed limits for individual/HUF clients",
          ]}
        />
        <p className="font-semibold text-foreground/90">Not eligible for a refund:</p>
        <List
          items={[
            "Dissatisfaction with market performance or trading losses",
            "Partial-month usage, or requests made after the cancellation window has passed",
            "Misuse of the Services, including sharing credentials or providing false KYC information",
          ]}
        />
        <p>
          To request a refund, email{" "}
          <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-primary underline underline-offset-2">
            {GRIEVANCE_EMAIL}
          </a>{" "}
          with your name, subscription details, payment reference, and reason. Approved refunds are
          processed to the original payment method within 10 working days of approval; cash refunds
          are not offered.
        </p>
      </Section>
    ),
  },
  {
    id: "media-policy",
    icon: Megaphone,
    title: "Media & Social Communication Policy",
    body: (
      <Section>
        <p>
          {FIRM_NAME} may share educational market commentary on public channels (website, YouTube,
          X/Twitter, Instagram, WhatsApp, etc.). This policy governs that content.
        </p>
        <List
          items={[
            "Public content is educational and informational only — it is never a buy/sell recommendation or personalized advice.",
            "Viewing or following public content does not create a client relationship; that requires a signed subscription and completed KYC.",
            "The Analyst may or may not hold positions in securities discussed publicly; no guarantee is given on the completeness or timeliness of public commentary.",
            "Every public post carries (or links to) this disclaimer; platform bios/descriptions carry a shortened version linking back to our Terms.",
          ]}
        />
        <p>
          Viewers should consult a personal financial adviser before acting on anything shared
          publicly, and should never treat free content as a substitute for a formal, KYC-verified
          subscription.
        </p>
      </Section>
    ),
  },
  {
    id: "aml",
    icon: ShieldAlert,
    title: "Anti-Money Laundering (AML) Policy",
    body: (
      <Section>
        <p>
          {FIRM_NAME} operates in accordance with the Prevention of Money Laundering Act, 2002 (PMLA)
          and applicable SEBI guidance for Research Analysts.
        </p>
        <List
          items={[
            "Client identity is established via PAN and KYC details collected at onboarding; no account is opened in a fictitious, benami, or anonymous name.",
            "Fees are collected only via bank transfer, UPI, or card — cash payments are never accepted, in line with PMLA fee-collection norms.",
            "Transactions are monitored for patterns suggestive of proceeds of crime, unusual complexity without economic rationale, or possible links to terrorism financing.",
            "Client identification and transaction records are retained for a minimum of 10 years, or until any related regulatory matter is resolved.",
            `Suspicious activity is reported by the designated Principal Officer (${ANALYST_NAME}) to the Financial Intelligence Unit – India (FIU-IND) with strict confidentiality.`,
          ]}
        />
        <p>This policy is reviewed periodically to remain aligned with current regulation.</p>
      </Section>
    ),
  },
  {
    id: "internal-policy",
    icon: ClipboardList,
    title: "Internal Policy & Code of Conduct",
    body: (
      <Section>
        <p>
          This internal policy implements the SEBI (Research Analysts) Regulations, 2014 for{" "}
          {FIRM_NAME} and any personnel involved in research production.
        </p>
        <List
          items={[
            "Research compensation is independent of any investment banking or distribution activity — Lasa Research does not undertake such activities.",
            "The Analyst and any associated personnel may not trade in a security they have recommended during the period from 30 days before to 5 days after publication of the relevant report, except with prior written compliance approval for a bona fide reason.",
            "Every research report/scan output must have a documented, reproducible analytical basis before publication.",
            "Material disclosures — financial interest above 1%, compensation from a subject company, or any conflict of interest — are made within the relevant report at the time of publication.",
            "Research records, including the data and methodology behind each report, are retained for a minimum of 5 years.",
          ]}
        />
      </Section>
    ),
  },
  {
    id: "grievance-redressal-policy",
    icon: MessageSquareWarning,
    title: "Grievance Redressal Policy",
    body: (
      <Section>
        <p>This policy exists to ensure client concerns are heard, investigated, and resolved fairly and promptly.</p>
        <p className="font-semibold text-foreground/90">Step 1 — Write to us directly</p>
        <p>
          Email{" "}
          <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-primary underline underline-offset-2">
            {GRIEVANCE_EMAIL}
          </a>{" "}
          or call the Compliance Officer, {ANALYST_NAME}, at{" "}
          <a href={`tel:${COMPLIANCE_PHONE.replace(/\s/g, "")}`} className="text-primary underline underline-offset-2">
            {COMPLIANCE_PHONE}
          </a>
          . We aim to resolve grievances within <strong className="text-foreground/90">21 days</strong> of receipt.
        </p>
        <p className="font-semibold text-foreground/90">Step 2 — Escalate to SEBI</p>
        <p>
          If unresolved, escalate via SEBI's SCORES portal (
          <a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            scores.sebi.gov.in
          </a>
          , also available as a mobile app) or the toll-free SEBI helpline 1800 22 7575 / 1800 266 7575.
        </p>
        <p className="font-semibold text-foreground/90">Step 3 — Online Dispute Resolution (ODR)</p>
        <p>
          For conciliation or online arbitration, use the SEBI-recognised ODR portal at{" "}
          <a href="https://smartodr.in" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            smartodr.in
          </a>
          .
        </p>
      </Section>
    ),
  },
  {
    id: "investor-charter",
    icon: BookOpen,
    title: "Investor Charter",
    body: (
      <Section>
        <p><strong className="text-foreground/90">Vision:</strong> Invest with knowledge &amp; safety.</p>
        <p>
          <strong className="text-foreground/90">Mission:</strong> Help investors take informed
          decisions through independent research, and access grievance redressal in a timely,
          transparent manner.
        </p>
        <p className="font-semibold text-foreground/90">Services provided by {FIRM_NAME}:</p>
        <List
          items={[
            "Publication of research reports and algorithmic scans based on a documented, independent methodology",
            "Disclosure of any financial interest or conflict relevant to a specific recommendation",
            "Annual compliance review and adherence to SEBI's advertisement and conduct codes",
            "Maintenance of client interaction and grievance records",
          ]}
        />
        <p className="font-semibold text-foreground/90">Your rights as an investor:</p>
        <List
          items={[
            "Privacy and confidentiality of your information",
            "Fair, transparent, and equitable treatment",
            "Complete disclosure of material information, including risks of complex products",
            "Timely redressal of grievances",
          ]}
        />
        <p className="font-semibold text-foreground/90">Do's:</p>
        <List
          items={[
            `Verify our SEBI registration (${REG_NO}) on the SEBI website before subscribing`,
            "Read all disclosures before acting on any recommendation",
            "Pay fees only via traceable banking channels and retain the receipt",
            "Ask for clarification on any recommendation you don't fully understand",
          ]}
        />
        <p className="font-semibold text-foreground/90">Don'ts:</p>
        <List
          items={[
            "Never transfer trading funds directly to the Analyst",
            "Don't act on unverified tips, rumours, or unsolicited advertisements",
            "Never share your trading/demat account credentials with anyone",
          ]}
        />
        <p>
          Grievances are redressed as promptly as possible, and in any case within{" "}
          <strong className="text-foreground/90">21 days</strong> of receipt. Escalation is available
          via SEBI SCORES (
          <a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            scores.sebi.gov.in
          </a>
          ), SEBI's Office of Investor Assistance and Education, Mumbai.
        </p>
      </Section>
    ),
  },
];

export function SebiCompliance() {
  const effectiveDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30 font-sans pb-20">
      <div className="relative container mx-auto px-4 py-10 max-w-3xl">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            <Scale className="w-3.5 h-3.5" />
            SEBI Compliance
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            SEBI Compliance &amp; Regulatory Policies
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Effective {effectiveDate}</p>
        </div>

        {/* Registration summary card */}
        <div className="mb-10 p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5 text-sm">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground/90">{FIRM_NAME}</strong> — SEBI Registered Research
              Analyst, Regn. No. <strong>{REG_NO}</strong>. Proprietor: {ANALYST_NAME}.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">Registered Office: {OFFICE_ADDRESS}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-muted-foreground hover:text-primary transition-colors">
              {GRIEVANCE_EMAIL}
            </a>
          </div>
          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">Compliance Officer: {ANALYST_NAME} · {COMPLIANCE_PHONE}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          Tap any policy below to expand it. Each section reflects {FIRM_NAME}'s obligations as a
          SEBI-registered Research Analyst under the SEBI (Research Analysts) Regulations, 2014 and
          related circulars.
        </p>

        {/* Collapsible policy sections */}
        <Accordion type="multiple" className="rounded-2xl border border-white/10 bg-white/[0.02] px-5">
          {POLICIES.map(({ id, icon: Icon, title, body }) => (
            <AccordionItem key={id} value={id} className="border-white/10">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex items-center gap-3 text-sm font-bold text-white">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  {title}
                </span>
              </AccordionTrigger>
              <AccordionContent>{body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Footer disclaimer strip */}
        <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <span>
            Registration granted by SEBI and certification from NISM in no way guarantee the
            performance of the intermediary or provide any assurance of returns to investors.
            Disputes are subject to the exclusive jurisdiction of the courts at {JURISDICTION}.
          </span>
        </div>
      </div>
    </div>
  );
}

export default SebiCompliance;
