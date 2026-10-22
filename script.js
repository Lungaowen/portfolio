const revealItems = document.querySelectorAll(".reveal");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const navLinks = siteNav ? siteNav.querySelectorAll("a") : [];

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const closeMenu = () => {
  if (!siteNav || !menuToggle) return;
  siteNav.classList.remove("open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) closeMenu();
  });
}

const heroVideo = document.querySelector(".hero-video");

if (heroVideo) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const syncMotion = () => {
    if (reduceMotion.matches) {
      heroVideo.pause();
    } else {
      heroVideo.play().catch(() => {});
    }
  };

  reduceMotion.addEventListener("change", syncMotion);
  syncMotion();
}

// Build the CV from the live portfolio content. No PDF is stored in the repository.
const downloadCvButton = document.querySelector("#download-cv");
const cvDownloadStatus = document.querySelector("#cv-download-status");

const CV_NAME = "Lunga Owen Mtsweni";
const CV_TITLE = "AI/ML-focused Software Engineer & Solutions Architect";
const CV_SUMMARY = "Final-year Computer Science Diploma student (NQF 6) at Tshwane University of Technology, graduating April 2027. " +
  "Sole architect of ALIS, a legal-tech compliance platform spanning Java Spring Boot, Python FastAPI/Celery, React/TypeScript and Cloudflare Workers. " +
  "Strong in microservices, event-driven design and auth/security, with a career goal in AI/ML engineering. Currently on WIL placement at ICEP. " +
  "Seeking a graduate programme or internship.";

const cvText = (element) => (element?.innerText || element?.textContent || "")
  .replace(/\s+/g, " ")
  .trim();

const cvSafeText = (value) => String(value || "")
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u2013\u2014]/g, "-")
  .replace(/\u2192/g, "->")
  .replace(/[\u00B7\u2022]/g, "|")
  .replace(/[^\x20-\x7E]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const jsPdfSources = [
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
  "https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js"
];

const ensureJsPdf = () => new Promise((resolve, reject) => {
  if (window.jspdf?.jsPDF) {
    resolve();
    return;
  }

  let sourceIndex = 0;
  const tryNextSource = () => {
    if (sourceIndex >= jsPdfSources.length) {
      reject(new Error("Could not load the PDF library. Check your connection and try again."));
      return;
    }

    const scriptElement = document.createElement("script");
    scriptElement.src = jsPdfSources[sourceIndex];
    scriptElement.async = true;
    sourceIndex += 1;
    scriptElement.onload = () => {
      if (window.jspdf?.jsPDF) {
        resolve();
      } else {
        scriptElement.remove();
        tryNextSource();
      }
    };
    scriptElement.onerror = () => {
      scriptElement.remove();
      tryNextSource();
    };
    document.head.appendChild(scriptElement);
  };

  tryNextSource();
});

const downloadGeneratedCv = () => {
  if (!window.jspdf?.jsPDF) {
    throw new Error("The PDF generator is not ready yet. Please click Download CV again.");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 17;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 15;
  const bodySize = 9.3;
  const lineHeight = (size) => size * 0.45;
  let y = 18;

  doc.setProperties({ title: CV_NAME + " - CV", author: CV_NAME, subject: "Curriculum vitae" });

  const font = (style, size, grey) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(grey ? 85 : 0);
  };

  const ensureSpace = (height) => {
    if (y + height > bottomLimit) {
      doc.addPage();
      y = 16;
    }
  };

  const writeLines = (lines, size, x) => {
    lines.forEach((line) => {
      ensureSpace(lineHeight(size));
      doc.text(line, x, y);
      y += lineHeight(size);
    });
  };

  const heading = (title) => {
    ensureSpace(16);
    y += 4;
    font("bold", 10);
    doc.text(title.toUpperCase(), margin, y);
    y += 1.8;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.4;
  };

  const paragraph = (text, { style = "normal", grey = false, after = 1.2 } = {}) => {
    const clean = cvSafeText(text);
    if (!clean) return;
    font(style, bodySize, grey);
    writeLines(doc.splitTextToSize(clean, contentWidth), bodySize, margin);
    y += after;
  };

  const bullet = (text) => {
    const clean = cvSafeText(text);
    if (!clean) return;
    font("normal", bodySize);
    const lines = doc.splitTextToSize(clean, contentWidth - 5);
    ensureSpace(lineHeight(bodySize) * Math.min(lines.length, 2));
    doc.setFillColor(0);
    doc.circle(margin + 1.4, y - 1.1, 0.35, "F");
    writeLines(lines, bodySize, margin + 5);
    y += 0.9;
  };

  const labelRow = (label, value) => {
    const cleanLabel = cvSafeText(label);
    const cleanValue = cvSafeText(value);
    if (!cleanLabel || !cleanValue) return;
    const labelWidth = 30;
    font("normal", bodySize);
    const lines = doc.splitTextToSize(cleanValue, contentWidth - labelWidth);
    ensureSpace(lineHeight(bodySize) * lines.length);
    font("bold", bodySize);
    doc.text(cleanLabel, margin, y);
    font("normal", bodySize);
    writeLines(lines, bodySize, margin + labelWidth);
    y += 1.2;
  };

  // Header
  font("bold", 20);
  doc.text(CV_NAME, margin, y);
  y += 6.5;
  font("normal", 10.5);
  doc.text(cvSafeText(CV_TITLE), margin, y);
  y += 5;

  const emailLink = document.querySelector('a[href^="mailto:"]');
  const email = emailLink ? emailLink.getAttribute("href").replace(/^mailto:/i, "") : "";
  const location = cvText(document.querySelector(".focus-details dd.with-icon"));
  const contactLine = [location, email, "github.com/Lungaowen", "lungaowen.github.io/portfolio"].filter(Boolean).join("  |  ");
  font("normal", 9, true);
  writeLines(doc.splitTextToSize(cvSafeText(contactLine), contentWidth), 9, margin);

  heading("Summary");
  paragraph(CV_SUMMARY);

  heading("Experience");
  document.querySelectorAll("#experience .experience-item").forEach((item) => {
    const role = cvText(item.querySelector(".experience-body h3"));
    const meta = [cvText(item.querySelector(".experience-where")), cvText(item.querySelector(".experience-when"))].filter(Boolean).join(" | ");
    ensureSpace(14);
    paragraph(role, { style: "bold", after: 0.2 });
    paragraph(meta, { style: "italic", grey: true, after: 0.8 });
    item.querySelectorAll(".experience-points li").forEach((point) => bullet(cvText(point)));
    y += 1.5;
  });

  heading("Selected Projects");
  document.querySelectorAll("#work .project").forEach((project) => {
    const name = cvText(project.querySelector("h3"));
    const description = cvText(project.querySelector(".project-description"));
    const tags = Array.from(project.querySelectorAll(".tags span")).map(cvText).filter(Boolean).join(", ");
    ensureSpace(14);
    paragraph(name, { style: "bold", after: 0.2 });
    paragraph(description, { after: tags ? 0.2 : 1.6 });
    if (tags) paragraph("Technologies: " + tags, { grey: true, after: 1.6 });
  });

  heading("Technical Skills");
  document.querySelectorAll(".stack-section .stack-row").forEach((row) => {
    labelRow(cvText(row.querySelector(".stack-label")), cvText(row.querySelectorAll("span")[1]));
  });

  heading("Education & Certifications");
  document.querySelectorAll(".credentials-section .stack-row").forEach((row) => {
    const label = cvText(row.querySelector(".stack-label"));
    if (/^(next up|practice)$/i.test(label)) return;
    labelRow(label, cvText(row.querySelectorAll("span")[1]));
  });

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    font("normal", 8, true);
    doc.text("Page " + page + " of " + pageCount, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  doc.save("Lunga-Owen-Mtsweni-CV.pdf");
};

if (downloadCvButton) {
  downloadCvButton.addEventListener("click", async () => {
    downloadCvButton.disabled = true;
    if (cvDownloadStatus) cvDownloadStatus.textContent = "Preparing your latest CV...";
    try {
      await ensureJsPdf();
      downloadGeneratedCv();
      if (cvDownloadStatus) cvDownloadStatus.textContent = "Your CV was generated from the current portfolio content.";
    } catch (error) {
      console.error("CV generation failed:", error);
      if (cvDownloadStatus) cvDownloadStatus.textContent = error.message || "Could not generate the CV. Please try again.";
    } finally {
      downloadCvButton.disabled = false;
    }
  });
}
