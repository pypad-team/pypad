import { Client } from "./client";

const client = new Client();

// TODO
const shareButton = document.getElementById("share");
if (shareButton !== null) {
    shareButton.addEventListener("click", () => {
        client.getConnectionLink();
    });
}

const form = document.getElementById("entry");
if (form !== null) {
    form.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        const nameElement = document.getElementById("name") as HTMLInputElement;
        if (nameElement !== null) {
            client.setName(nameElement.value);
            const overlay = document.getElementById("overlay");
            if (overlay !== null) {
                overlay.remove();
            }
        }
    });
}
