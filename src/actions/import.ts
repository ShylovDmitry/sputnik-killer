import PatientModel, {IPatient, IPatientModel} from '../models/patient.model';
import EmailModel from '../models/email.model';
import * as parse from 'csv-parse';
import * as fs from 'fs';
import logger from '../logger';
import {DATA_FILE} from "../config";

export async function runImport(): Promise<void> {
    await clearCollections();

    const patientsFromFile = await readPatientsFromFile();
    const patientsToInsert = patientsFromFile.map(p => convertPatientFromFileToModel(p));
    const patients = await insertPatients(patientsToInsert);

    const patientsToSubscribe = patients.filter(p => p.consent === 'Y');
    if (patientsToSubscribe.length) {
        const now = +new Date();
        const day = 24 * 60 * 60 * 1000;

        await createSubscription('Day 1', patientsToSubscribe, new Date(now + day), 'Hello ${patient.firstName}. Day 1.');
        await createSubscription('Day 2', patientsToSubscribe, new Date(now + 2 * day), 'Hello ${patient.firstName}. Day 2.');
        await createSubscription('Day 3', patientsToSubscribe, new Date(now + 3 * day), 'Hello ${patient.firstName}. Day 3.');
        await createSubscription('Day 4', patientsToSubscribe, new Date(now + 4 * day), 'Hello ${patient.firstName}. Day 4.');
    }
}

export function readPatientsFromFile(): Promise<[]> {
    return new Promise(resolve => {
        fs.readFile(DATA_FILE, 'utf8', (err, data) => {
            if (err) throw err;

            parse(data, {
                columns: true,
                delimiter: '|'
            }, (err, output) => {
                if (err) throw err;

                resolve(output);
            })
        });
    });
}

async function clearCollections(): Promise<void> {
    await PatientModel.deleteMany({});
    await EmailModel.deleteMany({});
}

async function insertPatients(patients: IPatient[]): Promise<IPatientModel[]> {
    const result = [];

    for (const patient of patients) {
        try {
            const patientsModel = new PatientModel(patient);
            await patientsModel.save();
            result.push(patientsModel);

            logger.info(`Patient "${patientsModel.email}" was created.`);
        } catch(e) {
            logger.error(`Patient "${patient.email}" was not created (${e.message}):`, patient);
        }
    }

    return result;
}

async function createSubscription(title: string, patients: IPatientModel[], sendDate: Date, body: string = '') {
    const emails = patients.map(patient => ({ title, body, sendDate, patient: patient._id }));
    return await EmailModel.collection.insertMany(emails);
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
