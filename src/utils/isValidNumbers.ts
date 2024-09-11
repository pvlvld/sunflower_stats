function isValidNumbers(numbers: any[]): boolean {
    numbers.forEach((n) => {
        if (isNaN(parseInt(n))) {
            return false;
        }
    });
    return true;
}

export default isValidNumbers;
