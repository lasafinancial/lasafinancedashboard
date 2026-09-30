import { Link } from "react-router-dom";
import { Mail, Linkedin, Instagram, Tv } from "lucide-react";
import { InstagramReels } from "@/components/cards/InstagramReels";

const TIMELINE = [
  {
    when: "1999",
    title: "First entered the equity markets",
    body: "Started as an individual investor right as a defining cycle was taking shape — the beginning of a habit of tracking price, cycle and sentiment that has continued ever since.",
  },
  {
    when: "20 years",
    title: "Senior technical leadership in IT",
    body: "Built a career across multiple US-based multinational corporations in senior technical leadership roles, while continuing to follow the market through every cycle in the background.",
  },
  {
    when: "Full-time pivot",
    title: "Founded Lasa Research",
    body: "Left the corporate track to focus on financial markets full time, registering with SEBI as a Research Analyst to bring that two-decade-plus market discipline to others.",
  },
];

const CREDENTIALS: { name: string; tag: string; logo?: string; logoAlt?: string }[] = [
  { name: "Indian Institute of Management, Lucknow", tag: "IIM Lucknow", logo: "/about/iim-lucknow-logo.png", logoAlt: "IIM Lucknow logo" },
  { name: "Master of Computer Applications", tag: "MCA" },
  { name: "Project Management Professional", tag: "PMP · USA", logo: "/about/pmp-logo.jpg", logoAlt: "PMP Certified badge" },
  { name: "NISM Certified", tag: "SEBI / NISM" },
  { name: "Professional Cloud Architect", tag: "Google Cloud", logo: "/about/gcp-logo.png", logoAlt: "Google Cloud logo" },
  { name: "Certified Engineer", tag: "Microsoft" },
];

const ASSOCIATIONS = [
  { org: "JITO Noida", role: "Patron Member", logo: "/about/jito-logo.jpg", logoAlt: "JITO Business Network logo" },
  { org: "Rotary Club Noida Elegance", role: "Member", logo: "/about/rotary-logo.jpg", logoAlt: "Rotary Club Noida Elegance logo" },
];

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section aria-labelledby={id} className="py-12 border-b border-white/10 last:border-b-0">
    <h2 id={id} className="text-2xl font-bold tracking-tight mb-6">{title}</h2>
    {children}
  </section>
);

export function About() {
  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30 font-sans pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Hero */}
        <header className="flex flex-col-reverse sm:flex-row gap-6 sm:gap-10 items-start py-12 sm:py-16 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">About</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-3">Dheeraj Sogani</h1>
            <p className="text-sm text-muted-foreground mb-5">
              SEBI Registered Research Analyst · Reg. No. <b className="text-foreground font-semibold">INH000030144</b>
            </p>
            <p className="text-lg leading-relaxed text-slate-300 max-w-[60ch]">
              In the equity market since 1999 — twenty-seven years of watching it rise, fall, and rise again, across every cycle it has run since.
            </p>
          </div>
          <div className="shrink-0 w-24 h-24 sm:w-[152px] sm:h-[152px] rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <img src="/about/dheeraj-photo.png" alt="Dheeraj Sogani" className="w-full h-full object-cover" />
          </div>
        </header>

        <Section id="about-philosophy" title="On investing">
          <p className="text-xl font-medium leading-relaxed text-slate-200 max-w-[52ch]">
            There is no such thing as a long-term investment — there is only the{" "}
            <em className="not-italic text-cyan-400">right stock, at the right time</em>, read against where the market's cycle and regime actually stand. That's precisely the problem our engine is built to solve, and why we keep investing in the research behind it.
          </p>
        </Section>

        <Section id="about-journey" title="The path here">
          <ol className="border-l border-white/10 ml-[5px]">
            {TIMELINE.map((step) => (
              <li key={step.when} className="relative pl-7 pb-8 last:pb-0">
                <span className="absolute -left-[6px] top-1.5 w-[11px] h-[11px] rounded-full bg-[#020617] border-2 border-cyan-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5">{step.when}</p>
                <h3 className="text-lg font-semibold mb-1.5">{step.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground max-w-[60ch]">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="about-patent" title="Patent">
          <div className="rounded-[10px] border border-white/10 bg-white/[0.03] p-6">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-violet-400 border border-violet-400/35 bg-violet-400/10 rounded-full px-3 py-1 mb-3">
              Patent filed
            </span>
            <h3 className="text-lg font-semibold mb-1.5">Market Regime &amp; Security State Engine</h3>
            <p className="text-base leading-relaxed text-muted-foreground max-w-[60ch]">
              A system and method for calculating and identifying the prevailing market regime by analyzing historical price and volume parameters of a security — the analytical foundation underlying Lasa Research's cycle and regime-based approach to the market.
            </p>
          </div>
        </Section>

        <Section id="about-credentials" title="Education &amp; certifications">
          <ul className="border-t border-white/10">
            {CREDENTIALS.map((cred) => (
              <li key={cred.name} className="flex items-center justify-between gap-4 py-4 border-b border-white/10">
                <span className="flex items-center gap-3 min-w-0">
                  {cred.logo ? (
                    <img
                      src={cred.logo}
                      alt={cred.logoAlt}
                      className="w-[30px] h-[30px] object-contain bg-white rounded-md p-[3px] shrink-0"
                    />
                  ) : (
                    // Keep names aligned with the rows that have a logo
                    <span aria-hidden="true" className="w-[30px] h-[30px] rounded-md bg-white/[0.04] border border-white/10 shrink-0" />
                  )}
                  <span className="text-base font-medium">{cred.name}</span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap text-right">{cred.tag}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="about-associations" title="Associations">
          <div className="flex flex-col gap-3.5">
            {ASSOCIATIONS.map((aff) => (
              <div key={aff.org} className="flex items-center gap-4 px-5 py-[18px] rounded-[10px] border border-white/10 bg-white/[0.03]">
                <div className="shrink-0 w-16 h-16 rounded-[10px] bg-white flex items-center justify-center overflow-hidden p-1.5">
                  <img src={aff.logo} alt={aff.logoAlt} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold mb-0.5">{aff.org}</p>
                  <p className="text-sm text-muted-foreground">{aff.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="about-media" title="In the media">
          <div className="flex items-center gap-4 px-5 py-[18px] rounded-[10px] border border-white/10 bg-white/[0.03] mb-5">
            <div className="shrink-0 w-16 h-16 rounded-[10px] bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <Tv className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold mb-0.5">Market Times TV</p>
              <p className="text-sm text-muted-foreground">Regular Analyst</p>
            </div>
          </div>
          <InstagramReels />
          <a
            href="https://www.instagram.com/lasaresearch/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            More videos on Instagram · @lasaresearch
          </a>
        </Section>

        <Section id="about-connect" title="Connect">
          <div className="flex flex-wrap gap-3">
            {[
              { href: "mailto:lasaresearch@gmail.com", label: "lasaresearch@gmail.com", icon: Mail, external: false },
              { href: "https://www.linkedin.com/in/lasa-research-dheeraj-sogani-25752a3b4/", label: "LinkedIn", icon: Linkedin, external: true },
              { href: "https://www.instagram.com/lasaresearch/", label: "@lasaresearch", icon: Instagram, external: true },
            ].map(({ href, label, icon: Icon, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-2.5 px-[18px] py-3 rounded-[10px] border border-white/10 bg-white/[0.03] text-sm font-medium hover:border-cyan-400 transition-colors"
              >
                <Icon className="w-[18px] h-[18px] shrink-0 text-muted-foreground" />
                {label}
              </a>
            ))}
          </div>
        </Section>

        <div className="pt-6 border-t border-white/10 text-xs leading-relaxed text-muted-foreground/70">
          <b className="text-muted-foreground">Dheeraj Sogani</b> is a SEBI Registered Research Analyst, Reg. No. INH000030144. Content on this website is for educational and informational purposes only and does not constitute investment advice. Investment in securities markets is subject to market risks; read all related documents carefully. There is no assurance of returns, and no claim shall lie for losses arising from decisions made on the basis of this content. See our{" "}
          <Link to="/sebi-compliance" className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
            Disclosures &amp; Regulatory Information
          </Link>{" "}
          page for SEBI registration details, fee structure, investor charter and grievance redressal.
        </div>
      </div>
    </div>
  );
}

export default About;
