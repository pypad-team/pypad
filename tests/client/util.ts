import { v4 as uuid } from "uuid";

import { CRDT, Index } from "../../client/crdt";
import { MessageInterface } from "../../client/message";
import { ConnectionInterface } from "../../client/connection";
import { EditorInterface } from "../../client/editor";
import { ClientInterface } from "../../client/client";

const DEBUG = false;

/*
 * TODO document
 */
export class TestConnection implements ConnectionInterface {
    public queue;

    public constructor() {
        this.queue = [];
    }

    public isConnected(): boolean {
        return true;
    }

    public sendMessage(msg: MessageInterface): void {
        if (DEBUG) {
            console.log("message: ", msg);
        }
        this.queue.push(msg);
    }
}

/*
 * TODO document
 */
export class TestEditor implements EditorInterface {
    public editorInsert(index: Index, ch: string): void {
        if (DEBUG) {
            console.log("index: ", index, " ch: ", ch);
        }
    }

    public editorDelete(index: Index): void {
        if (DEBUG) {
            console.log("index: ", index);
        }
    }
}

/*
 * TODO document
 */
export class TestClient implements ClientInterface {
    public uuid;
    public editor;
    public connection;
    public crdt;

    public constructor() {
        this.uuid = uuid();
        this.editor = new TestEditor();
        this.connection = new TestConnection();
        this.crdt = new CRDT(this.uuid, this);
    }
}
