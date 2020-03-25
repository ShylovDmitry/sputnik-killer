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
    programIdentifier: Number,
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
            },
            message: props => `${props.value} is not a valid email`
        }
    },
    dataSource: String,
    cardNumber: Number,
    memberId: Number,
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    telephoneNumber: String,
    consent: {
        type: String,
        enum: ['Y', 'N']
    },
    mobilePhone: String
});

export default model<IPatientModel>('Patient', PatientSchema);
