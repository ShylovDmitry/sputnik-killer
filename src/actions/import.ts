import PatientModel, {IPatient, IPatientModel} from '../models/patient.model';
import EmailModel from '../models/email.model';
import * as parse from 'csv-parse';
import * as fs from 'fs';
import logger from '../logger';
import {DATA_FILE} from "../config";

export async function runImport(): Promise<void> {
    await clearCollections();

    for await (const patientFromFile of readPatientsFromFileStream()) {
        const patient = await insertPatient(convertPatientFromFileToModel(patientFromFile));

        if (patient?.consent === 'Y') {
            const now = +new Date();
            const day = 24 * 60 * 60 * 1000;

            await createSubscription('Day 1', patient, new Date(now + day), 'Hello ${patient.firstName}. Day 1.');
            await createSubscription('Day 2', patient, new Date(now + 2 * day), 'Hello ${patient.firstName}. Day 2.');
            await createSubscription('Day 3', patient, new Date(now + 3 * day), 'Hello ${patient.firstName}. Day 3.');
            await createSubscription('Day 4', patient, new Date(now + 4 * day), 'Hello ${patient.firstName}. Day 4.');
        }
    }
}

export async function* readPatientsFromFileStream() {
    const parser = parse({
        columns: true,
        delimiter: '|'
    });

    const readStream = fs.createReadStream(DATA_FILE, { encoding: 'utf8' });
    readStream.pipe(parser);

    for await (const record of parser) {
        yield record;
    }
}

async function clearCollections(): Promise<void> {
    await PatientModel.deleteMany({});
    await EmailModel.deleteMany({});
}

async function insertPatient(patient: IPatient): Promise<IPatientModel> {
    try {
        const patientsModel = new PatientModel(patient);
        await patientsModel.save();

        logger.info(`Patient "${patientsModel.email}" was created.`);

        return patientsModel;
    } catch(e) {
        logger.error(`Patient "${patient.email}" was not created (${e.message}):`, patient);
    }

    return null;
}

async function createSubscription(title: string, patient: IPatientModel, sendDate: Date, body: string = '') {
    try {
        const emailModel = new EmailModel({
            title,
            body,
            sendDate,
            patient: patient._id
        });
        await emailModel.save();

        logger.info(`Subscription "${title}" for patient "${patient.email}" was created.`);

        return emailModel;
    } catch(e) {
        logger.error(`Subscription "${title}" for patient "${patient.email}" was not created (${e.message}):`, patient);
    }

    return null;
}

export function convertPatientFromFileToModel(patient: any): IPatient {
    return {
        programIdentifier: patient['Program Identifier'],
        email: patient['Email Address'],
        dataSource: patient['Data Source'],
        cardNumber: patient['Card Number'],
        memberId: patient['Member ID'],
        firstName: patient['First Name'],
        lastName: patient['Last Name'],
        dateOfBirth: new Date(patient['Date of Birth']),
        address1: patient['Address 1'],
        address2: patient['Address 2'],
        city: patient['City'],
        state: patient['State'],
        zipCode: patient['Zip code'],
        telephoneNumber: patient['Telephone number'],
        consent: patient['CONSENT'],
        mobilePhone: patient['Mobile Phone']
    };
}
