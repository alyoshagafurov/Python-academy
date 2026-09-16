# Синхронизация курса «Математика мышления» с репозиторием бота

Сайт работает на вендорной копии бота в `backend/_bot`. Сам репозиторий бота в этом этапе не менялся. Ниже — что перенести туда вручную.

## 1. Контент
Скопировать папку целиком:

```
backend/_bot/content/math/thinking/course.json
backend/_bot/content/math/thinking/stage_1.json … stage_5.json
```

в `content/math/thinking/` репозитория бота. Загрузчик находит курсы по маске `*/*/course.json`, схему и загрузчик менять не нужно.

Практика, квиз и челлендж не содержат поля `code`: бот показывает их как обычные вопросы с четырьмя вариантами.

## 2. Короткий код курса для callback-данных
`keyboards/inline.py`, словарь `_COURSE_CODE` (занято: `b`, `s`, `h`, `w`, `m`):

```python
_COURSE_CODE = {"python_beginner": "b", "python_student": "s",
                "web_htmlcss": "h", "web_python": "w",
                "python_minecraft": "m", "math_thinking": "t"}
```

## 3. Код курса в сертификате
`services/certificate_service.py`, словарь `_CCODE`:

```python
    "math_thinking": "MT",
```

Замечание: в `_CCODE` сейчас нет и `python_minecraft`. Это существующий пробел, этапом 2 он не исправлялся.

## 4. Названия тем
`utils/constants.py`, словарь `TOPIC_NAMES`. Без этих строк бот покажет ключ темы (`math_percent`), а сайт — название урока через резервный вариант в `backend/app/content.py`.

```python
    # Math stage 1 — Числа без страха
    "math_estimation": "Прикидка и порядок величин",
    "math_percent": "Проценты — язык денег",
    "math_percent_of_percent": "Процент от процента",
    "math_proportion": "Доли, отношения, пропорции",
    "math_unit_price": "Цена за единицу",
    "math_false_precision": "Округление и ложная точность",
    # Math stage 2 — Ясное рассуждение
    "math_logic_statements": "Утверждение, отрицание, «если… то»",
    "math_necessary_sufficient": "Необходимое и достаточное",
    "math_counterexample": "Контрпример",
    "math_logical_traps": "Логические ловушки",
    "math_decompose": "Разбить задачу на части",
    # Math stage 3 — Вероятность и риск
    "math_chance_frequency": "Шанс и частота",
    "math_expected_value": "Ожидаемое значение",
    "math_independence": "Независимость и ошибка игрока",
    "math_base_rate": "Базовая частота",
    "math_risk_spread": "Риск и разброс",
    "math_lottery_pyramid": "Лотереи и пирамиды",
    # Math stage 4 — Деньги во времени
    "math_compound_interest": "Сложный процент",
    "math_rule_of_72": "Правило 72",
    "math_real_return": "Инфляция и реальная доходность",
    "math_loan_overpayment": "Кредит и рассрочка: переплата",
    "math_microloan_rate": "Микрозайм: годовая ставка",
    "math_emergency_fund": "Подушка безопасности",
    # Math stage 5 — Решения на данных
    "math_mean_median": "Среднее и медиана",
    "math_misleading_charts": "Графики, которые обманывают",
    "math_correlation": "Корреляция — не причина",
    "math_opportunity_cost": "Альтернативные издержки",
    "math_marginal_thinking": "Маржинальное мышление",
    "math_budget_model": "Бюджет как модель",
```

`TOPIC_EMOJI` дополнять не обязательно: для неизвестных тем `topic_emoji` возвращает значок по умолчанию.

## 5. Что изменилось на стороне сайта и не требует переноса
- `backend/app/mentor.py`: ответы наставника очищаются от эмодзи (`_no_emoji`), порядок ступеней подсказок не менялся.
- `backend/app/content.py`: если в `TOPIC_NAMES` нет названия темы, API показывает название урока. После переноса строк из п. 4 результат для математики не изменится. Для `python_minecraft` тема `coords` сейчас показывается как «Координаты и блоки»; стоит добавить эту строку и в `TOPIC_NAMES` бота.
- Эмодзи в JSON-контенте старых курсов не трогались: это этап 3.
