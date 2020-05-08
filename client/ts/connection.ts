import { ClientInterface } from "./client";
import { generateColor } from "./color";
import { ConnectionError, PeerNotFoundError } from "./error";
import { MessageInterface, MessageType } from "./message";
import { PeerData } from "./peer";

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
    private peers: Map<string, PeerData>;

    constructor(hostID: string, client: ClientInterface) {
        this.hostID = hostID;
        this.id = "";
        this.client = client;

        this.isHost = hostID === "";
        this.connectedToServer = false;
        this.connectedToHost = false;
        this.attemptingReconnect = false;

        this.peerConnections = new Map<string, any>();
        this.peers = new Map<string, PeerData>();
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
     * Get the ID of the peer
     * @returns ID of the peer
     */
    public getID(): string {
        return this.id;
    }

    /**
     * Get the peer data for a peer in peer-to-peer network
     *
     * @param id - ID of peer to get data for
     * @returns peer data associated with given ID
     *
     * @throws {@link PeerNotFoundError}
     * Thrown peer not found in peer-to-peer network
     */
    public getPeerData(id: string): PeerData {
        const peerData = this.peers.get(id);
        if (peerData === undefined) {
            throw new PeerNotFoundError("peer not found in network");
        }
        return peerData;
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
        switch (msg.messageType) {
            case MessageType.Insert:
                this.client.crdt.remoteInsert(msg.ch);
                break;
            case MessageType.Delete:
                this.client.crdt.remoteDelete(msg.ch);
                break;
            case MessageType.Sync:
                // TODO implement sync
                // Send peer data to others
                this.sendMessage({
                    id: this.id,
                    messageType: MessageType.Join,
                    name: this.client.name
                });
                break;
            case MessageType.Cursor:
                this.client.editor.setCursor(
                    {
                        start: msg.start,
                        end: msg.end,
                        type: msg.cursorType
                    },
                    msg.id
                );
                break;
            case MessageType.Join:
                this.peers.set(msg.id, {
                    id: msg.id,
                    name: msg.name,
                    color: generateColor()
                });
                break;
            case MessageType.Leave:
                this.peers.delete(msg.id);
                this.client.editor.removeCursor(msg.id);
                break;
            case MessageType.Update: {
                const existingPeer = this.peers.get(msg.id);
                if (existingPeer === undefined) {
                    this.peers.set(msg.id, {
                        id: msg.id,
                        name: msg.name,
                        color: generateColor()
                    });
                } else {
                    existingPeer.name = msg.name;
                }
                break;
            }
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
                this.peers.delete(connection.peer);
                this.client.editor.removeCursor(connection.peer);
                this.sendMessage({
                    id: connection.peer,
                    messageType: MessageType.Leave
                });
            }).bind(this)
        );
        connection.on(
            "open",
            ((): void => {
                connection.send({
                    id: this.id,
                    messageType: MessageType.Sync,
                    name: this.client.name
                });
                // Send all existing peer data to new peer
                connection.send({
                    id: this.id,
                    messageType: MessageType.Join,
                    name: this.client.name
                });
                this.peers.forEach((peerData: PeerData) => {
                    if (peerData.id === connection.peer) {
                        return;
                    }
                    connection.send({
                        id: peerData.id,
                        messageType: MessageType.Join,
                        name: peerData.name
                    });
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
