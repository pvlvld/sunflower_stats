import { ChartService } from "./chartService.js";

async function main() {
    const chartService = new ChartService();
    await chartService.start();

    process.on("SIGINT", async () => {
        console.log("Received SIGINT, stopping ChartService...");
        await chartService.stop();
        process.exit(0);
    });
}

main();
