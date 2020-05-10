import { Client } from "./client";

const client = new Client();

client.crdt.initDocument(`def print_ten():
    for i in range(10):
        print(i)

print_ten()
`);
