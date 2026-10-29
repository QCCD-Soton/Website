import fs from "node:fs";
import yaml from "js-yaml";
import { HtmlBasePlugin } from "@11ty/eleventy";

// Order that people groups appear on the People page.
const PEOPLE_GROUPS = ["lead", "postdoc", "phd", "masters", "visitor", "undergrad"];

export default function (eleventyConfig) {
  // Adds the GitHub Pages path prefix (e.g. /website/) to every link and image.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addGlobalData("site", () =>
    yaml.load(fs.readFileSync("content/site.yml", "utf8"))
  );
  eleventyConfig.addWatchTarget("content/site.yml");

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
  eleventyConfig.addPassthroughCopy({ "templates/style.css": "style.css" });
  eleventyConfig.addPassthroughCopy({ "templates/site.js": "site.js" });
  eleventyConfig.addPassthroughCopy({ "templates/pink.css": "pink.css" });
  eleventyConfig.addPassthroughCopy({ "templates/pink.js": "pink.js" });

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

  // Placeholder avatar: initials, and a blue-ish hue that stays the same for each name.
  eleventyConfig.addFilter("initials", (name = "") =>
    name.replace(/^(Dr|Prof)\.?\s+/, "").split(/\s+/).filter((w, i, all) => i === 0 || i === all.length - 1)
      .map((w) => w[0]).join("").toUpperCase()
  );
  eleventyConfig.addFilter("hue", (name = "") =>
    184 + ([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 64)
  );
  eleventyConfig.addFilter("pad", (n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  eleventyConfig.addFilter("head", (arr = [], n) => arr.slice(0, n));
  eleventyConfig.addFilter("date", (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  );
  eleventyConfig.addFilter("firstSentence", (text = "") =>
    text.trim().split(/(?<=\.)\s/)[0]
  );
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
