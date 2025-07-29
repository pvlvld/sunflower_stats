import isValidNumbers from "./isValidNumbers.js";

function isValidDateOrDateRange(dateRange: string[]) {
    if (dateRange.length === 1) {
        return (
            dateRange[0].length === 10 &&
            dateRange[0].split(".").length === 3 &&
            isValidNumbers(dateRange[0].split("."))
        );
    }
    return (
        dateRange[0].length === 10 &&
        dateRange[1].length === 10 &&
        dateRange[0].split(".").length === 3 &&
        dateRange[1].split(".").length === 3 &&
        isValidNumbers(dateRange[0].split(".")) &&
        isValidNumbers(dateRange[1].split("."))
    );
}

export { isValidDateOrDateRange };
