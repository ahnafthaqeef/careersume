import type { ResumeContent, TemplateName } from "@/types";

export function renderResumeHTML(
  content: ResumeContent,
  template: TemplateName
): string {
  switch (template) {
    case "experienced":
      return renderExperienced(content);
    case "entry-level":
      return renderEntryLevel(content);
    case "modern":
      return renderModern(content);
    case "executive":
      return renderExecutive(content);
    case "creative":
      return renderCreative(content);
    case "minimal":
      return renderMinimal(content);
    case "tech":
      return renderTech(content);
    case "compact":
      return renderCompact(content);
    case "professional":
      return renderProfessional(content);
    case "elegant":
      return renderElegant(content);
    default:
      return renderExperienced(content);
  }
}

function esc(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildClassicContactParts(p: ResumeContent["personalInfo"]): string {
  return [
    p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : "",
    p.phone ? esc(p.phone) : "",
    p.location ? esc(p.location) : "",
    p.linkedin
      ? `<a href="${esc(p.linkedin)}" target="_blank">LinkedIn</a>`
      : "",
    p.github
      ? `<a href="${esc(p.github)}" target="_blank">GitHub</a>`
      : "",
    p.website
      ? `<a href="${esc(p.website)}" target="_blank">Portfolio</a>`
      : "",
  ]
    .filter(Boolean)
    .join(" &bull; ");
}

function buildWorkHTML(c: ResumeContent): string {
  return (c.workExperience ?? [])
    .map(
      (w) => `
    <div class="entry">
      <div class="entry-header">
        <div class="entry-left">
          <span class="entry-title">${esc(w.title)}</span> &mdash; <span class="entry-org">${esc(w.company)}</span>
          ${w.location ? `<span class="entry-location">, ${esc(w.location)}</span>` : ""}
        </div>
        <div class="entry-date">${esc(w.startDate)} &ndash; ${esc(w.endDate)}</div>
      </div>
      <ul class="bullets">
        ${(w.bullets ?? []).map((b) => `<li>${esc(b)}</li>`).join("")}
      </ul>
    </div>`
    )
    .join("");
}

function buildEducHTML(c: ResumeContent): string {
  return (c.education ?? [])
    .map(
      (e) => `
    <div class="entry">
      <div class="entry-header">
        <div class="entry-left">
          <span class="entry-title">${esc(e.degree)} in ${esc(e.field)}</span> &mdash; <span class="entry-org">${esc(e.institution)}</span>
          ${e.gpa ? `<span class="entry-gpa"> &bull; GPA: ${esc(e.gpa)}</span>` : ""}
          ${e.honors ? `<span class="entry-honors"> &bull; ${esc(e.honors)}</span>` : ""}
        </div>
        <div class="entry-date">${esc(e.graduationDate)}</div>
      </div>
    </div>`
    )
    .join("");
}

function buildProjHTML(c: ResumeContent): string {
  return (c.projects ?? [])
    .map(
      (proj) => `
    <div class="entry">
      <div class="entry-header">
        <div class="entry-left">
          <span class="entry-title">${esc(proj.name)}</span>
          ${proj.url ? ` &mdash; <a href="${esc(proj.url)}" target="_blank" class="entry-link">${esc(proj.url)}</a>` : ""}
        </div>
        <div class="entry-tech">${(proj.technologies ?? []).map(esc).join(", ")}</div>
      </div>
      <ul class="bullets">
        ${(proj.bullets ?? []).map((b) => `<li>${esc(b)}</li>`).join("")}
      </ul>
    </div>`
    )
    .join("");
}

function buildCertHTML(c: ResumeContent): string {
  return (c.certifications ?? [])
    .map(
      (cert) => `
    <div class="cert-item">
      <strong>${esc(cert.name)}</strong> &mdash; ${esc(cert.issuer)} <span class="cert-date">(${esc(cert.date)})</span>
    </div>`
    )
    .join("");
}

const classicStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #1a1a1a;
    background: white;
    padding: 0.75in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  a { color: inherit; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px; }
  .profile-pic { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ccc; flex-shrink: 0; }
  .header-text { flex: 1; }
  .name { font-size: 22pt; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .contact { font-size: 9.5pt; color: #444; }

  .section { margin-bottom: 14px; }
  .section-title {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1.5px solid #1a1a1a;
    padding-bottom: 2px;
    margin-bottom: 8px;
  }

  .summary { font-size: 10.5pt; color: #333; line-height: 1.5; text-align: justify; }

  .entry { margin-bottom: 10px; }
  .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
  .entry-left { flex: 1; }
  .entry-title { font-weight: bold; }
  .entry-org { font-style: italic; }
  .entry-location, .entry-gpa, .entry-honors { font-size: 10pt; }
  .entry-date { font-size: 10pt; color: #555; white-space: nowrap; margin-left: 12px; }
  .entry-tech { font-size: 9.5pt; color: #555; white-space: nowrap; margin-left: 12px; font-style: italic; }
  .entry-link { font-size: 9.5pt; }

  .bullets { padding-left: 18px; margin-top: 3px; }
  .bullets li { font-size: 10.5pt; margin-bottom: 2px; color: #222; text-align: justify; }

  .skills-grid { display: flex; flex-wrap: wrap; gap: 4px 8px; }
  .skill-tag {
    font-size: 10pt;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 1px 7px;
    color: #333;
  }

  .cert-item { font-size: 10.5pt; margin-bottom: 5px; }
  .cert-date { color: #555; }

  .references-note { font-size: 10.5pt; color: #555; font-style: italic; }

  @media print {
    body { padding: 0.4in; margin: 0; }
    a { text-decoration: none; color: inherit; }
    .entry { page-break-inside: avoid; }
    .section { page-break-inside: avoid; }
    @page { margin: 0; size: Letter; }
  }
`;

function renderExperienced(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contactParts = buildClassicContactParts(p);
  const workHTML = buildWorkHTML(c);
  const educHTML = buildEducHTML(c);
  const projHTML = buildProjHTML(c);
  const certHTML = buildCertHTML(c);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.name)} - Resume</title>
<style>${classicStyles}</style>
</head>
<body>
  <div class="header">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" class="profile-pic" />` : ""}
    <div class="header-text">
      <div class="name">${esc(p.name)}</div>
      <div class="contact">${contactParts}</div>
    </div>
  </div>

  ${
    c.summary
      ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${esc(c.summary)}</div>
  </div>`
      : ""
  }

  ${
    (c.workExperience ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Work Experience</div>
    ${workHTML}
  </div>`
      : ""
  }

  ${
    (c.projects ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Projects</div>
    ${projHTML}
  </div>`
      : ""
  }

  ${
    (c.skills ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-grid">
      ${(c.skills ?? []).map((s) => `<span class="skill-tag">${esc(s)}</span>`).join("")}
    </div>
  </div>`
      : ""
  }

  ${
    (c.education ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${educHTML}
  </div>`
      : ""
  }

  ${
    (c.certifications ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    ${certHTML}
  </div>`
      : ""
  }

  <div class="section">
    <div class="section-title">References</div>
    <div class="references-note">Available upon request</div>
  </div>
</body>
</html>`;
}

// ── Modern Template ───────────────────────────────────────────────────────────
// Two-column: dark sidebar (left) + main content (right)

const modernStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1e2532; background: white; }
  a { color: inherit; text-decoration: none; }
  .page { display: flex; min-height: 100vh; }
  .sidebar { width: 36%; background: #1e2d40; color: #c8d6e5; padding: 36px 22px; flex-shrink: 0; }
  .profile-pic { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.2); display: block; margin: 0 auto 18px; }
  .sb-name { font-size: 16pt; font-weight: 700; color: #ffffff; text-align: center; line-height: 1.2; margin-bottom: 4px; }
  .sb-section-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #4db8c8; border-bottom: 1px solid rgba(77,184,200,0.3); padding-bottom: 4px; margin-bottom: 10px; margin-top: 22px; }
  .sb-item { font-size: 9.5pt; margin-bottom: 6px; color: #b8cad9; display: flex; align-items: flex-start; gap: 6px; }
  .sb-item-icon { color: #4db8c8; flex-shrink: 0; margin-top: 1px; }
  .sb-item a { color: #b8cad9; } .sb-item a:hover { color: #fff; }
  .skill-pill { display: inline-block; background: rgba(77,184,200,0.15); border: 1px solid rgba(77,184,200,0.3); color: #c8d6e5; border-radius: 3px; padding: 2px 8px; font-size: 9pt; margin: 2px 2px 2px 0; }
  .main { flex: 1; padding: 32px 28px; background: #ffffff; }
  .main-hero { border-left: 4px solid #4db8c8; padding-left: 14px; margin-bottom: 24px; }
  .main-hero-title { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #4db8c8; margin-bottom: 6px; }
  .main-summary { font-size: 10pt; color: #3a4a5c; line-height: 1.6; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1e2d40; border-bottom: 2px solid #4db8c8; padding-bottom: 3px; margin-bottom: 12px; }
  .entry { margin-bottom: 12px; }
  .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
  .entry-left { flex: 1; }
  .entry-title { font-weight: 700; color: #1e2d40; font-size: 10.5pt; }
  .entry-org { color: #4db8c8; font-size: 9.5pt; font-weight: 600; }
  .entry-location { color: #7a8fa6; font-size: 9pt; }
  .entry-date { font-size: 9pt; color: #7a8fa6; white-space: nowrap; margin-left: 10px; background: #f0f6fa; padding: 1px 7px; border-radius: 3px; }
  .entry-tech { font-size: 9pt; color: #7a8fa6; margin-left: 10px; white-space: nowrap; font-style: italic; }
  .bullets { padding-left: 16px; margin-top: 4px; }
  .bullets li { font-size: 10pt; margin-bottom: 3px; color: #2d3e50; }
  @media print {
    .sidebar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; size: A4; }
  }
`;

function renderModern(c: ResumeContent): string {
  const { personalInfo: p } = c;

  const contactItems = [
    p.email ? `<div class="sb-item"><span class="sb-item-icon">✉</span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>` : "",
    p.phone ? `<div class="sb-item"><span class="sb-item-icon">☎</span>${esc(p.phone)}</div>` : "",
    p.location ? `<div class="sb-item"><span class="sb-item-icon">⊙</span>${esc(p.location)}</div>` : "",
    p.linkedin ? `<div class="sb-item"><span class="sb-item-icon">in</span><a href="${esc(p.linkedin)}" target="_blank">LinkedIn</a></div>` : "",
    p.github ? `<div class="sb-item"><span class="sb-item-icon">↗</span><a href="${esc(p.github)}" target="_blank">GitHub</a></div>` : "",
    p.website ? `<div class="sb-item"><span class="sb-item-icon">⊛</span><a href="${esc(p.website)}" target="_blank">Portfolio</a></div>` : "",
  ].filter(Boolean).join("");

  const skillsHTML = (c.skills ?? []).length > 0
    ? `<div class="sb-section-title">Skills</div><div>${(c.skills ?? []).map(s => `<span class="skill-pill">${esc(s)}</span>`).join("")}</div>`
    : "";

  const educSbHTML = (c.education ?? []).length > 0
    ? `<div class="sb-section-title">Education</div>` +
      (c.education ?? []).map(e => `
        <div style="margin-bottom:12px;">
          <div style="color:#ffffff;font-weight:700;font-size:9.5pt;">${esc(e.degree)}</div>
          <div style="font-size:9pt;color:#b8cad9;">${esc(e.field)}</div>
          <div style="font-size:9pt;color:#4db8c8;">${esc(e.institution)}</div>
          <div style="font-size:9pt;color:#b8cad9;">${esc(e.graduationDate)}${e.gpa ? ` · GPA ${esc(e.gpa)}` : ""}</div>
        </div>`).join("")
    : "";

  const certSbHTML = (c.certifications ?? []).length > 0
    ? `<div class="sb-section-title">Certifications</div>` +
      (c.certifications ?? []).map(cert => `
        <div style="margin-bottom:10px;">
          <div style="color:#ffffff;font-size:9.5pt;font-weight:600;">${esc(cert.name)}</div>
          <div style="font-size:9pt;color:#4db8c8;">${esc(cert.issuer)}</div>
          <div style="font-size:9pt;color:#b8cad9;">${esc(cert.date)}</div>
        </div>`).join("")
    : "";

  const workHTML = (c.workExperience ?? []).length > 0
    ? `<div class="section">
        <div class="section-title">Experience</div>
        ${(c.workExperience ?? []).map(w => `
          <div class="entry">
            <div class="entry-header">
              <div class="entry-left">
                <div class="entry-title">${esc(w.title)}</div>
                <div><span class="entry-org">${esc(w.company)}</span>${w.location ? ` <span class="entry-location">· ${esc(w.location)}</span>` : ""}</div>
              </div>
              <div class="entry-date">${esc(w.startDate)} – ${esc(w.endDate)}</div>
            </div>
            <ul class="bullets">${(w.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul>
          </div>`).join("")}
      </div>` : "";

  const projHTML = (c.projects ?? []).length > 0
    ? `<div class="section">
        <div class="section-title">Projects</div>
        ${(c.projects ?? []).map(proj => `
          <div class="entry">
            <div class="entry-header">
              <div class="entry-left">
                <div class="entry-title">${esc(proj.name)}${proj.url ? ` <a href="${esc(proj.url)}" target="_blank" style="font-size:9pt;font-weight:400;color:#4db8c8;">[link]</a>` : ""}</div>
                <div class="entry-location">${esc(proj.description)}</div>
              </div>
              <div class="entry-tech">${(proj.technologies ?? []).slice(0, 4).map(esc).join(" · ")}</div>
            </div>
            <ul class="bullets">${(proj.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul>
          </div>`).join("")}
      </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(p.name)} - Resume</title>
<style>${modernStyles}</style>
</head>
<body>
<div class="page">
  <div class="sidebar">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" class="profile-pic" />` : ""}
    <div class="sb-name">${esc(p.name)}</div>
    <div style="margin-top:18px;">
      <div class="sb-section-title">Contact</div>
      ${contactItems}
    </div>
    ${skillsHTML}
    ${educSbHTML}
    ${certSbHTML}
  </div>
  <div class="main">
    ${c.summary ? `<div class="main-hero"><div class="main-hero-title">Professional Summary</div><div class="main-summary">${esc(c.summary)}</div></div>` : ""}
    ${workHTML}
    ${projHTML}
  </div>
</div>
</body>
</html>`;
}

function renderEntryLevel(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contactParts = buildClassicContactParts(p);
  const workHTML = buildWorkHTML(c);
  const educHTML = buildEducHTML(c);
  const projHTML = buildProjHTML(c);
  const certHTML = buildCertHTML(c);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.name)} - Resume</title>
<style>${classicStyles}</style>
</head>
<body>
  <div class="header">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" class="profile-pic" />` : ""}
    <div class="header-text">
      <div class="name">${esc(p.name)}</div>
      <div class="contact">${contactParts}</div>
    </div>
  </div>

  ${
    c.summary
      ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${esc(c.summary)}</div>
  </div>`
      : ""
  }

  ${
    (c.education ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${educHTML}
  </div>`
      : ""
  }

  ${
    (c.workExperience ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Work Experience</div>
    ${workHTML}
  </div>`
      : ""
  }

  ${
    (c.projects ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Projects</div>
    ${projHTML}
  </div>`
      : ""
  }

  ${
    (c.skills ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-grid">
      ${(c.skills ?? []).map((s) => `<span class="skill-tag">${esc(s)}</span>`).join("")}
    </div>
  </div>`
      : ""
  }

  ${
    (c.certifications ?? []).length > 0
      ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    ${certHTML}
  </div>`
      : ""
  }

  <div class="section">
    <div class="section-title">References</div>
    <div class="references-note">Available upon request</div>
  </div>
</body>
</html>`;
}

// ── Executive Template ────────────────────────────────────────────────────────
// Centered header, double rule, formal serif — C-suite / directors
const executiveStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Garamond', 'Book Antiqua', Georgia, serif; font-size: 11pt; line-height: 1.45; color: #1a1a1a; background: #fff; padding: 0.7in 0.85in; max-width: 8.5in; margin: 0 auto; }
  a { color: inherit; text-decoration: none; }
  .header { text-align: center; margin-bottom: 18px; }
  .name { font-size: 26pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
  .contact { font-size: 9.5pt; color: #555; letter-spacing: 0.3px; }
  .rule-double { border: none; border-top: 3px double #1a1a1a; margin: 14px 0 16px; }
  .rule-single { border: none; border-top: 1px solid #999; margin: 12px 0 14px; }
  .section-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; margin-bottom: 9px; text-align: center; }
  .summary { font-size: 10.5pt; color: #333; line-height: 1.6; text-align: justify; }
  .entry { margin-bottom: 12px; }
  .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
  .entry-left { flex: 1; }
  .entry-title { font-weight: bold; font-size: 10.5pt; }
  .entry-org { font-style: italic; }
  .entry-date { font-size: 9.5pt; color: #666; white-space: nowrap; margin-left: 12px; }
  .bullets { padding-left: 20px; margin-top: 3px; }
  .bullets li { font-size: 10.5pt; margin-bottom: 2px; color: #222; }
  .skills-row { font-size: 10.5pt; color: #333; line-height: 1.7; }
  .cert-item { font-size: 10.5pt; margin-bottom: 4px; }
  @media print { body { padding: 0.5in 0.6in; } @page { margin: 0; size: Letter; } }
`;

function renderExecutive(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contact = buildClassicContactParts(p);
  const workHTML = buildWorkHTML(c);
  const projHTML = buildProjHTML(c);
  const certHTML = buildCertHTML(c);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} - Resume</title><style>${executiveStyles}</style></head><body>
  <div class="header">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #ccc;display:block;margin:0 auto 10px;" />` : ""}
    <div class="name">${esc(p.name)}</div>
    <div class="contact">${contact}</div>
  </div>
  <hr class="rule-double" />
  ${c.summary ? `<div class="summary">${esc(c.summary)}</div><hr class="rule-single" />` : ""}
  ${(c.workExperience ?? []).length > 0 ? `<div class="section-title">Professional Experience</div>${workHTML}<hr class="rule-single" />` : ""}
  ${(c.education ?? []).length > 0 ? `<div class="section-title">Education</div>${(c.education ?? []).map(e => `<div class="entry"><div class="entry-header"><div class="entry-left"><span class="entry-title">${esc(e.degree)} in ${esc(e.field)}</span>, <span class="entry-org">${esc(e.institution)}</span>${e.gpa ? ` &bull; GPA ${esc(e.gpa)}` : ""}</div><div class="entry-date">${esc(e.graduationDate)}</div></div></div>`).join("")}<hr class="rule-single" />` : ""}
  ${(c.skills ?? []).length > 0 ? `<div class="section-title">Core Competencies</div><div class="skills-row">${(c.skills ?? []).join(" &bull; ")}</div><hr class="rule-single" />` : ""}
  ${(c.projects ?? []).length > 0 ? `<div class="section-title">Key Projects</div>${projHTML}<hr class="rule-single" />` : ""}
  ${(c.certifications ?? []).length > 0 ? `<div class="section-title">Certifications</div>${certHTML}<hr class="rule-single" />` : ""}
  <div style="font-size:10.5pt;color:#666;font-style:italic;text-align:center;">References available upon request</div>
</body></html>`;
}

// ── Creative Template ─────────────────────────────────────────────────────────
// Left purple sidebar + white main — designers, marketing, creative roles
const creativeStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1e1e2e; background: #fff; }
  a { color: inherit; text-decoration: none; }
  .page { display: flex; min-height: 100vh; }
  .sidebar { width: 32%; background: #5b21b6; color: #ede9fe; padding: 36px 20px; flex-shrink: 0; }
  .sb-pic { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.3); display: block; margin: 0 auto 14px; }
  .sb-name { font-size: 17pt; font-weight: 800; color: #fff; text-align: center; line-height: 1.2; }
  .sb-divider { border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 16px 0; }
  .sb-section { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #c4b5fd; margin-bottom: 8px; margin-top: 18px; }
  .sb-item { font-size: 9.5pt; margin-bottom: 5px; color: #ddd6fe; }
  .sb-item a { color: #ddd6fe; }
  .main { flex: 1; padding: 36px 28px; }
  .section { margin-bottom: 22px; }
  .section-title { font-size: 11pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #5b21b6; border-bottom: 2.5px solid #5b21b6; padding-bottom: 4px; margin-bottom: 12px; }
  .summary { font-size: 10pt; color: #374151; line-height: 1.65; }
  .entry { margin-bottom: 14px; }
  .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
  .entry-left { flex: 1; }
  .entry-title { font-weight: 700; color: #1e1e2e; font-size: 10.5pt; }
  .entry-org { color: #5b21b6; font-size: 9.5pt; font-weight: 600; }
  .entry-date { font-size: 9pt; color: #6b7280; white-space: nowrap; margin-left: 8px; background: #f3f4f6; padding: 1px 7px; border-radius: 12px; }
  .bullets { padding-left: 16px; margin-top: 4px; }
  .bullets li { font-size: 10pt; margin-bottom: 3px; color: #374151; }
  @media print { .sidebar { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 0; size: A4; } }
`;

function renderCreative(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contactItems = [
    p.email ? `<div class="sb-item">✉ <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>` : "",
    p.phone ? `<div class="sb-item">☎ ${esc(p.phone)}</div>` : "",
    p.location ? `<div class="sb-item">⊙ ${esc(p.location)}</div>` : "",
    p.linkedin ? `<div class="sb-item">in <a href="${esc(p.linkedin)}" target="_blank">LinkedIn</a></div>` : "",
    p.github ? `<div class="sb-item">↗ <a href="${esc(p.github)}" target="_blank">GitHub</a></div>` : "",
    p.website ? `<div class="sb-item">⊛ <a href="${esc(p.website)}" target="_blank">Portfolio</a></div>` : "",
  ].filter(Boolean).join("");
  const skillsHTML = (c.skills ?? []).length > 0
    ? `<div class="sb-section">Skills</div>${(c.skills ?? []).map(s => `<div class="sb-item">· ${esc(s)}</div>`).join("")}` : "";
  const educSb = (c.education ?? []).length > 0
    ? `<div class="sb-section">Education</div>` + (c.education ?? []).map(e =>
        `<div style="margin-bottom:10px;"><div style="color:#fff;font-weight:700;font-size:9.5pt;">${esc(e.degree)}</div><div style="font-size:9pt;color:#ddd6fe;">${esc(e.field)}</div><div style="font-size:9pt;color:#c4b5fd;">${esc(e.institution)}</div><div style="font-size:9pt;color:#ddd6fe;">${esc(e.graduationDate)}</div></div>`
      ).join("") : "";
  const certSb = (c.certifications ?? []).length > 0
    ? `<div class="sb-section">Certifications</div>` + (c.certifications ?? []).map(cert =>
        `<div style="margin-bottom:8px;"><div style="color:#fff;font-size:9.5pt;font-weight:600;">${esc(cert.name)}</div><div style="font-size:9pt;color:#c4b5fd;">${esc(cert.issuer)} · ${esc(cert.date)}</div></div>`
      ).join("") : "";
  const workMain = (c.workExperience ?? []).length > 0
    ? `<div class="section"><div class="section-title">Experience</div>${(c.workExperience ?? []).map(w =>
        `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(w.title)}</div><div class="entry-org">${esc(w.company)}${w.location ? ` · ${esc(w.location)}` : ""}</div></div><div class="entry-date">${esc(w.startDate)} – ${esc(w.endDate)}</div></div><ul class="bullets">${(w.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`
      ).join("")}</div>` : "";
  const projMain = (c.projects ?? []).length > 0
    ? `<div class="section"><div class="section-title">Projects</div>${(c.projects ?? []).map(proj =>
        `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(proj.name)}${proj.url ? ` <a href="${esc(proj.url)}" target="_blank" style="font-size:9pt;color:#5b21b6;">[link]</a>` : ""}</div><div style="font-size:9pt;color:#6b7280;">${(proj.technologies ?? []).slice(0, 4).map(esc).join(" · ")}</div></div></div><ul class="bullets">${(proj.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`
      ).join("")}</div>` : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} - Resume</title><style>${creativeStyles}</style></head><body>
<div class="page">
  <div class="sidebar">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" class="sb-pic" />` : ""}
    <div class="sb-name">${esc(p.name)}</div>
    <hr class="sb-divider" />
    <div class="sb-section">Contact</div>${contactItems}
    ${skillsHTML}${educSb}${certSb}
  </div>
  <div class="main">
    ${c.summary ? `<div class="section"><div class="section-title">About</div><div class="summary">${esc(c.summary)}</div></div>` : ""}
    ${workMain}${projMain}
  </div>
</div></body></html>`;
}

// ── Minimal Template ──────────────────────────────────────────────────────────
// Ultra-clean, generous whitespace, gray section titles
const minimalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #111827; background: #fff; padding: 0.8in 0.9in; max-width: 8.5in; margin: 0 auto; }
  a { color: #374151; text-decoration: none; }
  .name { font-size: 22pt; font-weight: 700; color: #111827; letter-spacing: -0.3px; margin-bottom: 6px; }
  .contact { font-size: 9.5pt; color: #6b7280; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
  .section-title { font-size: 9pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; margin-bottom: 12px; }
  .summary { font-size: 10pt; color: #374151; line-height: 1.7; }
  .entry { margin-bottom: 14px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
  .entry-title { font-weight: 600; font-size: 10.5pt; color: #111827; }
  .entry-org { font-size: 10pt; color: #6b7280; }
  .entry-date { font-size: 9.5pt; color: #9ca3af; white-space: nowrap; margin-left: 8px; }
  .bullets { padding-left: 18px; margin-top: 4px; }
  .bullets li { font-size: 10pt; margin-bottom: 3px; color: #374151; }
  .skill::before { content: "·"; margin-right: 5px; color: #9ca3af; }
  .skill { font-size: 10pt; color: #374151; display: inline-block; margin-right: 4px; }
  .cert-item { font-size: 10pt; margin-bottom: 4px; color: #374151; }
  @media print { body { padding: 0.5in 0.6in; } @page { margin: 0; size: Letter; } }
`;

function renderMinimal(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contactParts = [
    p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : "",
    p.phone ? esc(p.phone) : "",
    p.location ? esc(p.location) : "",
    p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank">LinkedIn</a>` : "",
    p.github ? `<a href="${esc(p.github)}" target="_blank">GitHub</a>` : "",
    p.website ? `<a href="${esc(p.website)}" target="_blank">Portfolio</a>` : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} - Resume</title><style>${minimalStyles}</style></head><body>
  ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;float:right;margin-left:16px;" />` : ""}
  <div class="name">${esc(p.name)}</div>
  <div class="contact">${contactParts}</div>
  ${c.summary ? `<hr class="divider" /><div class="section-title">Summary</div><div class="summary">${esc(c.summary)}</div>` : ""}
  ${(c.workExperience ?? []).length > 0 ? `<hr class="divider" /><div class="section-title">Experience</div>${(c.workExperience ?? []).map(w => `<div class="entry"><div class="entry-header"><span class="entry-title">${esc(w.title)}</span><span class="entry-date">${esc(w.startDate)} – ${esc(w.endDate)}</span></div><div class="entry-org">${esc(w.company)}${w.location ? ` · ${esc(w.location)}` : ""}</div><ul class="bullets">${(w.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}` : ""}
  ${(c.education ?? []).length > 0 ? `<hr class="divider" /><div class="section-title">Education</div>${(c.education ?? []).map(e => `<div class="entry"><div class="entry-header"><span class="entry-title">${esc(e.degree)} in ${esc(e.field)}</span><span class="entry-date">${esc(e.graduationDate)}</span></div><div class="entry-org">${esc(e.institution)}${e.gpa ? ` · GPA ${esc(e.gpa)}` : ""}</div></div>`).join("")}` : ""}
  ${(c.skills ?? []).length > 0 ? `<hr class="divider" /><div class="section-title">Skills</div><div>${(c.skills ?? []).map(s => `<span class="skill">${esc(s)}</span>`).join("")}</div>` : ""}
  ${(c.projects ?? []).length > 0 ? `<hr class="divider" /><div class="section-title">Projects</div>${(c.projects ?? []).map(proj => `<div class="entry"><div class="entry-header"><span class="entry-title">${esc(proj.name)}${proj.url ? ` <a href="${esc(proj.url)}" target="_blank" style="font-weight:400;font-size:9pt;">↗</a>` : ""}</span><span class="entry-date">${(proj.technologies ?? []).slice(0, 3).map(esc).join(", ")}</span></div><ul class="bullets">${(proj.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}` : ""}
  ${(c.certifications ?? []).length > 0 ? `<hr class="divider" /><div class="section-title">Certifications</div>${(c.certifications ?? []).map(cert => `<div class="cert-item"><strong>${esc(cert.name)}</strong> · ${esc(cert.issuer)} · ${esc(cert.date)}</div>`).join("")}` : ""}
</body></html>`;
}

// ── Tech Template ─────────────────────────────────────────────────────────────
// Dark header strip, monospace accent — engineers & developers
const techStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', 'Consolas', monospace; font-size: 10pt; line-height: 1.5; color: #1e293b; background: #fff; max-width: 8.5in; margin: 0 auto; }
  a { color: inherit; text-decoration: none; }
  .t-header { background: #0f172a; color: #e2e8f0; padding: 26px 36px; display: flex; align-items: center; gap: 18px; }
  .t-header-pic { width: 72px; height: 72px; border-radius: 6px; object-fit: cover; border: 2px solid #334155; flex-shrink: 0; }
  .t-name { font-size: 20pt; font-weight: bold; color: #f8fafc; }
  .t-name-prefix { color: #38bdf8; font-size: 16pt; }
  .t-contact { margin-top: 6px; font-size: 9pt; color: #94a3b8; }
  .t-contact a { color: #7dd3fc; }
  .t-sep { margin: 0 6px; color: #475569; }
  .t-body { padding: 24px 36px; }
  .t-section { margin-bottom: 20px; }
  .t-section-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; padding-bottom: 4px; border-bottom: 2px solid #0f172a; margin-bottom: 10px; }
  .t-section-title::before { content: "//"; color: #38bdf8; margin-right: 6px; }
  .t-summary { font-size: 10pt; color: #334155; line-height: 1.65; font-family: 'Segoe UI', Arial, sans-serif; }
  .t-entry { margin-bottom: 12px; }
  .t-entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
  .t-entry-left { flex: 1; }
  .t-entry-title { font-weight: bold; color: #0f172a; font-size: 10pt; }
  .t-entry-org { color: #38bdf8; font-size: 9.5pt; }
  .t-entry-date { font-size: 9pt; color: #64748b; white-space: nowrap; margin-left: 10px; }
  .t-bullets { padding-left: 16px; margin-top: 3px; font-family: 'Segoe UI', Arial, sans-serif; }
  .t-bullets li { font-size: 10pt; margin-bottom: 3px; color: #334155; }
  .t-bullets li::marker { color: #38bdf8; }
  .t-skills-grid { display: flex; flex-wrap: wrap; gap: 4px 8px; }
  .t-skill { font-size: 9pt; background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; border-radius: 3px; padding: 2px 7px; }
  @media print { body { padding: 0.4in 0.5in; } @page { margin: 0; size: Letter; } }
`;

function renderTech(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contactParts = [
    p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : "",
    p.phone ? esc(p.phone) : "",
    p.location ? esc(p.location) : "",
    p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank">LinkedIn</a>` : "",
    p.github ? `<a href="${esc(p.github)}" target="_blank">GitHub</a>` : "",
    p.website ? `<a href="${esc(p.website)}" target="_blank">Portfolio</a>` : "",
  ].filter(Boolean).join(`<span class="t-sep">|</span>`);
  const nameParts = (p.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} - Resume</title><style>${techStyles}</style></head><body>
  <div class="t-header">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" class="t-header-pic" />` : ""}
    <div>
      <div class="t-name"><span class="t-name-prefix">&gt;</span> ${esc(firstName)} <strong>${esc(lastName)}</strong></div>
      <div class="t-contact">${contactParts}</div>
    </div>
  </div>
  <div class="t-body">
    ${c.summary ? `<div class="t-section"><div class="t-section-title">Profile</div><div class="t-summary">${esc(c.summary)}</div></div>` : ""}
    ${(c.workExperience ?? []).length > 0 ? `<div class="t-section"><div class="t-section-title">Experience</div>${(c.workExperience ?? []).map(w => `<div class="t-entry"><div class="t-entry-header"><div class="t-entry-left"><div class="t-entry-title">${esc(w.title)}</div><div class="t-entry-org">${esc(w.company)}${w.location ? ` @ ${esc(w.location)}` : ""}</div></div><div class="t-entry-date">[${esc(w.startDate)} – ${esc(w.endDate)}]</div></div><ul class="t-bullets">${(w.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
    ${(c.skills ?? []).length > 0 ? `<div class="t-section"><div class="t-section-title">Technical Skills</div><div class="t-skills-grid">${(c.skills ?? []).map(s => `<span class="t-skill">${esc(s)}</span>`).join("")}</div></div>` : ""}
    ${(c.projects ?? []).length > 0 ? `<div class="t-section"><div class="t-section-title">Projects</div>${(c.projects ?? []).map(proj => `<div class="t-entry"><div class="t-entry-header"><div class="t-entry-left"><div class="t-entry-title">${esc(proj.name)}${proj.url ? ` <a href="${esc(proj.url)}" target="_blank" style="font-size:9pt;color:#38bdf8;">[repo]</a>` : ""}</div><div class="t-entry-org">${(proj.technologies ?? []).slice(0, 5).map(esc).join(", ")}</div></div></div><ul class="t-bullets">${(proj.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
    ${(c.education ?? []).length > 0 ? `<div class="t-section"><div class="t-section-title">Education</div>${(c.education ?? []).map(e => `<div class="t-entry"><div class="t-entry-header"><div class="t-entry-left"><div class="t-entry-title">${esc(e.degree)} in ${esc(e.field)}</div><div class="t-entry-org">${esc(e.institution)}</div></div><div class="t-entry-date">[${esc(e.graduationDate)}]</div></div></div>`).join("")}</div>` : ""}
    ${(c.certifications ?? []).length > 0 ? `<div class="t-section"><div class="t-section-title">Certifications</div>${(c.certifications ?? []).map(cert => `<div style="font-size:10pt;margin-bottom:5px;font-family:'Segoe UI',sans-serif;"><span style="color:#38bdf8;">✓</span> <strong>${esc(cert.name)}</strong> — ${esc(cert.issuer)} (${esc(cert.date)})</div>`).join("")}</div>` : ""}
  </div>
</body></html>`;
}

// ── Compact Template ──────────────────────────────────────────────────────────
// Dense, two-column skills, tight bullets — lots of experience / academics
const compactStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.35; color: #1a1a1a; background: #fff; padding: 0.55in 0.65in; max-width: 8.5in; margin: 0 auto; }
  a { color: inherit; text-decoration: none; }
  .c-name { font-size: 18pt; font-weight: bold; color: #1a1a1a; letter-spacing: 0.3px; }
  .c-contact { font-size: 8.5pt; color: #555; margin-top: 2px; }
  hr { border: none; border-top: 1.5px solid #1a1a1a; margin: 8px 0; }
  .c-section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
  .c-summary { font-size: 9.5pt; color: #333; line-height: 1.4; }
  .c-entry { margin-bottom: 7px; }
  .c-entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .c-entry-title { font-weight: bold; font-size: 9.5pt; }
  .c-entry-org { font-style: italic; font-size: 9pt; }
  .c-entry-date { font-size: 8.5pt; color: #666; white-space: nowrap; margin-left: 10px; }
  .c-bullets { padding-left: 14px; margin-top: 1px; }
  .c-bullets li { font-size: 9pt; margin-bottom: 1px; }
  .c-skills-cols { columns: 2; column-gap: 20px; }
  .c-skill-item { font-size: 9pt; margin-bottom: 2px; color: #333; }
  .c-skill-item::before { content: "▪ "; color: #666; }
  @media print { body { padding: 0.4in 0.5in; } @page { margin: 0; size: Letter; } }
`;

function renderCompact(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contact = buildClassicContactParts(p);
  const certHTML = buildCertHTML(c);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} - Resume</title><style>${compactStyles}</style></head><body>
  ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" style="width:60px;height:60px;border-radius:4px;object-fit:cover;float:right;margin-left:10px;" />` : ""}
  <div class="c-name">${esc(p.name)}</div>
  <div class="c-contact">${contact}</div>
  <hr />
  ${c.summary ? `<div class="c-section-title">Summary</div><div class="c-summary">${esc(c.summary)}</div><hr />` : ""}
  ${(c.workExperience ?? []).length > 0 ? `<div class="c-section-title">Experience</div>${(c.workExperience ?? []).map(w => `<div class="c-entry"><div class="c-entry-header"><div><span class="c-entry-title">${esc(w.title)}</span>, <span class="c-entry-org">${esc(w.company)}</span>${w.location ? `, ${esc(w.location)}` : ""}</div><span class="c-entry-date">${esc(w.startDate)} – ${esc(w.endDate)}</span></div><ul class="c-bullets">${(w.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}<hr />` : ""}
  ${(c.education ?? []).length > 0 ? `<div class="c-section-title">Education</div>${(c.education ?? []).map(e => `<div class="c-entry"><div class="c-entry-header"><div><span class="c-entry-title">${esc(e.degree)} in ${esc(e.field)}</span>, <span class="c-entry-org">${esc(e.institution)}</span>${e.gpa ? ` · GPA ${esc(e.gpa)}` : ""}</div><span class="c-entry-date">${esc(e.graduationDate)}</span></div></div>`).join("")}<hr />` : ""}
  ${(c.skills ?? []).length > 0 ? `<div class="c-section-title">Skills</div><div class="c-skills-cols">${(c.skills ?? []).map(s => `<div class="c-skill-item">${esc(s)}</div>`).join("")}</div><hr />` : ""}
  ${(c.projects ?? []).length > 0 ? `<div class="c-section-title">Projects</div>${(c.projects ?? []).map(proj => `<div class="c-entry"><div class="c-entry-header"><span class="c-entry-title">${esc(proj.name)}</span><span class="c-entry-date">${(proj.technologies ?? []).slice(0, 3).map(esc).join(", ")}</span></div><ul class="c-bullets">${(proj.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}<hr />` : ""}
  ${(c.certifications ?? []).length > 0 ? `<div class="c-section-title">Certifications</div>${certHTML}<hr />` : ""}
  <div style="font-size:9pt;color:#666;font-style:italic;">References available upon request</div>
</body></html>`;
}

// ── Professional Template ─────────────────────────────────────────────────────
// Navy top banner, clean conservative body — finance, law, corporate
const professionalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Calibri', 'Gill Sans', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1e2d40; background: #fff; max-width: 8.5in; margin: 0 auto; }
  a { color: inherit; text-decoration: none; }
  .p-banner { background: #1e3a5f; color: #fff; padding: 26px 36px; display: flex; align-items: center; gap: 18px; }
  .p-banner-pic { width: 72px; height: 72px; border-radius: 4px; object-fit: cover; border: 2px solid rgba(255,255,255,0.3); flex-shrink: 0; }
  .p-name { font-size: 22pt; font-weight: 700; color: #fff; }
  .p-contact { margin-top: 5px; font-size: 9.5pt; color: #bfdbfe; }
  .p-contact a { color: #bfdbfe; }
  .p-body { padding: 24px 36px; }
  .p-section { margin-bottom: 18px; }
  .p-section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1e3a5f; border-left: 4px solid #1e3a5f; padding-left: 8px; margin-bottom: 10px; }
  .p-summary { font-size: 10.5pt; color: #374151; line-height: 1.65; }
  .p-entry { margin-bottom: 13px; }
  .p-entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
  .p-entry-left { flex: 1; }
  .p-entry-title { font-weight: 700; color: #1e2d40; font-size: 10.5pt; }
  .p-entry-org { color: #1e3a5f; font-size: 10pt; font-weight: 600; }
  .p-entry-date { font-size: 9.5pt; color: #6b7280; white-space: nowrap; margin-left: 8px; }
  .p-bullets { padding-left: 17px; margin-top: 4px; }
  .p-bullets li { font-size: 10pt; margin-bottom: 3px; color: #374151; }
  .p-skills-grid { display: flex; flex-wrap: wrap; gap: 4px 8px; }
  .p-skill { font-size: 9.5pt; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a5f; border-radius: 3px; padding: 2px 8px; }
  @media print { .p-banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 0; size: A4; } }
`;

function renderProfessional(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contactParts = [
    p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : "",
    p.phone ? esc(p.phone) : "",
    p.location ? esc(p.location) : "",
    p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank">LinkedIn</a>` : "",
    p.github ? `<a href="${esc(p.github)}" target="_blank">GitHub</a>` : "",
    p.website ? `<a href="${esc(p.website)}" target="_blank">Portfolio</a>` : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} - Resume</title><style>${professionalStyles}</style></head><body>
  <div class="p-banner">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" class="p-banner-pic" />` : ""}
    <div>
      <div class="p-name">${esc(p.name)}</div>
      <div class="p-contact">${contactParts}</div>
    </div>
  </div>
  <div class="p-body">
    ${c.summary ? `<div class="p-section"><div class="p-section-title">Executive Summary</div><div class="p-summary">${esc(c.summary)}</div></div>` : ""}
    ${(c.workExperience ?? []).length > 0 ? `<div class="p-section"><div class="p-section-title">Professional Experience</div>${(c.workExperience ?? []).map(w => `<div class="p-entry"><div class="p-entry-header"><div class="p-entry-left"><div class="p-entry-title">${esc(w.title)}</div><div class="p-entry-org">${esc(w.company)}${w.location ? ` · ${esc(w.location)}` : ""}</div></div><div class="p-entry-date">${esc(w.startDate)} – ${esc(w.endDate)}</div></div><ul class="p-bullets">${(w.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
    ${(c.skills ?? []).length > 0 ? `<div class="p-section"><div class="p-section-title">Core Competencies</div><div class="p-skills-grid">${(c.skills ?? []).map(s => `<span class="p-skill">${esc(s)}</span>`).join("")}</div></div>` : ""}
    ${(c.education ?? []).length > 0 ? `<div class="p-section"><div class="p-section-title">Education</div>${(c.education ?? []).map(e => `<div class="p-entry"><div class="p-entry-header"><div class="p-entry-left"><div class="p-entry-title">${esc(e.degree)} in ${esc(e.field)}</div><div class="p-entry-org">${esc(e.institution)}${e.gpa ? ` · GPA ${esc(e.gpa)}` : ""}</div></div><div class="p-entry-date">${esc(e.graduationDate)}</div></div></div>`).join("")}</div>` : ""}
    ${(c.projects ?? []).length > 0 ? `<div class="p-section"><div class="p-section-title">Key Projects</div>${buildProjHTML(c)}</div>` : ""}
    ${(c.certifications ?? []).length > 0 ? `<div class="p-section"><div class="p-section-title">Certifications &amp; Licenses</div>${(c.certifications ?? []).map(cert => `<div style="font-size:10pt;margin-bottom:4px;color:#374151;"><strong>${esc(cert.name)}</strong> — ${esc(cert.issuer)} (${esc(cert.date)})</div>`).join("")}</div>` : ""}
    <div style="font-size:10pt;color:#6b7280;font-style:italic;">References available upon request</div>
  </div>
</body></html>`;
}

// ── Elegant Template ──────────────────────────────────────────────────────────
// Centered header, thin gold rule, italic titles — hospitality, luxury, events
const elegantStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif; font-size: 10.5pt; line-height: 1.55; color: #2c2c2c; background: #fff; padding: 0.75in 0.9in; max-width: 8.5in; margin: 0 auto; }
  a { color: inherit; text-decoration: none; }
  .e-header { text-align: center; margin-bottom: 16px; }
  .e-header-pic { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #c9a84c; display: block; margin: 0 auto 10px; }
  .e-name { font-size: 24pt; font-weight: normal; letter-spacing: 3px; text-transform: uppercase; color: #2c2c2c; margin-bottom: 5px; }
  .e-contact { font-size: 9.5pt; color: #888; letter-spacing: 0.5px; }
  .e-gold-rule { border: none; border-top: 1px solid #c9a84c; margin: 14px auto; max-width: 400px; }
  .e-gold-wide { border: none; border-top: 1px solid #c9a84c; margin: 12px 0; }
  .e-section-title { font-size: 10pt; font-weight: normal; font-style: italic; text-align: center; letter-spacing: 2px; text-transform: uppercase; color: #c9a84c; margin-bottom: 10px; }
  .e-summary { font-size: 10.5pt; color: #444; line-height: 1.65; text-align: justify; }
  .e-entry { margin-bottom: 12px; }
  .e-entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
  .e-entry-title { font-weight: bold; font-size: 10.5pt; color: #2c2c2c; }
  .e-entry-org { font-style: italic; color: #666; }
  .e-entry-date { font-size: 9.5pt; color: #999; white-space: nowrap; margin-left: 10px; }
  .e-bullets { padding-left: 18px; margin-top: 3px; }
  .e-bullets li { font-size: 10pt; margin-bottom: 2px; color: #444; }
  .e-skills-row { font-size: 10pt; color: #444; line-height: 1.8; text-align: center; }
  @media print { body { padding: 0.5in 0.65in; } @page { margin: 0; size: Letter; } }
`;

function renderElegant(c: ResumeContent): string {
  const { personalInfo: p } = c;
  const contact = buildClassicContactParts(p);
  const projHTML = buildProjHTML(c);
  const certHTML = buildCertHTML(c);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} - Resume</title><style>${elegantStyles}</style></head><body>
  <div class="e-header">
    ${p.profilePicture ? `<img src="${p.profilePicture}" alt="${esc(p.name)}" class="e-header-pic" />` : ""}
    <div class="e-name">${esc(p.name)}</div>
    <div class="e-contact">${contact}</div>
  </div>
  <hr class="e-gold-rule" />
  ${c.summary ? `<div class="e-section-title">Profile</div><div class="e-summary">${esc(c.summary)}</div><hr class="e-gold-wide" />` : ""}
  ${(c.workExperience ?? []).length > 0 ? `<div class="e-section-title">Experience</div>${(c.workExperience ?? []).map(w => `<div class="e-entry"><div class="e-entry-header"><div><span class="e-entry-title">${esc(w.title)}</span> &mdash; <span class="e-entry-org">${esc(w.company)}</span>${w.location ? `, ${esc(w.location)}` : ""}</div><span class="e-entry-date">${esc(w.startDate)} &ndash; ${esc(w.endDate)}</span></div><ul class="e-bullets">${(w.bullets ?? []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}<hr class="e-gold-wide" />` : ""}
  ${(c.education ?? []).length > 0 ? `<div class="e-section-title">Education</div>${(c.education ?? []).map(e => `<div class="e-entry"><div class="e-entry-header"><div><span class="e-entry-title">${esc(e.degree)} in ${esc(e.field)}</span> &mdash; <span class="e-entry-org">${esc(e.institution)}</span>${e.gpa ? ` · ${esc(e.gpa)}` : ""}</div><span class="e-entry-date">${esc(e.graduationDate)}</span></div></div>`).join("")}<hr class="e-gold-wide" />` : ""}
  ${(c.skills ?? []).length > 0 ? `<div class="e-section-title">Areas of Expertise</div><div class="e-skills-row">${(c.skills ?? []).join(" &nbsp;&bull;&nbsp; ")}</div><hr class="e-gold-wide" />` : ""}
  ${(c.projects ?? []).length > 0 ? `<div class="e-section-title">Selected Projects</div>${projHTML}<hr class="e-gold-wide" />` : ""}
  ${(c.certifications ?? []).length > 0 ? `<div class="e-section-title">Certifications</div>${certHTML}<hr class="e-gold-wide" />` : ""}
  <div style="font-size:10pt;color:#999;font-style:italic;text-align:center;">References available upon request</div>
</body></html>`;
}
