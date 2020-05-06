import { ClientInterface } from "./client";
import { Delta, Index } from "./crdt";
import { Cursor, RemoteCursor } from "./cursor";
import { MessageType } from "./message";

/** Editor class; source loaded using CDN */
declare const ace: any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Generic editor interface */
export interface EditorInterface {
    editorInsert(index: Index, ch: string): void;
    editorDelete(startIndex: Index, endIndex: Index): void;
    [prop: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Internal editor representation.
 *
 * Manages local and remote changes made to the document. Updates the location
 * of cursors based on local and remote cursor movement.
 */
export class Editor implements EditorInterface {
    private client: ClientInterface;
    private editor: any;
    private enabled: boolean;
    private remoteCursors: Map<string, RemoteCursor>;

    constructor(client: ClientInterface, elementID = "editor") {
        this.client = client;
        this.editor = ace.edit(elementID, {
            mode: "ace/mode/python",
            theme: "ace/theme/nord_dark"
        });
        // TODO customize editor
        this.editor.setFontSize("16px");
        this.editor.setShowPrintMargin(false);

        this.enabled = false;
        this.remoteCursors = new Map<string, RemoteCursor>();

        this.disable();
        this.listenLocalChanges();
        this.listenCursorChanges();
    }

    /**
     * Insert text into the editor.
     *
     * @param index - index to insert character
     * @param ch - character to be inserted
     */
    public editorInsert(index: Index, ch: string): void {
        this.editor.session.insert(index, ch);
    }

    /**
     * Remove text from the editor.
     *
     * @param startIndex - starting index to remove text
     * @param endIndex - ending index to remove text
     */
    public editorDelete(startIndex: Index, endIndex: Index): void {
        const range = new ace.Range(startIndex.row, startIndex.column, endIndex.row, endIndex.column);
        this.editor.session.replace(range, "");
    }

    /**
     * Set a cursor to be displayed in the editor.
     *
     * @param cursor - remote cursor to insert
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
     * Remove a cursor from the editor.
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

    /** Update remote cursors in the editor */
    private updateRemoteCursors(): void {
        // remove HTML elements for remote cursors
        const remoteCursorElements = document.querySelectorAll('[class^="remoteCursor"],[class*=" remoteCursor"]');
        remoteCursorElements.forEach((cursorElement: Element): void => {
            cursorElement.remove();
        });

        // insert HTML elements for remote cursors
        this.remoteCursors.forEach((remoteCursor: RemoteCursor): void => {
            const cursor = remoteCursor.cursor;
            // remove existing cursor markers
            if (remoteCursor.id !== undefined) {
                this.editor.session.removeMarker(remoteCursor.id);
            }
            let range;
            if (cursor.start.row === cursor.end.row && cursor.start.column === cursor.end.column) {
                cursor.type = "single";
                range = new ace.Range(cursor.start.row, cursor.start.column - 1, cursor.start.row, cursor.end.column);
            } else {
                cursor.type = "selection";
                range = new ace.Range(cursor.start.row, cursor.start.column, cursor.start.row, cursor.end.column);
            }

            remoteCursor.id = this.editor.session.addMarker(
                range,
                `remoteCursor-${cursor.color.r}-${cursor.color.g}-${cursor.color.b}-${cursor.label}-${cursor.type}`,
                "text",
                true
            );
        });

        // timeout until markers are inserted into the editor
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
                    // parse the class name to style the cursor
                    const rgb = `${tokens[1]}, ${tokens[2]}, ${tokens[3]}`;
                    (cursorElement as HTMLElement).style.position = "absolute";
                    (cursorElement as HTMLElement).style.borderRight = `2px solid rgba(${rgb}, 0.5)`;
                    if (tokens[5] === "selection") {
                        (cursorElement as HTMLElement).style.backgroundColor = `rgba(${rgb}, 0.2)`;
                    }
                });
            }).bind(this),
            100
        );
    }

    /** Enable the editor */
    public enable(): void {
        this.editor.setReadOnly(false);
        this.enabled = true;
    }

    /** Disable the editor  */
    public disable(): void {
        this.editor.setReadOnly(true);
        this.enabled = false;
    }

    /* Listen for local changes in editor to update CRDT */
    private listenLocalChanges(): void {
        this.editor.on(
            "change",
            ((delta: Delta): void => {
                // ignore non-user changes
                if (this.editor.curOp && this.editor.curOp.command.name) {
                    switch (delta.action) {
                        case "insert":
                            this.client.crdt.localInsert(delta);
                            break;
                        case "remove":
                            this.client.crdt.localDelete(delta);
                            break;
                    }
                }
            }).bind(this)
        );
    }

    /* Listen for cursor changes to emit to peers */
    private listenCursorChanges(): void {
        this.editor.selection.on(
            "changeCursor",
            ((): void => {
                const range = this.editor.selection.getRange();
                // TODO generalize
                this.client.connection.sendMessage({
                    id: this.client.connection.id,
                    messageType: MessageType.Cursor,
                    start: range.start,
                    end: range.end,
                    color: {
                        r: 0,
                        g: 255,
                        b: 0
                    }
                });
            }).bind(this)
        );
    }
}
