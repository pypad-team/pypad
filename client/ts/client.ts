import { v4 as uuid } from "uuid";

import { Connection, ConnectionInterface } from "./connection";
import { Console } from "./console";
import { Color } from "./color";
import { CRDT } from "./crdt";
import { Editor, EditorInterface } from "./editor";
import { ConnectionError } from "./error";
import { MessageType } from "./message";
import { generateName } from "./names";

const DEFAULT_DOCUMENT = `def print_ten():
    for i in range(10):
        print(i)

print_ten()`;

/** Generic client interface */
export interface ClientInterface {
    uuid: string;
    editor: EditorInterface;
    connection: ConnectionInterface;
    crdt: CRDT;
    [prop: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Client representation.
 *
 * Manages the components associated to each client in the editing
 * session.
 */
export class Client implements ClientInterface {
    public uuid: string;
    public connection: ConnectionInterface;
    public console: Console;
    public crdt: CRDT;
    public editor: EditorInterface;
    public name: string;

    private bindingsIndex;

    public constructor() {
        this.initHandlers();
        // Set name to cached name if exists
        const cachedName = window.localStorage.getItem("name");
        if (cachedName === null) {
            this.name = generateName();
        } else {
            this.name = cachedName;
            const start = document.getElementById("start")!;
            start.remove();
        }
        this.uuid = uuid();
        this.connection = new Connection(this.getHostID(), this);
        this.console = new Console(this);
        this.crdt = new CRDT(this.uuid, this);
        this.editor = new Editor(this);
        this.addPeerDisplay({ h: 220, s: 28, l: 88 }, this.name, this.uuid);
        // Initialize document
        if (this.connection.isHost) {
            const cachedDocument = window.localStorage.getItem("document");
            if (cachedDocument === null) {
                this.crdt.initDocument(DEFAULT_DOCUMENT);
            } else {
                this.crdt.initDocument(cachedDocument);
            }
        }
        this.bindingsIndex = 0;
    }

    /**
     * Initialize the name of the client.
     *
     * @param name - name of the client
     */
    public setName(name: string): void {
        this.name = name;
        if (this.connection.isConnectionLive()) {
            this.connection.sendMessage({
                messageType: MessageType.Update,
                id: this.connection.getID(),
                name: this.name
            });
        }
        this.updatePeerDisplay(this.uuid, name);
        // Cache name
        window.localStorage.setItem("name", name);
    }

    /** Get connection link to connect to peer network */
    public getConnectionLink(): void {
        if (this.connection.isConnectionLive()) {
            const connectLink = `${location.origin}?${this.connection.getHostID()}`;
            navigator.clipboard.writeText(connectLink);
        } else {
            throw new ConnectionError("client is not connected");
        }
    }

    /**
     * Add a peer to the peers list display
     *
     * @param dotColor - color of the peer's dot in the display
     * @param name - name of the peer to display
     * @param peerID - ID of the peer to add
     */
    public addPeerDisplay(dotColor: Color, name: string, peerID: string): void {
        // TODO cleanup (?)
        const peersElement = document.getElementById("peer-list");
        const peerElement = document.createElement("div");
        const dotElement = document.createElement("span");
        const nameElement = document.createElement("span");
        peerElement.id = peerID;
        peerElement.classList.add("peer");
        dotElement.classList.add("peer-dot");
        nameElement.classList.add("peer-name");
        dotElement.style.backgroundColor = `hsl(${dotColor.h}, ${dotColor.s}%, ${dotColor.l}%)`;
        // If the peer to add is the host, indicate it
        if ((this.connection.isHost && peerID === this.uuid) || peerID === this.connection.hostID) {
            nameElement.innerHTML = name + " (host)";
        } else {
            nameElement.innerHTML = name;
        }
        peerElement.appendChild(dotElement);
        peerElement.appendChild(nameElement);
        peersElement!.appendChild(peerElement);
    }

    /**
     * Remove a peer from the peers list display
     *
     * @param peerID - ID of the peer to remove
     */
    public removePeerDisplay(peerID: string): void {
        const peerElement = document.getElementById(peerID);
        if (peerElement !== null) {
            peerElement!.remove();
        }
    }

    /**
     * Update the display of a peer in the peers list
     *
     * @param peerID - ID of the peer to update
     * @param name - name of the peer to display
     * @param dotColor - color of the peer's dot in the display
     */
    public updatePeerDisplay(peerID: string, name?: string, dotColor?: Color): void {
        const peerElement = document.getElementById(peerID);
        if (name !== undefined) {
            if ((this.connection.isHost && peerID === this.uuid) || peerID === this.connection.hostID) {
                (peerElement!.children[1] as HTMLElement)!.innerHTML = name + " (host)";
            } else {
                (peerElement!.children[1] as HTMLElement)!.innerHTML = name;
            }
        }
        if (dotColor !== undefined) {
            (peerElement!
                .children[0] as HTMLElement)!.style.backgroundColor = `hsl(${dotColor.h}, ${dotColor.s}%, ${dotColor.l}%)`;
        }
    }

    /* Get host ID string from URL */
    private getHostID(): string {
        return location.search === "" ? "" : location.search.slice(1);
    }

    /* Initialize interactive elements */
    private initHandlers(): void {
        // run button
        const runButton = document.getElementById("run")!;
        runButton.addEventListener("click", () => {
            this.console.run();
        });
        // link button
        const linkButton = document.getElementById("link")!;
        linkButton.addEventListener("click", () => {
            this.getConnectionLink();
        });
        // bindings button
        const bindingsButton = document.getElementById("bindings")!;
        bindingsButton.addEventListener("click", () => {
            this.editor.updateBindings();
        });
        // reset button
        const resetButton = document.getElementById("reset")!;
        resetButton.addEventListener("click", () => {
            this.console.reset();
        });
        // submission button
        const input = document.getElementById("name-input");
        input!.addEventListener("submit", (e: Event) => {
            e.preventDefault();
            const nameElement = document.getElementById("name") as HTMLInputElement;
            const start = document.getElementById("start")!;
            this.setName(nameElement!.value);
            start.remove();
        });
    }
}
