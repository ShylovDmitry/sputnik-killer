import {createLogger, transports} from 'winston';
import {format} from 'logform';

const logger = createLogger({
    format: format.combine(
        format.cli(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
    ]
});

export default logger;
