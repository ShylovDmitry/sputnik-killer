import {runImport} from './actions/import';
import {runCheck} from './actions/check';
import {connect} from "mongoose";
import logger from "./logger";

class App {
    private async setupDb(): Promise<void> {
        const mongoDb = "mongodb://127.0.0.1/sputnik-killer";

        try {
            await connect(mongoDb, {useNewUrlParser: true, useUnifiedTopology: true});
        } catch (e) {
            logger.error('Cannot connect to database');
        }
    }

    async run(action): Promise<void> {
        await this.setupDb();

        switch (action) {
            case 'import':
                await runImport();
                break;

            case 'check':
                await runCheck();
                break;

            default:
                logger.error(`Wrong command line parameter: "${action}".`);
                break;
        }
    }
}

(async () => {
    const action = process.argv[2];

    const app = new App();
    await app.run(action);

    process.exit(0);
})();
