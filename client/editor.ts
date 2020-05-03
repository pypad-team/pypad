declare const ace: any;

interface Color {
    r: number;
    g: number;
    b: number;
}

interface Cursor {
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
    color: Color;
    label: string;
}

interface RemoteCursor {
    cursor: Cursor;
    id?: number;
}

/**
 * Editor wrapper to handle front-end display of data
 */
class Editor {
    private client: Client;
    private editor: any;
    private theme: string;
    private mode: string;
    private enabled: boolean;
    private remoteCursors: Map<string, RemoteCursor>;

    constructor(client: any, elementID = "editor", theme = "solarized_dark", mode = "python") {
        this.client = client;
        this.editor = ace.edit(elementID);
        this.theme = theme;
        this.mode = mode;
        this.enabled = false;
        this.remoteCursors = new Map<string, RemoteCursor>();

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
     * Remove text from editor within a given range
     *
     * @param startRow - Starting row to remove text from
     * @param endRow - Ending row to remove text from
     * @param startColumn - Starting column to remove text from
     * @param endColumn - Ending column to remove text from
     */
    public remove(startRow: number, endRow: number, startColumn: number, endColumn: number): void {
        const range = new ace.Range(startRow, startColumn, endRow, endColumn);
        this.editor.session.replace(range, "");
    }

    /**
     * Set a cursor to be displayed in the editor
     *
     * @param cursor - Cursor from other peer to display in editor
     * @param id - ID of client represented by the cursor
     */
    public setCursor(cursor: Cursor, id: string): void {
        const existingCursor = this.remoteCursors.get(id);
        if (existingCursor !== undefined) {
            existingCursor.cursor = cursor;
        } else {
            this.remoteCursors.set(id, {
                cursor: cursor
            });
        }

        this.updateRemoteCursors();
    }

    /**
     * Remove a cursor from the editor
     *
     * @param id - ID of client represented by the cursor
     */
    public removeCursor(id: string): void {
        const cursor = this.remoteCursors.get(id);
        if (cursor !== undefined) {
            if (cursor.id !== undefined) {
                this.editor.session.removeMarker(cursor.id);
            }
            this.remoteCursors.delete(id);
            this.updateRemoteCursors();
        }
    }

    /**
     * Update the display for remote cursors in the editor
     */
    private updateRemoteCursors(): void {
        // Get all the HTML elements for remote cursors and remove them
        const remoteCursorElements = document.querySelectorAll('[class^="remoteCursor"],[class*=" remoteCursor"]');
        remoteCursorElements.forEach((cursorElement: Element): void => {
            cursorElement.remove();
        });

        // Add HTML elements for all remote cursors
        this.remoteCursors.forEach((remoteCursor: RemoteCursor, id: string): void => {
            const cursor = remoteCursor.cursor;
            // Remove any existing markers for the cursor
            if (remoteCursor.id !== undefined) {
                this.editor.session.removeMarker(remoteCursor.id);
            }
            const range = new ace.Range(cursor.startRow, cursor.startColumn, cursor.startRow, cursor.endColumn);
            remoteCursor.id = this.editor.session.addMarker(
                range,
                `remoteCursor-${cursor.color.r}-${cursor.color.g}-${cursor.color.b}-${cursor.label}`,
                "text",
                true
            );
        });

        // Wait for all markers to be added to the editor
        setTimeout(
            ((): void => {
                const remoteCursorElements = document.querySelectorAll(
                    '[class^="remoteCursor"],[class*=" remoteCursor"]'
                );
                remoteCursorElements.forEach((cursorElement: Element): void => {
                    const classNames = cursorElement.className.split(" ");
                    const className = classNames.filter((name: string): boolean => {
                        return name.includes("remoteCursor");
                    })[0];
                    const tokens = className.split("-");
                    // Parse the class name to style the cursor
                    const rgb = `${tokens[1]}, ${tokens[2]}, ${tokens[3]}`;
                    (cursorElement as HTMLElement).style.position = "absolute";
                    (cursorElement as HTMLElement).style.borderRight = `2px solid rgba(${rgb}, 0.5)`;
                    (cursorElement as HTMLElement).style.backgroundColor = `rgba(${rgb}, 0.2)`;
                });
            }).bind(this),
            100
        );
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

                    /** Manual tests: replace with real change message */
                    this.client.connection.sendMessage({
                        type: "text",
                        delta: delta
                    });
                    /** end */
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

                /** Manual tests: replace with real cursor updates */
                this.client.connection.sendMessage({
                    type: "cursor",
                    startRow: cursorPosition.row,
                    endRow: cursorPosition.row,
                    startColumn: cursorPosition.column - 1,
                    endColumn: cursorPosition.column,
                    r: 150,
                    g: 255,
                    b: 50
                });
                /** end */
            }).bind(this)
        );
    }
}
