import { createBareServer } from "@tomphttp/bare-server-node";
import express from "express";
import { createServer } from "node:http";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { join } from "node:path";
import { hostname } from "node:os";

const bare = createBareServer("/bare/");
const app = express();

app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));

app.use((req, res) => {
    res.status(404);
    res.sendFile(join(publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
    if (bare.shouldRoute(req)) {
        bare.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

server.on("upgrade", (req, socket, head) => {
    if (bare.shouldRoute(req)) {
        bare.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 80;

server.on("listening", () => {
    const address = server.address();
    console.log("Listening on:");
    console.log(`\thttp://${hostname()}:${address.port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("Closing HTTP server");
    server.close();
    bare.close();
    process.exit(0);
}

server.listen(port);