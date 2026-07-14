interface ICourts {
  minRequired?: number;
  dimensions?: string;
  surfaceType?: string;
  netHeight?: string;
}

interface IPersonnelPerMatch {
  mainReferee?: number;
  lineJudges?: number;
  scoreKeepers?: number;
}

interface IEquipment {
  ballType?: string;
  other?: string;
}

export interface IResourceManagementRule  {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  sportType?: string;
  court?: ICourts;
  personnel?: IPersonnelPerMatch;
  equipment?: IEquipment;
  customResources?: string;
  status?: "actived" | "inactived";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
