import moment from "moment";

export const yyyy_mm_dd_date = () => {
  return moment().format("YYYY-MM-DD");
};

export class DynamicDateRange {
  private getFormattedDateRange(
    start: moment.Moment,
    end: moment.Moment
  ): [string, string] {
    return [start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")];
  }

  get yesterdayDate(): string {
    return moment().subtract(1, "days").format("YYYY-MM-DD");
  }

  get weekRange(): [monday: string, sunday: string] {
    const monday = moment().startOf("week");
    const sunday = moment().endOf("week");

    return this.getFormattedDateRange(monday, sunday);
  }

  get monthRange(): [firstDayOfTheMonth: string, lastDayOfTheMonth: string] {
    const firstDay = moment().startOf("month");
    const lastDay = moment().endOf("month");

    return this.getFormattedDateRange(firstDay, lastDay);
  }
}

const DateRange = new DynamicDateRange();

export default DateRange;
