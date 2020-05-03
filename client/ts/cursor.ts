/** TODO document */
export interface Color {
    r: number;
    g: number;
    b: number;
}

/** TODO document */
export interface Cursor {
    type?: string;
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
    color: Color;
    label: string;
}

/** TODO document */
export interface RemoteCursor {
    cursor: Cursor;
    id?: number;
}
