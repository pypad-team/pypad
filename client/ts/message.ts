/* TODO document */
export enum Message {
    Insert,
    Delete
}

/* TODO document */
export interface MessageInterface {
    msg: Message;
    [prop: string]: any; // avoid explicit any (?)
}
