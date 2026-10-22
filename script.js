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

const cvText = (element) => (element?.innerText || element?.textContent || "")
  .replace(/\s+/g, " ")
  .trim();

const cvSafeText = (value) => String(value || "")
  .replace(/[’‘]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, "-")
  .replace(/[·•]/g, "|")
  .replace(/[^\x20-\x7E]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const downloadGeneratedCv = () => {
  if (!window.jspdf?.jsPDF) {
    throw new Error("The PDF library has not loaded. Check your connection and try again.");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  if (typeof doc.autoTable !== "function") {
    throw new Error("The PDF table plugin has not loaded. Please try again.");
  }

  const ink = [20, 33, 31];
  const green = [15, 118, 110];
  const muted = [82, 97, 93];
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const name = cvSafeText(cvText(document.querySelector(".brand-name")) || "Lunga Owen");
  const emailLink = document.querySelector('a[href^="mailto:"]');
  const email = emailLink ? emailLink.getAttribute("href").replace(/^mailto:/i, "") : "";
  const githubLink = document.querySelector('a[href^="https://github.com/Lungaowen"]');
  const github = githubLink ? githubLink.href : "https://github.com/Lungaowen";
  const summary = cvSafeText(cvText(document.querySelector(".hero-intro")));
  const location = cvSafeText(cvText(document.querySelector(".focus-details dd.with-icon")));
  const generatedOn = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

  doc.setProperties({
    title: name + " - CV",
    subject: "Automatically generated curriculum vitae from the portfolio website",
    author: name,
    creator: "Portfolio frontend CV generator"
  });

  const drawPageFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(220, 229, 226);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text("Generated " + generatedOn + " | lungaowen.github.io/portfolio", margin, pageHeight - 7);
      doc.text("Page " + page + " of " + pageCount, pageWidth - margin, pageHeight - 7, { align: "right" });
    }
  };

  doc.setFillColor(...green);
  doc.rect(0, 0, pageWidth, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text(name, margin, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...green);
  doc.text("SOLUTIONS ARCHITECTURE | SOFTWARE ENGINEERING | AI/ML", margin, 24);
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const contactLine = [location, email, "GitHub: " + github.replace("https://", "").replace("http://", "")].filter(Boolean).join(" | ");
  const contactLines = doc.splitTextToSize(cvSafeText(contactLine), pageWidth - margin * 2);
  doc.text(contactLines, margin, 31);

  let cursorY = 36 + (contactLines.length - 1) * 4;
  const addSection = (title, rows, options = {}) => {
    const content = (rows || []).map((row) => [cvSafeText(row)]).filter((row) => row[0]);
    if (!content.length) return;
    doc.autoTable({
      startY: cursorY + 3,
      margin: { left: margin, right: margin, top: 15, bottom: 17 },
      head: [[cvSafeText(title.toUpperCase())]],
      body: content,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 9, textColor: ink, cellPadding: { top: 1.8, right: 2, bottom: 1.8, left: 2 }, overflow: "linebreak", valign: "top", lineColor: [235, 239, 238], lineWidth: 0.1 },
      headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 } },
      didDrawPage: () => {
        doc.setFillColor(...green);
        doc.rect(0, 0, pageWidth, 4, "F");
      },
      ...options
    });
    cursorY = doc.lastAutoTable.finalY;
  };

  addSection("Professional summary", [summary]);

  const experienceRows = [];
  document.querySelectorAll("#experience .experience-item").forEach((item) => {
    const heading = cvSafeText(cvText(item.querySelector(".experience-body h3")));
    const meta = [cvText(item.querySelector(".experience-when")), cvText(item.querySelector(".experience-where"))].filter(Boolean).join(" | ");
    if (heading) experienceRows.push(heading + (meta ? " - " + cvSafeText(meta) : ""));
    item.querySelectorAll(".experience-points li").forEach((point) => {
      const pointText = cvSafeText(cvText(point));
      if (pointText) experienceRows.push("  - " + pointText);
    });
  });
  addSection("Experience", experienceRows);

  const projectRows = [];
  document.querySelectorAll("#work .project").forEach((project) => {
    const heading = cvSafeText(cvText(project.querySelector("h3")));
    const description = cvSafeText(cvText(project.querySelector(".project-description")));
    const tags = Array.from(project.querySelectorAll(".tags span")).map(cvText).filter(Boolean).join(", ");
    if (heading) projectRows.push(heading + (description ? " - " + description : ""));
    if (tags) projectRows.push("  Technologies: " + cvSafeText(tags));
    project.querySelectorAll(".project-grid > div").forEach((detail) => {
      const label = cvText(detail.querySelector(".detail-label"));
      const value = cvText(detail.querySelector("p"));
      if (label && value) projectRows.push("  " + cvSafeText(label) + ": " + cvSafeText(value));
    });
  });
  addSection("Selected projects", projectRows);

  const skillRows = [];
  document.querySelectorAll(".stack-section .stack-row").forEach((row) => {
    const label = cvSafeText(cvText(row.querySelector(".stack-label")));
    const values = cvSafeText(cvText(row.querySelectorAll("span")[1]));
    if (label && values) skillRows.push(label + ": " + values);
  });
  addSection("Technical skills", skillRows);

  const credentialRows = [];
  document.querySelectorAll(".credentials-section .stack-row").forEach((row) => {
    const label = cvSafeText(cvText(row.querySelector(".stack-label")));
    const values = cvSafeText(cvText(row.querySelectorAll("span")[1]));
    if (label && values && !/^next up$/i.test(label) && !/^practice$/i.test(label)) {
      credentialRows.push(label + ": " + values);
    }
  });
  addSection("Education and credentials", credentialRows);

  drawPageFooter();
  doc.save("Lunga-Owen-CV.pdf");
};

if (downloadCvButton) {
  downloadCvButton.addEventListener("click", () => {
    downloadCvButton.disabled = true;
    if (cvDownloadStatus) cvDownloadStatus.textContent = "Preparing your latest CV...";
    try {
      downloadGeneratedCv();
      if (cvDownloadStatus) cvDownloadStatus.textContent = "Your CV was generated from the current portfolio content.";
    } catch (error) {
      console.error("CV generation failed:", error);
      if (cvDownloadStatus) cvDownloadStatus.textContent = error.message || "Could not generate the CV. Please try again.";
    } finally {
      window.setTimeout(() => { downloadCvButton.disabled = false; }, 800);
    }
  });
}
