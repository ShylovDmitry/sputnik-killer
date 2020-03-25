import PatientModel from '../models/patient.model';
import EmailModel from '../models/email.model';
import * as equal from 'deep-equal';
import {convertPatientFromFileToModel, readPatientsFromFileStream} from './import';
import logger from '../logger';
import * as stringify from 'csv-stringify';
import * as fs from "fs";
import {OUTPUT_FILE} from "../config";
import * as util from 'util';
import * as stream from 'stream';
import {once} from 'events';

const finished = util.promisify(stream.finished);

export async function runCheck(): Promise<void> {
    const tests = [
        { title: 'Assert File Matches Database', exec: assertFileMatchDb },
        { title: 'Missing First Name', exec: assertMissingFirstName },
        { title: 'Missing Email But Consent Is Y', exec: assertMissingEmail },
        { title: 'Verify Email List', exec: assertEmailList },
    ];

    await executeTestsAndOutputResult(tests);
}

async function executeTestsAndOutputResult(tests) {
    const stringifier = stringify({
        header: true,
        delimiter: '|'
    });
    const writeStream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });
    stringifier.pipe(writeStream);

    for (const test of tests) {
        logger.info(`--- ${test.title}`);

        const result = {
            'Test Name': test.title,
            'Test Result': await test.exec()
        };
        if (!stringifier.write(result)) {
            // Handle backpressure
            await once(stringifier, 'drain');
        }

        logger.info('Done');
    }

    stringifier.end();
    await finished(writeStream);

    logger.info(`Result file is created at ${OUTPUT_FILE}`);
}

async function assertFileMatchDb(): Promise<string> {
    const result = [];

    for await (const patientFromFile of readPatientsFromFileStream()) {
        const patient = convertPatientFromFileToModel(patientFromFile);

        const patientModel = await PatientModel.findOne({ email: patient.email }, { _id: 0, __v: 0 });

        if (!patientModel) {
            logger.error(`Cannot find a patient with email: "${patient.email}"`);
        } else if (!equal(patient, patientModel.toObject())) {
            result.push(patient.email);
            logger.error(`Patient "${patient.email}" is not equal.`);
        }
    }

    return result.length ? 'false' : 'true';
}

async function assertMissingFirstName(): Promise<string> {
    const patients = await PatientModel.find({ firstName: '' });

    if (patients.length) {
        logger.error(`IDs: ${patients.map(p => p.id)}`);
        logger.error(`Emails: ${patients.map(p => p.email)}`);
    }

    return patients.map(p => p.id).toString();
}

async function assertMissingEmail(): Promise<string> {
    const patients = await PatientModel.find({ email: '', consent: 'Y' });

    if (patients.length) {
        logger.error(`IDs: ${patients.map(p => p.id)}`);
        logger.error(`Emails: ${patients.map(p => p.email)}`);
    }

    return patients.map(p => p.id).toString();
}

async function assertEmailList(): Promise<string> {
    const result = [];

    const patientsModelWithConsentY = await PatientModel.find({ consent: 'Y' });
    for (const patient of patientsModelWithConsentY) {
        const emails = await EmailModel.find({ patient: patient._id });

        const emailsNum = 4;
        if (emails.length !== emailsNum) {
            result.push(patient.email);
            logger.error(`Patient "${patient.email}" is expected to have ${emailsNum} email(s), but has ${emails.length}`);
        }
    }

    return result.length ? 'false' : 'true';
}
