import * as mongoose from 'mongoose';
import {runImport} from './actions/import';
import {runCheck} from './actions/check';

class App {
    private async setupDb(): Promise<void> {
        const mongoDb = "mongodb://127.0.0.1/sputnik-killer";
        await mongoose.connect(mongoDb, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoose.connection.on("error", console.error.bind(console, "MongoDB Connection error"));
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
                throw new Error(`Wrong command line parameter: "${action}". Expected parameters are 'import' or 'check'.`);
        }

        console.info(`Action "${action}" is successfully executed.`)
    }
}


const action = process.argv[2];

const app = new App();
app.run(action).catch(e => console.log(e));
