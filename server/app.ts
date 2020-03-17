import * as express from "express";
import * as bodyParser from "body-parser";
import { Request } from "express"; // eslint-disable-line no-unused-vars
import { Response } from "express"; // eslint-disable-line no-unused-vars
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

    router.get("/", (req: Request, res: Response) => {
      res.sendFile("index.html", { root: path.join(__dirname, "../client") });
    });

    this.app.use("/", router);
  }
}

export default new App().app;
