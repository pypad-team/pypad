import { v4 as uuid } from "uuid";

import { Connection, ConnectionInterface } from "./connection";
import { CRDT } from "./crdt";
import { Editor, EditorInterface } from "./editor";
import { ConnectionError } from "./error";
import { MessageType } from "./message";

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

    /** Get host ID string from URL */
    private getHostID(): string {
        return location.search === "" ? "" : location.search.slice(1);
    }
}
