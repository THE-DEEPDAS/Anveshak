import axios from "axios";
import * as cheerio from "cheerio";

const COMMON_SELECTORS = {
  jobs: [
    ".jobs-list",
    ".careers-list",
    ".positions-list",
    ".job-openings",
    ".open-positions",
    "#careers",
    '[data-testid*="job"]',
    '[data-testid*="career"]',
  ],
  tech: [
    ".tech-stack",
    ".technologies",
    ".stack",
    ".tools",
    ".programming-languages",
  ],
  culture: [
    ".benefits",
    ".perks",
    ".culture",
    ".why-us",
    ".why-join",
    ".what-we-offer",
  ],
};

// Helper function to normalize text content
const normalizeText = (text) => text.trim().replace(/\s+/g, " ");

// Helper function for safe URL joining
const joinUrl = (base, path) => {
  try {
    return new URL(path, base).toString();
  } catch (error) {
    return null;
  }
};

const extractTechStack = ($, selectors = COMMON_SELECTORS.tech) => {
  const techSet = new Set();

  selectors.forEach((selector) => {
    $(selector)
      .find("li, div, span")
      .each((_, el) => {
        const tech = normalizeText($(el).text());
        if (tech && tech.length < 20 && !tech.includes(" ")) {
          techSet.add(tech.toLowerCase());
        }
      });
  });

  // Also look for tech keywords in page content
  const techKeywords = [
    "react",
    "angular",
    "vue",
    "node",
    "python",
    "java",
    "typescript",
    "golang",
    "rust",
    "aws",
    "azure",
    "gcp",
  ];

  const pageText = $("body").text().toLowerCase();
  techKeywords.forEach((tech) => {
    if (pageText.includes(tech)) techSet.add(tech);
  });

  return [...techSet];
};

const extractJobs = ($, selectors = COMMON_SELECTORS.jobs) => {
  const jobs = [];
  const processedTexts = new Set(); // Avoid duplicates

  selectors.forEach((selector) => {
    $(selector)
      .find("a, div, li")
      .each((_, el) => {
        const $el = $(el);
        const text = normalizeText($el.text());

        if (text && !processedTexts.has(text)) {
          processedTexts.add(text);

          if (text.match(/engineer|developer|scientist|architect|designer/i)) {
            const link = $el.is("a") ? $el.attr("href") : null;

            jobs.push({
              title: text,
              department: text.match(/front|back|full|ui|ux/i)
                ? "Engineering"
                : "Technology",
              url: link ? joinUrl($("base").attr("href"), link) : null,
              remote: text.toLowerCase().includes("remote"),
              seniority: text.match(/senior|lead|principal/i)
                ? "senior"
                : text.match(/junior|associate/i)
                ? "junior"
                : "mid",
            });
          }
        }
      });
  });

  return jobs;
};

const extractCulture = ($, selectors = COMMON_SELECTORS.culture) => {
  const culture = {
    values: [],
    benefits: [],
  };

  selectors.forEach((selector) => {
    $(selector)
      .find("li, div, p")
      .each((_, el) => {
        const text = normalizeText($(el).text());

        if (text.length > 10 && text.length < 100) {
          if (
            text.match(/insurance|health|vacation|pto|learning|growth|remote/i)
          ) {
            culture.benefits.push(text);
          } else if (text.match(/values|mission|vision|culture/i)) {
            culture.values.push(text);
          }
        }
      });
  });

  return culture;
};

const scrapeLinkedIn = async (linkedInUrl) => {
  try {
    const response = await axios.get(linkedInUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const $ = cheerio.load(response.data);

    return {
      employeeCount: $(".org-top-card-summary-info-list__info-item")
        .first()
        .text()
        .trim(),
      about: $(".org-about-us-organization-description__text").text().trim(),
      companyType: $(".org-about-us-organization-description__industry")
        .text()
        .trim(),
    };
  } catch (error) {
    console.warn("LinkedIn scraping failed:", error.message);
    return null;
  }
};

const scrapeCareers = async (careersUrl) => {
  try {
    const response = await axios.get(careersUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const $ = cheerio.load(response.data);

    return {
      openings: extractJobs($),
      departments: new Set(
        $(".department, .team, .category")
          .map((_, el) => $(el).text().trim())
          .get()
      ),
    };
  } catch (error) {
    console.warn("Careers page scraping failed:", error.message);
    return null;
  }
};

export const scrapeCompanyWebsite = async (url) => {
  try {
    // Get main website content
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Initialize company info
    const companyInfo = {
      description: $('meta[name="description"]').attr("content") || "",
      techStack: extractTechStack($),
      openRoles: extractJobs($),
      culture: extractCulture($),
      social: {
        linkedin: $('a[href*="linkedin.com/company"]').attr("href"),
        twitter: $('a[href*="twitter.com"]').attr("href"),
        github: $('a[href*="github.com"]').attr("href"),
      },
    };

    // Find careers/jobs page
    let careersUrl = $("a")
      .filter((_, el) =>
        $(el)
          .text()
          .toLowerCase()
          .match(/careers?|jobs?|positions?|opportunities/)
      )
      .first()
      .attr("href");

    if (careersUrl) {
      careersUrl = joinUrl(url, careersUrl);
      const careersData = await scrapeCareers(careersUrl);
      if (careersData) {
        companyInfo.openRoles = [
          ...companyInfo.openRoles,
          ...careersData.openings,
        ];
      }
    }

    // Get LinkedIn data if available
    if (companyInfo.social.linkedin) {
      const linkedInData = await scrapeLinkedIn(companyInfo.social.linkedin);
      if (linkedInData) {
        companyInfo.size = linkedInData.employeeCount;
        companyInfo.description = linkedInData.about || companyInfo.description;
        companyInfo.industry = linkedInData.companyType;
      }
    }

    return companyInfo;
  } catch (error) {
    console.error("Error scraping company website:", error);
    return null;
  }
};
