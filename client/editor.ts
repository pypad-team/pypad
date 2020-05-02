declare const ace: any;

/**
 * Editor wrapper to handle front-end display of data
 */
class Editor {
    private editor: any;
    private theme: string;
    private mode: string;

    constructor(elementID = "editor", theme = "solarized_dark", mode = "python") {
        this.editor = ace.edit(elementID);
        this.theme = theme;
        this.mode = mode;

        this.setTheme(theme);
        this.setMode(mode);
    }

    /**
     * Set the theme for the editor
     * @param theme - theme for the editor
     */
    public setTheme(theme: string): void {
        this.theme = theme;
        this.editor.setTheme(`ace/theme/${this.theme}`);
    }

    /**
     * Set the mode for the editor
     * @param mode - mode for the editor
     */
    public setMode(mode: string): void {
        this.mode = mode;
        this.editor.session.setMode(`ace/mode/${this.mode}`);
    }

    /**
     * Set the text of the editor
     * @param text - text to set editor to display
     */
    public setText(text: string): void {
        this.editor.setValue(text);
    }

    /**
     * Listen for local changes in editor
     */
    private listenLocalChanges(): void {
        this.editor.session.on("change", function(delta: any) {
            // TODO: send delta to CRDT
        });
    }
}
