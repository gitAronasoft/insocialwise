import { 
  subDays, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  subWeeks, subMonths 
} from 'date-fns';

export const getCustomStaticRanges = (today = new Date()) => {
  const endDate = subDays(today, 0);

  return [
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
  ];
};
