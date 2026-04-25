"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { OotdSummary } from "@/types/ootd";

interface OotdCalendarProps {
  ootds: OotdSummary[];
  onSelect: (id: string) => void;
}

interface CalendarState {
  year: number;
  month: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return days;
}

function buildThisWeek(today: Date): Date[] {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LABELS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function OotdCalendar({ ootds, onSelect }: OotdCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [state, setState] = useState<CalendarState>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const calendarDays = buildCalendarDays(state.year, state.month);
  const weekDays = useMemo(() => buildThisWeek(today), [today]);

  const ootdByDate = useMemo(() => {
    const map = new Map<string, OotdSummary>();
    for (const ootd of ootds) {
      const key = `${ootd.date.getFullYear()}-${String(ootd.date.getMonth() + 1).padStart(2, "0")}-${String(ootd.date.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, ootd);
      }
    }
    return map;
  }, [ootds]);

  function handlePrevMonth() {
    setState((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  }

  function handleNextMonth() {
    setState((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  }

  const todayWeekday = WEEKDAY_LABELS[today.getDay()];
  const todayLabel = `${todayWeekday}. ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* 1段目: 今日の曜日と日付 */}
      <header className="space-y-1">
        <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-denim/40 dark:text-offwhite/30">
          Today
        </p>
        <h2 className="font-display text-2xl sm:text-3xl tracking-widest text-denim-dark dark:text-offwhite">
          {todayLabel}
        </h2>
      </header>

      {/* 2段目: 今週ストリップ */}
      <div
        aria-label="今週"
        className="grid grid-cols-7 gap-1 rounded-sm border border-denim/10 dark:border-offwhite/10 bg-offwhite-subtle dark:bg-canvas-subtle px-2 py-3"
      >
        {weekDays.map((d, i) => {
          const isToday = isSameDate(d, today);
          return (
            <div
              key={d.toISOString()}
              className="flex flex-col items-center gap-1"
              aria-current={isToday ? "date" : undefined}
            >
              <span
                className={[
                  "text-base font-bold leading-none tabular-nums",
                  isToday
                    ? "text-denim dark:text-offwhite"
                    : "text-denim/50 dark:text-offwhite/40",
                ].join(" ")}
              >
                {d.getDate()}
              </span>
              <span
                className={[
                  "text-[10px] font-medium tracking-wider uppercase leading-none",
                  isToday
                    ? "text-denim dark:text-offwhite"
                    : "text-denim/30 dark:text-offwhite/20",
                ].join(" ")}
              >
                {WEEKDAY_LABELS_SHORT[i]}
              </span>
              <span
                aria-hidden="true"
                className={[
                  "h-1.5 leading-none text-[10px]",
                  isToday
                    ? "text-denim dark:text-offwhite"
                    : "text-transparent",
                ].join(" ")}
              >
                ▲
              </span>
            </div>
          );
        })}
      </div>

      {/* 3段目: 月カレンダー */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="前の月"
            className="rounded-sm p-1.5 text-denim/50 hover:text-denim dark:text-offwhite/40 dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            <ChevronLeftIcon width={16} height={16} />
          </button>

          <h3 className="font-display text-xl tracking-widest text-denim-dark dark:text-offwhite">
            {MONTH_NAMES[state.month]} {state.year}
          </h3>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="次の月"
            className="rounded-sm p-1.5 text-denim/50 hover:text-denim dark:text-offwhite/40 dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            <ChevronRightIcon width={16} height={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-1 text-center text-xs font-medium tracking-wide text-denim/40 dark:text-offwhite/30"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px rounded-sm overflow-hidden bg-denim/5 dark:bg-offwhite/5">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="bg-offwhite dark:bg-canvas-subtle aspect-square"
                />
              );
            }

            const dateKey = `${state.year}-${String(state.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const ootd = ootdByDate.get(dateKey);
            const isToday =
              day === today.getDate() &&
              state.month === today.getMonth() &&
              state.year === today.getFullYear();

            return (
              <div
                key={`day-${day}`}
                className="relative bg-offwhite dark:bg-canvas-subtle aspect-square"
              >
                {ootd ? (
                  <button
                    type="button"
                    onClick={() => onSelect(ootd.id)}
                    aria-label={`${state.year}年${state.month + 1}月${day}日のコーデを見る`}
                    className="relative w-full h-full overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim"
                  >
                    <Image
                      src={ootd.imageUrl}
                      alt={ootd.oneLiner}
                      fill
                      sizes="(max-width: 768px) 14vw, 80px"
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <span
                      className={[
                        "absolute top-0.5 left-0.5 text-xs font-bold leading-none z-10",
                        "text-offwhite drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                        isToday ? "underline underline-offset-1" : "",
                      ].join(" ")}
                    >
                      {day}
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-start pt-1 h-full px-0.5">
                    <span
                      className={[
                        "text-xs font-medium leading-none",
                        isToday
                          ? "text-denim dark:text-denim-light font-bold underline underline-offset-1"
                          : "text-denim/25 dark:text-offwhite/20",
                      ].join(" ")}
                    >
                      {day}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
