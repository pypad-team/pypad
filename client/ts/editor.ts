import * as ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-nord_dark";

import { ClientInterface } from "./client";
import { Index } from "./crdt";
import { Cursor, RemoteCursor } from "./cursor";
import { MessageType } from "./message";

/* TODO document */
export interface EditorInterface {
    editorInsert(index: Index, ch: string): void;
    editorDelete(startIndex: Index, endIndex: Index): void;
    [prop: string]: any; // avoid explicit any (?)
}

/* TODO document */
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
        this.enabled = false;
        this.remoteCursors = new Map<string, RemoteCursor>();

        this.listenLocalChanges();
        this.listenCursorChanges();
    }

    /**
     * Insert text into the editor at given row and column of the editor
     *
     * @param index - TODO
     * @param ch - TODO
     */
    public editorInsert(index: Index, ch: string): void {
        this.editor.session.insert(index, ch);
    }

    /**
     * Remove text from editor within a given range
     *
     * @param startIndex - TODO
     * @param endIndex - TODO
     */
    public editorDelete(startIndex: Index, endIndex: Index): void {
        const deleteRange = new ace.Range(startIndex.row, startIndex.column, endIndex.row, endIndex.column);
        this.editor.session.replace(deleteRange, "");
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
            let range;
            if (cursor.startRow === cursor.endRow && cursor.startColumn === cursor.endColumn) {
                cursor.type = "single";
                range = new ace.Range(cursor.startRow, cursor.startColumn - 1, cursor.startRow, cursor.endColumn);
                console.log("single");
            } else {
                cursor.type = "selection";
                range = new ace.Range(cursor.startRow, cursor.startColumn, cursor.startRow, cursor.endColumn);
                console.log("selection");
            }

            remoteCursor.id = this.editor.session.addMarker(
                range,
                `remoteCursor-${cursor.color.r}-${cursor.color.g}-${cursor.color.b}-${cursor.label}-${cursor.type}`,
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
                    if (tokens[5] === "selection") {
                        (cursorElement as HTMLElement).style.backgroundColor = `rgba(${rgb}, 0.2)`;
                    }
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
                        sourceID: this.client.connection.id,
                        msgType: MessageType.TextDelta,
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
                const cursorRange = this.editor.selection.getRange();
                // TODO: emit new cursor position to connection

                /** Manual tests: replace with real cursor updates */
                this.client.connection.sendMessage({
                    sourceID: this.client.connection.id,
                    msgType: MessageType.Cursor,
                    startRow: cursorRange.start.row,
                    endRow: cursorRange.end.row,
                    startColumn: cursorRange.start.column,
                    endColumn: cursorRange.end.column,
                    r: 150,
                    g: 255,
                    b: 50
                });
                /** end */
            }).bind(this)
        );
    }
}
