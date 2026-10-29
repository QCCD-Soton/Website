# Quantum Computing & Quantum Chemistry: group website

The website of the QCCD group, School of Chemistry, University of Southampton.

All the text lives in `content/` as Markdown files. Every change merged into `main` is built with [Eleventy](https://www.11ty.dev/) and published to GitHub Pages automatically. You don't need to install anything to edit the site.

## Where things are

| Folder | What's in it | Who edits it |
|---|---|---|
| `content/` | All page text, one Markdown file per page, person, research theme or news item | Anyone in the group |
| `content/site.yml` | Site title, contact email, address, collaborators, funder logos | Maintainers |
| `images/` | Photos, figures and logos | Anyone in the group |
| `templates/` | HTML layouts, `style.css` and `site.js`: how the site looks and moves (the "QCCD Classic" design) | Maintainers |
| `data/publications.json` | Publication list. **Generated weekly, don't edit by hand** | The update workflow |
| `content/preprints.yml` | arXiv preprints, added by hand | Anyone in the group |
| `scripts/fetch_publications.py` | Fetches publications from ORCID and OpenAlex | Maintainers |
| `.github/workflows/` | Builds and deploys the site, refreshes publications | Maintainers |

The `*.11tydata.json` files in `content/people/`, `content/research/` and `content/news/` tell Eleventy how to treat each folder. You don't need to touch them.

## Common tasks

### Add a person

1. Copy `content/people/example-student.md` to `content/people/firstname-lastname.md`.
2. Fill in the header: `name`, `role`, `group` (one of `lead`, `postdoc`, `phd`, `masters`, `undergrad`, `visitor`, `alumni`), `topic` (a few words on their project), `orcid` and `email`.
3. Write a short bio below the second `---`. It shows on the back of their card.
4. Put a portrait headshot (4:5, e.g. 800×1000) in `images/` named `firstname-lastname.jpg` and set `photo: firstname-lastname.jpg`. Until then a coloured silhouette stands in.

When someone leaves, change their `group` to `alumni` and their `role` to a one-liner such as `PhD 2025 → Postdoc`. They move to the "Former members" list at the end of the page and their new papers stop being fetched.

Academic collaborators and industry partners are listed in `site.yml`.

### Post news

Add `content/news/YYYY-MM-DD-short-title.md`:

```markdown
---
title: Jane's paper is out in JCTC
kind: Paper                  # label above the title: Paper, Funding, People, Event, Talk…
summary: One sentence for the news timeline.
image: news-jctc-cover.jpg   # optional
image_alt: Journal cover
---
One or two paragraphs.
```

The date in the filename sets the date shown and the order. The News page shows the latest four, with a button for older ones.

### Edit a research theme

Research has two sides, each with its own page: quantum computing (`content/research-quantum.md`) and classical quantum chemistry (`content/research-classical.md`). Their themes are the files in `content/research/quantum/` and `content/research/classical/`, shown in filename order, so `01-…` comes first. Each theme has a `title`, a one-line `summary`, `tags`, an optional `image`, `image_alt` and `caption`, and the text. A theme without an `image` has no figure, and its title runs the full width.

On the quantum page each theme sits on a qubit wire behind a gate (H, Z, Rx, then a measurement, in that order). On the classical page a particle in a box beside the themes doubles as the scroll bar, gaining a node at each theme.

### Open positions and contact

`content/join.md` lists open positions under `roles:` and holds the Join us text. A role's `text:` can hold Markdown links, written `[Apply here](https://…)`. The contact details on that page come from `email`, `address` and `find_us` in `site.yml`.

### Pink mode

A hidden pink theme. Tap the "&" in the home page title five times within a couple of seconds, or type the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), to switch it on or off. The choice is remembered like the light/dark one. It lives in `templates/pink.css` (colours, which mirror the tokens at the top of `style.css`) and `templates/pink.js` (the unlock).

### Wide mode

A hidden layout for the group's ultrawide owners. Tap Kyle's or Luke's card on the People page five times within a couple of seconds to switch it on or off. It stretches the whole page sideways (text, buttons, cards and all) to fill a wide window, with a springy animation. It only works in an ultrawide-shaped window (at least 1600px wide and 2.25 times as wide as tall, so a maximised 16:9 browser doesn't count); anywhere else it's rejected and nothing changes, and if the window later turns narrower the page simply goes back to normal. It works alongside pink mode and is remembered the same way. It lives in `templates/wide.css` and `templates/wide.js`.

### Formatting text

Not every place you can type text understands Markdown. There are three kinds:

**Markdown text** is everything below the second `---` in a content file: page intros, person bios, research theme text and news posts. Paragraphs, `**bold**`, `*italic*`, `[links](https://…)`, `<https://…>`, `##` headings, `-` and `1.` lists, and HTML such as `H<sub>2</sub>O` all work. These don't:

- Footnotes (`[^1]`).
- Bare web addresses. `https://…` on its own stays plain text, so write `[text](https://…)` or `<https://…>`.
- `{{` and `{%`. These are read as template code and break the build or disappear.
- Images with `![]()`. Use the header fields (`image:`, `photo:`) so a missing file stops the build.
- Tables, block quotes (`>`) and `` `code` `` do render, but have no styling, so they look like plain text (tables have no lines). Best avoided.
- Headings in bios and news posts. They're shown large and look out of place in a card or a short post.

**Maths** works in Markdown text, written in LaTeX between dollar signs. `$E = mc^2$` sits in the sentence; `$$ ... $$` on lines of their own is shown centred on its own line:

```markdown
The energy is bounded by $E_0 \le \langle\psi|\hat H|\psi\rangle$, where

$$
\hat H = \sum_{pq} h_{pq}\, a_p^\dagger a_q + \tfrac12 \sum_{pqrs} g_{pqrs}\, a_p^\dagger a_q^\dagger a_s a_r
$$
```

It's drawn by [KaTeX](https://katex.org/docs/supported.html) (that page lists every command) when the site is built, so it appears instantly and looks the same in light and dark mode. A price like `$5` stays as text, because maths needs the `$` to touch its first character. If some LaTeX doesn't work, the build fails and names the page and the maths, so it can't go live broken. A wide equation scrolls sideways on a phone rather than squashing. For a quick H<sub>2</sub>O or ℏ in ordinary text, HTML (`H<sub>2</sub>O`) and Unicode still work too. Avoid `{{` and `{%` in maths as anywhere else (write `{ {` with a space).

**Inline Markdown** is a role's `text:` in `content/join.md`. Links, bold, italic and `$maths$` work. Everything else stays on one line as one paragraph: no lists, headings or line breaks.

**Plain text** is every other header field, plus everything in `site.yml` and `preprints.yml`: titles, `heading`, `summary`, `kind`, `role`, `topic`, `tags`, `caption`, `image_alt`, a role's `level`, `title` and `status`, `enquiries`, collaborator names, preprint notes and so on. Markdown and HTML show exactly as typed, so `*word*` appears with the asterisks. The one exception is `address` in `site.yml`, where each line break is kept.

A news post without a `summary` shows its first sentence on the timeline as plain text, so add a `summary` if that sentence has a link or formatting in it.

### Images

Every image goes in `images/`. A content file links to an image by naming it in the header (`photo:`, `image:`, `group_photo:`, or `logo:` in `site.yml`). If the named file doesn't exist, the build fails and says which one, so it can't go live broken. Use a prefix so the folder stays easy to scan: a person's name for headshots, `team-…` for group photos, `logo-…` for logos, `news-…` for news images.

## Publications

`.github/workflows/publications.yml` runs every Monday (or from the Actions tab with "Run workflow"). It collects the works of every current member with an `orcid` in their person file, fills in details from OpenAlex, and opens a pull request if anything changed. Check that the new papers belong to the group, then merge. Only papers from `publications_since` in `site.yml` onwards are included.

For this to work, enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**.

### Add a preprint

arXiv preprints are listed by hand in `content/preprints.yml` and shown under **Preprints** at the top of the Publications page, above the published papers. Copy an entry and fill in the `title` and `authors` exactly as on arXiv, the `arxiv` number (e.g. `"2606.15489"`, in quotes), the `date` it went on arXiv (`YYYY-MM-DD`), and optionally a short `note`. Group members are bolded automatically and entries are sorted newest first. The year buttons only filter the published list, so preprints always stay visible.

Once a preprint is published and shows up in the fetched list (after the weekly update is merged), delete its entry from `preprints.yml` so it isn't listed twice. When the file has no entries the Preprints section disappears.

## Making a change

Edit on github.com (open a file, click the pencil, then "Propose changes") or ask Claude. Either way, the change goes in as a pull request. The build runs on the pull request and must pass before merging. Merging to `main` publishes the site within a couple of minutes.

## Preview locally (optional)

Needs Node.js 20 or newer.

```
npm install
npm start          # http://localhost:8080, reloads when you save
```

To refresh publications locally: `python scripts/fetch_publications.py` (Python 3.10+, no packages needed).

## Hosting

The site deploys to GitHub Pages at `https://qccd-soton.github.io/website/`. Turn this on once under **Settings → Pages → Source: GitHub Actions**. The workflow adds the `/website/` prefix to links automatically, and drops it if a custom domain is set.

To use Cloudflare Pages instead, connect this repository in Cloudflare with build command `npx @11ty/eleventy` and output directory `_site`, and delete `deploy.yml`. The publications workflow works unchanged.
