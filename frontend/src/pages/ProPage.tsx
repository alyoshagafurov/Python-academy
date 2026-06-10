import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Rocket, FileBadge, Route, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/PageTransition";

const perks = [
  { icon: Rocket, title: "Backend-проекты", text: "Портфолио-проекты по шагам: Todo API, JWT-авторизация, Redis-кэш, деплой." },
  { icon: Route, title: "Career Path", text: "Дорожная карта до Junior Backend с оценкой готовности." },
  { icon: FileBadge, title: "Сертификат", text: "Подтверждение прохождения курса с уникальным кодом." },
  { icon: Sparkles, title: "Без лимитов", text: "Снимаются дневные ограничения практики и закрытые материалы." },
];

const plans = [
  { id: "month", name: "PRO на месяц", price: "399 ⭐", note: "Telegram Stars · 30 дней", highlight: false },
  { id: "program", name: "Полная программа", price: "2490 ⭐", note: "Навсегда · все курсы и проекты", highlight: true },
];

export function ProPage() {
  const [clicked, setClicked] = useState<string | null>(null);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
            <Crown size={15} /> Python Knowledge Hub PRO
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
            Из «понимаю теорию» —{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              в «беру оффер»
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted">
            Теория навсегда бесплатна. PRO добавляет практику, проекты для
            портфолио и путь до первой работы.
          </p>
        </div>

        {/* Perks */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {perks.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <perk.icon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-fg">{perk.title}</h3>
                <p className="mt-1 text-sm text-fg-muted">{perk.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Plans */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl border p-7 ${
                plan.highlight
                  ? "border-primary bg-primary-soft/40 shadow-[0_24px_60px_-30px_var(--primary)]"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-fg">
                  Выгоднее
                </span>
              )}
              <h3 className="text-lg font-bold text-fg">{plan.name}</h3>
              <div className="mt-2 text-3xl font-extrabold text-fg">{plan.price}</div>
              <p className="mt-1 text-sm text-fg-subtle">{plan.note}</p>
              <Button
                className="mt-5 w-full"
                variant={plan.highlight ? "primary" : "secondary"}
                onClick={() => setClicked(plan.id)}
              >
                {clicked === plan.id ? (
                  <>
                    <Check size={16} /> Скоро — следи за обновлениями
                  </>
                ) : (
                  "Оформить PRO"
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-fg-subtle">
          💡 Оплата через Telegram Stars подключается отдельно. Сейчас это превью —
          кнопка зарезервирована под будущий платёжный поток.
        </p>
      </div>
    </PageTransition>
  );
}
