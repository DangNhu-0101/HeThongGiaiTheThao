import type { Sponsor } from "./sponsor";
import type { BaseRule } from "./baseRule";

export interface ITimeLine {
  registrationStart: string; // Để string để dễ thao tác với input type="datetime-local"
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
}

export interface IGalaConfig {
  hasGala: boolean;
  time: string | null;
  venue: string;
  description: string;
}

export interface ILocation {
  city?: string;
  district?: string;
  detail?: string; // Thêm trường chi tiết địa điểm nếu cần
}

export interface IContactPerson {
  name: string;
  phone: string;
}

export interface ISportItem {
  sport: string;
  feePerAthlete: number;
  maxTeams: number | null;
  categories: string[]; // Mảng chứa ID danh mục ví dụ: ['MS', 'MD']
}



export interface Tournament {
  _id?: string; // ID do MongoDB tự sinh ra
  name: string;
  slogan?: string;
  targetParticipants?: string;
  description: string;
  logo: string;
  banner: string; // Chứa URL banner chính
  banners?: string[]; // Mảng chứa danh sách nhiều banner phụ
  sportType: string[];
  sportsConfig?: ISportItem[]; // Cấu hình chi tiết bộ môn lưu xuống DB
  timeLine: ITimeLine;
  contactPerson?: IContactPerson;
  paymentQR: string;
  prizes: string;
  galaConfig: IGalaConfig;
  location: ILocation;
  baseRule: BaseRule[]; // Sửa từ [BaseRule] thành mảng chuẩn BaseRule[]
  budget: {
    totalSponsor: number;
    totalExpense: number;
  };
  organizer: string; // Sửa từ String (Object) thành string (primitive type)
  sponsors: Sponsor[]; // Sửa từ [Sponsor] thành mảng chuẩn Sponsor[]
  status: 'upcoming' | 'ongoing' | 'completed' | string; // Sử dụng Literal Type cho rõ ràng
  createdAt: string | Date;
  updatedAt: string | Date;
}


export interface IMediaPreviews {
  logo: string | null;
  paymentQR: string | null;
  banners: string[];
}

export interface IMediaFiles {
  logo: File | null;
  paymentQR: File | null;
  banners: File[];
}

export interface ICatListItem {
  id: string;
  label: string;
}

// Cấu trúc State dùng cho Form UI (Dạng Key-Value cặp để toggle nhanh độc lập)
export interface ISportFormState {
  [sportName: string]: {
    selected: boolean;
    feePerAthlete: string | number;
    maxTeams: string | number;
    categories: string[];
  };
}



export interface TournamentFormProps {
  // Các Object State dữ liệu (Sử dụng Partial vì khi điền form dữ liệu ban đầu có thể trống)
  formData: Partial<Tournament>;
  contactPerson: IContactPerson;
  timeLine: ITimeLine;
  sportsConfig: ISportFormState;
  galaConfig: IGalaConfig;
  previews: IMediaPreviews;

  // Các hàm React SetState Setter chuẩn chỉ, dọn sạch 100% lỗi ESLint unknown
  setFormData: React.Dispatch<React.SetStateAction<Partial<Tournament>>>;
  setContactPerson: React.Dispatch<React.SetStateAction<IContactPerson>>;
  setTimeLine: React.Dispatch<React.SetStateAction<ITimeLine>>;
  setSportsConfig: React.Dispatch<React.SetStateAction<ISportFormState>>;
  setGalaConfig: React.Dispatch<React.SetStateAction<IGalaConfig>>;
  setPreviews: React.Dispatch<React.SetStateAction<IMediaPreviews>>;
  setFiles: React.Dispatch<React.SetStateAction<IMediaFiles>>;

  // Hàm xử lý sự kiện submit form chuẩn của HTMLForm
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}