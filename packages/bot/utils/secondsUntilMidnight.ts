function secondsUntilMidnight(): number {
    const m = new Date();
    m.setHours(24, 0, 0, 0);
    return Math.ceil((m.getTime() - new Date().getTime()) / 1000);
}

export { secondsUntilMidnight };
