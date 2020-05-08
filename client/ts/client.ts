import { v4 as uuid } from "uuid";

import { Connection, ConnectionInterface } from "./connection";
import { CRDT } from "./crdt";
import { Editor, EditorInterface } from "./editor";
import { ConnectionError } from "./error";
import { MessageType } from "./message";
import { Color } from "./color";

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
    public editor: EditorInterface;
    public connection: ConnectionInterface;
    public crdt: CRDT;
    public name?: string;

    public constructor() {
        this.uuid = uuid();
        this.editor = new Editor(this);
        this.connection = new Connection(this.getHostID(), this);
        this.crdt = new CRDT(this.uuid, this);
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
     * @param dotColor - color of the peer's dot in the display
     * @param name - name of the peer to display
     * @param peerID - ID of the peer to add
     */
    public addPeerDisplay(dotColor: Color, name: string, peerID: string): void {
        const peersElement = document.getElementById("peer-list");
        const peerElement = document.createElement("div");
        const dotElement = document.createElement("span");
        const nameElement = document.createElement("span");
        peerElement.id = peerID;
        peerElement.classList.add("peer");
        dotElement.classList.add("peer-dot");
        nameElement.classList.add("peer-name");
        dotElement.style.backgroundColor = `rgb(${dotColor.r}, ${dotColor.g}, ${dotColor.b})`;
        nameElement.innerHTML = name;
        peerElement.appendChild(dotElement);
        peerElement.appendChild(nameElement);
        peersElement!.appendChild(peerElement);
    }

    /**
     * Remove a peer from the peers list display
     * @param peerID - ID of the peer to remove
     */
    public removePeerDisplay(peerID: string): void {
        const peerElement = document.getElementById(peerID);
        peerElement!.remove();
    }

    /**
     * Update the display of a peer in the peers list
     * @param peerID - ID of the peer to update
     * @param name - name of the peer to display
     * @param dotColor - color of the peer's dot in the display
     */
    public updatePeerDisplay(peerID: string, name?: string, dotColor?: Color): void {
        const peerElement = document.getElementById(peerID);
        if (name !== undefined) {
            (peerElement!.children[1] as HTMLElement)!.innerHTML = name;
        }
        if (dotColor !== undefined) {
            (peerElement!
                .children[0] as HTMLElement)!.style.backgroundColor = `rgb(${dotColor.r}, ${dotColor.g}, ${dotColor.b})`;
        }
    }

    /** Get host ID string from URL */
    private getHostID(): string {
        return location.search === "" ? "" : location.search.slice(1);
    }
}
