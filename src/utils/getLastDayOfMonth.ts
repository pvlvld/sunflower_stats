function getLastDayOfMonth() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(0);
    return nextMonth;
}

export { getLastDayOfMonth };
