import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartHandshake,
  Menu,
  X,
  Palette,
  Phone,
  ShieldCheck,
  UsersRound,
  UserRoundCog,
} from "lucide-react";
import { useLayoutEffect, useState } from "react";
import Brand from "../../components/layout/Brand.jsx";
import "./landing-page.css";

const features = [
  { icon: GraduationCap, title: "Student records & enrollment", text: "Keep learner profiles, admissions, class placement and enrollment history together." },
  { icon: UsersRound, title: "Classes, teachers & subjects", text: "Organize class levels, groups, subjects, staff profiles and teaching assignments." },
  { icon: ClipboardCheck, title: "Attendance", text: "Take class registers and keep attendance records easy to follow up." },
  { icon: CalendarDays, title: "Academic years & terms", text: "Set up the school calendar, grading scales and progression between year groups." },
  { icon: BookOpen, title: "Assessments & grading", text: "Record marks and review learner progress across subjects and terms." },
  { icon: FileText, title: "Report cards", text: "Design school-branded mid-term and term reports, then share results with families." },
  { icon: HeartHandshake, title: "Parent portal", text: "Give parents a secure place to follow their children’s assessments and reports." },
  { icon: UserRoundCog, title: "People & permissions", text: "Manage staff accounts, roles, invitations and school activity records." },
  { icon: Palette, title: "School management", text: "Manage school profiles, appearance, subscriptions and platform oversight." },
];

function WhatsAppIcon() {
  return (
    <svg className="landing-whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.34.15 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.79 1.47h.01C18.66 23.82 24 18.48 24 11.9a11.83 11.83 0 0 0-3.48-8.42ZM12.08 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.73.98.99-3.64-.24-.37a9.84 9.84 0 0 1-1.52-5.26c0-5.47 4.45-9.92 9.92-9.92a9.86 9.86 0 0 1 7.02 2.91 9.86 9.86 0 0 1 2.9 7.02c0 5.47-4.45 9.92-9.94 9.92Zm5.45-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.66-1.6-.9-2.2-.23-.58-.47-.5-.66-.51h-.56c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46 0 1.46 1.06 2.87 1.2 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.62.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function WorkspacePreview() {
  return (
    <div className="workspace-preview" aria-label="Illustration of the Nexa School workspace">
      <div className="workspace-preview-top">
        <span className="preview-mark"><GraduationCap size={18} /></span>
        <div><strong>School workspace</strong><small>Everything in one view</small></div>
        <span className="preview-status"><i /> Connected</span>
      </div>
      <div className="workspace-preview-body">
        <div className="preview-welcome"><span>YOUR SCHOOL, AT A GLANCE</span><b>A clearer school day starts here.</b></div>
        <div className="preview-module-grid">
          <div className="preview-module"><span className="preview-module-icon preview-green"><UsersRound size={17} /></span><span><b>Student register</b><small>Profiles & enrollment</small></span><ArrowRight size={15} /></div>
          <div className="preview-module"><span className="preview-module-icon preview-yellow"><ClipboardCheck size={17} /></span><span><b>Class attendance</b><small>Daily registers</small></span><ArrowRight size={15} /></div>
          <div className="preview-module"><span className="preview-module-icon preview-blue"><BookOpen size={17} /></span><span><b>Assessments</b><small>Marks & progress</small></span><ArrowRight size={15} /></div>
          <div className="preview-module"><span className="preview-module-icon preview-lilac"><FileText size={17} /></span><span><b>Report cards</b><small>Results for families</small></span><ArrowRight size={15} /></div>
        </div>
      </div>
      <div className="preview-family-card"><span className="family-icon"><HeartHandshake size={18} /></span><span><small>FOR FAMILIES</small><b>A portal parents can use</b></span><span className="family-check"><Check size={14} /></span></div>
      <div className="preview-note"><ShieldCheck size={15} /> Each person sees the right school information.</div>
    </div>
  );
}

function ContactOptions({ number, digits }) {
  return (
    <div className="landing-contact-row">
      <span className="landing-contact-number">{number}</span>
      <a href={`tel:+${digits}`}><Phone size={15} /> Call</a>
      <a className="landing-whatsapp-link" href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp</a>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const elements = [...document.querySelectorAll('.landing-page [data-reveal]')];
    if (!elements.length) return undefined;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('landing-revealed'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('landing-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });

    elements.forEach((element) => {
      element.classList.add('landing-reveal-pending');
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Nexa School home"><Brand /></a>
        <nav id="landing-mobile-nav" className={`landing-nav${mobileMenuOpen ? " landing-nav-open" : ""}`} aria-label="Main navigation">
          <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Platform</a>
          <a href="#why-nexa" onClick={() => setMobileMenuOpen(false)}>Why Nexa</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          <a className="landing-mobile-nav-auth" href="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</a>
          <a className="landing-mobile-nav-auth landing-mobile-nav-register" href="/login?mode=signup" onClick={() => setMobileMenuOpen(false)}>Get Started</a>
        </nav>
        <div className="landing-header-actions"><a className="landing-sign-in" href="/login">Sign in</a><a className="landing-button landing-button-small" href="/login?mode=signup">Register your school <ArrowRight size={16} /></a></div>
        <button className="landing-mobile-menu" type="button" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} aria-controls="landing-mobile-nav" onClick={() => setMobileMenuOpen((open) => !open)}>
          {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-eyebrow"><span /> SCHOOL MANAGEMENT, MADE CLEARER</div>
          <h1>Give your school<br />room to <span>thrive.</span></h1>
          <p>Bring student records, teaching, attendance and results into one connected workspace. Keep the day organized for your team and progress visible to families.</p>
          <div className="landing-hero-actions"><a className="landing-button" href="/login?mode=signup">Get started <ArrowRight size={17} /></a><a className="landing-text-link" href="/login">Already using Nexa? <b>Sign in</b></a></div>
          <div className="landing-privacy-note"><ShieldCheck size={17} /> Role-based access keeps school information in the right hands.</div>
        </div>
        <div className="landing-hero-art"><div className="hero-blob hero-blob-back" /><div className="landing-motion-orb" aria-hidden="true" /><WorkspacePreview /></div>
      </section>

      <section className="landing-value-strip" aria-label="Nexa School benefits" data-reveal>
        <div><span className="value-icon"><UsersRound size={19} /></span><p><b>One connected school</b><small>People, classes and records</small></p></div>
        <div><span className="value-icon"><BookOpen size={19} /></span><p><b>Learning stays central</b><small>Attendance, assessment and results</small></p></div>
        <div><span className="value-icon"><HeartHandshake size={19} /></span><p><b>Families stay informed</b><small>Secure parent access</small></p></div>
      </section>

      <section className="landing-platform" id="platform">
        <div className="landing-section-title" id="why-nexa" data-reveal><span className="landing-eyebrow">MADE FOR THE WHOLE SCHOOL COMMUNITY</span><h2>All the moving parts<br />of school, <span>working together.</span></h2><p>Spend less time chasing information and more time supporting learners.</p></div>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => <article className={`landing-feature landing-feature-${index + 1}`} data-reveal key={title} style={{ '--reveal-delay': `${Math.min(index, 4) * 55}ms` }}><span className="landing-feature-icon"><Icon size={21} strokeWidth={1.8} /></span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="landing-parent-callout" data-reveal>
        <div className="parent-callout-art" aria-hidden="true"><div className="parent-phone"><div className="phone-speaker" /><div className="phone-screen"><span className="phone-avatar"><GraduationCap size={20} /></span><small>FAMILY PORTAL</small><b>Learning, shared.</b><span className="phone-row"><Check size={13} /> Term reports</span><span className="phone-row"><Check size={13} /> Assessment progress</span></div></div></div>
        <div className="parent-callout-copy"><span className="landing-eyebrow">A BETTER CONNECTION WITH FAMILIES</span><h2>Parents are part<br />of the <span>picture.</span></h2><p>The parent portal gives families secure access to student progress, assessment results and report cards, so school and home can stay connected.</p><a className="landing-inline-link" href="/login">Explore family access <ArrowRight size={16} /></a></div>
      </section>

      <section className="landing-cta-panel" data-reveal><div><span className="landing-eyebrow">READY WHEN YOUR SCHOOL IS</span><h2>Make the school day<br />work <span>better.</span></h2></div><a className="landing-button landing-button-light" href="/login?mode=signup">Register your school <ArrowRight size={17} /></a></section>

      <footer className="landing-footer" id="contact" data-reveal>
        <div className="landing-footer-main"><div className="landing-footer-brand"><a href="/" aria-label="Nexa School home"><Brand /></a><p>Thoughtful tools for better school days.</p></div><div className="landing-footer-contact"><span className="landing-footer-label">TALK TO OUR TEAM</span><ContactOptions number="+265 885 435 964" digits="265885435964" /><ContactOptions number="+265 998 351 834" digits="265998351834" /><a className="landing-email-link" href="mailto:nexacircuit@gmail.com">nexacircuit@gmail.com <ArrowUpRight size={15} /></a></div></div>
        <div className="landing-footer-bottom"><span>© {new Date().getFullYear()} Nexa Circuit Ltd.</span><span>School management, made clearer.</span></div>
      </footer>
    </main>
  );
}
