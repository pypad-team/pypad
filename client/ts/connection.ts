import { ClientInterface } from "./client";
import { ConnectionError } from "./error";
import { MessageInterface, MessageType } from "./message";

/** PeerJS peer class; source loaded using CDN */
declare const Peer: any;

/** Generic connection interface */
export interface ConnectionInterface {
    isConnectionLive(): boolean;
    sendMessage(msg: MessageInterface): void;
    [prop: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Internal connection representation.
 *
 * Handles communication between clients in the editing session. Peers
 * connect to a central host; sent messages are routed to peers through
 * the host.
 */
export class Connection implements ConnectionInterface {
    private hostID: string;
    private id: string;
    private client: ClientInterface;

    private isHost: boolean;
    private connectedToServer: boolean;
    private connectedToHost: boolean;
    private attemptingReconnect: boolean;

    private turnServerConnection?: any;
    private peerConnections: Map<string, any>;

    constructor(hostID: string, client: ClientInterface) {
        this.hostID = hostID;
        this.id = "";
        this.client = client;

        this.isHost = hostID === "";
        this.connectedToServer = false;
        this.connectedToHost = false;
        this.attemptingReconnect = false;

        this.peerConnections = new Map<string, any>();
        this.connectToNetwork();
    }

    /**
     * Returns the connection status.
     *
     * @returns `true` if client is host or if client is connected to host and
     * connection has been assigned an ID
     */
    public isConnectionLive(): boolean {
        return this.connectedToServer && this.connectedToHost;
    }

    /**
     * Send message to remote peers.
     *
     * @param msg - message to be sent
     * @returns `true` if message is sent successfully; `false` otherwise
     */
    public sendMessage(msg: MessageInterface): boolean {
        try {
            if (this.isHost) {
                this.sendMessageToPeers(msg);
            } else {
                this.sendMessageToHost(msg);
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Returns the ID of the central host.
     *
     * @returns central host ID
     *
     * @throws {@link ConnectionError}
     * Thrown if host has not been assigned an ID
     */
    public getHostID(): string {
        if (this.isHost) {
            if (this.id === "") {
                throw new ConnectionError("host not assigned an ID");
            }
            return this.id;
        }
        return this.hostID;
    }

    /**
     * Send message from peer to host.
     *
     * @param msg - message to be sent
     * @returns `true` if message is sent successfully; `false` otherwise
     *
     * @throws {@link ConnectionError}
     * Thrown if not connected to network
     */
    private sendMessageToHost(msg: MessageInterface): void {
        if (!this.isConnectionLive()) {
            throw new ConnectionError("not connected to network");
        }
        const connection = this.peerConnections.get(this.hostID);
        if (connection === undefined) {
            throw new ConnectionError("not connected to network");
        }
        connection.send(msg);
    }

    /**
     * Send message from host to peers.
     *
     * @param msg - message to be sent
     * @returns `true` if message is sent successfully; `false` otherwise
     *
     * @throws {@link ConnectionError}
     * Thrown if not connected to network
     */
    private sendMessageToPeers(msg: MessageInterface): void {
        if (!this.isConnectionLive()) {
            throw new ConnectionError("not connected to network");
        }
        this.peerConnections.forEach((connection: any, id: string): void => {
            if (msg.id !== id) {
                connection.send(msg);
            }
        });
    }

    /**
     * Handle message received from peers.
     *
     * @param msg - received message
     */
    private processMessage(msg: MessageInterface): void {
        console.log(msg);
        switch (msg.messageType) {
            case MessageType.Insert:
                this.client.crdt.remoteInsert(msg.ch);
                break;
            case MessageType.Delete:
                this.client.crdt.remoteDelete(msg.ch);
                break;
            case MessageType.Sync:
                // TODO implement sync
                break;
            case MessageType.Cursor:
                this.client.editor.setCursor(
                    {
                        start: msg.start,
                        end: msg.end,
                        color: msg.color,
                        label: Math.random()
                    },
                    ""
                );
                break;
        }
    }

    /**
     * Reconnect to network if not connected.
     *
     * @throws {@link ConnectionError}
     * Thrown if connected to  network
     */
    private connectToNetwork(): void {
        if (this.isConnectionLive()) {
            throw new ConnectionError("connected to network");
        }
        // create new connection to TURN server if no live connection exists
        if (this.turnServerConnection === undefined || this.turnServerConnection.destroyed) {
            this.turnServerConnection = Peer();
            this.turnServerConnection.on(
                "open",
                ((id: string): void => {
                    if (this.connectedToHost) {
                        this.client.editor.enable();
                    }
                    this.connectedToServer = true;
                    this.id = id;
                }).bind(this)
            );
            // disconnect from TURN server upon error
            this.turnServerConnection.on(
                "error",
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ((error: Error): void => {
                    this.turnServerConnection.disconnect();
                }).bind(this)
            );
            // reset the ID and disconnect upon connection close
            this.turnServerConnection.on(
                "close",
                ((): void => {
                    this.id = "";
                    this.connectedToServer = false;
                    this.handleDisconnect();
                }).bind(this)
            );
            this.turnServerConnection.on(
                "disconnected",
                ((): void => {
                    this.connectedToServer = false;
                    this.handleDisconnect();
                }).bind(this)
            );
            this.turnServerConnection.on("connection", this.acceptConnections.bind(this));
        } else if (this.turnServerConnection.disconnected) {
            this.turnServerConnection.reconnect();
        }

        if (!this.isHost) {
            // create reliable connection channel to host if connection is not host
            const hostConnection = this.turnServerConnection.connect(this.hostID, {
                reliable: true
            });
            this.peerConnections.set(this.hostID, hostConnection);
            hostConnection.on("data", this.processMessage.bind(this));
            // disconnect from host upon error
            hostConnection.on(
                "error",
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ((error: Error): void => {
                    hostConnection.close();
                }).bind(this)
            );
            hostConnection.on(
                "close",
                ((): void => {
                    this.connectedToHost = false;
                    this.handleDisconnect();
                }).bind(this)
            );
            hostConnection.on(
                "open",
                ((): void => {
                    if (this.connectedToServer) {
                        this.client.editor.enable();
                    }
                    this.connectedToHost = true;
                }).bind(this)
            );
        } else {
            this.connectedToHost = true;
        }
    }

    /**
     * Handle disconnect from network, resetting appropriate variables.
     *
     * @throws {@link ConnectionError}
     * Thrown if connected to network
     */
    private handleDisconnect(): void {
        if (this.isConnectionLive()) {
            throw new ConnectionError("connected to network");
        }
        this.client.editor.disable();
        this.peerConnections.forEach((connection: any, id: string): void => {
            connection.close();
            this.peerConnections.delete(id);
        });
        if (!this.attemptingReconnect) {
            this.attemptingReconnect = true;
            this.reconnect();
        }
    }

    /**
     * Accept connections from new peers joining the network.
     *
     * @param connection - connection to peer joining the network
     * @throws {@link ConnectionError}
     * Thrown if not host in network
     */
    private acceptConnections(connection: any): void {
        if (!this.isHost) {
            connection.close();
            throw new ConnectionError("not the host");
        }
        this.peerConnections.set(connection.peer, connection);

        connection.on(
            "data",
            ((msg: MessageInterface): void => {
                this.processMessage(msg);
                this.sendMessageToPeers(msg);
            }).bind(this)
        );
        connection.on(
            "error",
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ((error: Error): void => {
                connection.close();
            }).bind(this)
        );
        connection.on(
            "close",
            ((): void => {
                if (this.peerConnections.has(connection.peer)) {
                    this.peerConnections.delete(connection.peer);
                }
            }).bind(this)
        );
        connection.on(
            "open",
            ((): void => {
                this.sendMessage({
                    id: this.id,
                    messageType: MessageType.Sync
                });
            }).bind(this)
        );
    }

    /** Reattempt to reconnect if disconnected */
    private reconnect(): void {
        const RETRY_INTERVAL = 3000;
        if (this.isConnectionLive()) {
            this.attemptingReconnect = false;
            return;
        }
        this.connectToNetwork();
        setTimeout(this.reconnect.bind(this), RETRY_INTERVAL);
    }
}
