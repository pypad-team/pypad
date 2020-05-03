import { MessageInterface } from "./message";

/* TODO document */
export interface ConnectionInterface {
    isConnected(): boolean;
    sendMessage(msg: MessageInterface): void;
    [prop: string]: any; // avoid explicit any (?)
}
