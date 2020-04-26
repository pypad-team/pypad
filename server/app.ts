import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";

/**
 * Express app object to handle server routes, requests, and responses
 */
class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    /**
     * Configure requests and responses to decode and encode JSON objects
     */
    private config(): void {
        this.app.use(bodyParser.json());
        this.app.use(
            bodyParser.urlencoded({
                extended: false
            })
        );
    }

    /**
     * Create routes for server to handle
     */
    private routes(): void {
        const router = express.Router();

        router.get("/", (req: express.Request, res: express.Response) => {
            res.sendFile("index.html", { root: path.join(__dirname, "../client") });
        });

        this.app.use("/", router);
        this.app.use("/css", express.static(path.join(__dirname, "../client/css")));
        this.app.use("/js", express.static(path.join(__dirname, "../client/js")));
    }
}

export default new App().app;