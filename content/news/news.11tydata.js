import fs from "node:fs";

// A news item gets its own page only when there's something more to see there:
// text below the header, or an image. Otherwise it shows on the News page alone, with no link.
const hasPage = (data) => {
  if (data.image) return true;
  const body = fs.readFileSync(data.page.inputPath, "utf8").replace(/^---[\s\S]*?\n---/, "");
  return body.trim() !== "";
};

export default {
  eleventyComputed: {
    layout: (data) => (hasPage(data) ? "post.njk" : false),
    permalink: (data) => (hasPage(data) ? `/news/${data.page.fileSlug}/` : false),
  },
};
