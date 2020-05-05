import { Index } from "./crdt";

/* Color RGB representation */
interface Color {
    r: number;
    g: number;
    b: number;
}

/** Cursor representation */
export interface Cursor {
    type?: string;
    label: string;
    start: Index;
    end: Index;
    color: Color;
}

/** Remote cursor representation */
export interface RemoteCursor {
    id?: number;
    cursor: Cursor;
}
