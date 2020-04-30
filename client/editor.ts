import { Index } from "./crdt";

/* TODO document */
export interface EditorInterface {
    editorInsert(index: Index, ch: string): void;
    editorDelete(index: Index): void;
}
