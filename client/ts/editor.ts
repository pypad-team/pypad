import { Index } from "./crdt";

/* TODO document */
export interface EditorInterface {
    editorInsert(index: Index, ch: string): void;
    editorDelete(index: Index): void;
    [prop: string]: any; // avoid explicit any (?)
}

/* TODO document */
export class Editor implements EditorInterface {
    public editorInsert(index: Index, ch: string): void {
        // do nothing
    }
    public editorDelete(index: Index): void {
        // do nothing
    }
}
