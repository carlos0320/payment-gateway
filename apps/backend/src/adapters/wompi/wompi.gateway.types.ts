export type PresignedData = {
  permalink: string;
  acceptance_token: string;
};

export type MerchantsContracts = {
  data?: {
    presigned_acceptance?: PresignedData;
    presigned_personal_data_auth?: PresignedData;
  };
};

export type WompiTransactionData = {
  id?: string;
  status?: string;
  status_message?: string;
};

export type TransactionResponse = {
  data?: WompiTransactionData;
};
