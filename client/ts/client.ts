import { v4 as uuid } from "uuid";

import { CRDT } from "./crdt";
import { Editor, EditorInterface } from "./editor";
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
        this.editor = new Editor();
        this.connection = new Connection();
        this.crdt = new CRDT(this.uuid, this);
    }
}
