import { ClientInterface } from "./client";
import { Delta, Index } from "./crdt";
import { Cursor, CursorType } from "./cursor";
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
    private remoteCursors: Map<string, Cursor>;

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
        this.remoteCursors = new Map<string, Cursor>();

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
     * Set the text of the document
     * @param text - text to set the document to
     */
    public setText(text: string): void {
        this.editor.setValue(text);
    }

    /**
     * Set a cursor to be displayed in the editor.
     *
     * @param cursor - remote cursor to insert
     * @param peerID - ID of peer represented by the cursor
     */
    public setCursor(cursor: Cursor, peerID: string): void {
        const existingCursor = this.remoteCursors.get(peerID);
        if (existingCursor !== undefined) {
            existingCursor.start = cursor.start;
            existingCursor.end = cursor.end;
            existingCursor.type = cursor.type;
        } else {
            this.remoteCursors.set(peerID, cursor);
        }
        this.updateRemoteCursors();
    }

    /**
     * Remove a cursor from the editor.
     *
     * @param peerID - ID of peer represented by the cursor
     */
    public removeCursor(peerID: string): void {
        const cursor = this.remoteCursors.get(peerID);
        if (cursor !== undefined) {
            if (cursor.elementID !== undefined) {
                this.editor.session.removeMarker(cursor.elementID);
            }
            this.remoteCursors.delete(peerID);
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

        // insert HTML elements for cursors
        this.remoteCursors.forEach((cursor: Cursor, peerID: string): void => {
            // remove existing cursor markers
            if (cursor.elementID !== undefined) {
                this.editor.session.removeMarker(cursor.elementID);
            }
            let range;
            if (cursor.type === CursorType.Bar) {
                range = new ace.Range(cursor.start.row, cursor.start.column - 1, cursor.start.row, cursor.end.column);
            } else {
                range = new ace.Range(cursor.start.row, cursor.start.column, cursor.start.row, cursor.end.column);
            }
            const cursorType = (cursor.type as string).toLowerCase();
            const peerData = this.client.connection.getPeerData(peerID);
            const name = peerData.name === undefined ? "" : peerData.name;
            cursor.elementID = this.editor.session.addMarker(
                range,
                `remoteCursor-${peerData.color.r}-${peerData.color.g}-${peerData.color.b}-${name}-${cursorType}`,
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
                    if (tokens[5] === (CursorType.Selection as string).toLowerCase()) {
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
        const editorElement = document.getElementById("editor");
        if (editorElement !== null) {
            editorElement.style.backgroundColor = "";
        }
        const shareButton = document.getElementById("share") as HTMLButtonElement;
        if (shareButton !== null) {
            shareButton.disabled = false;
        }
        const statusDot = document.getElementById("status-dot");
        if (statusDot !== null) {
            statusDot.style.backgroundColor = "green";
        }
        const statusElement = document.getElementById("status");
        if (statusElement !== null) {
            statusElement.innerHTML = "<div class='dot' style='background-color: green'></div>Connected";
        }
    }

    /** Disable the editor  */
    public disable(): void {
        this.editor.setReadOnly(true);
        this.enabled = false;
        const editorElement = document.getElementById("editor");
        if (editorElement !== null) {
            editorElement.style.backgroundColor = "#BF616A26";
        }
        const shareButton = document.getElementById("share") as HTMLButtonElement;
        if (shareButton !== null) {
            shareButton.disabled = true;
        }
        const statusDot = document.getElementById("status-dot");
        if (statusDot !== null) {
            statusDot.style.backgroundColor = "red";
        }
        const statusElement = document.getElementById("status");
        if (statusElement !== null) {
            statusElement.innerHTML = "<div class='dot' style='background-color: red'></div>Disconnected";
        }
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
                const cusorType =
                    range.start.row === range.end.row && range.start.column === range.end.column
                        ? CursorType.Bar
                        : CursorType.Selection;
                this.client.connection.sendMessage({
                    id: this.client.connection.id,
                    messageType: MessageType.Cursor,
                    cursorType: cusorType,
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
