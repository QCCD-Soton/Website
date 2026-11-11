import fs from "node:fs";
import yaml from "js-yaml";
import path from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import katex from "@vscode/markdown-it-katex";

// Order that people groups appear on the People page.
const PEOPLE_GROUPS = ["lead", "postdoc", "phd", "masters", "visitor", "undergrad"];

export default function (eleventyConfig) {
  // Adds the GitHub Pages path prefix (e.g. /website/) to every link and image.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Every <img> on the site is resized when the site is built: smaller copies (400, 800 and 1600px
  // wide, never bigger than the original) in WebP and the original format go to /img/, and the
  // browser picks the one that fits. Photos can be added at full size; the originals stay in images/.
  // An <img> can set its own widths with eleventy:widths="200,400".
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    widths: [400, 800, 1600],
    formats: ["webp", "auto"],
    urlPath: "/img/",
    outputDir: "_site/img/",
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 1244px) 1180px, 100vw" },
    },
  });
  // The image plugin reads a /images/... path from the content folder, but images/ sits beside it,
  // so point it at the real file. Runs before the image plugin (higher priority runs first).
  eleventyConfig.htmlTransformer.addPosthtmlPlugin("html", (context) => (tree) => {
    tree.match({ tag: "img" }, (node) => {
      const src = node.attrs?.src;
      if (src?.startsWith("/images/")) {
        node.attrs.src = path.relative(path.dirname(context.page.inputPath), src.slice(1)).split(path.sep).join("/");
      }
      return node;
    });
    return tree;
  }, { priority: 1 });

  eleventyConfig.addGlobalData("site", () =>
    yaml.load(fs.readFileSync("content/site.yml", "utf8"))
  );
  eleventyConfig.addWatchTarget("content/site.yml");
  // content/people/example-student.md is a template to copy, not a person, so it is never built.
  eleventyConfig.ignores.add("content/people/example-*.md");

  // Hand-kept arXiv preprints, shaped like a fetched publication so publication.njk can show them.
  // Fails the build naming the entry if its title or arXiv number is missing.
  eleventyConfig.addGlobalData("preprints", () => {
    const file = "content/preprints.yml";
    const entries = (fs.existsSync(file) && yaml.load(fs.readFileSync(file, "utf8"))) || [];
    return entries.map((p, i) => {
      const id = String(p.arxiv ?? "").trim().replace(/^arxiv:\s*/i, "").replace(/v\d+$/, "");
      if (!p.title || !id) {
        throw new Error(`${file}: entry ${i + 1} needs a title and an arxiv number`);
      }
      const date = p.date ? new Date(p.date) : null;
      return {
        title: p.title,
        authors: p.authors ?? [],
        year: date ? date.getFullYear() : "",
        sortKey: date ? date.getTime() : 0,
        url: `https://arxiv.org/abs/${id}`,
        arxiv: id,
        note: p.note,
        preprint: true,
      };
    }).sort((a, b) => b.sortKey - a.sortKey);
  });
  eleventyConfig.addWatchTarget("content/preprints.yml");

  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("favicon.ico"); // browsers and crawlers ask for /favicon.ico by default
  eleventyConfig.addPassthroughCopy({ "templates/style.css": "style.css" });
  eleventyConfig.addPassthroughCopy({ "templates/site.js": "site.js" });
  eleventyConfig.addPassthroughCopy({ "templates/pink.css": "pink.css" });
  eleventyConfig.addPassthroughCopy({ "templates/pink.js": "pink.js" });
  eleventyConfig.addPassthroughCopy({ "templates/wide.css": "wide.css" });
  eleventyConfig.addPassthroughCopy({ "templates/wide.js": "wide.js" });
  eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist/katex.min.css": "katex/katex.min.css" });
  eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist/fonts": "katex/fonts" });

  // Fails the build with the file's name if a person has no name, which usually means
  // the first line of the file isn't exactly ---, so its details weren't read.
  eleventyConfig.addCollection("people", (api) =>
    api.getFilteredByGlob("content/people/*.md").map((p) => {
      if (!p.data.name) {
        throw new Error(`${p.inputPath}: no name found. Check the file starts with a line that is exactly ---`);
      }
      return p;
    })
  );
  // Research themes live in content/research/<track>/; the track pages are content/research-<track>.md.
  eleventyConfig.addCollection("research", (api) =>
    api.getFilteredByGlob("content/research/*/*.md")
      .sort((a, b) => a.inputPath.localeCompare(b.inputPath))
  );
  eleventyConfig.addCollection("tracks", (api) =>
    api.getFilteredByGlob("content/research-*.md")
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
  );
  eleventyConfig.addFilter("track", (themes, track) =>
    themes.filter((t) => t.inputPath.includes(`/research/${track}/`))
  );
  eleventyConfig.addCollection("news", (api) =>
    api.getFilteredByGlob("content/news/*.md").reverse()
  );

  // Splits people into [{ group, people }] in PEOPLE_GROUPS order, sorted by `order` then name.
  eleventyConfig.addFilter("byGroup", (people) =>
    PEOPLE_GROUPS.map((group) => ({
      group,
      people: people
        .filter((p) => p.data.group === group)
        .sort((a, b) =>
          (a.data.order ?? 99) - (b.data.order ?? 99) ||
          a.data.name.localeCompare(b.data.name)
        ),
    })).filter((g) => g.people.length)
  );
  eleventyConfig.addFilter("alumni", (people) =>
    people.filter((p) => p.data.group === "alumni")
  );

  // Image path from a filename in front matter. Fails the build if the file is missing,
  // so a misspelt photo name is caught before it goes live.
  eleventyConfig.addFilter("img", function (name) {
    if (!fs.existsSync(`images/${name}`)) {
      throw new Error(`${this.page.inputPath}: image "${name}" not found in images/`);
    }
    return `/images/${name}`;
  });

  // Bolds group members in a publication's author list and links them to their card on the People page.
  // A member matches on surname and first initial, ignoring accents and titles.
  const plain = (s = "") => String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const nameKey = (name) => {
    const parts = plain(name).replace(/^(dr|prof)\.?\s+/, "").replace(/[.,]/g, " ").split(/\s+/).filter(Boolean);
    return parts.length ? `${parts[0][0]} ${parts.at(-1)}` : "";
  };
  const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  eleventyConfig.addFilter("authorList", (authors = [], people = []) => {
    const members = new Map(
      people.filter((p) => p.data.group !== "alumni").map((p) => [nameKey(p.data.name), p.fileSlug])
    );
    return authors.filter(Boolean).map((a) => {
      const slug = members.get(nameKey(a));
      return slug ? `<a class="author" href="/people/#${slug}"><b>${escape(a)}</b></a>` : escape(a);
    }).join(", ");
  });

  // A person's github: / linkedin: header, given as a username or a full web address.
  const profile = (base) => (handle = "") => {
    const h = String(handle).trim();
    return /^https?:\/\//i.test(h) ? h : base + h.replace(/^@/, "").replace(/\/+$/, "");
  };
  eleventyConfig.addFilter("githubUrl", profile("https://github.com/"));
  eleventyConfig.addFilter("linkedinUrl", profile("https://www.linkedin.com/in/"));

  // Placeholder avatar: initials, and a blue-ish hue that stays the same for each name.
  eleventyConfig.addFilter("initials", (name = "") =>
    name.replace(/^(Dr|Prof)\.?\s+/, "").split(/\s+/).filter((w, i, all) => i === 0 || i === all.length - 1)
      .map((w) => w[0]).join("").toUpperCase()
  );
  eleventyConfig.addFilter("hue", (name = "") =>
    184 + ([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 64)
  );
  // $...$ and $$...$$ in Markdown become maths, drawn by KaTeX when the site is built,
  // so no JavaScript runs in the browser. Broken LaTeX fails the build rather than going live.
  // Renders a short header field (like a role's text in join.md) as inline Markdown,
  // so [links](https://…), *emphasis* and $maths$ work there as they do in the page body.
  let md;
  eleventyConfig.amendLibrary("md", (lib) => {
    md = lib.use(katex.default ?? katex);
  });
  // KaTeX leaves a katex-error element where LaTeX doesn't parse; stop the build there instead.
  eleventyConfig.addTransform("mathErrors", function (html) {
    const bad = typeof html === "string" && html.match(/class="(?:katex-block )?katex-error" title="([^"]*)">([^<]*)/);
    if (bad) {
      const text = (s) => s.replace(/&(amp|lt|gt|quot|#039);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#039": "'" })[e]);
      throw new Error(`${this.page.inputPath}: the maths $${text(bad[1])}$ doesn't work. ${text(bad[2]).replace(/^.*?parse error: /, "")}`);
    }
    return html;
  });
  eleventyConfig.addFilter("inlineMd", (text = "") => md.renderInline(String(text)));

  // Structured data (schema.org JSON-LD) for the home and People pages: the group as a research
  // organisation within the university, and each current member as a Person, with their ORCID,
  // GitHub, LinkedIn and other profile links as sameAs. Helps Google connect the site to the group,
  // to Karl Michael's other profiles, and to each member's name.
  eleventyConfig.addFilter("groupJsonLd", (people = [], site = {}) => {
    const base = String(site.url || "").replace(/\/+$/, "");
    const org = `${base}/#organization`;
    const person = (p) => {
      const d = p.data;
      const prefix = (d.name.match(/^(Dr|Prof)\.?\s+/) || [])[1];
      const sameAs = [
        d.orcid && !/^0000-0000-0000-0000$/.test(d.orcid) && `https://orcid.org/${d.orcid}`,
        d.github && profile("https://github.com/")(d.github),
        d.linkedin && profile("https://www.linkedin.com/in/")(d.linkedin),
        ...Object.values(d.links || {}),
      ].filter(Boolean);
      return {
        "@type": "Person",
        "@id": `${base}/people/#${p.fileSlug}`,
        name: d.name.replace(/^(Dr|Prof)\.?\s+/, ""),
        ...(prefix && { honorificPrefix: prefix }),
        ...(d.role && !d.role.includes("?") && { jobTitle: d.role }),
        url: `${base}/people/#${p.fileSlug}`,
        ...(d.photo && { image: `${base}/images/${d.photo}` }),
        ...(sameAs.length && { sameAs }),
        memberOf: { "@id": org },
      };
    };
    const current = people.filter((p) => p.data.group !== "alumni");
    const lead = current.filter((p) => p.data.group === "lead");
    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${base}/#website`,
          name: site.subtitle,
          alternateName: site.title,
          url: `${base}/`,
          publisher: { "@id": org },
        },
        {
          "@type": "ResearchOrganization",
          "@id": org,
          name: site.subtitle,
          alternateName: [site.title, site.short_title].filter(Boolean),
          description: site.tagline,
          url: `${base}/`,
          logo: `${base}/images/favicon-192.png`,
          ...(site.email && { email: site.email }),
          ...(lead.length && { founder: lead.map((p) => ({ "@id": `${base}/people/#${p.fileSlug}` })) }),
          parentOrganization: {
            "@type": "Organization",
            name: site.school,
            parentOrganization: {
              "@type": "CollegeOrUniversity",
              name: site.university,
              ...(site.university_url && { url: site.university_url }),
            },
          },
          member: current.map(person),
        },
      ],
    };
    return JSON.stringify(graph).replace(/</g, "\\u003c");
  });

  eleventyConfig.addFilter("pad", (n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  eleventyConfig.addFilter("head", (arr = [], n) => arr.slice(0, n));
  eleventyConfig.addFilter("date", (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  );
  eleventyConfig.addFilter("firstSentence", (text = "") =>
    text.trim().split(/(?<=\.)\s/)[0]
  );
  // A page's description for search results and link previews: its `description`, else the first sentence
  // of its text (Markdown and HTML stripped), else its `summary`, else its image's alt text, else the site's tagline. At most about 160 characters.
  eleventyConfig.addFilter("describe", (data = {}, raw = "", fallback = "") => {
    const text = String(raw).replace(/^---[\s\S]*?\n---/, "").replace(/\$[^$]*\$/g, "")
      .replace(/<[^>]+>/g, "").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
    let d = String(data.description || text.split(/(?<=\.)\s/)[0] || data.summary || data.image_alt || fallback).trim();
    if (d.length > 160) d = d.slice(0, 157).replace(/\s+\S*$/, "") + "…";
    return d;
  });

  eleventyConfig.addFilter("groupByYear", (pubs = []) => {
    const years = {};
    for (const p of pubs) (years[p.year] ??= []).push(p);
    return Object.entries(years).sort(([a], [b]) => b - a);
  });

  return {
    dir: {
      input: "content",
      includes: "../templates",
      data: "../data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
  };
}
