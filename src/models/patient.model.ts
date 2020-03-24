import {Document, model, Schema} from "mongoose"

export interface IPatient {
    programIdentifier: string;
    email: string;
    dataSource: string;
    cardNumber: string;
    memberId: number,
    firstName: string;
    lastName: string;
    dateOfBirth: Date,
    address1: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
    telephoneNumber: string;
    consent: string;
    mobilePhone: string;
}

export interface IPatientModel extends IPatient, Document {}

const PatientSchema: Schema = new Schema({
    programIdentifier: String,
    email: { type: String }, // TODO: Good to have: { required: true, unique: true }
    dataSource: String,
    cardNumber: String,
    memberId: String,
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    telephoneNumber: String,
    consent: String,
    mobilePhone: String
});

export default model<IPatientModel>('Patient', PatientSchema);
