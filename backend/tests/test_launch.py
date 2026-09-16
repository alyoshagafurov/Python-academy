"""Launch checks for the site (stage 3).

Safe defaults and a hard stop without a real session secret, admin-only
analytics, honest status for a lesson ahead of the current one, deterministic
answer shuffling that keeps the right answer, emoji-free API text with code
untouched, the SEO shell (meta, JSON-LD, sitemap, robots) and databases on
absolute paths that survive a restart.

Run from backend/:  .venv/bin/python -m pytest tests -q
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from html import unescape
from html.parser import HTMLParser

import pytest
from conftest import ADMIN_ID, BACKEND_DIR, BOT_TOKEN, FRONTEND_DIR, REPO_DIR, SITE_URL

EMOJI_RE = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍]")
DEFAULT_SECRET = "dev-insecure-secret-change-me"
STUDENT_ID = 222_000_222
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


def _courses():
    from app import bot_bridge as bot

    return list(bot.all_courses().values())


# ───────────────────────────── safe defaults ─────────────────────────────

def _clean_env(monkeypatch) -> None:
    for name in ("DEV_AUTH", "SESSION_SECRET", "COOKIE_SECURE", "MENTOR_ANALYTICS_OPEN", "ADMIN_TELEGRAM_IDS", "SITE_URL"):
        monkeypatch.delenv(name, raising=False)


def test_settings_are_safe_by_default(monkeypatch):
    from app.settings import load_settings

    _clean_env(monkeypatch)
    s = load_settings()
    assert s.dev_auth_enabled is False
    assert s.cookie_secure is True
    assert s.mentor_analytics_open is False
    assert s.admin_telegram_ids == frozenset()


def test_dev_mode_is_explicit_and_local(monkeypatch):
    from app.settings import load_settings

    _clean_env(monkeypatch)
    monkeypatch.setenv("DEV_AUTH", "1")
    s = load_settings()
    assert s.dev_auth_enabled is True
    assert s.cookie_secure is False  # plain http://localhost


def _start_app(overrides: dict[str, str | None]) -> subprocess.CompletedProcess:
    env = dict(os.environ)
    for key, value in overrides.items():
        if value is None:
            env.pop(key, None)
        else:
            env[key] = value
    return subprocess.run(
        [sys.executable, "-c", "import app.main"],
        cwd=BACKEND_DIR, env=env, capture_output=True, text=True, timeout=120,
    )


@pytest.mark.parametrize("secret", [None, "", DEFAULT_SECRET])
def test_start_refuses_without_real_secret_outside_dev(secret):
    result = _start_app({"DEV_AUTH": "0", "SESSION_SECRET": secret})
    assert result.returncode != 0
    assert "SESSION_SECRET" in result.stderr


@pytest.mark.parametrize("site_url", [None, "", "academy.example", "ftp://academy.example"])
def test_start_refuses_without_site_url_outside_dev(site_url):
    """Canonical, Open Graph and the sitemap must never be built from the Host header."""
    result = _start_app({"DEV_AUTH": "0", "SITE_URL": site_url})
    assert result.returncode != 0
    assert "SITE_URL" in result.stderr


def test_start_allowed_locally_in_dev_mode():
    result = _start_app({"DEV_AUTH": "1", "SESSION_SECRET": None, "SITE_URL": None})
    assert result.returncode == 0, result.stderr


def test_host_header_does_not_change_public_urls(client):
    forged = {"host": "evil.example"}
    assert "evil.example" not in client.get("/sitemap.xml", headers=forged).text
    assert "evil.example" not in client.get("/robots.txt", headers=forged).text
    assert "evil.example" not in client.get("/courses/python_beginner", headers=forged).text


def test_dev_login_is_404_when_disabled(client):
    assert client.post("/api/auth/dev", json_body={"user_id": 5}).status == 404
    assert client.get("/api/auth/dev/users").status == 404
    assert client.get("/api/auth/config").json()["dev_auth_enabled"] is False


def test_session_cookie_is_http_only_secure_lax():
    from fastapi import Response

    from app.auth import issue_session

    response = Response()
    issue_session(response, 42)
    cookie = response.headers["set-cookie"].lower()
    assert cookie.startswith("pkh_session=")
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie


def _telegram_query(next_path: str | None = None, forge: bool = False, **fields) -> str:
    """A Telegram Login Widget callback query, signed the way Telegram signs it."""
    import hmac
    import time
    from urllib.parse import urlencode

    data = {"id": 777_000_777, "first_name": "Ali", "auth_date": int(time.time()), **fields}
    check = "\n".join(sorted(f"{k}={v}" for k, v in data.items()))
    secret = hashlib.sha256(BOT_TOKEN.encode()).digest()
    signature = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    data["hash"] = "0" * 64 if forge else signature
    if next_path is not None:
        data["next"] = next_path
    return urlencode(data)


def test_telegram_callback_signs_in_without_inline_javascript(client):
    """The widget evaluates data-onauth as JavaScript, which the CSP forbids, so login
    goes through a redirect callback instead: no inline or eval'd script anywhere."""
    response = client.get(f"/api/auth/telegram/callback?{_telegram_query()}")
    assert response.status in (302, 303)
    assert response.header("location") == "/"
    cookie = (response.header("set-cookie") or "").lower()
    assert cookie.startswith("pkh_session=")
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie


def test_telegram_callback_rejects_a_forged_signature(client):
    response = client.get(f"/api/auth/telegram/callback?{_telegram_query(forge=True)}")
    assert response.status == 401
    assert response.header("set-cookie") is None


def test_telegram_callback_only_returns_to_our_own_pages(client):
    inside = client.get(f"/api/auth/telegram/callback?{_telegram_query(next_path='/courses/python_beginner')}")
    assert inside.header("location") == "/courses/python_beginner"
    for outside in ("https://evil.example/x", "//evil.example/x", "/\\evil.example"):
        response = client.get(f"/api/auth/telegram/callback?{_telegram_query(next_path=outside)}")
        assert response.header("location") == "/", outside


def _csp(response) -> dict[str, str]:
    policy = response.header("content-security-policy") or ""
    directives = {}
    for part in filter(None, (p.strip() for p in policy.split(";"))):
        name, _, value = part.partition(" ")
        directives[name] = value
    return directives


@pytest.mark.parametrize("path", ["/api/health", "/", "/courses/python_beginner"])
def test_security_headers(client, path):
    r = client.get(path)
    assert r.header("x-content-type-options") == "nosniff"
    assert r.header("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in (r.header("permissions-policy") or "")
    assert "max-age=" in (r.header("strict-transport-security") or "")
    # Popups stay allowed: the Telegram login flow can open its own window.
    assert r.header("cross-origin-opener-policy") == "same-origin-allow-popups"
    assert r.header("cross-origin-resource-policy") == "same-origin"
    csp = _csp(r)
    assert csp.get("default-src") == "'self'"
    assert "'unsafe-inline'" not in csp["script-src"]
    assert "https://telegram.org" in csp["script-src"]
    assert "https://oauth.telegram.org" in csp["frame-src"]
    assert "frame-ancestors" in csp and "object-src" in csp


def test_csp_allows_the_theme_script_by_its_hash(client):
    index = (REPO_DIR / "frontend" / "index.html").read_text(encoding="utf-8")
    inline = re.findall(r"<script>(.*?)</script>", index, re.S)
    assert len(inline) == 1, "в index.html ожидается один inline-скрипт темы"
    digest = base64.b64encode(hashlib.sha256(inline[0].encode()).digest()).decode()
    assert f"'sha256-{digest}'" in _csp(client.get("/"))["script-src"]


def test_cors_allows_only_the_configured_origin(client):
    preflight = {"access-control-request-method": "GET"}
    ok = client.request("OPTIONS", "/api/courses", headers={"origin": SITE_URL, **preflight})
    assert ok.header("access-control-allow-origin") == SITE_URL
    other = client.request("OPTIONS", "/api/courses", headers={"origin": "https://evil.example", **preflight})
    assert other.header("access-control-allow-origin") is None


# ─────────────────────────── admin-only analytics ──────────────────────────

def test_analytics_is_404_for_guests_and_students(client, make_user):
    make_user(STUDENT_ID, "student")
    assert client.get("/api/mentor/analytics").status == 404
    assert client.get("/api/mentor/analytics", user_id=STUDENT_ID).status == 404


def test_analytics_is_open_to_admin(client, make_user):
    make_user(ADMIN_ID, "admin")
    r = client.get("/api/mentor/analytics", user_id=ADMIN_ID)
    assert r.status == 200 and "totals" in r.json()


def test_session_says_who_is_admin(client, make_user):
    make_user(ADMIN_ID, "admin")
    make_user(STUDENT_ID, "student")
    assert client.get("/api/auth/session", user_id=ADMIN_ID).json()["user"]["is_admin"] is True
    assert client.get("/api/auth/session", user_id=STUDENT_ID).json()["user"]["is_admin"] is False


# ─────────────────────────── abuse limits ──────────────────────────────────

def test_event_meta_size_is_capped(client):
    big = {"type": "lesson_view", "course_id": "python_beginner", "lesson_id": 1, "meta": {"blob": "x" * 5000}}
    assert client.post("/api/mentor/event", json_body=big).status == 422
    ok = {"type": "lesson_view", "course_id": "python_beginner", "lesson_id": 1, "meta": {"title": "Урок"}}
    assert client.post("/api/mentor/event", json_body=ok).status == 200


def test_api_rejects_oversized_bodies(client):
    huge = {"type": "lesson_view", "meta": {"blob": "x" * 70_000}}
    assert client.post("/api/mentor/event", json_body=huge).status == 413


def test_search_query_length_is_capped(client):
    assert client.get("/api/search?q=" + "a" * 201).status == 422
    assert client.get("/api/search?q=" + "a" * 200).status == 200


def test_anonymous_mentor_calls_are_limited_per_client_ip(client, monkeypatch):
    """Rotating X-Anon-Id must not reset the limit for one network client."""
    from app.routers import mentor as mentor_router

    monkeypatch.setattr(mentor_router, "ANON_IP_LIMIT_PER_HOUR", 3)
    body = {"course_id": "python_beginner", "lesson_id": 2}
    statuses = [
        client.post("/api/mentor/hint", json_body=body, headers={"x-anon-id": f"rotating-{i}"}).status
        for i in range(5)
    ]
    assert statuses[:3] == [200, 200, 200]
    assert statuses[3:] == [429, 429]


def test_event_logging_is_rate_limited(client, monkeypatch):
    from app.routers import mentor as mentor_router

    monkeypatch.setattr(mentor_router, "EVENT_LIMIT_PER_HOUR", 2)
    headers = {"x-anon-id": "event-flood"}
    body = {"type": "check_attempt", "course_id": "math_thinking", "lesson_id": 3}
    statuses = [client.post("/api/mentor/event", json_body=body, headers=headers).status for _ in range(4)]
    assert statuses == [200, 200, 429, 429]


# ─────────────────────────── honest lesson status ──────────────────────────

def test_reading_a_lesson_ahead_is_reported_honestly(client, make_user):
    uid = make_user(333_000_333, "ahead")
    ahead = client.post("/api/courses/python_beginner/lessons/5/read", user_id=uid).json()
    assert ahead["awarded"] is False and ahead["ahead"] is True
    assert ahead["current_lesson"] == 1 and ahead["progress"]["done"] == 0

    first = client.post("/api/courses/python_beginner/lessons/1/read", user_id=uid).json()
    assert first["awarded"] is True and first["ahead"] is False
    assert first["current_lesson"] == 2


def test_stats_show_the_real_student_count(client):
    stats = client.get("/api/stats").json()
    assert stats["students"] == stats["students_real"]


def test_course_descriptions(client):
    cards = {c["id"]: c for c in client.get("/api/courses").json()["courses"]}
    assert cards["python_beginner"]["description"] == "С нуля до уверенного Python: циклы, функции, файлы, ошибки и ООП"
    assert cards["python_student"]["description"] == "Python для продакшена: async, базы данных, API, тесты и деплой"


# ─────────────────────────── shuffled checks ───────────────────────────────

def _shown_checks():
    from app import content

    for course in _courses():
        for lesson in course.lessons:
            shown = content.lesson_check(lesson, course.id)
            if shown is not None:
                yield course.id, lesson, shown, content.lesson_check(lesson)


def test_shuffled_check_keeps_the_right_answer():
    problems = []
    for course_id, lesson, shown, source in _shown_checks():
        same_options = sorted(shown["options"]) == sorted(source["options"])
        same_answer = shown["options"][shown["correct"]] == source["options"][source["correct"]]
        if not (same_options and same_answer):
            problems.append(f"{course_id}:{lesson.id}")
    assert problems == []


def test_correct_index_spread_per_course():
    spread: dict[str, Counter] = defaultdict(Counter)
    for course_id, _lesson, shown, _source in _shown_checks():
        spread[course_id][shown["correct"]] += 1
    for course_id, counts in spread.items():
        assert max(counts.values()) / sum(counts.values()) <= 0.40, (course_id, counts)


def test_shuffle_is_stable_between_requests(client):
    path = "/api/courses/python_beginner/lessons/3"
    assert client.get(path).json()["check"] == client.get(path).json()["check"]


@pytest.mark.parametrize("course_id,lesson_id", [("python_beginner", 1), ("python_student", 2), ("math_thinking", 18)])
def test_mentor_solution_matches_the_shown_check(client, course_id, lesson_id):
    from app import mentor

    shown = client.get(f"/api/courses/{course_id}/lessons/{lesson_id}").json()["check"]
    solution = mentor.build_hint(course_id, lesson_id, 5)
    assert f"«{shown['options'][shown['correct']]}»" in solution["text"]


# ─────────────────────────── emoji-free API text ───────────────────────────

LESSON_TEXT_FIELDS = ("title", "topic_name", "course_title", "theory", "association", "real_example", "code_explained")
MARKUP_FIELDS = ("theory", "association", "real_example", "code_explained")


def test_api_text_has_no_emoji_and_code_is_untouched(client):
    offenders, code_changed = [], []
    for course in _courses():
        detail = client.get(f"/api/courses/{course.id}").json()
        texts = [detail["title"], detail["description"]]
        for stage in detail["stages"]:
            texts += [stage["title"], stage["subtitle"]] + [l["title"] for l in stage["lessons"]]
        offenders += [f"{course.id}: {t[:40]}" for t in texts if EMOJI_RE.search(t or "")]

        for lesson in course.lessons:
            data = client.get(f"/api/courses/{course.id}/lessons/{lesson.id}").json()
            fields = {k: data[k] for k in LESSON_TEXT_FIELDS}
            fields.update({f"mistake{i}": m for i, m in enumerate(data["common_mistakes"])})
            if data["check"]:
                fields.update({"question": data["check"]["question"], "explanation": data["check"]["explanation"]})
                fields.update({f"option{i}": o for i, o in enumerate(data["check"]["options"])})
            offenders += [f"{course.id}:{lesson.id}.{k}" for k, v in fields.items() if EMOJI_RE.search(v or "")]
            if data["example"] != lesson.example:
                code_changed.append(f"{course.id}:{lesson.id}.example")
    assert offenders == []
    assert code_changed == []


def test_search_and_profile_have_no_emoji(client, make_user):
    hits = client.get("/api/search?q=%D1%81%D0%BF%D0%B8%D1%81%D0%BE%D0%BA").json()["hits"]
    assert hits, "поиск «список» должен что-то находить"
    texts = [h[k] for h in hits for k in ("title", "topic_name", "course_title", "snippet")]
    uid = make_user(444_000_444, "profile")
    profile = client.get("/api/me", user_id=uid).json()
    texts += [profile["user"]["level_title"]] + [c["title"] for c in profile["courses"]]
    assert [t for t in texts if EMOJI_RE.search(t or "")] == []


class _TagCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.found: set[tuple[str, bool]] = set()

    def handle_starttag(self, tag, attrs):
        self.found.add((tag, bool(attrs)))


def _tags(text: str) -> set[tuple[str, bool]]:
    parser = _TagCollector()
    parser.feed(text or "")
    return parser.found


def test_lesson_markup_fits_the_sanitizer_allowlist():
    """DOMPurify keeps exactly these tags without attributes, so rendered lesson
    text equals the source only if the content never needs anything else.
    Escaped markup inside code (&lt;p&gt;) is text and never parsed as a tag."""
    source = (REPO_DIR / "frontend" / "src" / "lib" / "sanitize.ts").read_text(encoding="utf-8")
    allowed = set(re.findall(r'"([a-z0-9]+)"', re.search(r"ALLOWED_TAGS\s*=\s*\[(.*?)\]", source, re.S).group(1)))
    unexpected = []
    for course in _courses():
        for lesson in course.lessons:
            texts = {field: getattr(lesson, field) for field in MARKUP_FIELDS}
            texts.update({f"mistake{i}": m for i, m in enumerate(lesson.common_mistakes)})
            for field, text in texts.items():
                unexpected += [f"{course.id}:{lesson.id}.{field} <{tag}>" for tag, has_attrs in _tags(text)
                               if tag not in allowed or has_attrs]
    assert unexpected == []


# ───────────────────────────────── SEO ─────────────────────────────────────

def _meta(html_text: str, attr: str, name: str) -> str | None:
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', html_text)
    return m.group(1) if m else None


def _title(html_text: str) -> str:
    return unescape(re.search(r"<title>(.*?)</title>", html_text, re.S).group(1))


def _json_ld(html_text: str) -> dict:
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html_text, re.S)
    assert m, "нет JSON-LD"
    return json.loads(m.group(1))


def test_course_page_html_has_meta_without_js(client):
    r = client.get("/courses/python_beginner")
    assert r.status == 200 and "text/html" in (r.header("content-type") or "")
    assert "Python Beginner" in _title(r.text) and len(_title(r.text)) <= 60
    description = _meta(r.text, "name", "description")
    assert description and len(unescape(description)) <= 155
    for prop in ("og:title", "og:description", "og:image", "og:url"):
        assert _meta(r.text, "property", prop), prop
    assert _meta(r.text, "name", "twitter:card") == "summary_large_image"
    assert _meta(r.text, "property", "og:image") == f"{SITE_URL}/og.png"
    assert f'<link rel="canonical" href="{SITE_URL}/courses/python_beginner" />' in r.text
    ld = _json_ld(r.text)
    assert ld["@type"] == "Course" and ld["inLanguage"] == "ru" and ld["isAccessibleForFree"] is True
    assert ld["provider"]["name"] == "Python Academy"


def test_home_and_lesson_meta(client):
    assert _json_ld(client.get("/").text)["@type"] == "EducationalOrganization"
    lesson = client.get("/courses/math_thinking/lessons/18")
    assert "Сложный процент" in _title(lesson.text)
    assert _meta(lesson.text, "property", "og:url") == f"{SITE_URL}/courses/math_thinking/lessons/18"


def test_lesson_page_preloads_its_api_data(client):
    html_text = client.get("/courses/math_thinking/lessons/18").text
    for href in ("/api/courses/math_thinking/lessons/18", "/api/courses/math_thinking"):
        assert f'<link rel="preload" href="{href}" as="fetch" crossorigin="use-credentials" />' in html_text
    assert 'rel="preload"' not in client.get("/courses").text


@pytest.mark.parametrize("path", ["/dashboard", "/search", "/insights"])
def test_private_pages_are_noindex(client, path):
    assert _meta(client.get(path).text, "name", "robots") == "noindex, nofollow"


def test_unknown_course_returns_404_page(client):
    r = client.get("/courses/no_such_course")
    assert r.status == 404 and '<div id="root">' in r.text


def test_meta_values_are_escaped():
    from app import seo

    template = (FRONTEND_DIR / "index.html").read_text(encoding="utf-8")
    page = seo.PageMeta(
        title='Урок "кавычки" <b>тег</b>',
        description="Описание & <script>alert(1)</script>",
        path="/courses/x",
        json_ld={"name": "</script><script>alert(1)</script>"},
    )
    out = seo.render_index(template, page, SITE_URL)
    assert "<b>тег</b>" not in out and "<script>alert(1)</script>" not in out
    assert "&quot;кавычки&quot;" in out and "&lt;b&gt;" in out
    ld_block = out.split('<script type="application/ld+json">', 1)[1].split("</script>", 1)[0]
    assert "<" not in ld_block


def test_sitemap_lists_every_course_and_lesson(client):
    r = client.get("/sitemap.xml")
    assert r.status == 200 and "xml" in (r.header("content-type") or "")
    locs = {el.text for el in ET.fromstring(r.body).iter(f"{SITEMAP_NS}loc")}
    assert {f"{SITE_URL}/", f"{SITE_URL}/courses"} <= locs
    for course in _courses():
        assert f"{SITE_URL}/courses/{course.id}" in locs
        # Placeholder lessons are structure only («скоро») and stay out of the index.
        lessons = [l for l in course.lessons if not l.placeholder]
        assert all(f"{SITE_URL}/courses/{course.id}/lessons/{l.id}" in locs for l in lessons)
    assert not any(p in loc for loc in locs for p in ("/dashboard", "/search", "/insights"))


def test_robots_txt(client):
    text = client.get("/robots.txt").text
    assert f"Sitemap: {SITE_URL}/sitemap.xml" in text
    for path in ("/api/", "/dashboard", "/search", "/insights"):
        assert f"Disallow: {path}" in text


def test_local_stylesheets_are_inlined(tmp_path):
    """The built CSS is inlined into the HTML shell: no render-blocking request
    before first paint. External stylesheets and missing files stay links."""
    from app import seo

    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "index-abc.css").write_text(":root{--bg:#fff}body{margin:0}", encoding="utf-8")
    template = (
        "<head>\n"
        '    <link rel="stylesheet" crossorigin href="/assets/index-abc.css">\n'
        '    <link rel="stylesheet" href="/assets/missing.css">\n'
        '    <link rel="stylesheet" href="https://fonts.example/x.css">\n'
        "</head>"
    )
    out = seo.inline_local_stylesheets(template, tmp_path)
    assert "<style>:root{--bg:#fff}body{margin:0}</style>" in out
    assert "/assets/index-abc.css" not in out
    assert '<link rel="stylesheet" href="/assets/missing.css">' in out
    assert '<link rel="stylesheet" href="https://fonts.example/x.css">' in out


def test_code_font_is_preloaded(tmp_path):
    """The code font is needed for the first paint of the home showcase and lesson
    code; preloading it starts the download with the JS instead of after it."""
    from app import seo

    (tmp_path / "assets").mkdir()
    css = (
        "@font-face{font-family:JetBrains Mono Variable;src:url(/assets/jetbrains-mono-cyrillic-wght-normal-AAA.woff2) format('woff2-variations')}"
        "@font-face{font-family:JetBrains Mono Variable;src:url(/assets/jetbrains-mono-latin-wght-normal-BBB.woff2) format('woff2-variations')}"
        "@font-face{font-family:JetBrains Mono Variable;src:url(/assets/jetbrains-mono-greek-wght-normal-CCC.woff2) format('woff2-variations')}"
        "@font-face{font-family:Onest Variable;src:url(/assets/onest-latin-wght-normal-DDD.woff2) format('woff2-variations')}"
    )
    (tmp_path / "assets" / "index-abc.css").write_text(css, encoding="utf-8")
    template = '<head>\n    <link rel="stylesheet" crossorigin href="/assets/index-abc.css">\n  </head>'
    out = seo.inline_local_stylesheets(template, tmp_path)
    for name in ("jetbrains-mono-latin-wght-normal-BBB", "jetbrains-mono-cyrillic-wght-normal-AAA"):
        assert f'<link rel="preload" href="/assets/{name}.woff2" as="font" type="font/woff2" crossorigin />' in out
    assert "greek" not in out.split("<style>")[0] and "onest" not in out.split("<style>")[0]


def test_inlined_css_cannot_close_the_style_tag(tmp_path):
    from app import seo

    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "evil.css").write_text("a{content:'</style><script>alert(1)</script>'}", encoding="utf-8")
    out = seo.inline_local_stylesheets('<link rel="stylesheet" href="/assets/evil.css">', tmp_path)
    assert "</style><script>" not in out


def test_responses_are_compressed(client):
    r = client.get("/api/courses", headers={"accept-encoding": "gzip"})
    assert r.header("content-encoding") == "gzip"


def test_built_assets_are_cached_for_a_year(client):
    (FRONTEND_DIR / "assets" / "index-abc123.js").write_text("console.log('asset');\n", encoding="utf-8")
    r = client.get("/assets/index-abc123.js")
    assert r.status == 200
    assert r.header("cache-control") == "public, max-age=31536000, immutable"
    assert client.get("/courses").header("cache-control") == "no-cache"


# ─────────────────────────── databases on a volume ─────────────────────────

_RESTART_SCRIPT = """
import asyncio, sys
from app.main import app
from app import bot_bridge as bot, mentor_store

async def main(step):
    async with app.router.lifespan_context(app):
        if step == "write":
            await bot.models.create_user(777, "volume")
            await mentor_store.log_event("user:777", "lesson_view", "python_beginner", 1)
        user = await bot.models.get_user(777)
        print(user is not None, len(await mentor_store._all_events()))

asyncio.run(main(sys.argv[1]))
"""


def test_databases_on_absolute_paths_survive_a_restart(tmp_path):
    volume = tmp_path / "data"
    env = {**os.environ, "DB_PATH": str(volume / "academy.db"), "MENTOR_DB_PATH": str(volume / "mentor.db")}

    def run(step: str) -> list[str]:
        result = subprocess.run([sys.executable, "-c", _RESTART_SCRIPT, step], cwd=BACKEND_DIR,
                                env=env, capture_output=True, text=True, timeout=120)
        assert result.returncode == 0, result.stderr
        return result.stdout.split()[-2:]

    assert run("write") == ["True", "1"]
    assert (volume / "academy.db").is_file() and (volume / "mentor.db").is_file()
    assert run("read") == ["True", "1"]


# ─────────────────────────── build and brand ───────────────────────────────

def test_dockerfile_uses_node_22_and_proxy_headers():
    dockerfile = (REPO_DIR / "Dockerfile").read_text(encoding="utf-8")
    assert "FROM node:22-alpine" in dockerfile
    assert "--proxy-headers" in dockerfile


def test_env_example_documents_launch_variables():
    text = (BACKEND_DIR / ".env.example").read_text(encoding="utf-8")
    for name in ("DEV_AUTH", "SESSION_SECRET", "COOKIE_SECURE", "TELEGRAM_BOT_TOKEN", "CORS_ORIGINS",
                 "DB_PATH", "MENTOR_DB_PATH", "ADMIN_TELEGRAM_IDS", "SITE_URL"):
        assert re.search(rf"^#?\s*{name}=", text, re.M), name


def test_brand_is_python_academy():
    files = [REPO_DIR / "frontend" / "index.html", REPO_DIR / "CLAUDE.md",
             *(REPO_DIR / "frontend" / "src").rglob("*.ts*")]
    stale = [str(f.relative_to(REPO_DIR)) for f in files if "Knowledge Hub" in f.read_text(encoding="utf-8")]
    assert stale == []
