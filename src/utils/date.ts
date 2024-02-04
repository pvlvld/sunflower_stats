import moment from "moment";

export const yyyy_mm_dd_date = () => {
  return moment().format("YYYY-MM-DD");
};

export class DynamicDateRange {
  get yesterdayDate(): string {
    return moment().subtract(1, "days").format("YYYY-MM-DD");
  }

  get weekRange(): [monday: string, sunday: string] {
    return [
      moment().startOf("week").format("YYYY-MM-DD"),
      moment().endOf("week").format("YYYY-MM-DD"),
    ];
  }

  get monthRange(): [firstDayOfTheMonth: string, lastDayOfTheMonth: string] {
    return [
      moment().startOf("month").format("YYYY-MM-DD"),
      moment().endOf("month").format("YYYY-MM-DD"),
    ];
  }
}

const DateRange = new DynamicDateRange();

export default DateRange;
