
import React from "react";
import { useState } from "react";
import "./portfolio.css";
import profileImage from "../../assets/EdgarChinenga.jpg";
import schoolhouseDashboard from "../../assets/images/school-mgt-screenshots/screenshot2.png";
import dimtDashboard from "../../assets/images/DMIT-Screenshots/Screenshot12.png";
import nthakaAnalytics from "../../assets/images/Nthaka-Screenshots/Screenshot8.png";

const projects = [
  {
    number: "01",
    name: "Schoolhouse",
    category: "School Management System",
    description:
      "A web-based school management and reporting platform covering school records, academic years and terms, class and subject structures, teaching assignments, assessments, results and automated reports.",
    technologies: ["React", "Node.js", "Express.js", "PostgreSQL", "Prisma", "Docker", "Git"],
    features: [
      "Student and enrolment management",
      "Academic years, classes and teaching assignments",
      "Assessment and results management",
      "Term reports and academic progression",
      "Role-based access control",
    ],
    status: "Active development",
    featured: true,
    link: "https://nc.nexa-circuit.com",
    image: schoolhouseDashboard,
  },
  {
    number: "02",
    name: "HRMS (SaaS)",
    category: "Human Resources Platform",
    description:
      "A software-as-a-service HR platform bringing employee records, HR processes and workforce administration together in one web-based system.",
    technologies: ["SaaS", "Employee records", "HR processes", "Workforce administration"],
    features: [
      "Centralised employee records",
      "Digital HR processes",
      "Workforce administration",
      "Web-based access",
    ],
    status: "Request a demo",
  },
  {
    number: "03",
    name: "Nthaka Eco",
    category: "Mobile Eco-trade Platform",
    description:
      "A smart eco-trade system connecting smallholder farmers, buyers and cooperatives through a transparent marketplace.",
    technologies: ["Mobile application", "Eco-trade", "Smallholder marketplace"],
    features: [
      "Connects farmers, buyers and cooperatives",
      "Supports transparent marketplace activity",
    ],
    status: "Available on Google Play",
    link: "https://play.google.com/store/apps/details?id=com.nexacircuit.nthaka_eco",
    image: nthakaAnalytics,
  },
  {
    number: "04",
    name: "DIMT Student Management System",
    category: "Student Management System & Portal",
    description:
      "The institution's student management system and portal, supporting student registration and records while giving students access to their academic information.",
    technologies: ["Student registration", "Academic records", "Student portal"],
    features: [
      "Student records management",
      "Academic administration",
      "Student portal",
      "Database-driven information management",
    ],
    status: "Implemented",
    image: dimtDashboard,
    link: "https://dimtmw.com/login",
  },
  {
    number: "05",
    name: "DIMT eLibrary",
    category: "Digital Library & Repository",
    description:
      "An institutional digital library implemented using DSpace to provide an organised platform for accessing and managing academic resources and digital publications.",
    technologies: ["DSpace", "Local hosting", "Digital repository"],
    features: [
      "Digital resource management",
      "Institutional repository",
      "Organised academic collections",
      "Digital access to learning materials",
    ],
    status: "Implemented",
  },
 
];

const experience = [
  {
    period: "August 2022 – April 2026",
    role: "IT Officer",
    organisation: "Domasi Institute of Management and Technology",
    description:
      "Developed and maintained the student management system and student portal, set up the DSpace eLibrary, supported LAN/WAN connectivity and user devices, prepared database reports, and trained staff and students.",
  },
  {
    period: "2025 – Present",
    role: "ICT Officer",
    organisation: "HillTop Academy",
    description:
      "Handle day-to-day school ICT operations and help develop the HillTop Smart Timetable for planning teaching schedules and allocating staff and rooms.",
  },
  {
    period: "2025 – Present",
    role: "Founder & Chief Technology Officer",
    organisation: "Nexa Circuit Ltd",
    description:
      "Lead software product design and development, from client requirements and database design through implementation, deployment, maintenance and user support.",
  },
];

const skills = [
  {
    title: "Systems Development",
    items: ["Requirements", "Web applications", "Implementation", "Documentation", "Maintenance"],
  },
  {
    title: "Databases & Data Management",
    items: ["PostgreSQL", "MySQL", "Relational database design", "SQL reports", "Prisma"],
  },
  {
    title: "Infrastructure & Support",
    items: ["LAN/WAN networks", "Linux servers", "Deployments", "End-user devices", "Technical support"],
  },
  {
    title: "Security, Continuity & Training",
    items: ["Access controls", "Backups", "Data integrity", "Software updates", "User training"],
  },
  {
    title: "Development Tools",
    items: ["React", "Node.js", "Laravel / PHP", "Git", "Docker", "CI/CD"],
  },
  {
    title: "Education Systems",
    items: ["Registration", "Enrolment", "Academic records", "Assessments", "Results", "Reporting", "Libraries", "Timetabling"],
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="portfolio-section-heading">
      <span className="portfolio-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function ProjectCard({ project }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article
      className={`portfolio-project-card ${
        project.featured ? "portfolio-project-featured" : ""
      }`}
    >
      <div className="portfolio-project-image">
        {project.image && !imageFailed && (
          <img
            src={project.image}
            alt={`${project.name} application preview`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="portfolio-project-image-placeholder">
          <span>{project.number}</span>
          <strong>{project.name}</strong>
          <small>{project.category}</small>
        </div>
        {project.featured && (
          <span className="portfolio-featured-label">Featured Project</span>
        )}
      </div>

      <div className="portfolio-project-content">
        <div className="portfolio-project-topline">
          <span>{project.category}</span>
          <span className="portfolio-project-status">{project.status}</span>
        </div>

        <h3>{project.name}</h3>
        <p className="portfolio-project-description">
          {project.description}
        </p>

        <div className="portfolio-project-features">
          {project.features.map((feature) => (
            <div key={feature}>
              <span className="portfolio-check">✓</span>
              {feature}
            </div>
          ))}
        </div>

        <div className="portfolio-tech-list">
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>

        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="portfolio-project-link"
          >
            Visit project <span>↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

export default function Portfolio() {
  return (
    <main className="edgar-portfolio">
      {/* NAVIGATION */}
      <nav className="portfolio-nav">
        <a href="#home" className="portfolio-brand">
          <span className="portfolio-brand-mark">EC</span>
          <span>
            <strong>EDGAR CHINENGA</strong>
            <small>ICT OFFICER & SOFTWARE DEVELOPER</small>
          </span>
        </a>

        <div className="portfolio-nav-links">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Expertise</a>
          <a href="#contact" className="portfolio-nav-contact">
            Contact
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="portfolio-hero" id="home">
        <div className="portfolio-hero-inner">
          <div className="portfolio-hero-copy">
            <div className="portfolio-availability">
              <span></span> ICT OFFICER & SOFTWARE DEVELOPER
            </div>

            <p className="portfolio-hero-intro">Hello, I'm</p>
            <h1>
              Edgar
              <br />
              <span>Chinenga.</span>
            </h1>

            <h2>
              ICT Officer <span>·</span> Software Developer
              <span> · </span> Founder & CTO
            </h2>

            <p className="portfolio-hero-description">
              I am an ICT Officer and Software Developer with nearly five
              years of experience managing institutional ICT systems,
              networks and digital platforms. Through Nexa Circuit Ltd, I
              develop and deploy software from requirements and database
              design through implementation and ongoing support.
            </p>

            <div className="portfolio-hero-actions">
              <a href="#projects" className="portfolio-button-primary">
                Explore my work <span>↗</span>
              </a>
              <a href="#contact" className="portfolio-button-outline">
                Get in touch
              </a>
            </div>

            <div className="portfolio-hero-company">
              <span>FOUNDER & CTO</span>
              <strong>NEXA CIRCUIT LTD</strong>
            </div>
          </div>

          <div className="portfolio-hero-visual">
            <div className="portfolio-visual-frame">
              <img
                className="portfolio-visual-portrait"
                src={profileImage}
                alt="Edgar Chinenga"
              />
              <div className="portfolio-visual-caption">
                <span>ENGINEERING IDEAS INTO SOLUTIONS</span>
                <strong>Reliable technology. Practical solutions.</strong>
              </div>
              <div className="portfolio-visual-number">01 / 06</div>
            </div>
            <div className="portfolio-visual-decoration"></div>
          </div>
        </div>

        <div className="portfolio-hero-bottom">
          <span>BASED IN MALAWI</span>
          <span>SOFTWARE DEVELOPMENT</span>
          <span>ICT INFRASTRUCTURE</span>
          <span>SYSTEMS ADMINISTRATION</span>
        </div>
      </section>

      {/* ABOUT */}
      <section className="portfolio-section portfolio-about" id="about">
        <div className="portfolio-about-left">
          <SectionHeading
            eyebrow="01 — ABOUT ME"
            title="Building systems that solve real problems."
          />
        </div>

        <div className="portfolio-about-right">
          <p className="portfolio-about-lead">
            I am an ICT Officer and Software Developer with a Bachelor of
            Applied Science in Computer Engineering and nearly five years
            of experience supporting institutional technology.
          </p>
          <p>
            My work spans software development, relational database design
            and administration, Linux servers, LAN/WAN networking, end-user
            support and training. I have worked on student registration,
            academic records, assessments, results, reporting, library
            systems and timetabling.
          </p>
          <p>
            Through Nexa Circuit Ltd, I take software projects from client
            requirements and database design to deployment, maintenance and
            ongoing user support, with a focus on reliability, data accuracy
            and security.
          </p>

          <div className="portfolio-education">
            <span>EDUCATION</span>
            <div className="portfolio-education-entry">
              <strong>Bachelor of Science in Computer Engineering</strong>
              <small>University of Livingstonia — Laws Campus · Jan 2018–Jun 2022</small>
            </div>
            <div className="portfolio-education-entry">
              <strong>International General Certificate of Secondary Education</strong>
              <small>Mzuzu International Academy · Sep 2012–May 2018</small>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="portfolio-section portfolio-experience" id="experience">
        <SectionHeading
          eyebrow="02 — PROFESSIONAL EXPERIENCE"
          title="Experience across education and technology."
          description="Nearly five years of experience across institutional ICT operations, education systems and software product development."
        />

        <div className="portfolio-experience-list">
          {experience.map((item, index) => (
            <article className="portfolio-experience-item" key={item.organisation}>
              <span className="portfolio-experience-number">
                0{index + 1}
              </span>
              <div className="portfolio-experience-main">
                <span className="portfolio-experience-period">
                  {item.period}
                </span>
                <h3>{item.role}</h3>
                <h4>{item.organisation}</h4>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <section className="portfolio-section portfolio-projects" id="projects">
        <SectionHeading
          eyebrow="03 — SELECTED WORK"
          title="Systems developed and implemented."
          description="A selection of practical technology projects demonstrating my experience in software development and institutional systems implementation."
        />

        <div className="portfolio-project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.number} project={project} />
          ))}
        </div>

        <div className="portfolio-ip-notice">
          <strong>Intellectual Property Notice</strong>
          <p>
            Project information and application previews are presented
            solely to demonstrate professional experience. Source code,
            credentials, databases and proprietary technical documentation
            are not made available through this portfolio. All applicable
            intellectual property rights remain with their respective owners.
          </p>
        </div>
      </section>

      {/* SKILLS */}
      <section className="portfolio-section portfolio-skills" id="skills">
        <SectionHeading
          eyebrow="04 — TECHNICAL EXPERTISE"
          title="Technology across multiple disciplines."
          description="Practical technical capabilities developed through academic training, professional responsibilities and software projects."
        />

        <div className="portfolio-skills-grid">
          {skills.map((group, index) => (
            <article className="portfolio-skill-card" key={group.title}>
              <span>0{index + 1}</span>
              <h3>{group.title}</h3>
              <div>
                {group.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* NEXA CIRCUIT */}
      <section className="portfolio-company">
        <div className="portfolio-company-content">
          <span className="portfolio-eyebrow">TECHNOLOGY LEADERSHIP</span>
          <h2>Turning ideas into working technology.</h2>
          <p>
            Through Nexa Circuit Ltd, I lead the design and development
            of software solutions, helping organisations translate their
            operational needs into practical digital systems.
          </p>
          <a
            href="https://nexa-circuit.com"
            target="_blank"
            rel="noreferrer"
          >
            Explore Nexa Circuit <span>↗</span>
          </a>
        </div>
        <div className="portfolio-company-mark">NC.</div>
      </section>

      {/* CONTACT */}
      <section className="portfolio-section portfolio-contact" id="contact">
        <span className="portfolio-eyebrow">05 — CONTACT</span>
        <h2>Let's connect.</h2>
        <p>
          For professional enquiries, technology projects and
          collaboration opportunities, feel free to get in touch.
        </p>

        <div className="portfolio-contact-links">
          <a href="mailto:edgarchinenga@gmail.com">
            <span>Email</span>
            edgarchinenga@gmail.com ↗
          </a>
          <a href="tel:+265885435964">
            <span>Telephone</span>
            +265 885 435 964 / +265 994 826 129 ↗
          </a>
          <a
            href="https://nexa-circuit.com"
            target="_blank"
            rel="noreferrer"
          >
            <span>Company</span>
            Nexa Circuit Ltd ↗
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="portfolio-footer">
        <div>
          <strong>EDGAR CHINENGA</strong>
          <span>ICT Officer & Software Developer</span>
        </div>
        <p>
          © {new Date().getFullYear()} Edgar Chinenga. All rights reserved.
        </p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </main>
  );
}

