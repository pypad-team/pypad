declare const ace: any;

/**
 * Editor wrapper to handle front-end display of data
 */
class Editor {
    private client: Client;
    private editor: any;
    private theme: string;
    private mode: string;
    private enabled: boolean;
    private cursors: Array<any>;

    constructor(client: any, elementID = "editor", theme = "solarized_dark", mode = "python") {
        this.client = client;
        this.editor = ace.edit(elementID);
        this.theme = theme;
        this.mode = mode;
        this.enabled = false;
        this.cursors = new Array<any>();

        this.setTheme(theme);
        this.setMode(mode);
        this.listenLocalChanges();
        this.listenCursorChanges();
    }

    /**
     * Insert text into the editor at given row and column of the editor
     *
     * @param text - Text to insert into editor
     * @param row - Row (line number) to insert text at
     * @param column - Column (char number in line) to insert text at
     */
    public insert(text: string, row: number, column: number): void {
        const position = {
            row: row,
            column: column
        };
        this.editor.session.insert(position, text);
    }

    /**
     * Set the cursors to be displayed in the editor
     *
     * @param cursors - Array of cursors from other peers to display in editor
     */
    public setCursors(cursors: Array<any>): void {
        this.cursors = cursors;
        cursors.forEach((cursor: any): void => {
            // TODO: add to editor
        });
    }

    /**
     * Enable the editor to allow writing
     */
    public enable(): void {
        this.editor.setReadOnly(false);
        this.enabled = true;
    }

    /**
     * Disable the editor to disallow writing
     */
    public disable(): void {
        this.editor.setReadOnly(true);
        this.enabled = false;
    }

    /**
     * Set the theme for the editor
     *
     * @param theme - theme for the editor
     */
    public setTheme(theme: string): void {
        this.theme = theme;
        this.editor.setTheme(`ace/theme/${this.theme}`);
    }

    /**
     * Set the mode for the editor
     *
     * @param mode - mode for the editor
     */
    public setMode(mode: string): void {
        this.mode = mode;
        this.editor.session.setMode(`ace/mode/${this.mode}`);
    }

    /**
     * Listen for local changes in editor to update CRDT
     */
    private listenLocalChanges(): void {
        this.editor.on(
            "change",
            ((delta: any): void => {
                // Filter out changes from insert method
                if (this.editor.curOp && this.editor.curOp.command.name) {
                    // TODO: update CRDT and send messages
                }
            }).bind(this)
        );
    }

    /**
     * Listen for cursor changes to emit to peers
     */
    private listenCursorChanges(): void {
        this.editor.selection.on(
            "changeCursor",
            ((): void => {
                const cursorPosition = this.editor.getCursorPosition();
                // TODO: emit new cursor position to connection
            }).bind(this)
        );
    }
}
