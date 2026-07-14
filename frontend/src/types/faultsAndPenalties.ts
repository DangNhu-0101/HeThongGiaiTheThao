interface ITechnicalFault {
  name?: string;
  description?: string;
  penalty?: string;
}

export interface IFaultsAndPenalties  {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  sportType?: string;
  technicalFaults?: ITechnicalFault[];
  penaltyCards?: {
    yellowCard?: string;
    redCard?: string;
    verbalWarning?: string;
  };
  penaltyPoints?: number;
  customFaults?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
