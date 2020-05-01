import { v4 as uuid } from "uuid";

import { CRDT, Delta, Index } from "../../client/crdt";
import { Message, MessageInterface } from "../../client/message";
import { ConnectionInterface } from "../../client/connection";
import { EditorInterface } from "../../client/editor";
import { ClientInterface } from "../../client/client";

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
 * Test editor class.
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
    public peerInsert(index: number, delta: Delta): void {
        if (index >= this.peers.length) {
            throw new Error("peer out of range");
        }
        this.peers[index].crdt.localInsert(delta);
    }

    /* Delete lines from specified client */
    public peerDelete(index: number, delta: Delta): void {
        if (index >= this.peers.length) {
            throw new Error("peer out of range");
        }
        this.peers[index].crdt.localDelete(delta);
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
        sourcePeer.connection.queue.forEach(msg => {
            switch (msg.msg) {
                case Message.Insert:
                    destPeer.crdt.remoteInsert(msg.ch);
                    break;
                case Message.Delete:
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

    /* Generate a random character */
    private randomChar(): string {
        const characters = "abcd\n\n";
        return characters.charAt(Math.floor(Math.random() * characters.length));
    }
}
