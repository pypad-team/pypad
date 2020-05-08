/** Messages supported by `connection` */
export enum MessageType {
    Insert,
    Delete,
    Sync,
    Cursor,
    Join,
    Leave,
    Update
}

/** Generic message interface */
export interface MessageInterface {
    id: string;
    messageType: MessageType;
    [prop: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
