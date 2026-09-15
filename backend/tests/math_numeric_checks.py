"""NUMERIC_CHECKS for the «Математика мышления» course.

topic → list of (python_expression, target). The expression re-computes a
number that must appear in the lesson text: target "example" looks in the
calculation, "practice" / "quiz" / "challenge" look in that check's correct
option. Numbers in the text use the Russian format (14 049,28); tolerance 0.01.
Wrap approximate values in round(...) to the precision printed in the text.
"""
from __future__ import annotations

NUMERIC_CHECKS: dict[str, list[tuple[str, str]]] = {
    # ── Этап 1. Числа без страха ──
    "math_estimation": [
        ("7 * 50", "example"),
        ("7 * 48", "example"),
        ("7 * 50 - 7 * 48", "example"),
        ("7 * 48 * 10", "example"),
        ("20 * 3", "practice"),
        ("5000 * 12", "challenge"),
    ],
    "math_percent": [
        ("250 * 0.1", "example"),
        ("250 * 1.1", "example"),
        ("250 * 1.1 * 0.9", "example"),
        ("250 - 250 * 1.1 * 0.9", "example"),
        ("2400 * 0.85", "practice"),
        ("1000 * 1.2 * 0.8", "challenge"),
    ],
    "math_percent_of_percent": [
        ("1500 * 0.8", "example"),
        ("1500 * 0.8 * 0.9", "example"),
        ("0.8 * 0.9", "example"),
        ("(1 - 0.8 * 0.9) * 100", "example"),
        ("1500 * 0.7", "example"),
        ("1500 * 0.8 * 0.9 - 1500 * 0.7", "example"),
        ("(1 / 0.5 - 1) * 100", "practice"),
        ("(1.1 * 1.1 - 1) * 100", "challenge"),
    ],
    "math_proportion": [
        ("1 + 2 + 3", "example"),
        ("120 / 6", "example"),
        ("2 * 120 / 6", "example"),
        ("3 * 120 / 6", "example"),
        ("600 * 10 / 4", "practice"),
        ("300 / 100", "quiz"),
        ("300 - 100", "quiz"),
        ("3600 / 12 * 20", "challenge"),
    ],
    "math_unit_price": [
        ("130 / 5", "example"),
        ("28 - 130 / 5", "example"),
        ("(28 - 130 / 5) * 5", "example"),
        ("18 / 0.9", "practice"),
    ],
    "math_false_precision": [
        ("1200 * 12", "example"),
        ("1100 * 12", "example"),
        ("1300 * 12", "example"),
        ("350 * 8 / 100", "practice"),
        ("40 * 150 * 30 / 1000", "challenge"),
    ],
}
