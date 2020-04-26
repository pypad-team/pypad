import app from "./app";
import { ExpressPeerServer } from "peer";

const port = process.env.PORT || 3000;

// Run server listening on specified port
var appServer = app.listen(port, function() {
    return console.log(`Server is listening on port ${port}`);
});

// Create listener for peer connections
var peerServer = ExpressPeerServer(appServer, {});
app.use("/peerjs", peerServer)