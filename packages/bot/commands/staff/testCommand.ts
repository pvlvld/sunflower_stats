import { Database } from "../../db/db.js";
import { IContext } from "../../types/context.js";

async function testCommand(ctx: IContext) {
    // This is a placeholder for the test command functionality.
    // It can be used to test various features of the application.
    console.log("Test command executed successfully.");
    const res = await Database.chat.settings.getChatsLocaleWithActiveUsersSinceNDays(2);
    console.log("\n\n");
    console.log(res);
}

export { testCommand };
