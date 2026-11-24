import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Scale,
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
  UserCheck,
  ListOrdered,
  ExternalLink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const REG_NO = "INH000030144";
const BSE_ENLISTMENT_NO = "7513";
const ANALYST_NAME = "Dheeraj Sogani";
const RA_NAME = "Dheeraj Sogani Proprietor Lasa Research Services";
const FIRM_NAME = "Lasa Research";
const OFFICE_ADDRESS = "L1604, Ajnara Grand Heritage Sector 74, Noida, Uttar Pradesh, 201301";
const GRIEVANCE_EMAIL = "dheeraj_sogani@yahoo.com";
const COMPLIANCE_PHONE = "+91 9555151691";
const JURISDICTION = "Noida, Uttar Pradesh";
const SCORES_URL = "https://scores.sebi.gov.in/scores-home";
const SMART_ODR_URL = "https://smartodr.in/login";

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
const Sub = ({ children }: { children: React.ReactNode }) => (
  <p className="font-semibold text-foreground/90 pt-1">{children}</p>
);
const Ext = ({ href, children }: { href: string; children?: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-all">
    {children ?? href}
  </a>
);
const MailLink = () => (
  <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-primary underline underline-offset-2">
    {GRIEVANCE_EMAIL}
  </a>
);

/** RA details table that heads each policy document */
const RaDetails = () => (
  <div className="overflow-x-auto rounded-lg border border-white/10">
    <table className="w-full text-xs">
      <tbody className="divide-y divide-white/5">
        {[
          ["Name of Research Analyst", RA_NAME],
          ["Category", "Individual Research Analyst"],
          ["SEBI Registration Number", REG_NO],
          ["BSE Enlistment Number (RAASB)", BSE_ENLISTMENT_NO],
          ["Registered Office", OFFICE_ADDRESS],
          ["Contact Number", COMPLIANCE_PHONE],
          ["Email", GRIEVANCE_EMAIL],
        ].map(([k, v]) => (
          <tr key={k}>
            <td className="px-3 py-2 font-semibold text-foreground/80 align-top w-2/5">{k}</td>
            <td className="px-3 py-2 align-top break-words">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface PolicySection {
  id: string;
  icon: React.ElementType;
  title: string;
  body: React.ReactNode;
}

const POLICIES: PolicySection[] = [
  {
    id: "code-of-conduct",
    icon: UserCheck,
    title: "Code of Conduct",
    body: (
      <Section>
        <p className="font-semibold text-foreground/90">Code of Conduct for Research Analyst</p>
        {[
          ["Honesty and Good Faith", "Research analyst or research entity shall act honestly and in good faith."],
          ["Diligence", "Research analyst or research entity shall act with due skill, care and diligence and shall ensure that the research report is prepared after thorough analysis."],
          ["Conflict of Interest", "Research analyst or research entity shall effectively address conflict of interest which may affect the impartiality of its research analysis and research report and shall make appropriate disclosures to address the same."],
          ["Insider Trading or front running", "Research analyst or research entity or its employees shall not engage in insider trading or front running or front running of its own research report."],
          ["Confidentiality", "Research analyst or research entity or its employees shall maintain confidentiality of report till the report is made public."],
          ["Professional Standard", "Research analyst or research entity or its employees engaged in research analysis shall observe high professional standard while preparing research report."],
          ["Compliance", "Research analyst or research entity shall comply with all regulatory requirements applicable to the conduct of its business activities."],
          ["Responsibility of senior management", "The senior management of research analyst or research entity shall bear primary responsibility for ensuring the maintenance of appropriate standards of conduct and adherence to proper procedures."],
        ].map(([title, text], i) => (
          <div key={title}>
            <Sub>{i + 1}. {title}</Sub>
            <p>{text}</p>
          </div>
        ))}
      </Section>
    ),
  },
  {
    id: "escalation-matrix",
    icon: ListOrdered,
    title: "Escalation Matrix",
    body: (
      <Section>
        <p>Grievance Redressal / Escalation Matrix:</p>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="bg-white/[0.03] text-foreground/80">
              <tr>
                {["Details of designation", "Contact Person Name", "Address where the physical address location", "Contact No.", "Email-ID", "Working hours when complainant can call"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold align-top">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/5">
                <td className="px-3 py-2 align-top">Principal Officer</td>
                <td className="px-3 py-2 align-top">{ANALYST_NAME}</td>
                <td className="px-3 py-2 align-top">{OFFICE_ADDRESS}</td>
                <td className="px-3 py-2 align-top whitespace-nowrap">9555151691</td>
                <td className="px-3 py-2 align-top"><MailLink /></td>
                <td className="px-3 py-2 align-top">Monday to Friday 10.30 AM to 5.30 PM</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          If the grievance is not resolved, investors may lodge a complaint on SEBI SCORES (<Ext href={SCORES_URL} />) or
          use Smart ODR (<Ext href={SMART_ODR_URL} />).
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
        <p className="font-semibold text-foreground/90">Investor Charter in respect of Research Analyst (RA)</p>

        <Sub>A. Vision and Mission Statements for investors</Sub>
        <p><strong className="text-foreground/90">Vision:</strong> Invest with knowledge &amp; safety.</p>
        <p>
          <strong className="text-foreground/90">Mission:</strong> Every investor should be able to invest in right
          investment products based on their needs, manage and monitor them to meet their goals, access reports and
          enjoy financial wellness.
        </p>

        <Sub>B. Details of business transacted by the Research Analyst with respect to the investors</Sub>
        <List
          items={[
            "To publish research report based on the research activities of the RA.",
            "To provide an independent unbiased view on securities.",
            "To offer unbiased recommendation, disclosing the financial interests in recommended securities.",
            "To provide research recommendation, based on analysis of publicly available information and known observations.",
            "To conduct audit annually.",
            "To ensure that all advertisements are in adherence to the provisions of the Advertisement Code for Research Analysts.",
            "To maintain records of interactions, with all clients including prospective clients (prior to onboarding), where any conversation related to the research services has taken place.",
          ]}
        />

        <Sub>C. Details of services provided to investors (No Indicative Timelines)</Sub>
        <p>Onboarding of Clients:</p>
        <List items={["Sharing of terms and conditions of research service.", "Completing KYC of fee-paying clients."]} />
        <p>Disclosure to Clients:</p>
        <List
          items={[
            "To disclose, information that is material for the client to make an informed decision, including details of its business activity, disciplinary history, the terms and conditions of research services, details of associates, risks and conflicts of interest, if any.",
            "To disclose the extent of use of Artificial Intelligence tools in providing research services.",
            "To disclose, while distributing a third-party research report, any material conflict of interest of such third-party research provider or provide web address that directs a recipient to the relevant disclosures.",
            "To disclose any conflict of interest of the activities of providing research services with other activities of the research analyst.",
          ]}
        />
        <List
          items={[
            "To distribute research reports and recommendations to the clients without discrimination.",
            "To maintain confidentiality w.r.t publication of the research report until made available in the public domain.",
            "To respect data privacy rights of clients and take measures to protect unauthorized use of their confidential information.",
            "To disclose the timelines for the services provided by the research analyst to clients and ensure adherence to the said timelines.",
            "To provide clear guidance and adequate caution notice to clients when providing recommendations for dealing in complex and high-risk financial products/services.",
            "To treat all clients with honesty and integrity.",
            "To ensure confidentiality of information shared by clients unless such information is required to be provided in furtherance of discharging legal obligations or a client has provided specific consent to share such information.",
          ]}
        />

        <Sub>D. Details of grievance redressal mechanism and how to access it</Sub>
        <p>Investor can lodge complaint/grievance against Research Analyst in the following ways:</p>
        <p className="italic">Mode of filing the complaint with research analyst</p>
        <p>
          In case of any grievance / complaint, an investor may approach the concerned Research Analyst who shall
          strive to redress the grievance immediately, but not later than 21 days of the receipt of the grievance.
        </p>
        <p className="italic">Mode of filing the complaint on SCORES or with Research Analyst Administration and Supervisory Body (RAASB)</p>
        <List
          items={[
            <>
              SCORES 2.0 (a web based centralized grievance redressal system of SEBI for facilitating effective
              grievance redressal in time-bound manner) (<Ext href="https://scores.sebi.gov.in" />). Two level review
              for complaint/grievance against Research Analyst: first review done by designated body (RAASB); second
              review done by SEBI.
            </>,
            "Email to designated email ID of RAASB.",
            <>
              If the Investor is not satisfied with the resolution provided by the Market Participants, then the
              Investor has the option to file the complaint/grievance on SMARTODR platform (<Ext href="https://smartodr.in" />) for its
              resolution through online conciliation or arbitration.
            </>,
          ]}
        />
        <p>With regard to physical complaints, investors may send their complaints to:</p>
        <p className="pl-3 border-l border-white/10">
          Office of Investor Assistance and Education,
          <br />
          Securities and Exchange Board of India,
          <br />
          SEBI Bhavan, Plot No. C4-A, 'G' Block,
          <br />
          Bandra-Kurla Complex, Bandra (E),
          <br />
          Mumbai - 400 051
        </p>

        <Sub>E. Rights of investors</Sub>
        <List
          items={[
            "Right to Privacy and Confidentiality.",
            "Right to Transparent Practices.",
            "Right to fair and Equitable Treatment.",
            "Right to Adequate Information.",
            "Right to Initial and Continuing Disclosure - Right to receive information about all the statutory and regulatory disclosures.",
            "Right to Fair & True Advertisement.",
            "Right to Awareness about Service Parameters and Turnaround Times.",
            "Right to be informed of the timelines for each service.",
            "Right to be Heard and Satisfactory Grievance Redressal.",
            "Right to have timely redressal.",
            "Right to Exit from Financial product or service in accordance with the terms and conditions agreed with the research analyst.",
            "Right to receive clear guidance and caution notice when dealing in Complex and High-Risk Financial Products and Services.",
            "Additional Rights to vulnerable consumers - Right to get access to services in a suitable manner even if differently abled.",
            "Right to provide feedback on the financial products and services used.",
            "Right against coercive, unfair, and one-sided clauses in financial agreements.",
          ]}
        />

        <Sub>F. Expectations from the investors (Responsibilities of investors)</Sub>
        <p className="font-semibold text-emerald-400/90">Do's</p>
        <List
          items={[
            "Always deal with SEBI registered Research Analyst.",
            "Ensure that the Research Analyst has a valid registration certificate.",
            "Check for SEBI registration number.",
            <>
              Please refer to the list of all SEBI registered Research Analyst which is available on SEBI website in
              the following link:{" "}
              <Ext href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14" />
            </>,
            "Always pay attention towards disclosures made in the research reports before investing.",
            "Pay your Research Analyst through banking channels only and maintain duly signed receipts mentioning the details of your payments. You may make payment of fees through Centralized Fee Collection Mechanism (CeFCoM) of RAASB if research analyst has opted for the mechanism. (Applicable for fee paying clients only)",
            "Before buying/ selling securities or applying in public offer, check for the research recommendation provided by your Research Analyst.",
            "Ask all relevant questions and clear your doubts with your Research Analyst before acting on recommendation.",
            "Seek clarifications and guidance on research recommendations from your Research Analyst, especially if it involves complex and high risk financial products and services.",
            "Always be aware that you have the right to stop availing the service of a Research Analyst as per the terms of service agreed between you and your Research Analyst.",
            "Always be aware that you have the right to provide feedback to your Research Analyst in respect of the services received.",
            "Always be aware that you will not be bound by any clause, prescribed by the research analyst, which is contravening any regulatory provisions.",
            "Inform SEBI about Research Analyst offering assured or guaranteed returns.",
          ]}
        />
        <p className="font-semibold text-rose-400/90">Don'ts</p>
        <List
          items={[
            "Do not provide funds for investment to the Research Analyst.",
            "Don't fall prey to luring advertisements or market rumors.",
            "Do not get attracted to limited period discount or other incentive, gifts, etc. offered by Research Analyst.",
            "Do not share login credentials and password of your trading and demat accounts with the Research Analyst.",
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
        <RaDetails />
        <p>
          We value our customers and are committed to providing best services. Our clients need to realize that we do
          not offer a 100% guarantee on our calls, and fees are not refunded on the basis of an individual client's
          investment performance.
        </p>
        <p>
          In case of premature termination of services, either by the client or by the RA, the client is entitled to a
          refund of proportionate fees for the unexpired period of the subscription.
        </p>
        <p>
          If for some unforeseen reason, the client is not satisfied with our services, they may call us to seek
          direction on future calls. We will give our best effort to increase the satisfaction levels in such cases.
        </p>
        <p>We strongly recommend that before making a payment, our visitors and potential clients, please:</p>
        <List
          items={[
            "Read all information about our services and support given to our clients.",
            "Read our Terms and Conditions.",
            "Read our Privacy Policy and Refund Policy.",
          ]}
        />
        <p>
          Kindly make the payment after reading all terms and conditions, disclaimers and refund policy. If you still
          have any query, mail us: <MailLink />.
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
        <RaDetails />
        <p className="font-semibold text-foreground/90 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
          "Registration granted by SEBI, enlistment with BSE Limited (RAASB) and certification from NISM in no way
          guarantee performance of the intermediary or provide any assurance of returns to investors."
        </p>
        <List
          items={[
            "Investment in securities market is subject to market risks. Read all the related documents carefully before investing.",
            "The RA provides research services only. The RA does not execute trades, handle client funds or securities, or provide portfolio management, investment advisory, broking or distribution services. Clients should not permit the RA to execute any trade on their behalf.",
            "Research reports and recommendations are based on publicly available information and data believed to be reliable, analysed under certain assumptions as on the date of publication. No guarantee is given as to their accuracy or completeness, and they do not constitute an offer to buy or sell any security.",
            "The RA cannot and does not guarantee any returns, profits, accuracy, or risk-free investment. Past performance is not indicative of future results.",
            "Recommendations are general in nature and not tailored to the specific investment objectives or financial situation of any particular client. Clients should consider their own risk profile and, where necessary, consult their financial adviser before acting on any recommendation.",
            "Any loss arising from investments made on the basis of the research report is entirely at the client's own risk, and there is no recourse to claim such losses from the RA. Reliance on any research report is at the client's own judgement.",
            "Any securities quoted on this website or in any communication are for illustration only and are not recommendatory.",
            "The RA does not offer any assured, guaranteed or fixed-return scheme. Any such scheme is prohibited by law. The RA will never ask for your login credentials or OTPs of your trading, demat or bank accounts – never share these with anyone.",
            "The RA endeavours to disclose, and promptly inform clients of, any actual or potential conflict of interest that may affect the research services in accordance with SEBI regulations.",
          ]}
        />
      </Section>
    ),
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy Policy",
    body: (
      <Section>
        <RaDetails />
        <p>
          This Privacy Policy explains how the RA collects, uses, and protects personal information of website visitors
          and clients, in compliance with the Information Technology Act, 2000, the Digital Personal Data Protection
          Act, 2023, and the SEBI (Research Analysts) Regulations, 2014.
        </p>
        <Sub>Information We Collect</Sub>
        <List
          items={[
            "Identity and contact details: name, address, mobile number, email ID, PAN and other KYC documents, etc.",
            "Financial details necessary for compliance and fee processing (bank/payment details). Login credentials, passwords or OTPs of your trading, demat or bank accounts are never collected.",
            "Basic website usage data (IP address, browser type, cookies) for site functionality and analytics.",
          ]}
        />
        <Sub>How We Use Your Information</Sub>
        <List
          items={[
            "To provide research services, share research reports/recommendations, and service your account.",
            "To complete KYC and comply with SEBI (Research Analysts) Regulations, 2014, circulars issued thereunder, and other applicable laws, including mandatory record-keeping requirements.",
            "To communicate service updates, fee invoices, and regulatory disclosures.",
          ]}
        />
        <Sub>Sharing of Information</Sub>
        <p>
          Personal information is not sold, rented or traded to any third party. It may be disclosed only to SEBI, BSE
          (RAASB), KYC agencies (KRAs), other statutory/regulatory authorities as required by law, or service providers
          strictly for providing the services (under confidentiality obligations).
        </p>
        <Sub>Data Security and Retention</Sub>
        <p>
          Reasonable security practices are followed to protect your data from unauthorised access, alteration or
          disclosure. Client records are retained for a minimum period of five years as required under the SEBI
          (Research Analysts) Regulations, 2014, or longer if required in connection with any proceeding.
        </p>
        <Sub>Your Rights</Sub>
        <p>
          You may request access to, correction of, or updation of your personal information, and withdraw consent
          (subject to regulatory record-keeping obligations), by writing to <MailLink />. This policy may be updated
          from time to time; the revised version will be posted on this website.
        </p>
      </Section>
    ),
  },
  {
    id: "terms",
    icon: FileText,
    title: "Terms & Conditions",
    body: (
      <Section>
        <RaDetails />
        <p>
          These Terms &amp; Conditions govern the use of this website and the research services provided by {RA_NAME},
          SEBI Registered Research Analyst (Registration No. {REG_NO}; BSE Enlistment No. {BSE_ENLISTMENT_NO}), under the
          SEBI (Research Analysts) Regulations, 2014 and circulars issued thereunder, including the Most Important Terms
          and Conditions (MITC) standardised in consultation with SEBI/RAASB.
        </p>
        <Sub>Nature of Services</Sub>
        <p>
          The RA provides research services, i.e. research reports and buy/sell/hold recommendations on securities.
          Availing of services is subject to completion of KYC, disclosure of the terms and conditions of service
          (including MITC), and client consent thereto. The RA cannot execute any trade on behalf of the client.
        </p>
        <Sub>Fees and Payment</Sub>
        <List
          items={[
            "Fees for research services will be as mutually agreed and communicated in advance, subject to the maximum limit prescribed by SEBI/RAASB for individual and HUF clients (currently ₹1,51,000 per annum per family of client, excluding statutory charges). The limit does not apply to non-individual or accredited investor clients.",
            "Fees may be paid by cheque, online bank transfer, UPI or other permitted modes. Cash payment is not allowed. Clients may optionally pay through the Centralised Fee Collection Mechanism (CeFCoM) managed by BSE Limited.",
            "Advance fees, if agreed, shall not exceed the period stipulated by SEBI (presently one year). On premature termination of services by either party, the client is entitled to a refund of proportionate fees for the unexpired period.",
          ]}
        />
        <Sub>Client Obligations</Sub>
        <List
          items={[
            "Provide true, complete and updated KYC information, and keep contact details (email and mobile number) updated with the RA at all times.",
            "Use research reports solely for personal investment decisions; reports must not be reproduced, redistributed or resold without written consent of the RA.",
            "Never share trading account, demat account or bank account login credentials or OTPs with anyone, including the RA.",
          ]}
        />
        <Sub>Risk and Liability</Sub>
        <p>
          Investments in securities are subject to market risks and recommendations do not provide any assurance of
          returns. The RA shall not be liable for any loss arising from investment decisions made on the basis of its
          research services. No assured/guaranteed/fixed-return scheme is or will be offered.
        </p>
        <Sub>Grievance Redressal</Sub>
        <List
          items={[
            <>
              Contact the Research Analyst – {ANALYST_NAME}, Email: <MailLink />, Phone: {COMPLIANCE_PHONE}. Grievances
              will be addressed promptly and in any case within the timelines prescribed by SEBI.
            </>,
            <>
              If the resolution is unsatisfactory, lodge a complaint with SEBI through the SCORES platform at{" "}
              <Ext href="https://scores.sebi.gov.in" /> (SEBI toll-free helpline: 1800 22 7575 / 1800 266 7575).
            </>,
            <>
              The client may also opt for Online Dispute Resolution (ODR) through the Smart ODR portal at{" "}
              <Ext href="https://smartodr.in" />.
            </>,
          ]}
        />
        <Sub>General</Sub>
        <p>
          The RA reserves the right to modify these terms, the Disclaimers and the Privacy Policy at any time in line
          with applicable regulations; updated versions will be posted on this website and continued use constitutes
          acceptance. These terms are governed by the laws of India, and courts at {JURISDICTION} shall have exclusive
          jurisdiction, subject to the SEBI grievance redressal and ODR mechanism described above.
        </p>
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
    title: "Internal Policy",
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
];

/** "Important Links" shown at the top, in this order (sections that exist on this page) */
const IMPORTANT_LINKS: { id: string; label: string }[] = [
  { id: "code-of-conduct", label: "Code of Conduct" },
  { id: "escalation-matrix", label: "Escalation Matrix" },
  { id: "investor-charter", label: "Investor Charter" },
  { id: "refund", label: "Refund Policy" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms & Conditions" },
];

const InfoBlock = ({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) => (
  <div className="space-y-2">
    <h2 className="text-xs font-black uppercase tracking-widest text-primary">{title}</h2>
    <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,14rem)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground/90 break-words mb-1.5 sm:mb-0">{v}</dd>
        </div>
      ))}
    </dl>
  </div>
);

export function SebiCompliance() {
  const location = useLocation();
  const [open, setOpen] = useState<string[]>([]);

  // /sebi-compliance#refund opens and scrolls to that policy
  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (!id || !POLICIES.some((p) => p.id === id)) return;
    setOpen((prev) => (prev.includes(id) ? prev : [...prev, id]));
    // Wait for the page and the opened section to lay out before scrolling
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    return () => clearTimeout(t);
  }, [location.hash]);

  const effectiveDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const mail = (
    <a href={`mailto:${GRIEVANCE_EMAIL}`} className="hover:text-primary transition-colors">
      {GRIEVANCE_EMAIL}
    </a>
  );
  const phone = (
    <a href={`tel:${COMPLIANCE_PHONE.replace(/\s/g, "")}`} className="hover:text-primary transition-colors">
      {COMPLIANCE_PHONE.replace("+91 ", "")}
    </a>
  );

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

        {/* Research Analyst information */}
        <div className="mb-8 p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
          <InfoBlock
            title="Research Analyst Information"
            rows={[
              ["Name of Research Analyst", RA_NAME],
              ["Email ID", mail],
              ["Phone", phone],
              ["Type of RA", "Research Analyst"],
              ["Registered Office", OFFICE_ADDRESS],
              ["SEBI Registration Number", REG_NO],
              ["BSE Enlistment Number", BSE_ENLISTMENT_NO],
              ["Date of Registration", "12 September, 2026"],
              ["Validity of Registration", "Perpetual"],
            ]}
          />
          <InfoBlock title="Principal Officer" rows={[["Name", ANALYST_NAME], ["Email ID", mail], ["Mobile No.", phone]]} />
          <InfoBlock
            title="Grievance Officer / Compliance Officer"
            rows={[["Name", ANALYST_NAME], ["Email ID", mail], ["Mobile No.", phone]]}
          />
          <InfoBlock
            title="SEBI Office Details"
            rows={[
              ["Address", "SEBI Bhavan BKC, Bandra-Kurla Complex, Mumbai - 400051, Maharashtra, India"],
              ["SEBI SCORES", <Ext key="scores" href={SCORES_URL} />],
              ["Smart ODR", <Ext key="odr" href={SMART_ODR_URL} />],
            ]}
          />
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-primary">Disclaimer</h2>
            <p className="text-base font-bold text-white leading-relaxed">
              Investment in securities market are subject to market risks. Read all the related documents carefully
              before investing.
            </p>
            <p className="text-base font-bold text-white leading-relaxed">
              SEBI registration does not guarantee performance or returns.
            </p>
          </div>
        </div>

        {/* Important links */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Important Links
          </h2>
          <div className="flex flex-wrap gap-2">
            {IMPORTANT_LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold text-foreground/80 hover:border-primary/40 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          Tap any policy below to expand it. Each section reflects {FIRM_NAME}'s obligations as a SEBI-registered
          Research Analyst under the SEBI (Research Analysts) Regulations, 2014 and related circulars.
        </p>

        {/* Collapsible policy sections */}
        <Accordion
          type="multiple"
          value={open}
          onValueChange={setOpen}
          className="rounded-2xl border border-white/10 bg-white/[0.02] px-5"
        >
          {POLICIES.map(({ id, icon: Icon, title, body }) => (
            <AccordionItem key={id} value={id} id={id} className="border-white/10 scroll-mt-24">
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
            Registration granted by SEBI, enlistment with BSE Limited (RAASB) and certification from NISM in no way
            guarantee performance of the intermediary or provide any assurance of returns to investors. Disputes are
            subject to the exclusive jurisdiction of the courts at {JURISDICTION}.
          </span>
        </div>
      </div>
    </div>
  );
}

export default SebiCompliance;
