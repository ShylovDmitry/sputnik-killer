import Patient from '../models/patient.model';

export async function runCheck() {
    console.log(await Patient.find());
}
