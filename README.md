# Quantum Computing & Quantum Chemistry: group website

The website of the QCCD group, School of Chemistry, University of Southampton.

All the text lives in `content/` as Markdown files. Every change merged into `main` is built with [Eleventy](https://www.11ty.dev/) and published to GitHub Pages automatically. You don't need to install anything to edit the site.

## Where things are

| Folder | What's in it | Who edits it |
|---|---|---|
| `content/` | All page text, one Markdown file per page, person, research theme or news item | Anyone in the group |
| `content/site.yml` | Site title, contact email, address, funder logos | Maintainers |
| `images/` | Photos, figures and logos | Anyone in the group |
| `templates/` | HTML layouts and `style.css`: how the site looks | Maintainers |
| `data/publications.json` | Publication list. **Generated weekly, don't edit by hand** | The update workflow |
| `scripts/fetch_publications.py` | Fetches publications from ORCID and OpenAlex | Maintainers |
| `.github/workflows/` | Builds and deploys the site, refreshes publications | Maintainers |

The `*.11tydata.json` files in `content/people/`, `content/research/` and `content/news/` tell Eleventy how to treat each folder. You don't need to touch them.

## Common tasks

### Add a person

1. Copy `content/people/example-student.md` to `content/people/firstname-lastname.md`.
2. Fill in the header: `name`, `role`, `group` (one of `lead`, `postdoc`, `phd`, `masters`, `visitor`, `alumni`) and `orcid`.
3. Write a short bio below the second `---`.
4. Put a square headshot in `images/` named `firstname-lastname.jpg` and set `photo: firstname-lastname.jpg`.

When someone leaves, change their `group` to `alumni`. They move to the alumni list and their new papers stop being fetched.

### Post news

Add `content/news/YYYY-MM-DD-short-title.md`:

```markdown
---
title: Jane's paper is out in JCTC
image: news-jctc-cover.jpg   # optional
image_alt: Journal cover
---
One or two paragraphs.
```

The date in the filename sets the date shown and the order.

### Edit a research theme

The files in `content/research/` appear in filename order, so `01-…` comes first. Each one has a `title`, an optional `image` and `image_alt`, and the text.

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
