import { Client } from "./client";

const client = new Client();

// TODO
const shareButton = document.getElementById("share");
if (shareButton !== null) {
    shareButton.addEventListener("click", () => {
        client.getConnectionLink();
    });
}
