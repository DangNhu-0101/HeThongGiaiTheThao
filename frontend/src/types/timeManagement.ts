export interface ITimeManagementRule  {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  sportType?: string;
  periodConfig?: {
    numberOfPeriods?: number;
    durationPerPeriod?: number;
    halfTimeBreak?: number;
  };
  timeoutConfig?: {
    allowed?: boolean;
    countPerMatch?: number;
    durationSeconds?: number;
  };
  warmUpMinutes?: number;
  medicalTimeOutMinutes?: number;
  betweenSetRestMinutes?: number;
  maxWaitTimeBeforeForfeit?: number;
  changeSideAt?: number;
  customTimeRules?: string;
  status?: "actived" | "inactived";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
