import { MessageInterface } from "./message";

/* TODO document */
export interface ConnectionInterface {
    isConnected(): boolean;
    sendMessage(msg: MessageInterface): void;
    [prop: string]: any; // avoid explicit any (?)
}

/* TODO document */
export class Connection implements ConnectionInterface {
    public isConnected(): boolean {
        return true;
    }

    public sendMessage(msg: MessageInterface): void {
        // do nothing
    }
}
