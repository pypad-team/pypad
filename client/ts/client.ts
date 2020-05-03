import { v4 as uuid } from "uuid";

import { CRDT } from "./crdt";
import { Editor, EditorInterface } from "./editor";
import { InvalidActionError } from "./errors";
import { Connection, ConnectionInterface } from "./connection";

/* TODO document */
export interface ClientInterface {
    uuid: string;
    editor: EditorInterface;
    connection: ConnectionInterface;
    crdt: CRDT;
    [prop: string]: any; // avoid explicit any (?)
}

/* TODO document */
export class Client implements ClientInterface {
    public uuid: string;
    public editor: EditorInterface;
    public connection: ConnectionInterface;
    public crdt: CRDT;

    public constructor() {
        this.uuid = uuid();
        this.editor = new Editor(this);
        this.connection = new Connection(this.getHostID(), this);
        this.crdt = new CRDT(this.uuid, this);
    }

    /**
     * Copy link to connect to host and peer network
     */
    public copyConnectLink(): void {
        console.log(this.connection);
        if (this.connection.isConnectionLive()) {
            const connectLink = `${location.origin}?${this.connection.getHostID()}`;
            navigator.clipboard.writeText(connectLink);
        } else {
            throw new InvalidActionError("Client is not yet connected.");
        }
    }

    /**
     * Get the host ID string from URL
     */
    private getHostID(): string {
        return location.search === "" ? "" : location.search.slice(1);
    }
}
