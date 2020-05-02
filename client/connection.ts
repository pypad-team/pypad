declare const Peer: any;

/**
 * Object to handle connection in peer-to-peer work
 */
class Connection {
    private hostID: string;
    private id: string;
    private client: any;

    private isHost: boolean;
    private connectedToServer: boolean;
    private connectedToHost: boolean;
    private attemptingReconnect: boolean;

    private turnServerConnection?: any;
    private peerConnections: Map<string, any>;

    constructor(hostID: string, client: any) {
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
     * Returns the connection status in peer-to-peer network
     *
     * @returns true if connection is host or if connection is connected to host and
     *  connection has been assigned an ID by TURN server
     */
    public isConnectionLive(): boolean {
        return this.connectedToServer && this.connectedToHost;
    }

    /**
     * Send message to peers in peer-to-peer network
     *
     * @param message - Message to send to peers in network
     * @returns true if message is successfully sent, false otherwise
     */
    public sendMessage(message: any): boolean {
        try {
            if (this.isHost) {
                this.sendMessageToPeers(message);
            } else {
                this.sendMessageToHost(message);
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Returns the ID of the host in the peer-to-peer network
     *
     * @returns ID of the host in the peer-to-peer network
     *
     * @throws {@link InvalidActionError}
     * Thrown if host not yet assigned an ID
     */
    public getHostID(): string {
        if (this.isHost) {
            if (this.id === "") {
                throw new InvalidActionError("Host has not yet been assigned an ID.");
            }
            return this.id;
        }
        return this.hostID;
    }

    /**
     * Send message to host in peer-to-peer network if and only if connected
     *
     * @param message - Message to send to peers in network
     * @returns true if message is successfully sent, false otherwise
     *
     * @throws {@link InvalidActionError}
     * Thrown if not connected to peer-to-peer network
     */
    private sendMessageToHost(message: any): void {
        if (!this.isConnectionLive()) {
            throw new InvalidActionError("Not connected to peer-to-peer network.");
        }
        const connection = this.peerConnections.get(this.hostID);
        if (connection === undefined) {
            throw new InvalidActionError("Not connected to peer-to-peer network.");
        }
        connection.send(message);
    }

    /**
     * Send message to peers in peer-to-peer network
     *
     * @param message - Message to send to peers in network
     * @returns true if message is successfully sent, false otherwise
     *
     * @throws {@link InvalidActionError}
     * Thrown if not connected to peer-to-peer network
     */
    private sendMessageToPeers(message: any): void {
        if (!this.isConnectionLive()) {
            throw new InvalidActionError("Not connected to peer-to-peer network.");
        }
        this.peerConnections.forEach((connection: any, id: string) => {
            connection.send(message);
        });
    }

    /**
     * Process message received from peers
     *
     * @param message - Message received from peers
     */
    private processMessage(message: any): void {
        console.log(message);
    }

    /**
     * Connect to peer-to-peer network if not connected
     *
     * @throws {@link InvalidActionError}
     * Thrown if already connected to peer-to-peer network
     */
    private connectToNetwork(): void {
        if (this.isConnectionLive()) {
            throw new InvalidActionError("Already connected to peer-to-peer network.");
        }
        // Create new connection to TURN server if no live connection exists
        if (this.turnServerConnection === undefined || this.turnServerConnection.destroyed) {
            this.turnServerConnection = Peer();
            this.turnServerConnection.on("open", ((id: string) => {
                this.connectedToServer = true;
                this.id = id;
            }).bind(this));
            // Disconnect from TURN server if an error was found
            this.turnServerConnection.on("error", ((error: any) => {
                this.turnServerConnection.disconnect();
            }).bind(this));
            // Reset the ID and disconnect if connection was destroyed
            this.turnServerConnection.on("close", (() => {
                this.id = "";
                this.connectedToServer = false;
                this.handleDisconnect();
            }).bind(this));
            this.turnServerConnection.on("disconnected", (() => {
                this.connectedToServer = false;
                this.handleDisconnect();
            }).bind(this));
            this.turnServerConnection.on("connection", this.acceptConnections.bind(this));
        } else if (this.turnServerConnection.disconnected) {
            this.turnServerConnection.reconnect();
        }

        if (!this.isHost) {
            // Create reliable connection channel to host if connection is not host
            const hostConnection = this.turnServerConnection.connect(this.hostID, {
                reliable: true
            });
            this.peerConnections.set(this.hostID, hostConnection);
            hostConnection.on("data", this.processMessage.bind(this));
            // Disconnect from host if error was found
            hostConnection.on("error", ((error: any) => {
                hostConnection.close();
            }).bind(this));
            hostConnection.on("close", (() => {
                this.connectedToHost = false;
                this.handleDisconnect();
            }).bind(this));
            hostConnection.on("open", (() => {
                this.connectedToHost = true;
            }).bind(this));
        } else {
            this.connectedToHost = true;
        }
    }

    /**
     * Handle disconnect from peer-to-peer network, resetting all proper variables
     *
     * @throws {@link InvalidActionError}
     * Thrown if still connected to peer-to-peer network
     */
    private handleDisconnect(): void {
        if (this.isConnectionLive()) {
            throw new InvalidActionError("Still connected to peer-to-peer network.");
        }
        this.peerConnections.forEach((connection: any, id: string) => {
            connection.close();
            this.peerConnections.delete(id);
        });
        if (!this.attemptingReconnect) {
            this.attemptingReconnect = true;
            this.tryReconnect();
        }
    }

    /**
     * Accept connections from new peers to join peer-to-peer network
     *
     * @param connection - Connection to peer joining the network
     * @throws {@link InvalidActionError}
     * Thrown if not host in peer-to-peer network
     */
    private acceptConnections(connection: any): void {
        if (!this.isHost) {
            connection.close();
            throw new InvalidActionError("Not the host in peer-to-peer network");
        }
        this.peerConnections.set(connection.peer, connection);

        connection.on("data", ((message: any) => {
            this.processMessage(message);
            this.sendMessageToPeers(message);
        }).bind(this));
        connection.on("error", ((error: any) => {
            connection.close();
        }).bind(this));
        connection.on("close", (() => {
            if (this.peerConnections.has(connection.peer)) {
                this.peerConnections.delete(connection.peer);
            }
        }).bind(this));

        connection.on("open", (() => {
            connection.send({initial: true}/** TODO: send initial CRDT state */)
        }).bind(this));
    }

    private tryReconnect(): void {
        const RETRY_INTERVAL = 1000;
        if (this.isConnectionLive()) {
            this.attemptingReconnect = false;
            return;
        }

        this.connectToNetwork();
        setTimeout(this.tryReconnect.bind(this), RETRY_INTERVAL);
    }
}
