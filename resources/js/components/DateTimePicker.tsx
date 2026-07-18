import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import { BadgeButton } from '@/components/badge';
import { Button } from '@/components/button';
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
    selectDropdownMenuClass,
} from '@/components/dropdown';
import {
    buildMonthGrid,
    clampScheduleDate,
    combineDateAndTime,
    defaultScheduleDate,
    formatScheduleSummary,
    fromTwelveHourParts,
    isSameDay,
    minuteOptions,
    monthYearLabel,
    parseDatetimeLocalValue,
    schedulePresets,
    toPickerValue,
    toTwelveHourParts,
    usesTwelveHourClock,
    weekdayLabels,
    type SchedulePresetId,
    MINUTE_STEP,
} from '@/lib/datetime-picker';

type DateTimePickerProps = {
    value: string;
    onChange: (datetimeLocal: string) => void;
    disabled?: boolean;
    locale?: string;
    showPresets?: boolean;
    labels?: {
        time?: string;
        prevMonth?: string;
        nextMonth?: string;
        empty?: string;
        presets?: Partial<Record<SchedulePresetId, string>>;
        timezoneHint?: string;
    };
    'data-publish-schedule-input'?: string;
};

const timeSelectTriggerClass = clsx(
    'w-full min-w-0 max-w-full cursor-pointer justify-center gap-x-0.5 font-normal tabular-nums',
    '!px-1.5 !py-1.5 sm:!px-2 sm:!py-1',
    'text-sm/5 sm:text-sm/6'
);

function TimeSelect({
    label,
    value,
    options,
    disabled,
    onChange,
    className,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    disabled?: boolean;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <Dropdown>
            <DropdownButton
                outline
                disabled={disabled}
                aria-label={label}
                className={clsx(timeSelectTriggerClass, className)}
            >
                <span className="min-w-0 truncate text-center tabular-nums">{value}</span>
                <IconChevronDown data-slot="icon" className="!mx-0 !size-3.5 shrink-0 opacity-60 sm:!size-3.5" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className={clsx(selectDropdownMenuClass, 'max-h-60 !min-w-16')}>
                {options.map((option) => {
                    const selected = option.value === value;

                    return (
                        <DropdownItem
                            key={option.value}
                            disabled={disabled}
                            onClick={() => onChange(option.value)}
                            className={dropdownInsetItemClass}
                        >
                            <DropdownLabel inset className="tabular-nums">
                                {option.label}
                            </DropdownLabel>
                            {selected ? (
                                <DropdownTrailingIcon inset>
                                    <IconCheck className="size-4 text-zinc-950 dark:text-white" />
                                </DropdownTrailingIcon>
                            ) : null}
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
}

export default function DateTimePicker({
    value,
    onChange,
    disabled = false,
    locale,
    showPresets = true,
    labels = {},
    'data-publish-schedule-input': dataAttr,
}: DateTimePickerProps) {
    const twelveHour = useMemo(() => usesTwelveHourClock(locale), [locale]);
    const selected = useMemo(() => parseDatetimeLocalValue(value), [value]);

    const [view, setView] = useState(() => {
        const base = selected ?? defaultScheduleDate();

        return { year: base.getFullYear(), month: base.getMonth() };
    });

    const effective = selected ?? defaultScheduleDate();
    const hours24 = effective.getHours();
    const minutes = effective.getMinutes();
    const { hour12, meridiem } = toTwelveHourParts(hours24);

    const weekdays = useMemo(() => weekdayLabels(locale, 0), [locale]);
    const cells = useMemo(() => buildMonthGrid(view, { weekStartsOn: 0 }), [view]);
    const presets = useMemo(() => schedulePresets(), []);
    const summary = formatScheduleSummary(selected ?? value, locale);

    function emit(date: Date) {
        const clamped = clampScheduleDate(date);
        setView({ year: clamped.getFullYear(), month: clamped.getMonth() });
        onChange(toPickerValue(clamped));
    }

    function ensureSeeded(): Date {
        if (selected !== null) {
            return new Date(selected.getTime());
        }

        const seed = defaultScheduleDate();
        onChange(toPickerValue(seed));

        return seed;
    }

    function selectDay(day: Date) {
        if (disabled) {
            return;
        }

        const base = selected ?? defaultScheduleDate();
        emit(combineDateAndTime(day, base.getHours(), base.getMinutes()));
    }

    function setHoursMinutes(nextHours: number, nextMinutes: number) {
        if (disabled) {
            return;
        }

        const base = ensureSeeded();
        emit(combineDateAndTime(base, nextHours, nextMinutes));
    }

    function shiftMonth(delta: number) {
        setView((current) => {
            const cursor = new Date(current.year, current.month + delta, 1);

            return { year: cursor.getFullYear(), month: cursor.getMonth() };
        });
    }

    const hourOptions = twelveHour
        ? Array.from({ length: 12 }, (_, index) => {
              const hour = index + 1;

              return { value: String(hour), label: String(hour) };
          })
        : Array.from({ length: 24 }, (_, hour) => ({
              value: String(hour),
              label: String(hour).padStart(2, '0'),
          }));

    const steppedMinutes = minuteOptions(MINUTE_STEP);
    const minuteChoices =
        steppedMinutes.includes(minutes) || selected === null
            ? steppedMinutes
            : [...steppedMinutes, minutes].sort((a, b) => a - b);
    const minuteSelectOptions = minuteChoices.map((minute) => ({
        value: String(minute),
        label: String(minute).padStart(2, '0'),
    }));

    const displayHour = twelveHour ? String(hour12) : String(hours24).padStart(2, '0');
    const displayMinute = String(minutes).padStart(2, '0');

    return (
        <div
            className="min-w-0 rounded-lg border border-zinc-950/10 dark:border-white/10 dark:bg-white/[0.02] dark:ring-1 dark:ring-white/5"
            data-datetime-picker
        >
            <div
                className="border-b border-zinc-950/10 px-3 py-2.5 dark:border-white/10"
                data-publish-schedule-input={dataAttr !== undefined ? '' : undefined}
                data-datetime-picker-summary
            >
                <p
                    className={clsx(
                        'text-sm/6 font-medium',
                        summary === '' ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-950 dark:text-white'
                    )}
                >
                    {summary === '' ? (labels.empty ?? 'Choose a date and time') : summary}
                </p>
                {labels.timezoneHint ? (
                    <p className="mt-0.5 text-xs/5 text-zinc-500 dark:text-zinc-400">{labels.timezoneHint}</p>
                ) : null}
            </div>

            <div className="px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                    <Button
                        type="button"
                        plain
                        disabled={disabled}
                        aria-label={labels.prevMonth ?? 'Previous month'}
                        onClick={() => shiftMonth(-1)}
                        className="!px-2"
                    >
                        <IconChevronLeft data-slot="icon" />
                    </Button>
                    <p className="text-sm/6 font-semibold text-zinc-950 dark:text-white">
                        {monthYearLabel(view, locale)}
                    </p>
                    <Button
                        type="button"
                        plain
                        disabled={disabled}
                        aria-label={labels.nextMonth ?? 'Next month'}
                        onClick={() => shiftMonth(1)}
                        className="!px-2"
                    >
                        <IconChevronRight data-slot="icon" />
                    </Button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center" role="rowgroup">
                    {weekdays.map((label) => (
                        <div
                            key={label}
                            className="text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                        >
                            {label}
                        </div>
                    ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label={monthYearLabel(view, locale)}>
                    {cells.map((cell) => {
                        const isSelected = selected !== null && isSameDay(cell.date, selected);
                        const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;

                        return (
                            <button
                                key={key}
                                type="button"
                                disabled={disabled || cell.disabled}
                                aria-pressed={isSelected}
                                aria-label={cell.date.toLocaleDateString(locale, {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                                onClick={() => selectDay(cell.date)}
                                className={clsx(
                                    'flex h-9 w-full items-center justify-center rounded-lg text-sm/5 tabular-nums transition-colors',
                                    'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                                    'disabled:cursor-not-allowed disabled:opacity-40',
                                    !cell.inMonth && !isSelected && 'text-zinc-400 dark:text-zinc-600',
                                    cell.inMonth &&
                                        !isSelected &&
                                        'text-zinc-950 hover:bg-zinc-950/5 dark:text-white dark:hover:bg-white/10',
                                    cell.isToday &&
                                        !isSelected &&
                                        'ring-1 ring-inset ring-zinc-950/15 dark:ring-white/20',
                                    isSelected &&
                                        'bg-zinc-900 font-semibold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-white'
                                )}
                            >
                                {cell.day}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 min-w-0 border-t border-zinc-950/10 pt-3 dark:border-white/10">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 text-sm/6 text-zinc-500 dark:text-zinc-400">
                            {labels.time ?? 'Time'}
                        </span>
                        <div
                            className={clsx(
                                'grid min-w-0 flex-1 items-center gap-1',
                                twelveHour
                                    ? 'grid-cols-[1fr_auto_1fr_minmax(3.25rem,0.85fr)]'
                                    : 'grid-cols-[1fr_auto_1fr]'
                            )}
                            data-datetime-picker-time
                        >
                            <TimeSelect
                                label="Hour"
                                value={displayHour}
                                options={hourOptions}
                                disabled={disabled}
                                onChange={(next) => {
                                    if (twelveHour) {
                                        setHoursMinutes(fromTwelveHourParts(Number(next), meridiem), minutes);
                                    } else {
                                        setHoursMinutes(Number(next), minutes);
                                    }
                                }}
                            />
                            <span
                                className="select-none text-sm font-medium text-zinc-400 dark:text-zinc-500"
                                aria-hidden
                            >
                                :
                            </span>
                            <TimeSelect
                                label="Minute"
                                value={displayMinute}
                                options={minuteSelectOptions}
                                disabled={disabled}
                                onChange={(next) => setHoursMinutes(hours24, Number(next))}
                            />
                            {twelveHour ? (
                                <TimeSelect
                                    label="AM/PM"
                                    value={meridiem.toUpperCase()}
                                    options={[
                                        { value: 'AM', label: 'AM' },
                                        { value: 'PM', label: 'PM' },
                                    ]}
                                    disabled={disabled}
                                    onChange={(next) => {
                                        setHoursMinutes(
                                            fromTwelveHourParts(hour12, next.toLowerCase() as 'am' | 'pm'),
                                            minutes
                                        );
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>

                {showPresets ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {presets.map((preset) => (
                            <BadgeButton
                                key={preset.id}
                                color="zinc"
                                disabled={disabled}
                                onClick={() => emit(preset.date)}
                            >
                                {labels.presets?.[preset.id] ?? preset.id}
                            </BadgeButton>
                        ))}
                    </div>
                ) : null}
            </div>

            <input type="hidden" name="published_at" value={value} readOnly data-publish-schedule-value={value} />
        </div>
    );
}
