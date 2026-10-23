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
| `scripts/fetch_publications.py` | Fetches publications from ORCID and OpenAlex | Maintainers |
| `.github/workflows/` | Builds and deploys the site, refreshes publications | Maintainers |

The `*.11tydata.json` files in `content/people/`, `content/research/` and `content/news/` tell Eleventy how to treat each folder. You don't need to touch them.

## Common tasks

### Add a person

1. Copy `content/people/example-student.md` to `content/people/firstname-lastname.md`.
2. Fill in the header: `name`, `role`, `group` (one of `lead`, `postdoc`, `phd`, `masters`, `undergrad`, `visitor`, `alumni`), `topic` (a few words on their project), `orcid` and `email`.
3. Write a short bio below the second `---`. It shows on the back of their card.
4. Put a portrait headshot (4:5, e.g. 800×1000) in `images/` named `firstname-lastname.jpg` and set `photo: firstname-lastname.jpg`. Until then a coloured silhouette stands in.

When someone leaves, change their `group` to `alumni` and their `role` to a one-liner such as `PhD 2025 → Postdoc`. They move to the alumni list and their new papers stop being fetched.

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

Research has two sides, each with its own page: quantum computing (`content/research-quantum.md`) and classical quantum chemistry (`content/research-classical.md`). Their themes are the files in `content/research/quantum/` and `content/research/classical/`, shown in filename order, so `01-…` comes first. Each theme has a `title`, a one-line `summary`, `tags`, an optional `image`, `image_alt` and `caption`, and the text.

On the quantum page each theme sits on a qubit wire behind a gate (H, Z, Rx, then a measurement, in that order). On the classical page a small picture in the side panel doubles as the scroll bar; `classical_scrollbar` in `site.yml` picks which of six.

### Open positions and contact

`content/join.md` lists open positions under `roles:` and holds the Join us text. The contact details on that page come from `email`, `address` and `find_us` in `site.yml`.

### Images

Every image goes in `images/`. A content file links to an image by naming it in the header (`photo:`, `image:`, `group_photo:`, or `logo:` in `site.yml`). If the named file doesn't exist, the build fails and says which one, so it can't go live broken. Use a prefix so the folder stays easy to scan: a person's name for headshots, `team-…` for group photos, `logo-…` for logos, `news-…` for news images.

## Publications

`.github/workflows/publications.yml` runs every Monday (or from the Actions tab with "Run workflow"). It collects the works of every current member with an `orcid` in their person file, fills in details from OpenAlex, and opens a pull request if anything changed. Check that the new papers belong to the group, then merge. Only papers from `publications_since` in `site.yml` onwards are included.

For this to work, enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**.

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
