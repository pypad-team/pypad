function getHostID(): string {
    return (location.search === "") ? "" : location.search.slice(1);
}

class Client {
    private editor: Editor;
    private connection: Connection;

    constructor() {
        this.editor = new Editor();
        this.connection = new Connection(getHostID());
    }
}

var client = new Client();