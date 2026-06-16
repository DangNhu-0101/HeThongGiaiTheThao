import { AlertCircle } from "lucide-react";

const TeamMgmtAlert = () => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-orange-800 text-sm">7 đội đang chờ duyệt</h4>
          <p className="text-xs text-orange-600/80 mt-0.5">FC Dynamo, Blue Eagles và 5 đội khác đang chờ phản hồi </p>
        </div>
      </div>
      <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0 w-full sm:w-auto shadow-sm">
        Duyệt tất cả
      </button>
    </div>
  );
};
export default TeamMgmtAlert;