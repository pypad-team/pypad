/**
 * Get the host ID string from URL
 */
function getHostID(): string {
    return location.search === "" ? "" : location.search.slice(1);
}

/**
 * Object to manage client data for collaborative editor
 */
class Client {
    private editor: Editor;
    private connection: Connection;

    constructor() {
        this.editor = new Editor(this);
        this.connection = new Connection(getHostID(), this);
    }

    /**
     * Copy link to connect to host and peer network
     */
    public copyConnectLink(): void {
        if (this.connection.isConnectionLive()) {
            const connectLink = `${location.origin}?${this.connection.getHostID()}`;
            navigator.clipboard.writeText(connectLink);
        } else {
            throw new InvalidActionError("Client is not yet connected.");
        }
    }
}

const client = new Client();
