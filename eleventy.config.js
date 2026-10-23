import fs from "node:fs";
import yaml from "js-yaml";
import { HtmlBasePlugin } from "@11ty/eleventy";

// Order that people groups appear on the People page.
const PEOPLE_GROUPS = ["lead", "postdoc", "phd", "masters", "visitor"];

export default function (eleventyConfig) {
  // Adds the GitHub Pages path prefix (e.g. /website/) to every link and image.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addGlobalData("site", () =>
    yaml.load(fs.readFileSync("content/site.yml", "utf8"))
  );
  eleventyConfig.addWatchTarget("content/site.yml");

  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy({ "templates/style.css": "style.css" });

  eleventyConfig.addCollection("people", (api) =>
    api.getFilteredByGlob("content/people/*.md")
  );
  eleventyConfig.addCollection("research", (api) =>
    api.getFilteredByGlob("content/research/*.md")
      .sort((a, b) => a.inputPath.localeCompare(b.inputPath))
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
