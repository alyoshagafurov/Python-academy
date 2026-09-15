"""Content validator for the «Математика мышления» course (math_thinking).

Run from backend/:  .venv/bin/python -m pytest tests/test_math_course.py

Checks the JSON content through the bot's own loader (no schema or loader
changes), the lesson format agreed for the course, the spread of correct
answers, allowed markup, and that every number printed in a calculation or a
numeric correct answer is re-computed by an expression in NUMERIC_CHECKS.
It also checks that mentor replies contain no emoji for any course.
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
BOT_DIR = BACKEND_DIR / "_bot"
COURSE_DIR = BOT_DIR / "content" / "math" / "thinking"
if str(BOT_DIR) not in sys.path:
    sys.path.insert(0, str(BOT_DIR))

from lessons.loader import load_course  # noqa: E402  (bot module, needs BOT_DIR on sys.path)
from math_numeric_checks import NUMERIC_CHECKS  # noqa: E402

CHECK_KINDS = ("practice", "quiz", "challenge")
EXPECTED_LADDER = ["question", "hint", "hint", "reasoning", "solution"]

# Pictographic emoji, dingbats/symbols blocks, variation selector, ZWJ.
# Arrows (→), maths signs (×, −, ≈) and superscripts are allowed.
EMOJI_RE = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍]")
TAG_RE = re.compile(r"<\s*(/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>")
ALLOWED_TAGS = {"b", "i", "code"}
# Russian number format: "14 049,28", "3 678", "0,12" (plain, NBSP or thin space groups).
NUMBER_RE = re.compile(r"\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+(?:,\d+)?")
TOLERANCE = 0.01


# ───────────────────────────── helpers ──────────────────────────────

def parse_ru_numbers(text: str) -> list[float]:
    """All numbers in a Russian-formatted text, as floats."""
    found = []
    for raw in NUMBER_RE.findall(text or ""):
        cleaned = re.sub(r"[   ]", "", raw).replace(",", ".")
        found.append(float(cleaned))
    return found


def safe_eval(expression: str) -> float:
    allowed = {"min": min, "max": max, "range": range, "round": round, "sum": sum, "abs": abs}
    return float(eval(expression, {"__builtins__": {}}, allowed))  # noqa: S307 — trusted, repo-authored


def lesson_texts(lesson) -> dict[str, str]:
    """Every user-facing text field of a lesson, keyed by a readable path."""
    texts = {
        "title": lesson.title,
        "theory": lesson.theory,
        "association": lesson.association,
        "real_example": lesson.real_example,
        "example": lesson.example,
        "code_explained": lesson.code_explained,
    }
    for i, mistake in enumerate(lesson.common_mistakes):
        texts[f"common_mistakes[{i}]"] = mistake
    for kind in CHECK_KINDS:
        check = getattr(lesson, kind)
        if check is None:
            continue
        texts[f"{kind}.question"] = check.question
        texts[f"{kind}.explanation"] = check.explanation
        for i, option in enumerate(check.options):
            texts[f"{kind}.options[{i}]"] = option
    return texts


def correct_option(lesson, kind: str) -> str:
    check = getattr(lesson, kind)
    return check.options[check.correct]


def has_calculation(text: str) -> bool:
    return "=" in text and bool(NUMBER_RE.search(text))


# ───────────────────────────── fixtures ─────────────────────────────

@pytest.fixture(scope="module")
def course():
    assert (COURSE_DIR / "course.json").is_file(), f"нет {COURSE_DIR / 'course.json'}"
    return load_course(COURSE_DIR)


@pytest.fixture(scope="module")
def lessons(course):
    return list(course.lessons)


# ────────────────────────────── course ──────────────────────────────

def test_course_metadata(course):
    assert course.id == "math_thinking"
    assert course.language == "math"
    assert course.track == "thinking"
    assert course.title == "Математика мышления"
    assert course.emoji, "emoji обязателен для загрузчика и бота"
    assert 0 < len(course.description) <= 90
    assert not EMOJI_RE.search(course.description)


def test_five_stages_and_lesson_count(course, lessons):
    assert len(course.stages) == 5
    assert 25 <= len(lessons) <= 30
    assert all(stage.lessons for stage in course.stages), "пустой этап"


def test_no_placeholders(lessons):
    assert [l.title for l in lessons if l.placeholder] == []


def test_stage_titles_without_emoji(course):
    for stage in course.stages:
        assert stage.title and not EMOJI_RE.search(stage.title)
        assert stage.subtitle and not EMOJI_RE.search(stage.subtitle)


# ────────────────────────────── lessons ─────────────────────────────

def test_topics_unique_and_prefixed(lessons):
    topics = [l.topic for l in lessons]
    assert all(t.startswith("math_") for t in topics), topics
    duplicates = [t for t, n in Counter(topics).items() if n > 1]
    assert duplicates == []


def test_required_fields_filled(lessons):
    problems = []
    for l in lessons:
        for field in ("title", "theory", "association", "real_example", "example", "code_explained"):
            if not getattr(l, field).strip():
                problems.append(f"{l.topic}: пустое {field}")
        if len(l.common_mistakes) != 3:
            problems.append(f"{l.topic}: common_mistakes = {len(l.common_mistakes)}, нужно 3")
        if "•" not in l.code_explained:
            problems.append(f"{l.topic}: code_explained без пунктов «•»")
    assert problems == []


def test_lengths(lessons):
    problems = []
    for l in lessons:
        if len(l.title) > 40:
            problems.append(f"{l.topic}: title {len(l.title)} > 40")
        if len(l.association) > 200:
            problems.append(f"{l.topic}: association {len(l.association)} > 200")
        if len(l.example.splitlines()) > 10:
            problems.append(f"{l.topic}: example {len(l.example.splitlines())} строк > 10")
    assert problems == []


def test_xp_final_lesson_of_stage(course):
    problems = []
    for stage in course.stages:
        for i, l in enumerate(stage.lessons):
            expected = 30 if i == len(stage.lessons) - 1 else 20
            if l.xp != expected:
                problems.append(f"{l.topic}: xp {l.xp}, ожидалось {expected}")
    assert problems == []


def test_checks_have_four_options_and_explanation(lessons):
    problems = []
    for l in lessons:
        for kind in CHECK_KINDS:
            check = getattr(l, kind)
            if check is None:
                problems.append(f"{l.topic}: нет {kind}")
                continue
            if len(check.options) != 4:
                problems.append(f"{l.topic}.{kind}: {len(check.options)} вариантов")
            if not 0 <= check.correct <= 3:
                problems.append(f"{l.topic}.{kind}: correct = {check.correct}")
            if not check.explanation.strip():
                problems.append(f"{l.topic}.{kind}: нет explanation")
            if len(set(check.options)) != len(check.options):
                problems.append(f"{l.topic}.{kind}: повторяющиеся варианты")
    assert problems == []


def test_checks_have_no_code_field(lessons):
    """The site shows one check and prefers one with code; math must keep quiz."""
    offenders = [f"{l.topic}.{k}" for l in lessons for k in CHECK_KINDS if getattr(l, k) and getattr(l, k).code]
    assert offenders == []


def test_correct_answers_spread_per_stage(course):
    for stage in course.stages:
        indices = [getattr(l, k).correct for l in stage.lessons for k in CHECK_KINDS if getattr(l, k)]
        counts = Counter(indices)
        worst, n = counts.most_common(1)[0]
        assert n / len(indices) <= 0.40, (
            f"этап {stage.id}: индекс {worst} верный в {n} из {len(indices)} проверок ({counts})"
        )


def test_no_emoji_in_lesson_texts(lessons):
    offenders = [f"{l.topic}.{path}" for l in lessons for path, text in lesson_texts(l).items() if EMOJI_RE.search(text)]
    assert offenders == []


def test_only_allowed_tags(lessons):
    problems = []
    for l in lessons:
        for path, text in lesson_texts(l).items():
            for closing, tag, attrs in TAG_RE.findall(text):
                if tag.lower() not in ALLOWED_TAGS or attrs.strip():
                    problems.append(f"{l.topic}.{path}: <{closing}{tag}{attrs}>")
    assert problems == []


# ─────────────────────────── NUMERIC_CHECKS ─────────────────────────

def test_parse_ru_numbers_format():
    assert parse_ru_numbers("Итого 14 049,28 сомони и 0,12") == [14049.28, 0.12]
    assert parse_ru_numbers("≈ 3 678%") == [3678.0]


def test_numeric_checks_reference_real_lessons(lessons):
    topics = {l.topic for l in lessons}
    assert sorted(set(NUMERIC_CHECKS) - topics) == []
    for checks in NUMERIC_CHECKS.values():
        for _, target in checks:
            assert target in ("example", *CHECK_KINDS), target


def test_every_calculation_is_covered(lessons):
    missing = []
    for l in lessons:
        targets = {target for _, target in NUMERIC_CHECKS.get(l.topic, [])}
        if has_calculation(l.example) and "example" not in targets:
            missing.append(f"{l.topic}: example")
        for kind in CHECK_KINDS:
            if NUMBER_RE.search(correct_option(l, kind)) and kind not in targets:
                missing.append(f"{l.topic}: {kind} (верный ответ с числом)")
    assert missing == []


def test_numeric_checks_match_text(lessons):
    by_topic = {l.topic: l for l in lessons}
    mismatches = []
    for topic, checks in NUMERIC_CHECKS.items():
        lesson = by_topic.get(topic)
        if lesson is None:
            continue
        for expression, target in checks:
            value = safe_eval(expression)
            text = lesson.example if target == "example" else correct_option(lesson, target)
            if not any(abs(value - n) <= TOLERANCE for n in parse_ru_numbers(text)):
                mismatches.append(f"{topic}.{target}: {expression} = {value:.4f}, в тексте {parse_ru_numbers(text)}")
    assert mismatches == []


# ───────────────────────────── mentor ───────────────────────────────

MENTOR_CASES = [("python_beginner", 1), ("math_thinking", 1)]


@pytest.mark.parametrize("course_id,lesson_id", MENTOR_CASES)
def test_mentor_hints_without_emoji_and_same_ladder(course_id, lesson_id):
    from app import mentor

    hints = [mentor.build_hint(course_id, lesson_id, rung) for rung in range(1, 6)]
    assert all(h is not None for h in hints), f"урок {course_id}:{lesson_id} не найден"
    assert [h["kind"] for h in hints] == EXPECTED_LADDER
    assert [h["rung"] for h in hints] == [1, 2, 3, 4, 5]
    assert [h["is_solution"] for h in hints] == [False, False, False, False, True]
    assert [f"{course_id}:{h['rung']}" for h in hints if EMOJI_RE.search(h["text"])] == []


@pytest.mark.parametrize("course_id,lesson_id", MENTOR_CASES)
def test_mentor_explanations_without_emoji(course_id, lesson_id):
    from app import mentor

    for style in mentor.EXPLAIN_STYLES:
        view = mentor.build_explanation(course_id, lesson_id, style["id"])
        assert view is not None
        assert [b["text"] for b in view["blocks"] if EMOJI_RE.search(b["text"])] == [], style["id"]


def test_mentor_sources_without_emoji():
    for path in (BACKEND_DIR / "app" / "mentor.py", BACKEND_DIR / "app" / "routers" / "mentor.py"):
        assert EMOJI_RE.findall(path.read_text(encoding="utf-8")) == [], path.name
