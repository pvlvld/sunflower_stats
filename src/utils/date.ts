export const yyyy_mm_dd_date = () => new Date().toISOString().slice(0, 10);

class DynamicDateRange {
  // Is today method worth it??
  private get today(): Date {
    return new Date();
  }

  private getFormattedDateRange(start: Date, end: Date): [string, string] {
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
  }

  get weekRange(): [monday: string, sunday: string] {
    const monday = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate() - this.today.getDay()
    );
    const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);

    return this.getFormattedDateRange(monday, sunday);
  }

  get monthRange(): [firstDayOfTheMonth: string, lastDayOfTheMonth: string] {
    const year = this.today.getFullYear();
    const month = this.today.getMonth();

    const firstDay = new Date(year, month, 2);
    const lastDay = new Date(year, month + 1, 1);

    return this.getFormattedDateRange(firstDay, lastDay);
  }
}

const DateRange = new DynamicDateRange();

export default DateRange;
