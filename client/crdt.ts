import { Char } from "./char";
import { generateIdentifier } from "./identifier";

/** Index object */
interface Index {
    row: number;
    column: number;
}

/**
 * Delta object
 *
 * **Note:** corresponds to object returned by editor upon `change` event.
 */
export interface Delta {
    action: string;
    start: Index;
    end: Index;
    lines: string[];
}

/**
 * Internal CRDT representation.
 *
 * Example usage:
 * ```ts
 * const peer = 0;
 * const crdt = new CRDT(peer);
 * crdt.localInsert(...); // delta object
 * crdt.localDelete(...); // delta object
 * crdt.remoteInsert(...);
 * crdt.remoteDelete(...);
 * console.log(crdt.document); // internal crdt state
 * ```
 */
export class CRDT {
    public counter: number;
    public document: Char[][];

    public constructor(public peer: number) {
        this.counter = 0;
        this.document = [[]];
    }

    /**
     * Insert lines into CRDT. Note that `delta` must be an insert operation.
     *
     * @param delta - delta object emitted by editor
     */
    public localInsert(delta: Delta): void {
        if (delta.action !== "insert") {
            throw new Error("input delta not an insert operation");
        }
        this.counter++;
        const lines = this.parseLines(delta.lines);

        // initialize indices
        let currentRow = delta.start.row;
        let currentColumn = delta.start.column;
        let previousChar = this.findPreviousChar(delta.start);
        const nextChar = this.findNextChar(delta.start);

        // array of inserted character objects
        const inserted = [];

        lines.forEach(line => {
            Array.from(line).forEach(ch => {
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
            throw new Error("incorrect indices");
        }
        // TODO broadcast
    }

    /**
     * Delete lines from the CRDT. Note that `delta` must be a remove operation.
     *
     * @param delta - delta object emitted by editor
     */
    public localDelete(delta: Delta): void {
        if (delta.action !== "remove") {
            throw new Error("input delta not a delete operation");
        }
        this.counter++;
        const lines = this.parseLines(delta.lines);

        // initialize indices
        let currentRow = delta.end.row;
        let currentColumn = delta.end.column - 1;

        // array of deleted character objects
        const deleted = [];

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
                    const currentChar = this.document[currentRow].splice(currentColumn, 1);
                    deleted.push(currentChar);
                    currentColumn--;
                    if (ch === "\n") {
                        // merge lines
                        const currentLineAfter = this.document[currentRow + 1].splice(0);
                        this.document[currentRow] = this.document[currentRow].concat(currentLineAfter);
                    }
                });
        });
        // remove empty lines
        this.document = this.document.filter(str => str.join("") != "");
        if (this.document.length === 0) {
            this.document.push([]);
        }
        if (currentColumn !== delta.start.column - 1) {
            throw new Error("incorrect indices");
        }
        // TODO broadcast
    }

    /**
     * Insert remote character into local CRDT.
     *
     * @param ch - character to be inserted
     */
    public remoteInsert(ch: Char): void {
        // EMPTY
    }

    /**
     * Delete remote character from local CRDT.
     *
     * @param ch - character to be deleted
     */
    public remoteDelete(ch: Char): void {
        // EMPTY
    }

    /* Insert trailing newline characters */
    private parseLines(lines: string[]): string[] {
        for (let i = 0; i < lines.length - 1; i++) {
            lines[i] += "\n";
        }
        return lines;
    }

    /* Return character preceding `index` */
    private findPreviousChar(index: Index): Char {
        if (index.column !== 0) {
            return this.document[index.row][index.column - 1];
        } else {
            if (index.row == 0) {
                return { id: [], counter: null, data: null };
            } else {
                return this.document[index.row - 1][this.document[index.row - 1].length - 1];
            }
        }
    }

    /* Return character at `index` */
    private findNextChar(index: Index): Char {
        const lineLength = this.document[index.row].length;
        if (index.column === lineLength) {
            return { id: [], counter: null, data: null };
        } else {
            return this.document[index.row][index.column];
        }
    }

    /* Generate character between `prevChar` and `nextChar` */
    private generateChar(prevChar: Char, nextChar: Char, data: string): Char {
        const id = generateIdentifier(prevChar.id, nextChar.id, [], this.peer);
        return { id: id, counter: this.counter, data: data };
    }
}
