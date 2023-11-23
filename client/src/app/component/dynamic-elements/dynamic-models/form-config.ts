import { RequestModel } from 'src/app/models/request-model';
import { FieldsWithAdditionalInfo } from './fields-with-additional-info';
import { FieldConfig } from '../dynamic-forms/models/field-config';

export class FormConfig {
  actionButtons?: any;
  request?: RequestModel;
  editSettingsRequest?: any;
  additionalInfo?: FieldsWithAdditionalInfo;
  config?: FieldConfig[];
  childrens?: FormConfig[];
  class?: string;
}
