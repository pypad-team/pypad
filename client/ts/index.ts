import * as ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-nord_dark";

import { Delta } from "./crdt.ts";
import { Client } from "./client";

const editor = ace.edit("editor", {
    mode: "ace/mode/markdown",
    theme: "ace/theme/nord_dark"
});

const client = new Client();

editor.session.on("change", (delta: Delta) => {
    console.log(client.crdt.document);

    switch (delta.action) {
        case "insert":
            client.crdt.localInsert(delta);
            break;
        case "remove":
            client.crdt.localDelete(delta);
            break;
    }
});
