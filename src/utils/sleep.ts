function sleepSync(ms: number) {
    const start = Date.now();
    while (Date.now() - start < ms) {}
}

async function sleepAsync(ms: number) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
}

export { sleepAsync, sleepSync };
