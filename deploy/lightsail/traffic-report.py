#!/usr/bin/env python3
"""How people arrive at vhwpt.com, and where they land, from Caddy's visit log.

    python3 traffic-report.py                 last 7 days, plain text
    python3 traffic-report.py --days 30
    python3 traffic-report.py --since 2026-11-20 --until 2026-11-22
    python3 traffic-report.py --json          the same numbers for another program

The log is /var/log/caddy/vhwpt-visits.log (and its rotated, gzipped copies), written by the `log`
block in sites/vhwpt.caddy. It holds no cookies, no IP addresses and only the host of the
referring site, so this report counts page loads, not people: someone who reloads counts twice.

An ENTRY is the first page of a visit: a page load whose referring site is empty or not ours.
Clicks from one of our own pages to another are not entries. Each entry gets one way of arriving:

    qr / tagged   the address has ?src=<tag> (or utm_source). Every QR code we make has a tag,
                  for example /qr is src=banner. The tag is shown, so each code is counted alone.
    organic       the referrer is a search engine (Google, Bing, DuckDuckGo, Yahoo, Ecosia, Brave...)
    ai            the referrer is an AI assistant (ChatGPT, Perplexity, Claude, Gemini, Copilot...)
    social        Facebook, Instagram, X, LinkedIn, YouTube, Reddit, Nextdoor...
    email         webmail (Gmail, Outlook, Yahoo Mail)
    referral      any other site, with its host shown
    direct        no referrer and no tag: typed the address, a bookmark, or an app that hides it

Also counted: SCANS, the requests for /qr and /qr/<name>, which are the QR codes themselves before
the redirect. Known robots and monitors are left out.
"""
import argparse
import glob
import gzip
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlsplit

try:
    from zoneinfo import ZoneInfo
    LOCAL = ZoneInfo("America/New_York")
except Exception:  # no timezone data: report in UTC
    LOCAL = timezone.utc

DEFAULT_LOG = "/var/log/caddy/vhwpt-visits.log"
OWN_HOSTS = {"vhwpt.com", "www.vhwpt.com", "3.226.58.165"}
BOT = re.compile(
    r"bot|crawl|spider|slurp|monitor|uptime|curl/|wget|python-requests|python-urllib|go-http-client|"
    r"headlesschrome|lighthouse|pingdom|facebookexternalhit|bingpreview|pho-status|axios|okhttp|"
    r"libwww|scrapy|semrush|ahrefs|mj12",
    re.I,
)
ASSET = re.compile(r"\.(css|js|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|pdf|xml|txt|json|php|mp4|webm)$", re.I)

AI_HOSTS = ("chatgpt.com", "chat.openai.com", "perplexity.ai", "claude.ai", "gemini.google.com",
            "copilot.microsoft.com", "you.com", "phind.com", "poe.com", "meta.ai")
EMAIL_HOSTS = ("mail.google.com", "outlook.live.com", "outlook.office.com", "outlook.office365.com",
               "mail.yahoo.com", "mail.aol.com")
SOCIAL_HOSTS = ("facebook.com", "instagram.com", "t.co", "twitter.com", "x.com", "linkedin.com", "lnkd.in",
                "youtube.com", "youtu.be", "pinterest.com", "tiktok.com", "reddit.com", "nextdoor.com")
SEARCH = (
    ("Google", re.compile(r"(^|\.)google\.[a-z.]+$|googlequicksearchbox")),
    ("Bing", re.compile(r"(^|\.)bing\.com$")),
    ("DuckDuckGo", re.compile(r"(^|\.)duckduckgo\.com$")),
    ("Yahoo", re.compile(r"(^|\.)search\.yahoo\.com$|(^|\.)yahoo\.com$")),
    ("Ecosia", re.compile(r"(^|\.)ecosia\.org$")),
    ("Brave", re.compile(r"(^|\.)search\.brave\.com$")),
    ("Startpage", re.compile(r"(^|\.)startpage\.com$")),
    ("Yandex", re.compile(r"(^|\.)yandex\.[a-z.]+$")),
    ("Baidu", re.compile(r"(^|\.)baidu\.com$")),
    ("Kagi", re.compile(r"(^|\.)kagi\.com$")),
)


def host_of(referer):
    """The host in a Referer header value, or '' when there is none."""
    if not referer:
        return ""
    ref = referer.strip()
    if ref.startswith("android-app://"):
        return ref[len("android-app://"):].split("/")[0].lower()
    return (urlsplit(ref).hostname or "").lower()


def ends(host, names):
    return any(host == n or host.endswith("." + n) for n in names)


def classify(referer_host, tag):
    """(bucket, detail) for one entry."""
    if tag:
        return "qr / tagged", tag
    if not referer_host:
        return "direct", ""
    if ends(referer_host, AI_HOSTS):
        return "ai", referer_host
    if ends(referer_host, EMAIL_HOSTS):
        return "email", referer_host
    for name, rx in SEARCH:
        if rx.search(referer_host):
            return "organic", name
    if ends(referer_host, SOCIAL_HOSTS):
        return "social", referer_host
    return "referral", referer_host


def read_lines(path):
    opener = gzip.open if path.endswith(".gz") else open
    try:
        with opener(path, "rt", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                yield line
    except OSError as e:
        print(f"could not read {path}: {e}", file=sys.stderr)


def first(headers, name):
    v = headers.get(name) or headers.get(name.lower())
    if isinstance(v, list):
        return v[0] if v else ""
    return v or ""


def load(paths, start, end):
    """Yield (local datetime, status, method, path, query dict, referer host, user agent) per request."""
    for path in paths:
        for line in read_lines(path):
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                e = json.loads(line)
                ts = datetime.fromtimestamp(float(e["ts"]), tz=timezone.utc)
                if not (start <= ts < end):
                    continue
                req = e["request"]
                parts = urlsplit(req.get("uri", "/"))
                headers = req.get("headers") or {}
                yield (ts.astimezone(LOCAL), int(e.get("status", 0)), req.get("method", ""),
                       parts.path or "/", parse_qs(parts.query), host_of(first(headers, "Referer")),
                       first(headers, "User-Agent"))
            except (KeyError, ValueError, TypeError):
                continue


def build(paths, start, end, exclude):
    entries, scans = [], Counter()
    skipped_bots = 0
    for when, status, method, path, query, ref_host, ua in load(paths, start, end):
        if not ua or BOT.search(ua):
            skipped_bots += 1
            continue
        if method == "GET" and re.fullmatch(r"/qr(/[^/]+)?/?", path) and 300 <= status < 400:
            scans[path.rstrip("/") or "/"] += 1
            continue
        if method != "GET" or status not in (200, 304) or ASSET.search(path):
            continue
        if any(path.startswith(x) for x in exclude):
            continue
        if ref_host in OWN_HOSTS:          # a click from one of our own pages: not an entry
            continue
        tag = (query.get("src") or query.get("utm_source") or [""])[0].strip().lower()[:40]
        bucket, detail = classify(ref_host, tag)
        entries.append({"when": when, "page": path if path == "/" else path.rstrip("/") + "/",
                        "bucket": bucket, "detail": detail})
    return entries, scans, skipped_bots


def summarize(entries, scans, skipped_bots, start, end):
    buckets = Counter(e["bucket"] for e in entries)
    details = defaultdict(Counter)
    for e in entries:
        if e["detail"]:
            details[e["bucket"]][e["detail"]] += 1
    pages = defaultdict(Counter)
    for e in entries:
        pages[e["page"]][e["bucket"]] += 1
    days = Counter(e["when"].strftime("%Y-%m-%d") for e in entries)
    return {
        "from": start.astimezone(LOCAL).strftime("%Y-%m-%d %H:%M"),
        "to": end.astimezone(LOCAL).strftime("%Y-%m-%d %H:%M"),
        "timezone": str(LOCAL),
        "entries": len(entries),
        "robots_ignored": skipped_bots,
        "arrived_by": dict(buckets.most_common()),
        "details": {b: dict(c.most_common()) for b, c in details.items()},
        "entry_pages": {p: dict(c.most_common()) for p, c in sorted(pages.items(), key=lambda kv: -sum(kv[1].values()))},
        "qr_scans": dict(scans.most_common()),
        "entries_per_day": dict(sorted(days.items())),
    }


ORDER = ["qr / tagged", "organic", "direct", "ai", "social", "email", "referral"]


def text(r):
    out = []
    n = r["entries"]
    out.append(f"vhwpt.com visits, {r['from']} to {r['to']} ({r['timezone']})")
    out.append(f"{n} entries (the first page of a visit), {r['robots_ignored']} robot requests ignored")
    out.append("")
    out.append("How people arrived")
    arrived = r["arrived_by"]
    for b in ORDER + [b for b in arrived if b not in ORDER]:
        c = arrived.get(b, 0)
        if not c and b not in ("qr / tagged", "organic", "direct"):
            continue
        pct = f"{100 * c / n:.0f}%" if n else "-"
        det = r["details"].get(b, {})
        extra = ", ".join(f"{k} {v}" for k, v in list(det.items())[:6])
        out.append(f"  {b:<12} {c:>5}  {pct:>4}   {extra}")
    out.append("")
    out.append("QR scans (requests for the QR addresses, before the redirect)")
    if r["qr_scans"]:
        for p, c in r["qr_scans"].items():
            out.append(f"  {p:<12} {c:>5}")
    else:
        out.append("  none")
    out.append("")
    out.append("Where they entered the site")
    cols = [b for b in ORDER if any(b in v for v in r["entry_pages"].values())]
    short = {"qr / tagged": "qr/tag"}
    out.append("  " + "page".ljust(34) + "total".rjust(6) + "".join(short.get(c, c)[:9].rjust(11) for c in cols))
    for page, cnt in list(r["entry_pages"].items())[:15]:
        out.append("  " + page[:33].ljust(34) + str(sum(cnt.values())).rjust(6) + "".join(str(cnt.get(c, 0)).rjust(11) for c in cols))
    if r["entries_per_day"]:
        out.append("")
        out.append("Entries per day")
        for d, c in r["entries_per_day"].items():
            out.append(f"  {d}  {c:>4}  " + "#" * min(c, 50))
    out.append("")
    out.append("Counts are page loads, not people. 'direct' also includes apps and bookmarks that hide where")
    out.append("a visit came from. Clicks between our own pages are not counted.")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="How people arrive at vhwpt.com, from Caddy's visit log.")
    ap.add_argument("--log", default=DEFAULT_LOG, help=f"visit log (default {DEFAULT_LOG}; rotated copies are read too)")
    ap.add_argument("--days", type=int, default=7, help="how many days back (default 7)")
    ap.add_argument("--since", help="start date, YYYY-MM-DD (local time; overrides --days)")
    ap.add_argument("--until", help="end date, YYYY-MM-DD, through the end of that day (local time)")
    ap.add_argument("--exclude", action="append", default=[], help="leave out entries on pages starting with this path, e.g. /event (repeatable)")
    ap.add_argument("--json", action="store_true", help="print JSON instead of text")
    a = ap.parse_args()

    now = datetime.now(timezone.utc)
    end = now
    if a.until:
        end = datetime.strptime(a.until, "%Y-%m-%d").replace(tzinfo=LOCAL) + timedelta(days=1)
    start = (datetime.strptime(a.since, "%Y-%m-%d").replace(tzinfo=LOCAL) if a.since else end - timedelta(days=a.days))
    paths = sorted(set(glob.glob(a.log) + glob.glob(a.log + ".*") + glob.glob(a.log.replace(".log", "-*.log*"))))
    if not paths:
        print(f"no visit log at {a.log} yet", file=sys.stderr)
        return 1
    entries, scans, bots = build(paths, start.astimezone(timezone.utc), end.astimezone(timezone.utc), a.exclude)
    r = summarize(entries, scans, bots, start, end)
    print(json.dumps(r, indent=2) if a.json else text(r))
    return 0


if __name__ == "__main__":
    sys.exit(main())
