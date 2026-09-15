"""NUMERIC_CHECKS for the «Математика мышления» course.

topic → list of (python_expression, target). The expression re-computes a
number that must appear in the lesson text: target "example" looks in the
calculation, "practice" / "quiz" / "challenge" look in that check's correct
option. Numbers in the text use the Russian format (14 049,28); tolerance 0.01.
Wrap approximate values in round(...) to the precision printed in the text.
"""
from __future__ import annotations

NUMERIC_CHECKS: dict[str, list[tuple[str, str]]] = {}
