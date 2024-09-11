import { webhookCallback } from "grammy";
import fastify from "fastify";
import bot from "./bot.js";

function createServer() {
    const server = fastify();

    server.setErrorHandler(async (error) => {
        console.error(error);
    });

    server.post(`/${bot.token}`, webhookCallback(bot, "fastify"));

    return server;
}

export default createServer;
