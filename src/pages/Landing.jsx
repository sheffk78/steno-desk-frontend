import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "@/lib/api";
import { redditTrack } from "@/lib/reddit";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const features = [
  {
    title: "Built-in court reporter line items",
    body:
      "Appearance fee, original pages, copies, rough draft, exhibits, scopist deduction, mileage — all there from the start. No customizing a generic template every time.",
  },
  {
    title: "Per-client rate memory",
    body:
      "Set Veritext's rates once. They auto-fill every time you add a Veritext job. No re-entry, no guessing.",
  },
  {
    title: "Send from inside the app",
    body:
      "Generate a professional PDF invoice and email it to the ordering attorney without leaving Steno Desk. Your name, certification number, and letterhead on every one.",
  },
  {
    title: "Tax-time CSV export",
    body:
      "Log your scopist payments, mileage, and software expenses as you go. Export a clean CSV at year-end and hand it to your accountant.",
  },
];

const painPoints = [
  "You copy last month's Word invoice, change the caption, and manually recalculate the page count — every single time.",
  "You track outstanding payments in a spreadsheet you've been meaning to clean up since 2021.",
  "At tax time, you spend a weekend hunting through Gmail and paper folders to figure out what you paid your scopist.",
];

const howItWorks = [
  {
    step: "1",
    title: "Add the job",
    body: "Enter the client, date, and job type. Your per-client rates fill in automatically.",
  },
  {
    step: "2",
    title: "Build the invoice",
    body: "Every line item you charge is already there — appearance fee, pages, copies, exhibits, scopist deduction. Adjust quantities and you're done.",
  },
  {
    step: "3",
    title: "Send and track",
    body: "Email a clean PDF invoice to the ordering attorney from inside the app. Mark it paid when the check arrives. That's it.",
  },
];

const faqs = [
  {
    q: "Is this designed for agencies or freelancers?",
    a: "Freelancers only. Every feature is built around the solo reporter's workflow — not agency dispatch, not multi-reporter firms. If you work for yourself, this is for you.",
  },
  {
    q: "What happens after my 30-day trial?",
    a: "Nothing automatically. Your account stays open and you can see all your data. We'll ask if you'd like to continue. No credit card is charged without your action.",
  },
  {
    q: "Does it handle my transcripts or CAT files?",
    a: "No. Steno Desk handles the business side — jobs, invoices, clients, expenses. Your CAT software handles transcripts. The two don't need to talk to each other.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Invoices export as PDFs. Expense records export as CSV. You own your data.",
  },
  {
    q: "What if I've been using Acculaw or RepAgencyWorks?",
    a: "You can run Steno Desk alongside any existing software during your trial. Most reporters get through their first three jobs and don't look back.",
  },
  {
    q: "Do I have to get on a call with someone?",
    a: "No. The trial is self-serve — create your account and start working. If you'd like a personal walkthrough, you can book a 30-minute setup call with Jeff after you sign up. It's entirely optional.",
  },
];

export default function Landing() {
  const [emailCapture, setEmailCapture] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const onCapture = async (e) => {
    e.preventDefault();
    if (!emailCapture) return;
    try {
      await api.post("/leads", { email: emailCapture, source: "landing_email_capture" });
    } catch (_) {
      // Soft-fail — never block the marketing UX on backend errors.
    }
    // Reddit Lead conversion event (silent if pixel is blocked).
    redditTrack("Lead", { customEventName: "EmailCapture" });
    setEmailSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#1F2937]">
      {/* Top nav */}
      <header className="border-b border-[#E5E1DA] bg-[#FBFAF7]/85 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center" data-testid="brand-link">
            <Logo className="h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[15px] text-[#6B7280]">
            <a href="#features" className="hover:text-[#1F2937]">Features</a>
            <a href="#pricing" className="hover:text-[#1F2937]">Pricing</a>
            <a href="#founding" className="hover:text-[#1F2937]">Founding Users</a>
            <a href="#faq" className="hover:text-[#1F2937]">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[15px] text-[#1F2937] hover:text-[#111827] px-3 py-1.5" data-testid="nav-login">
              Sign in
            </Link>
            <Link to="/signup" data-testid="nav-signup">
              <Button className="bg-[#1F2937] hover:bg-[#111827] text-white text-[15px] h-10 px-4 rounded-md">
                Start free trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — generous, single CTA, with animated invoice mockup on the right */}
      <section className="border-b border-[#E5E1DA] bg-[#FBFAF7] sd-grain overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 sd-fade">
            <div className="text-[13px] tracking-[0.08em] uppercase text-[#6B7280] mb-6 font-medium">
              Built for freelance court reporters — not agencies
            </div>
            <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.05] font-semibold tracking-[-0.02em] text-[#1F2937]">
              Stop building invoices in&nbsp;Word.
            </h1>
            <p className="mt-7 text-[18px] sm:text-[20px] text-[#374151] max-w-2xl leading-[1.55]">
              Steno Desk is practice management software built specifically for
              freelance court reporters — with every line item you actually charge,
              your per-client rates remembered, and your invoices out the door in minutes.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/signup" data-testid="hero-signup">
                <Button className="bg-[#1F2937] hover:bg-[#111827] text-white h-12 px-6 text-[16px] rounded-md font-semibold">
                  Start your free 30-day trial
                </Button>
              </Link>
              <span className="text-[15px] text-[#6B7280]">
                No credit card required. No contracts. Cancel anytime.
              </span>
            </div>
          </div>

          {/* Animated invoice mockup */}
          <div className="lg:col-span-5 hidden lg:block" aria-hidden="true" data-testid="hero-invoice-mockup">
            <HeroInvoiceMockup />
          </div>
        </div>
      </section>

      {/* Pain points — alternating background */}
      <section className="bg-white border-b border-[#E5E1DA]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1F2937] mb-10">
            Sound familiar?
          </h2>
          <ul className="space-y-6">
            {painPoints.map((p) => (
              <li key={p} className="flex gap-4 text-[17px] text-[#374151] leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#D4A056] shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-[#E5E1DA] bg-[#FBFAF7]">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1F2937] mb-3">
            How it works.
          </h2>
          <p className="text-[17px] text-[#6B7280] mb-12 max-w-2xl">
            Three steps from job booked to invoice sent. No setup wizard, no
            templates to configure — your first invoice is ready in minutes.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorks.map((s) => (
              <div key={s.step} data-testid={`howitworks-step-${s.step}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-8 w-8 rounded-full bg-[#D4A056] text-white text-[14px] font-semibold flex items-center justify-center">
                    {s.step}
                  </span>
                  <h3 className="text-[18px] font-semibold text-[#1F2937]">{s.title}</h3>
                </div>
                <p className="text-[15px] text-[#374151] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-[#E5E1DA]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1F2937] mb-3">
            Everything a freelance reporter needs. Nothing you don't.
          </h2>
          <p className="text-[17px] text-[#6B7280] mb-12 max-w-2xl">
            Built around the work you actually do — appearance fees, page rates,
            scopist deductions — not retrofitted from a generic invoicing app.
          </p>
          <div className="grid md:grid-cols-2 gap-px bg-[#E5E1DA] border border-[#E5E1DA] rounded-lg overflow-hidden">
            {features.map((f) => (
              <div key={f.title} className="bg-white p-8" data-testid={`feature-${f.title.split(' ')[0].toLowerCase()}`}>
                <h3 className="text-[18px] font-semibold text-[#1F2937] mb-2">{f.title}</h3>
                <p className="text-[15px] text-[#374151] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white border-b border-[#E5E1DA]">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1F2937]">
              Simple pricing. No surprises.
            </h2>
            <p className="text-[17px] text-[#6B7280] mt-3">
              Both plans include every feature. Pay once a year and save $219.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <PricingCard
              name="Monthly"
              price="$39"
              cadence="/ month"
              best="Try before you commit"
              testid="pricing-monthly"
            />
            <PricingCard
              name="Annual"
              price="$249"
              cadence="/ year"
              best="Prefer to pay once and be done"
              featured
              testid="pricing-annual"
            />
          </div>
          <p className="text-center text-[14px] text-[#6B7280] mt-8">
            30-day free trial on both plans. No card required.
          </p>
        </div>
      </section>

      {/* Founding User Program */}
      <section id="founding" className="border-b border-[#E5E1DA] bg-[#FAF3E4]/40">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-[13px] tracking-[0.08em] uppercase text-[#B45309] mb-4 font-semibold">
            Founding User Program
          </div>
          <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1F2937] mb-5">
            Be among the first to run your practice on Steno Desk.
          </h2>
          <p className="text-[17px] text-[#374151] leading-relaxed mb-10 max-w-3xl">
            We're opening Steno Desk to a small founding group of freelance court
            reporters. You get the full product, a longer free trial, and a
            direct line to the builder. In return, you tell us what would make it
            better for the reporter sitting in the deposition chair next to you.
          </p>

          {/* Demo video */}
          <div
            className="relative w-full mb-10 bg-black rounded-lg overflow-hidden border border-[#E5E1DA] shadow-sm"
            style={{ paddingTop: "56.25%" }}
            data-testid="founding-demo-video"
          >
            <iframe
              src="https://iframe.mediadelivery.net/embed/611388/5a14c957-9a76-4aba-823b-729b72fb2a0f?autoplay=true&loop=true&muted=true&preload=true&responsive=true"
              loading="lazy"
              style={{ border: 0, position: "absolute", top: 0, left: 0, height: "100%", width: "100%" }}
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen;"
              allowFullScreen
              title="Steno Desk demo"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-8 mb-10 max-w-3xl">
            <div>
              <div className="text-[13px] tracking-[0.08em] uppercase text-[#6B7280] font-semibold mb-3">What you get</div>
              <ul className="space-y-2 text-[15px] text-[#374151]">
                <li>· 60 days completely free — no credit card, no auto-charge</li>
                <li>· Every feature, day one — nothing held back, no "pro" tier to unlock later</li>
                <li>· A direct line to Jeff, the builder — not a support queue, the person writing the code</li>
                <li>· Your requests shape the roadmap — you see what's being built and why</li>
              </ul>
            </div>
            <div>
              <div className="text-[13px] tracking-[0.08em] uppercase text-[#6B7280] font-semibold mb-3">Optional, not required</div>
              <ul className="space-y-2 text-[15px] text-[#374151]">
                <li>· Try it on a real job whenever you're ready — no deadline, no quota</li>
                <li>· Book a 30-minute setup walkthrough with Jeff if you'd like a guided tour</li>
                <li>· Send a note when something feels off — or don't. Up to you.</li>
              </ul>
            </div>
          </div>
          <Link to="/signup?founding=1" data-testid="founding-cta">
            <Button className="bg-[#1F2937] hover:bg-[#111827] text-white h-11 px-5 rounded-md font-semibold">
              Join the founding program
            </Button>
          </Link>
        </div>
      </section>

      {/* Founder bio */}
      <section className="bg-white border-b border-[#E5E1DA]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-[13px] tracking-[0.08em] uppercase text-[#6B7280] mb-4 font-semibold">
            About the founder
          </div>
          <p className="text-[17px] text-[#374151] leading-[1.65]">
            My name is Jeff Kohler. I'm not a court reporter — I'm a builder
            who got tired of watching skilled professionals run their businesses
            with tools that weren't designed for them. Steno Desk exists because
            the software court reporters deserve doesn't exist yet. I'm building
            it to be exactly what a freelance reporter needs: no bloat, no
            complexity, no agency-centric nonsense. Just a clean tool that
            handles the admin so you can focus on the work. You can reach me
            directly — no support tiers, no ticket queues. If something's
            broken, tell me and I'll fix it.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-[#E5E1DA]">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1F2937] mb-10">
            Common questions
          </h2>
          <div className="space-y-9">
            {faqs.map((f) => (
              <div key={f.q}>
                <div className="text-[17px] font-semibold text-[#1F2937] mb-2">{f.q}</div>
                <div className="text-[16px] text-[#374151] leading-[1.65]">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email capture */}
      <section className="bg-white">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#1F2937]">
            Not ready to sign up? Get updates.
          </h2>
          <p className="text-[16px] text-[#6B7280] mt-3 mb-8">
            We're adding founding users over the coming weeks. Leave your email
            and we'll let you know when a spot opens.
          </p>
          {emailSent ? (
            <div className="bg-[#DCFCE7] border border-[#15803D]/30 text-[#15803D] rounded-md px-4 py-3 text-[15px]">
              Thanks — we'll be in touch.
            </div>
          ) : (
            <form onSubmit={onCapture} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" data-testid="email-capture-form">
              <Input
                type="email"
                required
                value={emailCapture}
                onChange={(e) => setEmailCapture(e.target.value)}
                placeholder="Your email address"
                className="h-11 flex-1"
                data-testid="email-capture-input"
              />
              <Button type="submit" className="bg-[#1F2937] hover:bg-[#111827] text-white h-11 px-5 rounded-md font-semibold" data-testid="email-capture-submit">
                Notify me
              </Button>
            </form>
          )}
          <p className="text-[13px] text-[#6B7280] mt-4">
            We won't share your email or send you anything unrelated to Steno Desk.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#E5E1DA] bg-[#FBFAF7]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo className="h-6" />
            <span className="text-[13px] text-[#6B7280]">© {new Date().getFullYear()} Steno Desk</span>
          </div>
          <div className="text-[13px] text-[#6B7280]">
            Practice management for freelance court reporters.
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ name, price, cadence, best, featured, testid }) {
  return (
    <div
      data-testid={testid}
      className={`bg-white border rounded-lg p-8 ${
        featured ? "border-[#D4A056] ring-1 ring-[#D4A056]/40" : "border-[#E5E1DA]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13px] tracking-[0.08em] uppercase text-[#6B7280] font-semibold">{name}</div>
        {featured && (
          <span className="text-[11px] tracking-[0.08em] uppercase text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded font-semibold">
            Save $219
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-[42px] font-semibold text-[#1F2937] tabular">{price}</span>
        <span className="text-[16px] text-[#6B7280]">{cadence}</span>
      </div>
      <p className="text-[14px] text-[#6B7280] mb-7">{best}</p>
      <ul className="text-[15px] text-[#374151] space-y-2 mb-8">
        <li>· Unlimited jobs, invoices, and clients</li>
        <li>· Court-reporter line items built in</li>
        <li>· PDF generation + send via email</li>
        <li>· Schedule C expense export</li>
        <li>· 30 days free, no card</li>
      </ul>
      <Link to="/signup">
        <Button
          className={`w-full h-11 font-semibold rounded-md ${
            featured
              ? "bg-[#1F2937] hover:bg-[#111827] text-white"
              : "bg-white hover:bg-[#F3F0E9] text-[#1F2937] border border-[#E5E1DA]"
          }`}
        >
          Start free trial
        </Button>
      </Link>
    </div>
  );
}


/**
 * HeroInvoiceMockup — a stylized, animated invoice card that floats in the
 * hero's right column. Header + bill-to + 3 line items fade in sequentially,
 * the total row gets a sweeping gold underline, and a "Paid in 3 days"
 * stamp rotates in last. Pure CSS animations (defined in index.css).
 */
function HeroInvoiceMockup() {
  return (
    <div className="relative max-w-md mx-auto" data-testid="hero-mockup">
      {/* Soft warm halo behind the card */}
      <div
        className="absolute -inset-10 rounded-[40px] -z-10 blur-3xl opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(212,160,86,0.20) 0%, rgba(251,250,247,0) 70%)",
        }}
      />

      <div className="sd-float relative">
        <div className="bg-white border border-[#E5E1DA] rounded-lg shadow-[0_25px_60px_-30px_rgba(31,41,55,0.25)] overflow-hidden">
          {/* Letterhead bar */}
          <div className="px-6 py-4 border-b border-[#E5E1DA] flex items-center justify-between sd-fade">
            <div>
              <div className="text-[10px] tracking-[0.18em] uppercase text-[#6B7280] font-semibold">
                Marie Chen, RPR
              </div>
              <div className="text-[15px] font-semibold text-[#1F2937] mt-0.5">
                Marie Chen Court Reporting
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] tracking-[0.18em] uppercase text-[#6B7280] font-semibold">
                Invoice
              </div>
              <div className="text-[17px] font-semibold text-[#1F2937] tabular mt-0.5">
                SD-0024
              </div>
            </div>
          </div>

          {/* Bill-to + date */}
          <div className="px-6 py-3 border-b border-[#E5E1DA] grid grid-cols-2 gap-4 text-[11px] sd-fade sd-delay-1">
            <div>
              <div className="tracking-[0.14em] uppercase text-[#6B7280] font-semibold mb-1">Bill to</div>
              <div className="text-[#1F2937] text-[13px] font-medium">Snell &amp; Wilmer LLP</div>
              <div className="text-[#6B7280]">Attn: Theresa Lopez</div>
            </div>
            <div className="text-right">
              <div className="tracking-[0.14em] uppercase text-[#6B7280] font-semibold mb-1">Date · Due</div>
              <div className="text-[#1F2937] text-[12px]">Feb 10 · Mar 12</div>
            </div>
          </div>

          {/* Line items appear in sequence */}
          <div className="px-6 py-3 text-[12px]">
            <div className="grid grid-cols-12 text-[10px] tracking-[0.14em] uppercase text-[#6B7280] font-semibold pb-2 border-b border-[#E5E1DA]">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            <MockLine label="Appearance fee" qty="—" rate="—" amount="$250.00" delay="sd-delay-2" />
            <MockLine label="Original transcript" qty="112" rate="$4.50" amount="$504.00" delay="sd-delay-3" />
            <MockLine label="Copy" qty="112" rate="$1.25" amount="$140.00" delay="sd-delay-4" />

            {/* Total row with gold underline sweep */}
            <div className="grid grid-cols-12 pt-3 pb-1 items-baseline sd-fade sd-delay-5">
              <div className="col-span-8 text-right text-[#6B7280] text-[11px] pr-3">Total due</div>
              <div className="col-span-4 text-right relative">
                <span className="text-[18px] font-semibold text-[#1F2937] tabular">$894.00</span>
                <span
                  className="sd-underline absolute -bottom-0.5 right-0 h-[2px] rounded-full"
                  style={{ background: "linear-gradient(90deg, transparent 0%, #D4A056 100%)" }}
                />
              </div>
            </div>
          </div>

          {/* Footer chip */}
          <div className="px-6 py-3 border-t border-[#E5E1DA] flex items-center justify-between text-[11px] text-[#6B7280] sd-fade sd-delay-6">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
              Sent via Steno Desk
            </span>
            <span className="tabular">Net 30</span>
          </div>
        </div>

        {/* "Paid in 3 days" stamp — appears last, slightly rotated */}
        <div
          className="sd-stamp absolute -right-4 -bottom-4 sm:-right-6 sm:-bottom-6"
          style={{ transformOrigin: "center" }}
        >
          <div className="bg-white border-2 border-[#15803D] text-[#15803D] rounded-md px-3 py-1.5 shadow-md">
            <div className="text-[9px] tracking-[0.18em] uppercase font-bold">Paid</div>
            <div className="text-[11px] font-semibold leading-tight">in 3 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockLine({ label, qty, rate, amount, delay }) {
  return (
    <div className={`grid grid-cols-12 py-2 border-b border-[#F3F0E9] sd-fade ${delay}`}>
      <div className="col-span-6 text-[#1F2937]">{label}</div>
      <div className="col-span-2 text-right text-[#6B7280] tabular">{qty}</div>
      <div className="col-span-2 text-right text-[#6B7280] tabular">{rate}</div>
      <div className="col-span-2 text-right text-[#1F2937] font-medium tabular">{amount}</div>
    </div>
  );
}