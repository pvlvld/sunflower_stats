const cmdToDateRangeMap = {
    день: "today",
    сьогодні: "today",
    вчора: "yesterday",
    тиждень: "weekRange",
    місяць: "monthRange",
    рік: "yearRange",
    вся: "all",
    undefined: "today",
    today: "today",
    yesterday: "yesterday",
    week: "weekRange",
    month: "monthRange",
    year: "yearRange",
    all: "all",
    full: "all",
    total: "all",
    global: "global",
} as const;

export type IDateRange = (typeof cmdToDateRangeMap)[keyof typeof cmdToDateRangeMap];
export type IAllowedChartStatsRanges = Exclude<IDateRange, "today" | "yesterday"> | "global";
