"""Server-rendered meta for the SPA shell.

Link previews (Telegram, Instagram) and search engines read the HTML without
running JS, so FastAPI fills the title, description, canonical URL, Open Graph,
Twitter card and JSON-LD for each public route before sending index.html.
Every value is HTML-escaped, and JSON-LD is escaped so it can never close its tag.
"""
from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

from app import bot_bridge as bot
from app import content

BRAND = "Python Academy"
TITLE_LIMIT = 60
DESCRIPTION_LIMIT = 155
HOME_TITLE = f"{BRAND} — Python и математика с нуля"
HOME_DESCRIPTION = (
    "Бесплатные курсы Python и математики мышления: короткая теория, примеры из жизни "
    "и проверка после каждой темы. Без регистрации."
)
CATALOG_DESCRIPTION = (
    "Все курсы Python Academy: Python с первой строки, веб-разработка и математика "
    "для ясных решений. Теория, примеры и проверки, бесплатно."
)
PRIVATE_PAGES = {"/search": "Поиск"}

_COURSE_RE = re.compile(r"/courses/([\w-]+)")
_LESSON_RE = re.compile(r"/courses/([\w-]+)/lessons/(\d{1,6})")
_WS_RE = re.compile(r"\s+")
_TITLE_RE = re.compile(r"<title>.*?</title>", re.S)
_DESCRIPTION_RE = re.compile(r'\s*<meta\s+name="description"[^>]*>', re.S)
_STYLESHEET_LINK_RE = re.compile(r'<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(/assets/[^"]+\.css)"[^>]*/?>')
# The code font used in the first paint (home showcase, lesson code): latin + cyrillic.
_CODE_FONT_RE = re.compile(r"url\((/assets/jetbrains-mono-(?:latin|cyrillic)-wght-normal-[\w-]+\.woff2)\)")


def inline_local_stylesheets(template: str, root: Path) -> str:
    """Replace links to built CSS under /assets/ with the CSS itself.

    The stylesheet was the only render-blocking request before first paint (about
    300 ms on a slow mobile link). Inline styles are allowed by the CSP. Links to
    missing files or other origins are left as they are; «</style» inside the CSS
    is escaped so it can never close the tag. The code font files referenced by the
    CSS are preloaded, so they download alongside the JS instead of after it."""
    root = Path(root).resolve()

    def replace(match: re.Match) -> str:
        path = (root / match.group(1).lstrip("/")).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            return match.group(0)
        raw = path.read_text(encoding="utf-8")
        preloads = "".join(
            f'<link rel="preload" href="{html.escape(url, quote=True)}" as="font" type="font/woff2" crossorigin />\n    '
            for url in dict.fromkeys(_CODE_FONT_RE.findall(raw))
        )
        css = raw.replace("</style", "<\\/style")
        return f"{preloads}<style>{css}</style>"

    return _STYLESHEET_LINK_RE.sub(replace, template)


@dataclass(frozen=True)
class PageMeta:
    title: str
    description: str
    path: str
    json_ld: dict | None = None
    noindex: bool = False
    status: int = 200
    # Same-origin API URLs the page needs first; preloading them starts the
    # requests in parallel with the JS bundle instead of after it.
    preload: tuple[str, ...] = ()


def clip(text: str, limit: int) -> str:
    """Collapse whitespace and cut at a word boundary with an ellipsis."""
    text = _WS_RE.sub(" ", text or "").strip()
    if len(text) <= limit:
        return text
    cut = text[: limit - 1]
    if " " in cut:
        cut = cut[: cut.rfind(" ")]
    return cut.rstrip(" ,.;:—-") + "…"


def page_title(name: str) -> str:
    name = _WS_RE.sub(" ", name).strip()
    full = f"{name} — {BRAND}"
    return full if len(full) <= TITLE_LIMIT else clip(name, TITLE_LIMIT)


def _organization(site_url: str) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": BRAND,
        "url": site_url,
        "description": HOME_DESCRIPTION,
    }


def _not_found(path: str) -> PageMeta:
    return PageMeta(page_title("Страница не найдена"), HOME_DESCRIPTION, path, noindex=True, status=404)


def _course_meta(course, path: str, site_url: str) -> PageMeta:
    name = content.no_emoji(course.title)
    lead = content.no_emoji(course.description).rstrip(". ")
    description = clip(f"{lead}. Короткая теория, примеры и проверка после каждой темы, бесплатно.", DESCRIPTION_LIMIT)
    json_ld = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": name,
        "description": description,
        "inLanguage": "ru",
        "isAccessibleForFree": True,
        "url": f"{site_url}{path}",
        "provider": {"@type": "EducationalOrganization", "name": BRAND, "url": site_url},
    }
    return PageMeta(page_title(name), description, path, json_ld=json_ld)


def _lesson_meta(course, lesson, path: str) -> PageMeta:
    theory = content.no_emoji(content.plain(lesson.theory))
    description = clip(theory or content.no_emoji(course.description), DESCRIPTION_LIMIT)
    # The lesson text is the largest paint and waits for these two responses.
    preload = (f"/api/courses/{course.id}/lessons/{lesson.id}", f"/api/courses/{course.id}")
    return PageMeta(page_title(content.no_emoji(lesson.title)), description, path, preload=preload)


def meta_for_path(path: str, site_url: str) -> PageMeta:
    """Meta for a client route; unknown routes get a noindex 404."""
    path = "/" + path.strip("/") if path.strip("/") else "/"
    if path == "/":
        return PageMeta(HOME_TITLE, HOME_DESCRIPTION, path, json_ld=_organization(site_url))
    if path == "/courses":
        return PageMeta(page_title("Курсы"), CATALOG_DESCRIPTION, path)
    if path == "/pro":
        return PageMeta(page_title("PRO"), HOME_DESCRIPTION, path)
    if path in PRIVATE_PAGES:
        return PageMeta(page_title(PRIVATE_PAGES[path]), HOME_DESCRIPTION, path, noindex=True)

    courses = bot.all_courses()
    if match := _COURSE_RE.fullmatch(path):
        course = courses.get(match.group(1))
        return _course_meta(course, path, site_url) if course else _not_found(path)
    if match := _LESSON_RE.fullmatch(path):
        course = courses.get(match.group(1))
        lesson = course.get(int(match.group(2))) if course else None
        return _lesson_meta(course, lesson, path) if lesson else _not_found(path)
    return _not_found(path)


def _json_ld(data: dict) -> str:
    raw = json.dumps(data, ensure_ascii=False)
    return raw.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")


def render_index(template: str, page: PageMeta, site_url: str) -> str:
    """index.html with this page's title and meta tags in <head>."""
    esc = lambda value: html.escape(value, quote=True)  # noqa: E731
    url = f"{site_url}{page.path}"
    image = f"{site_url}/og.png"
    tags = [f'<meta name="description" content="{esc(page.description)}" />']
    if page.status == 200:
        tags.append(f'<link rel="canonical" href="{esc(url)}" />')
    if page.noindex:
        tags.append('<meta name="robots" content="noindex, nofollow" />')
    tags += [
        '<meta property="og:type" content="website" />',
        f'<meta property="og:site_name" content="{BRAND}" />',
        '<meta property="og:locale" content="ru_RU" />',
        f'<meta property="og:title" content="{esc(page.title)}" />',
        f'<meta property="og:description" content="{esc(page.description)}" />',
        f'<meta property="og:url" content="{esc(url)}" />',
        f'<meta property="og:image" content="{esc(image)}" />',
        '<meta property="og:image:width" content="1200" />',
        '<meta property="og:image:height" content="630" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{esc(page.title)}" />',
        f'<meta name="twitter:description" content="{esc(page.description)}" />',
        f'<meta name="twitter:image" content="{esc(image)}" />',
    ]
    if page.json_ld:
        tags.append(f'<script type="application/ld+json">{_json_ld(page.json_ld)}</script>')
    # Plain crossorigin matches the app's fetch: no credentials are ever sent.
    tags += [
        f'<link rel="preload" href="{esc(href)}" as="fetch" crossorigin />'
        for href in page.preload
    ]

    out = _DESCRIPTION_RE.sub("", template, count=1)
    out = _TITLE_RE.sub(lambda _m: f"<title>{esc(page.title)}</title>", out, count=1)
    head = "\n    ".join(tags)
    return out.replace("</head>", f"    {head}\n  </head>", 1)


def sitemap_xml(site_url: str) -> str:
    paths = ["/", "/courses", "/pro"]
    for course in bot.all_courses().values():
        paths.append(f"/courses/{course.id}")
        paths += [f"/courses/{course.id}/lessons/{l.id}" for l in course.lessons if not l.placeholder]
    urls = "".join(f"<url><loc>{xml_escape(site_url + p)}</loc></url>" for p in paths)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n'
    )


def robots_txt(site_url: str) -> str:
    return (
        "User-agent: *\n"
        "Disallow: /api/\n"
        "Disallow: /search\n"
        "Allow: /\n\n"
        f"Sitemap: {site_url}/sitemap.xml\n"
    )
