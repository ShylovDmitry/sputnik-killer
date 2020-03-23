import PatientModel from '../models/patient.model';
import EmailModel from '../models/email.model';
import * as equal from 'deep-equal';
import {convertPatientFromFileToModel, readPatientsFromFile} from './import';
import logger from '../logger';

export async function runCheck() {
    logger.info('--- Assert File Matches Database');
    await assertFileMatchDb();
    logger.info('Done');

    logger.info('--- Assert Missing First Name');
    await assertMissingFirstName();
    logger.info('Done');

    logger.info('--- Assert Missing Email BUT Consent Is Y');
    await assertMissingEmail();
    logger.info('Done');

    logger.info('--- Assert Email List');
    await assertEmailList();
    logger.info('Done');
}

async function assertFileMatchDb() {
    const patientsFromFile = readPatientsFromFile().map(p => convertPatientFromFileToModel(p));

    for (const patientFromFile of patientsFromFile) {
        const patientModel = await PatientModel.findOne({ email: patientFromFile.email }, { _id: 0, __v: 0 });

        if (!patientModel) {
            logger.error(`Cannot find a record with email: "${patientFromFile.email}"`);
        } else if (!equal(patientFromFile, patientModel.toObject())) {
            logger.error(`Patient "${patientFromFile.email}" is not equal.`);
        }
    }
}

async function assertMissingFirstName() {
    const patients = await PatientModel.find({ firstName: '' });

    logger.error(`IDs: ${patients.map(p => p.id)}`);
    logger.error(`Emails: ${patients.map(p => p.email)}`);
}

async function assertMissingEmail() {
    const patients = await PatientModel.find({ email: '', consent: 'Y' });

    logger.error(`IDs: ${patients.map(p => p.id)}`);
    logger.error(`Emails: ${patients.map(p => p.email)}`);
}

async function assertEmailList() {
    const patientsModelWithConsentY = await PatientModel.find({ consent: 'Y' });

    for (const patient of patientsModelWithConsentY) {
        const emails = await EmailModel.find({ patient: patient._id });

        const emailsNum = 4;
        if (emails.length !== emailsNum) {
            logger.error(`Patient "${patient.email}" is expected to have ${emailsNum} email(s), but has ${emails.length}`);
        }
    }
}
