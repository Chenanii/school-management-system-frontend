
import React from "react";
import { useState } from "react";
import "./portfolio.css";

const projects = [
  {
    number: "01",
    name: "Schoolhouse",
    category: "School Management System",
    description:
      "A comprehensive school management and academic reporting platform designed to simplify student administration, assessment management and academic reporting.",
    technologies: ["React", "Node.js", "Express", "PostgreSQL", "Prisma"],
    features: [
      "Student and enrolment management",
      "Academic years, classes and teaching assignments",
      "Assessment and results management",
      "Term reports and academic progression",
      "Role-based access control",
    ],
    status: "Active development & implementation",
    featured: true,
    link: "https://nc.nexa-circuit.com",
    image: "/portfolio/schoolhouse-dashboard.png",
  },
  {
    number: "02",
    name: "DIMT Student Management System",
    category: "Institutional Information System",
    description:
      "A web-based student management platform developed to support academic administration, student records and institutional information management at Domasi Institute of Management and Technology.",
    technologies: ["PHP", "Laravel", "MySQL", "JavaScript"],
    features: [
      "Student records management",
      "Academic administration",
      "Student portal",
      "Database-driven information management",
    ],
    status: "Implemented",
    image: "/portfolio/dimt-sms.png",
  },
  {
    number: "03",
    name: "DIMT eLibrary",
    category: "Digital Library & Repository",
    description:
      "An institutional digital library implemented using DSpace to provide an organised platform for accessing and managing academic resources and digital publications.",
    technologies: ["DSpace", "Java", "Angular", "Linux"],
    features: [
      "Digital resource management",
      "Institutional repository",
      "Organised academic collections",
      "Digital access to learning materials",
    ],
    status: "Implemented",
    image: "/portfolio/dimt-elibrary.png",
  },
  {
    number: "04",
    name: "HillTop Smart Timetable",
    category: "School Scheduling Solution",
    description:
      "A school timetable management solution developed to support the organisation of teaching periods, teacher allocations, room utilisation and examination invigilation schedules.",
    technologies: ["React", "Vite", "Tailwind CSS", "Node.js", "MySQL"],
    features: [
      "Teacher and subject scheduling",
      "Timetable management",
      "Room allocation",
      "Invigilation scheduling",
      "Teaching cover coordination",
    ],
    status: "Developed for school operations",
    image: "/portfolio/hilltop-timetable.png",
  },
];

const experience = [
  {
    period: "Professional experience",
    role: "IT Officer",
    organisation: "Domasi Institute of Management and Technology",
    description:
      "Worked on institutional ICT operations, infrastructure, technical support and the development and implementation of student information systems and a digital library.",
  },
  {
    period: "Professional experience",
    role: "IT Officer",
    organisation: "HillTop Academy",
    description:
      "Supported school ICT operations and worked on technology solutions addressing institutional scheduling and administrative requirements.",
  },
  {
    period: "2025 – Present",
    role: "Founder & Chief Technology Officer",
    organisation: "Nexa Circuit Ltd",
    description:
      "Leading software development and technology solutions, including systems design, database development, deployment and technical project delivery.",
  },
];

const skills = [
  {
    title: "Software Development",
    items: ["React", "JavaScript", "Node.js", "Express.js", "PHP", "Laravel", ".NET"],
  },
  {
    title: "Databases & Data Management",
    items: ["PostgreSQL", "MySQL", "Prisma ORM", "Database Design", "SQL"],
  },
  {
    title: "Infrastructure & Systems",
    items: ["Linux Administration", "Windows Environments", "Networking", "Server Management", "Docker"],
  },
  {
    title: "Security & Development Operations",
    items: ["Cybersecurity Principles", "Access Control", "Git & GitHub", "CI/CD", "Backup Management"],
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
        {!imageFailed && (
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
            <small>TECHNOLOGY PROFESSIONAL</small>
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
              <span></span> COMPUTER ENGINEERING & TECHNOLOGY
            </div>

            <p className="portfolio-hero-intro">Hello, I'm</p>
            <h1>
              Edgar
              <br />
              <span>Chinenga.</span>
            </h1>

            <h2>
              IT Professional <span>·</span> Systems Developer
              <span> · </span> Technology Leader
            </h2>

            <p className="portfolio-hero-description">
              I design, develop and implement technology solutions that
              help organisations work smarter. My experience combines
              software engineering, institutional ICT operations,
              infrastructure management and systems administration.
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
              <div className="portfolio-visual-monogram">EC</div>
              <div className="portfolio-visual-caption">
                <span>ENGINEERING IDEAS INTO SOLUTIONS</span>
                <strong>Technology with purpose.</strong>
              </div>
              <div className="portfolio-visual-number">01 / 04</div>
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
            I am a Computer Engineering graduate with practical experience
            in developing, implementing and supporting technology systems
            in institutional and educational environments.
          </p>
          <p>
            My work spans software development, database management,
            server administration, networking and end-user support. Having
            worked within educational institutions, I understand the
            importance of reliable ICT infrastructure and systems that
            support everyday academic and administrative activities.
          </p>
          <p>
            Through Nexa Circuit Ltd, I continue to lead the development
            of digital solutions, combining technical knowledge with
            practical problem-solving and project delivery.
          </p>

          <div className="portfolio-education">
            <span>ACADEMIC QUALIFICATION</span>
            <strong>BSc Computer Engineering</strong>
            <small>University of Livingstonia</small>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="portfolio-section portfolio-experience" id="experience">
        <SectionHeading
          eyebrow="02 — PROFESSIONAL EXPERIENCE"
          title="Experience across education and technology."
          description="My professional experience combines institutional ICT responsibilities with software development and technology leadership."
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
          <a href="mailto:YOUR_EMAIL@example.com">
            <span>Email</span>
            YOUR_EMAIL@example.com ↗
          </a>
          <a href="tel:+265XXXXXXXXX">
            <span>Telephone</span>
            +265 XXX XXX XXX ↗
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
          <span>Technology Professional & Systems Developer</span>
        </div>
        <p>
          © {new Date().getFullYear()} Edgar Chinenga. All rights reserved.
        </p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </main>
  );
}
