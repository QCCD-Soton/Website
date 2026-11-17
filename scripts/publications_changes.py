"""Describe how data/publications.json differs from another version of it, in Markdown.

Used by the publications workflow to fill in the "Publications update ready" issue.

    python scripts/publications_changes.py OLD.json NEW.json
"""

import json
import re
import sys

SHOWN = ("title", "year", "venue", "url", "doi", "authors", "preprint")  # fields that appear on the page


def key(work):
    return work.get("doi") or re.sub(r"[^a-z0-9]", "", (work.get("title") or "").lower())


def main(old_path, new_path):
    with open(old_path, encoding="utf-8") as f:
        old = {key(w): w for w in json.load(f)}
    with open(new_path, encoding="utf-8") as f:
        new = {key(w): w for w in json.load(f)}

    added = [new[k] for k in new if k not in old]
    removed = [old[k] for k in old if k not in new]
    changed = []
    for k in new:
        if k in old and old[k] != new[k]:
            fields = [f for f in sorted(set(old[k]) | set(new[k])) if old[k].get(f) != new[k].get(f)]
            changed.append((new[k], fields))

    lines = []
    if added:
        lines.append(f"**New ({len(added)})**, check these belong to the group:")
        lines += [f"- {w['title']} ({w.get('year') or 'no year'})" for w in added]
        lines.append("")
    if removed:
        lines.append(f"**Removed ({len(removed)})**:")
        lines += [f"- {w['title']} ({w.get('year') or 'no year'})" for w in removed]
        lines.append("")
    if changed:
        lines.append(f"**Changed ({len(changed)})**:")
        for w, fields in changed:
            hidden = "" if any(f in SHOWN for f in fields) else " (not shown on the site)"
            lines.append(f"- {w['title']}: {', '.join(fields)}{hidden}")
        lines.append("")
    print("\n".join(lines) if lines else "No differences.")


if __name__ == "__main__":
    main(*sys.argv[1:3])
