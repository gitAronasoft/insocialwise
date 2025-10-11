import React, { useState } from 'react';
import {
    subDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subWeeks,
    subMonths,
} from 'date-fns';
import { DateRangePicker, createStaticRanges } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { enUS } from 'date-fns/locale';

const DateRangePickerComponent = ({ onDateChange,selectedRange }) => {
  const today = new Date();
  const endDate = today //subDays(today, 1); 
  //const startDate = subDays(endDate, 6); 

  // const selectionRange = {
  //   startDate,
  //   endDate,
  //   key: 'selection',
  // }
  const [selectedDays, setSelectedDays] = useState([selectedRange]);

  const customLocale = {
    ...enUS,
    options: {
      ...enUS.options,
      weekStartsOn: 1, // Monday
    },
  };

  const handleSelect = (ranges) => {
    setSelectedDays([ranges.selection]);
    onDateChange && onDateChange(ranges.selection); // pass selected range to parent
  };

  const customStaticRanges = createStaticRanges([
    {
        label: 'Last 7 days',
        range: () => ({
            startDate: subDays(endDate, 6),
            endDate: endDate,
        }),
    },
    {
        label: 'Last 28 days',
        range: () => ({
            startDate: subDays(endDate, 27),
            endDate: endDate,
        }),
    },
    {
        label: 'Last 90 days',
        range: () => ({
            startDate: subDays(endDate, 89),
            endDate: endDate,
        }),
    },
    {
        label: 'This week',
        range: () => ({
            startDate: endDate,
            endDate: startOfWeek(today, { weekStartsOn: 1 }),
        }),
    },
    {
        label: 'Last week',
        range: () => {
            const start = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
            const end = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
            return { startDate: start, endDate: end };
        },
    },
    {
        label: 'This month',
        range: () => ({
            startDate: startOfMonth(today),
            endDate: endDate,
        }),
    },
    {
        label: 'Last month',
        range: () => {
            const start = startOfMonth(subMonths(today, 1));
            const end = endOfMonth(subMonths(today, 1));
            return { startDate: start, endDate: end };
        },
    },
  ]);

  return (
    <div style={{ zIndex: 999, position: 'relative' }}>
      <DateRangePicker
        onChange={handleSelect}
        showSelectionPreview={true}
        moveRangeOnFirstSelection={false}
        months={2}
        direction="horizontal"
        maxDate={new Date()}
        locale={customLocale}
        ranges={selectedDays}
        staticRanges={customStaticRanges}
        showMonthAndYearPickers={true}
        editableDateInputs = {true}
        inputRanges={[]}
      />
    </div>
  );
};

export default DateRangePickerComponent;
