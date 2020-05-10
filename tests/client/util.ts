import { v4 as uuid } from "uuid";

import { ClientInterface } from "../../client/ts/client";
import { ConnectionInterface } from "../../client/ts/connection";
import { CRDT, Delta, Index } from "../../client/ts/crdt";
import { EditorInterface } from "../../client/ts/editor";
import { MessageInterface, MessageType } from "../../client/ts/message";

const DEBUG = false;

/*
 * Test connection class.
 *
 * Simulates a connection for testing purposes. Sent messages are placed in a
 * queue processed by an external simulated net.
 */
export class TestConnection implements ConnectionInterface {
    public queue: MessageInterface[];

    public constructor() {
        this.queue = [];
    }

    public isConnectionLive(): boolean {
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
 * Test editor class.
 */
export class TestEditor implements EditorInterface {
    public setText(text: string): void {
        if (DEBUG) {
            console.log("text: ", text);
        }
    }

    public editorInsert(index: Index, ch: string): void {
        if (DEBUG) {
            console.log("index: ", index, " ch: ", ch);
        }
    }

    public editorDelete(startIndex: Index, endIndex: Index): void {
        if (DEBUG) {
            console.log("start index: ", startIndex, " end index: ", endIndex);
        }
    }
}

/*
 * Test client class.
 */
export class TestClient implements ClientInterface {
    public uuid: string;
    public editor: EditorInterface;
    public connection: ConnectionInterface;
    public crdt: CRDT;

    public constructor() {
        this.uuid = uuid();
        this.editor = new TestEditor();
        this.connection = new TestConnection();
        this.crdt = new CRDT(this.uuid, this);
    }
}

/*
 * Test network class.
 *
 * Manages multiple test clients for testing purposes. The test network handles
 * communication between test clients.
 *
 * Example usage:
 * ```ts
 * const net = new TestNetwork(2) // create test net w/ 2 clients
 * net.peerInsert(0, ...) // delta object
 * net.peerInsert(1, ...) // delta object
 * net.run(true) // run unreliable net
 * ```
 */
export class TestNetwork {
    public peers: TestClient[];

    /* Create a network with `num` clients */
    public constructor(num: number) {
        this.peers = [];
        for (let i = 0; i < num; i++) {
            this.peers.push(new TestClient());
        }
    }

    /* Insert lines into specified client */
    public peerInsert(peerIndex: number, delta: Delta): void {
        if (peerIndex >= this.peers.length) {
            throw new Error("peer out of range");
        }
        this.peers[peerIndex].crdt.localInsert(delta);
    }

    /* Delete lines from specified client */
    public peerDelete(peerIndex: number, delta: Delta): void {
        if (peerIndex >= this.peers.length) {
            throw new Error("peer out of range");
        }
        this.peers[peerIndex].crdt.localDelete(delta);
    }

    /* Insert a random insert/delete operation into client */
    public randomInsertDelete(insertBias: number): void {
        // select a random client
        const peerIndex = Math.floor(Math.random() * this.peers.length);

        // generate operation and insert/delete
        const delta = this.randomDelta(peerIndex, insertBias);
        if (delta.action === "insert") {
            this.peers[peerIndex].crdt.localInsert(delta);
        } else {
            this.peers[peerIndex].crdt.localDelete(delta);
        }
    }

    /*
     * Run the network.
     *
     * Send messages in each client's queue to every other client on the network.
     * If `unreliable`, messages are not sent in-order.
     */
    public run(unreliable: boolean): void {
        for (let i = 0; i < this.peers.length; i++) {
            for (let j = 0; j < this.peers.length; j++) {
                if (i === j) {
                    continue;
                }
                if (unreliable) {
                    // reorder messages in the queue
                    this.shuffle(this.peers[i].connection.queue);
                    this.broadcast(this.peers[i], this.peers[j]);
                } else {
                    this.broadcast(this.peers[i], this.peers[j]);
                }
            }
            // reset queue
            this.peers[i].connection.queue = [];
        }
    }

    /* Send messages in `sourcePeer` queue to `destPeer` */
    private broadcast(sourcePeer: TestClient, destPeer: TestClient): void {
        sourcePeer.connection.queue.forEach((msg: MessageInterface) => {
            switch (msg.messageType) {
                case MessageType.Insert:
                    destPeer.crdt.remoteInsert(msg.ch);
                    break;
                case MessageType.Delete:
                    destPeer.crdt.remoteDelete(msg.ch);
                    break;
            }
        });
    }

    /* Generate a random permutation of `arr` */
    private shuffle<T>(arr: T[]): void {
        // Fisher-Yates algorithm
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    /* Generate a random insert/delete delta */
    private randomDelta(index: number, insertBias: number): Delta {
        // select a random index
        const document = this.peers[index].crdt.document;
        const r = Math.floor(Math.random() * document.length);
        const c = Math.floor(Math.random() * document[r].length);

        // select a random operation
        let generateInsert = Math.random() < insertBias;
        if (document[r][c] === undefined) {
            generateInsert = true;
        }

        if (generateInsert) {
            // generate an insert delta
            const ch = this.randomChar();
            if (ch === "\n") {
                return {
                    action: "insert",
                    start: { row: r, column: c },
                    end: { row: r + 1, column: 0 },
                    lines: ["", ""]
                };
            } else {
                return {
                    action: "insert",
                    start: { row: r, column: c },
                    end: { row: r, column: c + 1 },
                    lines: [ch]
                };
            }
        } else {
            // generate a delete delta
            const ch = document[r][c];
            if (ch.data === "\n") {
                return {
                    action: "remove",
                    start: { row: r, column: c },
                    end: { row: r + 1, column: 0 },
                    lines: ["", ""]
                };
            } else {
                return {
                    action: "remove",
                    start: { row: r, column: c },
                    end: { row: r, column: c + 1 },
                    lines: [ch.data]
                };
            }
        }
    }

    /* Generate a random character */
    private randomChar(): string {
        const characters = "abcd\n\n";
        return characters.charAt(Math.floor(Math.random() * characters.length));
    }
}
