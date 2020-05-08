import { Index } from "./crdt";

/** Types of cursors displayed */
export enum CursorType {
    Bar = "BAR",
    Selection = "SELECTION"
}

/** Cursor representation */
export interface Cursor {
    start: Index;
    end: Index;
    type: CursorType;
    elementID?: number;
}
