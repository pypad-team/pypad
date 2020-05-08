import { Client } from "./client";

const client = new Client();

// TODO cleanup
const linkButton = document.getElementById("link");
linkButton!.addEventListener("click", () => {
    client.getConnectionLink();
});

// TODO cleanup
const form = document.getElementById("entry");
form!.addEventListener("submit", (e: Event) => {
    e.preventDefault();
    const nameElement = document.getElementById("name") as HTMLInputElement;
    const overlay = document.getElementById("overlay");
    client.setName(nameElement!.value);
    overlay!.remove();
});
