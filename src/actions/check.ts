import PatientModel from '../models/patient.model';
import EmailModel from '../models/email.model';
import * as equal from 'deep-equal';
import {convertPatientFromFileToModel, readPatientsFromFile} from './import';
import logger from '../logger';
import * as stringify from 'csv-stringify/lib/sync';
import * as fs from "fs";

export async function runCheck() {
    const result = {};

    logger.info('--- Assert File Matches Database');
    result['File Matches Database'] = await assertFileMatchDb();
    logger.info('Done');

    logger.info('--- Assert Missing First Name');
    result['Missing First Name'] = await assertMissingFirstName();
    logger.info('Done');

    logger.info('--- Assert Missing Email But Consent Is Y');
    result['Missing Email But Consent Is Y'] = await assertMissingEmail();
    logger.info('Done');

    logger.info('--- Assert Email List');
    result['Verify Email List'] = await assertEmailList();
    logger.info('Done');

    await generateResultFile(result);
}

async function assertFileMatchDb() {
    const result = [];

    const patientsFromFile = readPatientsFromFile().map(p => convertPatientFromFileToModel(p));
    for (const patientFromFile of patientsFromFile) {
        const patientModel = await PatientModel.findOne({ email: patientFromFile.email }, { _id: 0, __v: 0 });

        if (!patientModel) {
            logger.error(`Cannot find a record with email: "${patientFromFile.email}"`);
        } else if (!equal(patientFromFile, patientModel.toObject())) {
            result.push(patientFromFile.email);
            logger.error(`Patient "${patientFromFile.email}" is not equal.`);
        }
    }

    return result.length ? 'false' : 'true';
}

async function assertMissingFirstName() {
    const patients = await PatientModel.find({ firstName: '' });

    logger.error(`IDs: ${patients.map(p => p.id)}`);
    logger.error(`Emails: ${patients.map(p => p.email)}`);

    return patients.map(p => p.id).toString();
}

async function assertMissingEmail() {
    const patients = await PatientModel.find({ email: '', consent: 'Y' });

    logger.error(`IDs: ${patients.map(p => p.id)}`);
    logger.error(`Emails: ${patients.map(p => p.email)}`);

    return patients.map(p => p.id).toString();
}

async function assertEmailList() {
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


async function generateResultFile(tests) {
    const output = [];

    for (const name in tests) if (tests.hasOwnProperty(name)) {
        output.push({
            'Test Name': name,
            'Test Result': tests[name]
        });
    }

    const content = await stringify(output, {
        header: true,
        delimiter: '|',
        columns: ['Test Name', 'Test Result']
    });

    fs.writeFileSync('./output/result.csv', content, { encoding: 'utf8' });
}
