import moment from "moment";

type DateRangeKey = "today" | "yesterday" | "weekRange" | "monthRange" | "yearRange" | "all" | "global";

export type IFormattedRangeDateGetters = {
    [K in DateRangeKey]: [string, string, K];
};

/** Dates in "YYY-MM-DD" format.*/
export class FormattedDate {
    get today(): IFormattedRangeDateGetters["today"] {
        const today = moment().format("YYYY-MM-DD");
        return [today, today, "today"];
    }

    get yesterday(): IFormattedRangeDateGetters["yesterday"] {
        const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
        return [yesterday, yesterday, "yesterday"];
    }

    get weekRange(): IFormattedRangeDateGetters["weekRange"] {
        return [
            moment().startOf("isoWeek").format("YYYY-MM-DD"),
            moment().endOf("isoWeek").format("YYYY-MM-DD"),
            "weekRange",
        ];
    }

    get monthRange(): IFormattedRangeDateGetters["monthRange"] {
        return [
            moment().startOf("month").format("YYYY-MM-DD"),
            moment().endOf("month").format("YYYY-MM-DD"),
            "monthRange",
        ];
    }

    get yearRange(): IFormattedRangeDateGetters["yearRange"] {
        return [moment().startOf("year").format("YYYY-MM-DD"), moment().endOf("year").format("YYYY-MM-DD"), "yearRange"];
    }

    get all(): IFormattedRangeDateGetters["all"] {
        return ["2013-08-14", moment().format("YYYY-MM-DD"), "all"];
    }

    public dateToYYYYMMDD(date: Date) {
        return date.toISOString().split("T")[0];
    }
}

const formattedDate = new FormattedDate();

export default formattedDate;
