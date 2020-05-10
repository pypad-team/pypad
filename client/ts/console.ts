import { ClientInterface } from "./client";

/* Pyodide; source loaded using CDN */
declare const pyodide: any;
declare const languagePluginLoader: any;

/** Python interpreter prompt */
const PROMPT = ">>>";

/** Environment loaded text */
const ENV_TEXT = "Python 3.7.0 environment loaded.";

/**
 * Python console representation.
 *
 * Supports executing Python code and outputs standard out and standard
 * error to the console.
 */
export class Console {
    public constructor(public client: ClientInterface) {
        const runButton = document.getElementById("run")! as HTMLButtonElement;
        runButton.disabled = true;

        languagePluginLoader.then(() => {
            // import required libraries
            pyodide.runPython(`
                import sys
                import io
            `);

            this.updateEnvironment();
            this.updateConsole(PROMPT);
            runButton.disabled = false;
        });
    }

    /** Execute current program in editor */
    public run(): void {
        const input = this.client.editor.editor.getValue();

        try {
            pyodide.runPython(`
                sys.stdout = io.StringIO()
                sys.stderr = io.StringIO()
            `);
            pyodide.runPython(input);

            const stdout = pyodide.runPython("sys.stdout.getvalue()");
            const stderr = pyodide.runPython("sys.stderr.getvalue()");
            this.updateConsole(stdout);
            this.updateConsole(stderr);
        } catch (error) {
            const errorText = error.toString();
            this.updateConsole(errorText);
        }
        this.updateConsole(PROMPT);
    }

    /** Remove output from the console */
    public reset(): void {
        document.querySelectorAll(".console-text").forEach(elem => {
            elem.remove();
        });
        this.updateConsole(PROMPT);
    }

    /* Update environment information upon load */
    private updateEnvironment(): void {
        const load = document.getElementById("load")!;
        load.classList.remove("load-animation");
        load.innerText = ENV_TEXT;
    }

    /* Add `text` to console output */
    private updateConsole(text: string): void {
        const consoleContainer = document.getElementById("console")!;
        const consoleText = document.createElement("pre");

        consoleText.innerHTML = `<code>${text}</code>`;
        consoleText.className = "console-text";

        consoleContainer.appendChild(consoleText);
        consoleContainer.scrollTop = consoleContainer.scrollHeight;
    }
}
