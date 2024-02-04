import moment from "moment";

/** Dates in "YYY-MM-DD" format.*/
export class FormattedDate {
  get today(): string {
    return moment().format("YYYY-MM-DD");
  }
  get yesterday(): string {
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

const formattedDate = new FormattedDate();

export default formattedDate;
