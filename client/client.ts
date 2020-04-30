import { CRDT } from "./crdt";
import { EditorInterface } from "./editor";
import { ConnectionInterface } from "./connection";

/* TODO document */
export interface ClientInterface {
    uuid: string;
    editor: EditorInterface;
    connection: ConnectionInterface;
    crdt: CRDT;
}
