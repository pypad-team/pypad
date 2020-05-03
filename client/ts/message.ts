/* TODO document */
export enum MessageType {
    Insert,
    Delete,
    TextDelta,
    Cursor,
    Initial
}

/* TODO document */
export interface MessageInterface {
    sourceID: string;
    msgType: MessageType;
    [prop: string]: any; // avoid explicit any (?)
}
