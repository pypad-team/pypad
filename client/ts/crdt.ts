import { Char, compareChar } from "./char";
import { ClientInterface } from "./client";
import { TextError } from "./error";
import { generateIdentifier } from "./identifier";
import { MessageType } from "./message";
import { VersionVector } from "./version";

enum Operation {
    Insert,
    Delete
}

/**
 * Index object
 *
 * **Note:** corresponds to (row, column) position in editor.
 */
export interface Index {
    row: number;
    column: number;
}

/**
 * Delta object
 *
 * **Note:** corresponds to object returned by editor upon `change` event.
 */
export interface Delta {
    readonly action: string;
    readonly start: Index;
    readonly end: Index;
    readonly lines: string[];
}

/**
 * Internal CRDT representation.
 *
 * Example usage:
 * ```ts
 * const client = new Client();
 * client.crdt.localInsert(...); // delta object
 * client.crdt.localDelete(...); // delta object
 * client.crdt.remoteInsert(...); // character object
 * client.crdt.remoteDelete(...); // character object
 * console.log(crdt.document); // output internal document
 * ```
 */
export class CRDT {
    public document: Char[][];
    public buffer: Char[];
    public version: VersionVector;

    public constructor(public uuid: string, public client: ClientInterface) {
        this.document = [[]];
        this.buffer = [];
        this.version = new VersionVector(this.uuid);
    }

    /**
     * Insert lines into CRDT. Note that `delta` must be an insert operation.
     *
     * @param delta - delta object emitted by editor
     */
    public localInsert(delta: Delta): void {
        if (delta.action !== "insert") {
            throw new TextError("input delta not an insert operation");
        }
        const lines = this.parseLines(delta.lines.slice());

        // initialize indices
        let currentRow = delta.start.row;
        let currentColumn = delta.start.column;
        let previousChar = this.findPreviousChar(delta.start);
        const nextChar = this.findNextChar(delta.start);

        // array of inserted character objects
        const inserted: Char[] = [];

        lines.forEach(line => {
            Array.from(line).forEach(ch => {
                this.version.updateLocalVersion();

                const currentChar = this.generateChar(previousChar, nextChar, ch);
                this.document[currentRow].splice(currentColumn, 0, currentChar);
                inserted.push(currentChar);
                previousChar = currentChar;
                currentColumn++;

                if (ch === "\n") {
                    // split lines
                    const currentLineAfter = this.document[currentRow].splice(currentColumn);
                    this.document.splice(currentRow + 1, 0, currentLineAfter);
                    // update indices
                    currentRow++;
                    currentColumn = 0;
                }
            });
        });
        if (currentColumn !== delta.end.column) {
            throw new TextError("incorrect indices");
        }
        // broadcast inserted character objects
        inserted.forEach(ch => {
            const msg = {
                id: this.client.connection.id,
                messageType: MessageType.Insert,
                ch: ch
            };
            this.client.connection.sendMessage(msg);
        });
    }

    /**
     * Delete lines from the CRDT. Note that `delta` must be a remove operation.
     *
     * @param delta - delta object emitted by editor
     */
    public localDelete(delta: Delta): void {
        if (delta.action !== "remove") {
            throw new TextError("input delta not a delete operation");
        }
        const lines = this.parseLines(delta.lines.slice());

        // initialize indices
        let currentRow = delta.end.row;
        let currentColumn = delta.end.column - 1;

        // array of deleted character objects
        const deleted: Char[] = [];

        // NOTE: deleting multiple lines can be optimized
        lines.reverse().forEach(line => {
            Array.from(line)
                .reverse()
                .forEach(ch => {
                    if (currentColumn === -1) {
                        // update indices
                        currentRow--;
                        currentColumn = this.document[currentRow].length - 1;
                    }
                    const currentChar = this.document[currentRow].splice(currentColumn, 1)[0];
                    deleted.push(currentChar);
                    currentColumn--;
                    if (ch === "\n") {
                        // merge lines
                        const currentLineAfter = this.document[currentRow + 1].splice(0);
                        this.document[currentRow] = this.document[currentRow].concat(currentLineAfter);
                        this.document.splice(currentRow + 1, 1);
                    }
                });
        });

        if (currentColumn !== delta.start.column - 1) {
            throw new TextError("incorrect indices");
        }
        // broadcast deleted character objects
        deleted.forEach(ch => {
            const msg = {
                id: this.client.connection.id,
                messageType: MessageType.Delete,
                ch: ch
            };
            this.client.connection.sendMessage(msg);
        });
    }

    /**
     * Insert remote character into local CRDT.
     *
     * @param ch - character to be inserted
     */
    public remoteInsert(ch: Char): void {
        const index = this.findPosition(ch, Operation.Insert);
        this.document[index.row].splice(index.column, 0, ch);
        if (ch.data === "\n") {
            // split lines
            const currentLineAfter = this.document[index.row].splice(index.column + 1);
            this.document.splice(index.row + 1, 0, currentLineAfter);
        }
        // update local editor
        this.client.editor.editorInsert(index, ch.data);

        // update version
        this.version.updateRemoteVersion({
            uuid: ch.uuid,
            counter: ch.counter,
            pending: []
        });

        // process delete buffer
        this.processBuffer();
    }

    /**
     * Delete remote character from local CRDT.
     *
     * @param ch - character to be deleted
     */
    public remoteDelete(ch: Char): void {
        // push character to delete buffer
        this.buffer.push(ch);

        // process delete buffer
        this.processBuffer();
    }

    /* Attempt to delete characters in buffer */
    private processBuffer(): void {
        const buffer = this.buffer.slice();
        buffer.forEach(ch => {
            if (
                this.version.committed({
                    uuid: ch.uuid,
                    counter: ch.counter,
                    pending: []
                })
            ) {
                // remove character and delete
                const index = this.buffer.indexOf(ch);
                if (index === -1) {
                    throw new TextError("character not in buffer");
                }
                this.buffer.splice(index, 1);
                this.performRemoteDelete(ch);
            }
        });
    }

    /* Delete character from local CRDT */
    private performRemoteDelete(ch: Char): void {
        const index = this.findPosition(ch, Operation.Delete);
        this.document[index.row].splice(index.column, 1);
        if (ch.data === "\n") {
            // merge lines
            const currentLineAfter = this.document[index.row + 1].splice(0);
            this.document[index.row] = this.document[index.row].concat(currentLineAfter);
            this.document.splice(index.row + 1, 1);
        }
        // update local editor
        let indexNext: Index;
        if (ch.data === "\n") {
            indexNext = {
                row: index.row + 1,
                column: 0
            };
        } else {
            indexNext = {
                row: index.row,
                column: index.column + 1
            };
        }
        this.client.editor.editorDelete(index, indexNext);
    }

    /* Insert trailing newline characters */
    private parseLines(lines: string[]): string[] {
        for (let i = 0; i < lines.length - 1; i++) {
            lines[i] += "\n";
        }
        return lines;
    }

    /* Find insert/delete index of a character */
    private findPosition(ch: Char, op: Operation): Index {
        let min = 0;
        let max = this.document.length - 1;

        // base cases
        if (this.document[0].length === 0) {
            return { row: 0, column: 0 };
        }
        if (compareChar(ch, this.document[0][0]) === -1) {
            if (op == Operation.Insert) {
                return { row: 0, column: 0 };
            }
            throw new TextError("character not in document");
        }

        let lastCh: Char;
        if (this.document[max].length === 0) {
            lastCh = this.document[max - 1][this.document[max - 1].length - 1];
        } else {
            lastCh = this.document[max][this.document[max].length - 1];
        }
        if (compareChar(ch, lastCh) === 1) {
            if (op === Operation.Insert) {
                return { row: max, column: this.document[max].length };
            }
            throw new TextError("character not in document");
        }

        // binary search
        while (min <= max) {
            const mid = Math.floor((min + max) / 2);

            if (compareChar(ch, this.document[mid][0]) === -1) {
                max = mid - 1;
            } else if (compareChar(ch, this.document[mid][this.document[mid].length - 1]) === 1) {
                min = mid + 1;
            } else {
                if (op == Operation.Insert) {
                    return this.findPositionInsert(ch, mid);
                } else if (op == Operation.Delete) {
                    return this.findPositionDelete(ch, mid);
                }
            }
        }
        if (op == Operation.Insert) {
            return { row: min, column: 0 };
        }
        throw new TextError("character not in document");
    }

    /* Find insert index in a document line */
    private findPositionInsert(ch: Char, row: number): Index {
        let min = 0;
        let max = this.document[row].length;

        // binary search
        while (min <= max) {
            const mid = Math.floor((min + max) / 2);

            if (compareChar(ch, this.document[row][mid]) === -1) {
                max = mid - 1;
            } else if (compareChar(ch, this.document[row][mid]) === 1) {
                min = mid + 1;
            } else {
                throw new TextError("character in document");
            }
        }
        return { row: row, column: min };
    }

    /* Find delete index in a document line */
    private findPositionDelete(ch: Char, row: number): Index {
        let min = 0;
        let max = this.document[row].length;

        // binary search
        while (min <= max) {
            const mid = Math.floor((min + max) / 2);

            if (compareChar(ch, this.document[row][mid]) === -1) {
                max = mid - 1;
            } else if (compareChar(ch, this.document[row][mid]) === 1) {
                min = mid + 1;
            } else {
                return { row: row, column: mid };
            }
        }
        throw new TextError("character not in document");
    }

    /* Return character preceding `index` */
    private findPreviousChar(index: Index): Char {
        if (index.column !== 0) {
            return this.document[index.row][index.column - 1];
        } else {
            if (index.row == 0) {
                return { id: [], uuid: "", counter: 0, data: "" };
            } else {
                return this.document[index.row - 1][this.document[index.row - 1].length - 1];
            }
        }
    }

    /* Return character at `index` */
    private findNextChar(index: Index): Char {
        const lineLength = this.document[index.row].length;
        if (index.column === lineLength) {
            return { id: [], uuid: "", counter: 0, data: "" };
        } else {
            return this.document[index.row][index.column];
        }
    }

    /* Generate character between `prevChar` and `nextChar` */
    private generateChar(prevChar: Char, nextChar: Char, data: string): Char {
        const id = generateIdentifier(prevChar.id, nextChar.id, [], this.uuid);
        return { id: id, uuid: this.uuid, counter: this.version.getLocalVersion().counter, data: data };
    }
}
