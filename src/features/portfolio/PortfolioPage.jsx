
import React from "react";
import { useEffect, useRef, useState } from "react";
import "./portfolio.css";
import edgarPortrait from "../../assets/EdgarChinenga.jpg";
import schoolhouseDashboard from "../../assets/images/school-mgt-screenshots/screenshot2.png";
import schoolhouseReport from "../../assets/images/school-mgt-screenshots/screenshot3.png";
import schoolhouseAssessments from "../../assets/images/school-mgt-screenshots/screenshot4.png";
import dimtDashboard from "../../assets/images/DMIT-Screenshots/Screenshot2.png";
import dimtRecords from "../../assets/images/DMIT-Screenshots/Screenshot5.png";
import dimtAssessments from "../../assets/images/DMIT-Screenshots/Screenshot11.png";
import nthakaDashboard from "../../assets/images/Nthaka-Screenshots/Screenshot2.png";
import nthakaSales from "../../assets/images/Nthaka-Screenshots/Screenshot3.png";
import nthakaDiseases from "../../assets/images/Nthaka-Screenshots/Screenshot5.png";
import nthakaAnalytics from "../../assets/images/Nthaka-Screenshots/Screenshot8.png";

const projects = [
  {
    number: "01",
    name: "Schoolhouse",
    category: "School Management System",
    description:
      "A comprehensive school management and academic reporting platform designed to simplify student administration, assessment management and academic reporting.",
    technologies: ["React", "Node.js", "Express", "PostgreSQL", "Prisma"],
    images: [
      { src: schoolhouseDashboard, alt: "Schoolhouse dashboard" },
      { src: schoolhouseReport, alt: "Schoolhouse student report preview" },
      { src: schoolhouseAssessments, alt: "Schoolhouse assessment management" },
    ],
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
    name: "Nexa Circuit HRMS",
    category: "Human Resource Management SaaS",
    description:
      "A web-based HR platform that brings employee records, HR processes and workforce administration into one system.",
    technologies: [],
    features: [
      "Employee records",
      "Workforce administration",
      "HR process management",
      "SaaS delivery",
    ],
    status: "Request a demo",
    image: "/portfolio/hrms.png",
  },
  {
    number: "03",
    name: "Nthaka Eco",
    category: "Mobile Agricultural Marketplace",
    description:
      "A smart eco-trade mobile app connecting smallholder farmers, buyers and cooperatives through a transparent marketplace.",
    technologies: ["Mobile app", "Digital marketplace"],
    images: [
      { src: nthakaDashboard, alt: "Nthaka Eco mobile app dashboard" },
      { src: nthakaSales, alt: "Nthaka Eco sales screen" },
      { src: nthakaDiseases, alt: "Nthaka Eco plant disease screen" },
      { src: nthakaAnalytics, alt: "Nthaka Eco analytics screen" },
    ],
    features: [
      "Connects smallholder farmers and buyers",
      "Cooperative participation",
      "Transparent eco-trade marketplace",
    ],
    status: "Available on Google Play",
    link: "https://play.google.com/store/apps/details?id=com.nexacircuit.nthaka_eco",
    image: "/portfolio/nthaka-eco.png",
  },
  {
    number: "04",
    name: "DIMT Student Management System",
    category: "Institutional Information System",
    description:
      "The institution's student registration and records system, with a portal where students can view their academic information.",
    technologies: [],
    images: [
      { src: dimtDashboard, alt: "DIMT student management dashboard" },
      { src: dimtRecords, alt: "DIMT student records and enrolment" },
      { src: dimtAssessments, alt: "DIMT academic results screen" },
    ],
    features: [
      "Student records management",
      "Academic administration",
      "Student portal",
      "Database-driven information management",
    ],
    status: "Implemented",
    link: "https://dimtmw.com/login",
    image: "/portfolio/dimt-sms.png",
  },
  {
    number: "05",
    name: "DIMT eLibrary",
    category: "Digital Library & Repository",
    description:
      "A locally hosted DSpace digital library that organises institutional learning resources and makes them easy to find.",
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

];

const experience = [
  {
    period: "2025 – Present",
    role: "CoFounder & Chief Technology Officer",
    organisation: "Nexa Circuit Ltd",
    description:
      "Lead software product design and development, including Schoolhouse. Own application architecture, database design, deployment and maintenance, and support project delivery and clients.",
  },
  {
    period: "April 2026 – November 2026",
    role: "ICT Support & Software Development",
    organisation: "HillTop Academy",
    description:
      "Handle day-to-day school ICT operations and staff support, and help develop the HillTop Smart Timetable for planning schedules and assigning staff and rooms.",
  },
  {
    period: "August 2022 – April 2026",
    role: "ICT Officer",
    organisation: "Domasi Institute of Management and Technology",
    description:
      "Developed and maintained the Student Management System, student portal and DSpace eLibrary; supported LAN/WAN, devices, databases, reporting, backups, access management, and staff and student training. Also taught computing and practical mathematics.",
  },
];

const skills = [
  {
    title: "Systems Development",
    items: ["React", "Node.js", "Express.js", "Laravel / PHP", "Requirements", "Documentation", "Maintenance"],
  },
  {
    title: "Databases & Data Management",
    items: ["PostgreSQL", "MySQL", "Prisma", "Database Design", "SQL Reporting"],
  },
  {
    title: "Infrastructure & Systems",
    items: ["LAN / WAN", "Linux Servers", "Deployments", "End-user Devices", "Docker"],
  },
  {
    title: "Security & User Support",
    items: ["Access Controls", "Backups", "Data Protection", "Git", "CI/CD", "User Training"],
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
  const [activeImage, setActiveImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const dialogRef = useRef(null);
  const hasGallery = project.images?.length > 0 && !imageFailed;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (modalOpen && !dialog.open) dialog.showModal();
    if (!modalOpen && dialog.open) dialog.close();
  }, [modalOpen]);

  const showPreviousImage = () => {
    setActiveImage((current) =>
      (current - 1 + project.images.length) % project.images.length,
    );
  };

  const showNextImage = () => {
    setActiveImage((current) => (current + 1) % project.images.length);
  };

  return (
    <article
      className={`portfolio-project-card ${
        project.featured ? "portfolio-project-featured" : ""
      }`}
    >
      <div className="portfolio-project-image">
        {hasGallery && (
          <>
            <div
              className="portfolio-project-image-gallery"
              aria-roledescription="carousel"
              aria-label={`${project.name} screenshots`}
            >
              <button
                type="button"
                className="portfolio-image-open"
                onClick={() => setModalOpen(true)}
                aria-label={`Open ${project.name} screenshot ${activeImage + 1} in full view`}
              >
                <div
                  className="portfolio-project-image-track"
                  style={{ transform: `translateX(-${activeImage * 100}%)` }}
                  aria-live="polite"
                >
                  {project.images.map((image, index) => (
                    <img
                      key={image.src}
                      src={image.src}
                      alt={image.alt}
                      loading={index === activeImage ? "eager" : "lazy"}
                      onError={() => setImageFailed(true)}
                    />
                  ))}
                </div>
              </button>
            </div>
            {project.images.length > 1 && (
              <div className="portfolio-project-image-controls">
                <button
                  type="button"
                  className="portfolio-image-arrow"
                  onClick={showPreviousImage}
                  aria-label={`Previous ${project.name} screenshot`}
                >
                  ‹
                </button>
                <div className="portfolio-image-pagination" aria-label="Choose screenshot">
                  {project.images.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      className={index === activeImage ? "active" : ""}
                      onClick={() => setActiveImage(index)}
                      aria-label={`Show screenshot ${index + 1} of ${project.images.length}`}
                      aria-current={index === activeImage ? "true" : undefined}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="portfolio-image-arrow"
                  onClick={showNextImage}
                  aria-label={`Next ${project.name} screenshot`}
                >
                  ›
                </button>
              </div>
            )}
          </>
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

      <dialog
        ref={dialogRef}
        className="portfolio-image-modal"
        aria-label={`${project.name} screenshot viewer`}
        onClose={() => setModalOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setModalOpen(false);
        }}
      >
        <div className="portfolio-image-modal-content">
          <div className="portfolio-image-modal-header">
            <div>
              <strong>{project.name}</strong>
              <span>{activeImage + 1} / {project.images?.length ?? 0}</span>
            </div>
            <button
              type="button"
              className="portfolio-image-modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close image viewer"
              autoFocus
            >
              ×
            </button>
          </div>
          <div className="portfolio-image-modal-stage">
            <img
              src={project.images?.[activeImage]?.src}
              alt={project.images?.[activeImage]?.alt ?? `${project.name} preview`}
            />
            {project.images?.length > 1 && (
              <>
                <button
                  type="button"
                  className="portfolio-image-modal-arrow previous"
                  onClick={showPreviousImage}
                  aria-label={`Previous ${project.name} screenshot`}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="portfolio-image-modal-arrow next"
                  onClick={showNextImage}
                  aria-label={`Next ${project.name} screenshot`}
                >
                  ›
                </button>
              </>
            )}
          </div>
          <p className="portfolio-image-modal-caption">
            {project.images?.[activeImage]?.alt}
          </p>
        </div>
      </dialog>
    </article>
  );
}

export default function Portfolio() {
  return (
    <main className="edgar-portfolio">
      {/* NAVIGATION */}
      <nav className="portfolio-nav">
        <a href="#home" className="portfolio-brand">
          <img
            className="portfolio-brand-photo"
            src={edgarPortrait}
            alt="Edgar Chinenga"
          />
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
             <span>·</span> Software Developer
              <span> · </span> Computer Engineer
            </h2>

            <p className="portfolio-hero-description">
              I’m Software Developer with nearly five
              years of experience managing institutional ICT systems,
              networks and digital platforms. Through Nexa Circuit Ltd,
              I take software projects from requirements and database
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
              <span>COFOUNDER & CTO</span>
              <strong>NEXA CIRCUIT LTD</strong>
            </div>
          </div>

          <div className="portfolio-hero-visual">
            <div className="portfolio-visual-frame">
              <img
                className="portfolio-visual-portrait"
                src={edgarPortrait}
                alt="Edgar Chinenga"
              />
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
          <span>MALAWIAN COMPUTER ENGINEER</span>
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
            I’m an Software Developer with a Bachelor’s
            degree in Computer Engineering and nearly five years of
            experience managing institutional ICT systems and digital
            platforms.
          </p>
          <p>
            I build and support systems across the full project lifecycle,
            from requirements and relational database design to
            implementation, documentation and maintenance. My experience
            includes student registration and records, assessments,
            results, reporting, library systems and timetabling.
          </p>
          <p>
            I value reliable systems, accurate data, security and practical
            solutions. I also support and train users, helping staff and
            students get confident with the technology they use.
          </p>

          <div className="portfolio-education">
            <span>EDUCATION</span>
            <strong>BSc in Computer Engineering</strong>
            <small>University of Livingstonia, 2018 – 2022</small>
            <small>IGCSE · Mzuzu International Academy, 2012 – 2018</small>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="portfolio-section portfolio-experience" id="experience">
        <SectionHeading
          eyebrow="02 — PROFESSIONAL EXPERIENCE"
          title="Building and supporting institutional technology."
          description="Experience in software delivery, school ICT operations, institutional systems, infrastructure and user support."
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
            +265 885 435 964 ↗
          </a>
          <a href="tel:+265994826129">
            <span>Telephone</span>
            +265 994 826 129 ↗
          </a>
          <a
            href="https://nc.nexa-circuit.com/edgar-chinenga"
            target="_blank"
            rel="noreferrer"
          >
            <span>Portfolio</span>
            nc.nexa-circuit.com/edgar-chinenga ↗
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="portfolio-footer">
        <div>
          <strong>EDGAR CHINENGA</strong>
          <span>ICT Officer · Software Developer · Computer Engineer</span>
        </div>
        <p>
          © {new Date().getFullYear()} Edgar Chinenga. All rights reserved.
        </p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </main>
  );
}
