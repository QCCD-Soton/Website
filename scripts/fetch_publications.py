"""Fetch group publications from ORCID and OpenAlex into data/publications.json.

Reads the ORCID iD of every current member from content/people/*.md, collects
their works from the ORCID public API, fills in authors, journal and
open-access links from OpenAlex, removes duplicates and writes the result
newest first. Uses only the Python standard library.

Run from the repository root:  python scripts/fetch_publications.py
"""

import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PEOPLE_DIR = ROOT / "content" / "people"
SITE_FILE = ROOT / "content" / "site.yml"
OUTPUT = ROOT / "data" / "publications.json"

# OpenAlex asks API users to identify themselves; requests with an email get a faster pool.
CONTACT = "qccd-website@users.noreply.github.com"
USER_AGENT = f"qccd-website (mailto:{CONTACT})"


def get_json(url, headers=None):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def front_matter_value(text, key):
    """Value of a simple `key: value` line in a file's front matter, or None."""
    match = re.match(r"---\n(.*?)\n---", text, re.S)
    if not match:
        return None
    line = re.search(rf"^{key}:[ \t]*([^#\n]*)", match.group(1), re.M)
    value = line.group(1).strip().strip("\"'") if line else ""
    return value or None


def current_orcids():
    orcids = []
    for path in sorted(PEOPLE_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        orcid = front_matter_value(text, "orcid")
        if orcid and front_matter_value(text, "group") != "alumni":
            orcids.append(orcid)
    return orcids


def since_year():
    match = re.search(r"^publications_since:\s*(\d{4})", SITE_FILE.read_text(encoding="utf-8"), re.M)
    return int(match.group(1)) if match else 0


def orcid_works(orcid):
    """One summary per work: title, year, DOI, journal and link, as the person recorded them."""
    data = get_json(f"https://pub.orcid.org/v3.0/{orcid}/works", {"Accept": "application/json"})
    works = []
    for group in data.get("group", []):
        summary = group["work-summary"][0]  # ORCID's preferred version of this work
        ids = {
            e["external-id-type"]: e["external-id-value"]
            for e in (summary.get("external-ids") or {}).get("external-id", [])
        }
        year = ((summary.get("publication-date") or {}).get("year") or {}).get("value")
        works.append({
            "title": ((summary.get("title") or {}).get("title") or {}).get("value"),
            "year": int(year) if year else None,
            "doi": ids.get("doi", "").lower() or None,
            "arxiv": ids.get("arxiv"),
            "venue": (summary.get("journal-title") or {}).get("value"),
            "url": (summary.get("url") or {}).get("value"),
            "preprint": summary.get("type") == "preprint",
        })
    return works


def openalex_by_doi(dois):
    """OpenAlex records keyed by lower-case DOI, fetched 50 at a time."""
    found = {}
    dois = sorted(dois)
    for start in range(0, len(dois), 50):
        batch = "|".join(dois[start:start + 50])
        query = urllib.parse.urlencode({"filter": f"doi:{batch}", "per-page": 50, "mailto": CONTACT})
        for work in get_json(f"https://api.openalex.org/works?{query}")["results"]:
            if work.get("doi"):
                found[work["doi"].removeprefix("https://doi.org/").lower()] = work
    return found


def merge(work, record):
    """Prefer OpenAlex's details where it has them, keeping ORCID's as a fallback."""
    if record:
        source = (record.get("primary_location") or {}).get("source") or {}
        work.update({
            "title": record.get("display_name") or work["title"],
            "year": record.get("publication_year") or work["year"],
            "venue": source.get("display_name") or work["venue"],
            "authors": [a["author"]["display_name"] for a in record.get("authorships", [])],
            "open_access_url": (record.get("open_access") or {}).get("oa_url"),
            "preprint": record.get("type") == "preprint" or work["preprint"],
        })
    work.setdefault("authors", [])
    work.setdefault("open_access_url", None)
    if work["doi"]:
        work["url"] = f"https://doi.org/{work['doi']}"
    elif work["arxiv"] and not work["url"]:
        work["url"] = f"https://arxiv.org/abs/{work['arxiv']}"
    return work


def deduplicate(works):
    """One entry per paper: same DOI, or same title (a preprint and its published version)."""
    def key(w):
        return w["doi"] or re.sub(r"[^a-z0-9]", "", (w["title"] or "").lower())

    by_title = {}
    for w in works:
        k = re.sub(r"[^a-z0-9]", "", (w["title"] or "").lower())
        kept = by_title.get(k)
        # Keep the published version over a preprint, otherwise the first seen.
        if kept is None or (kept["preprint"] and not w["preprint"]):
            by_title[k] = w
    unique = {}
    for w in by_title.values():
        unique.setdefault(key(w), w)
    return list(unique.values())


def main():
    orcids = current_orcids()
    if not orcids:
        print("No ORCID iDs found in content/people/. Nothing to fetch.")
        return

    works = []
    for orcid in orcids:
        works += orcid_works(orcid)
        print(f"{orcid}: {len(works)} works so far")

    minimum = since_year()
    works = [w for w in works if w["title"] and (w["year"] or 0) >= minimum]

    works = deduplicate(works)
    records = openalex_by_doi({w["doi"] for w in works if w["doi"]})
    works = [merge(w, records.get(w["doi"])) for w in works]
    works.sort(key=lambda w: (w["year"] or 0, w["title"]), reverse=True)

    for w in works:
        del w["arxiv"]
    OUTPUT.write_text(json.dumps(works, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(works)} publications to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
