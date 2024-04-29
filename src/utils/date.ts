import moment from "moment";

export interface IFormattedRangeDateGetters {
  today: string;
  yesterday: string;
  weekRange: [monday: string, sunday: string];
  monthRange: [firstDayOfTheMonth: string, lastDayOfTheMonth: string];
  yearRange: [firstDayOfYear: string, lastDayOfYear: string];
  all: [from: string, to: string];
}

/** Dates in "YYY-MM-DD" format.*/
export class FormattedDate {
  get today(): string {
    return moment().format("YYYY-MM-DD");
  }

  get yesterday(): string {
    return moment().subtract(1, "days").format("YYYY-MM-DD");
  }

  get weekRange(): IFormattedRangeDateGetters["weekRange"] {
    return [
      moment().startOf("isoWeek").format("YYYY-MM-DD"),
      moment().endOf("isoWeek").format("YYYY-MM-DD"),
    ];
  }

  get monthRange(): IFormattedRangeDateGetters["monthRange"] {
    return [
      moment().startOf("month").format("YYYY-MM-DD"),
      moment().endOf("month").format("YYYY-MM-DD"),
    ];
  }

  get yearRange(): IFormattedRangeDateGetters["yearRange"] {
    return [
      moment().startOf("year").format("YYYY-MM-DD"),
      moment().endOf("year").format("YYYY-MM-DD"),
    ];
  }

  get all(): IFormattedRangeDateGetters["all"] {
    return ["2023-12-31", moment().format("YYYY-MM-DD")];
  }
}

const formattedDate = new FormattedDate();

export default formattedDate;
