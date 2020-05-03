import { Client } from "./client";

const client = new Client();

// TODO: clean this up
const shareButton = document.getElementById("share");
if (shareButton !== null) {
    shareButton.addEventListener("click", () => {
        client.copyConnectLink();
    });
}
