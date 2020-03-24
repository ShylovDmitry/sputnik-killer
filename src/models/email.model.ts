import {Document, model, Schema} from "mongoose"
import {IPatientModel} from "./patient.model";

export interface IEmail {
    title: string;
    body: string;
    sendDate: Date;
    patient: IPatientModel['_id'];
}

export interface IEmailModel extends IEmail, Document {}

const EmailSchema: Schema = new Schema({
    title: String,
    body: String,
    sendDate: Date,
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true }
});

export default model<IEmailModel>('Email', EmailSchema);
