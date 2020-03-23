import Patient from '../models/patient.model';
const parse = require('csv-parse/lib/sync');
const fs = require('fs');

export async function runImport() {
    const content = fs.readFileSync('./data/db.csv', 'utf8');

    const records = parse(content, {
        columns: true,
        delimiter: '|'
    });

    await Patient.deleteMany({});

    await insertPatients(records);
}

async function insertPatients(patients) {
    for (const patient of patients) {
        const patientsModel = new Patient({
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
        });

        await patientsModel.save();
    }
}
