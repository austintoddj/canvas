import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    selectDropdownMenuClass,
    selectDropdownTriggerCompactClass,
} from '@/components/dropdown';
import { useCanvas } from '@/hooks/useCanvas';
import { DASHBOARD_RANGE_DAYS, DASHBOARD_RANGE_LABEL_KEYS } from '@/lib/dashboard';
import type { DashboardRangeDays } from '@/types/api';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import clsx from 'clsx';

type DashboardRangeDropdownProps = {
    value: DashboardRangeDays;
    onChange: (days: DashboardRangeDays) => void;
    disabled?: boolean;
};

export function DashboardRangeDropdown({ value, onChange, disabled = false }: DashboardRangeDropdownProps) {
    const { t } = useCanvas();

    return (
        <Dropdown>
            <DropdownButton
                outline
                disabled={disabled}
                className={clsx(selectDropdownTriggerCompactClass, 'min-w-[9.5rem]')}
                aria-label={t('dashboard.range_label')}
            >
                <span className="truncate">{t(DASHBOARD_RANGE_LABEL_KEYS[value])}</span>
                <IconChevronDown data-slot="icon" className="size-4 shrink-0 opacity-60" aria-hidden="true" />
            </DropdownButton>
            <DropdownMenu anchor="bottom end" className={clsx(selectDropdownMenuClass, '!min-w-44')}>
                {DASHBOARD_RANGE_DAYS.map((days) => {
                    const selected = days === value;

                    return (
                        <DropdownItem key={days} onClick={() => onChange(days)}>
                            <DropdownLabel inset>{t(DASHBOARD_RANGE_LABEL_KEYS[days])}</DropdownLabel>
                            {selected ? (
                                <DropdownTrailingIcon inset>
                                    <IconCheck className="size-4" aria-hidden="true" />
                                </DropdownTrailingIcon>
                            ) : null}
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
}
