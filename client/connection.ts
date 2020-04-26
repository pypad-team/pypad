/**
 * Object to handle connection in peer-to-peer network
 */
class Connection {
    private serverConnection: any;
    private hostConnection?: any;
    private peerConnections?: Map<string, any>;
    private connected: boolean;
    private timedOut?: boolean;
    private id: string;
    private status: Status;
    public hostID: string;

    constructor(hostID: string) {
        this.id = "";
        this.status = (hostID === "") ? Status.Host : Status.Follower;
        this.hostID = hostID;

        this.connectToServer();
        // Set background listeners depending on status of client
        if (this.status === Status.Follower) {
            this.connectToHost();
            this.listenHeartbeats()
            this.connected = false;
        } else if (this.status === Status.Host) {
            this.peerConnections = new Map();
            this.listenConnection();
            this.sendHeartbeats();
            this.connected = true;
        }
    } 

    /**
     * Get the current connection status in peer network
     */
    public isConnected(): boolean {
        return this.connected;
    }

    /**
     * Given a message, broadcast it to other peers by sending it to the host
     * @param message - message to broadcast to peers
     */
    public broadcastMessage(message: object): void {
        if ((this.status === Status.Follower) && (this.hostConnection !== undefined)) {
            this.hostConnection.send(message);
        }
    }

    /**
     * Listen for new messages from host
     */
    private listenHostMessages(): void {
        if (this.status === Status.Host) {
            throw new InvalidActionError("Client is host and tried to listen for host messages.");
        }
        if (this.hostConnection === undefined) {
            throw new InvalidActionError("Connection not properly initialized - no host connection found");
        }
        // Create listener to digest messages from host
        this.hostConnection.on("data", (data: any) => {
            this.timedOut = false;
            // TODO: send data to CRDT
        });
    }

    /**
     * Forward messages from peer in network to all other peers
     * @param sourceID - ID of peer sending the message
     * @param message - message to send forward to other peers
     */
    private forwardMessage(sourceID: string, message: object): void {
        if (this.status !== Status.Host) {
            throw new InvalidActionError("Client is not host and tried to forward messages to network.");
        }
        if (this.peerConnections === undefined) {
            throw new InvalidActionError("Connection not properly initialized - no peer connections found for host.");
        }

        this.peerConnections.forEach((conn: any, id: string) => {
            if (id !== sourceID) {
                conn.send(message);
            }
        });
    }

    /**
     * Connect to TURN server
     */
    private connectToServer(): void {
        this.serverConnection = Peer();

        this.serverConnection.on("open", (id: string) => {
            this.id = id;
        });
    }

    /**
     * Connect to the host of peer network
     */
    private connectToHost(): void {
        if (this.status === Status.Host) {
            throw new InvalidActionError("Client is a host but tried to connect to another host.");
        }
        this.hostConnection = this.serverConnection.connect(this.hostID);
        this.listenHostMessages();
        this.connected = true;
    }

    /**
     * Listen for new connections as host from new peers joining the network
     */
    private listenConnection(): void {
        if (this.status !== Status.Host) {
            throw new InvalidActionError("Client is not host but tried to listen for new connections to peer network.");
        }
        // Create listener to save new peer connections to network
        this.serverConnection.on("connection", (conn: any) => {
            if (this.peerConnections === undefined) {
                throw new InvalidActionError("Connection not properly initialized - no peer connections found for host.");
            }
            this.peerConnections.set(conn.peer, conn);
            // Create listener to close and delete peer if connection has an error
            conn.on("error", (err: any) => {
                conn.close();
                this.peerConnections.delete(conn.peer);
            })
            // Create listener to forward messages received from peer
            conn.on("data", (data: any) => {
                this.forwardMessage(conn.peer, data);
            })
        });
    }

    /**
     * Send heartbeats from host to followers periodically to maintain connectivity
     */
    private sendHeartbeats(): void {
        const HEARTBEAT_INTERVAL = 100;
        if (this.peerConnections === undefined) {
            throw new InvalidActionError("Connection not properly initialized - no peer connections found for host.");
        }

        this.peerConnections.forEach((conn: any, id: string) => {
            conn.send({});
        });

        if (this.status === Status.Host) {
            setTimeout(this.sendHeartbeats.bind(this), HEARTBEAT_INTERVAL);
        }
    }
    
    /**
     * Listen for heartbeats from host to determine connectivity
     */
    private listenHeartbeats(): void {
        const TIMEOUT = 1000;
        if ((this.timedOut === undefined) || (!this.timedOut)) {
            this.timedOut = true;
            setTimeout(this.listenHeartbeats.bind(this), TIMEOUT);
        } else {
            this.connected = false;
        }
    }
}