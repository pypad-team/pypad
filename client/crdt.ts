import { Char, compareChar } from "./char";
import { generateIdentifier } from "./identifier";

enum Operation {
    Insert,
    Delete
}

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
 * crdt.remoteInsert(...); // character object
 * crdt.remoteDelete(...); // character object
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
        this.removeLines();

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
        const index = this.findPosition(ch, Operation.Insert);
        this.document[index.row].splice(index.column, 0, ch);
        if (ch.data === "\n") {
            // split lines
            const currentLineAfter = this.document[index.row].splice(index.column + 1);
            this.document.splice(index.row + 1, 0, currentLineAfter);
        }
        // TODO update editor
    }

    /**
     * Delete remote character from local CRDT.
     *
     * @param ch - character to be deleted
     */
    public remoteDelete(ch: Char): void {
        const index = this.findPosition(ch, Operation.Delete);
        this.document[index.row].splice(index.column, 1);
        if (ch.data === "\n") {
            // merge lines
            const currentLineAfter = this.document[index.row + 1].splice(0);
            this.document[index.row] = this.document[index.row].concat(currentLineAfter);
        }
        this.removeLines();
        // TODO update editor
    }

    /* Insert trailing newline characters */
    private parseLines(lines: string[]): string[] {
        for (let i = 0; i < lines.length - 1; i++) {
            lines[i] += "\n";
        }
        return lines;
    }

    /* Remove empty lines from document */
    private removeLines(): void {
        this.document = this.document.filter(str => str.join("") != "");
        if (this.document.length === 0) {
            this.document.push([]);
        }
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
            throw new Error("character not in document");
        }
        if (compareChar(ch, this.document[max][this.document[max].length - 1]) === 1) {
            if (op === Operation.Insert) {
                return { row: max, column: this.document[max].length };
            }
            throw new Error("character not in document");
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
        throw new Error("character not in document");
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
                throw new Error("character in document");
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
        throw new Error("character not in document");
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
