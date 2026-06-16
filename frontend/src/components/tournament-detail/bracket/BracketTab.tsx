import { useEffect } from "react";
import BracketSVGTree from "./BracketSVGTree";
import { useBracketStore } from "@/stores/useBracketStore";

const BracketTab = ({ tournamentId }: { tournamentId: string }) => {
  const { rootNode, loading, fetchBracketTree } = useBracketStore();

  useEffect(() => {
    fetchBracketTree(tournamentId);
  }, [tournamentId, fetchBracketTree]);

  if (loading || !rootNode) {
    return <div className="py-20 text-center text-muted-foreground">Đang tải sơ đồ loại trực tiếp đệ quy...</div>;
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center gap-3">
         <div className="w-1 h-6 bg-accent rounded-full"></div>
         <h3 className="font-bold text-lg uppercase text-foreground">Sơ đồ loại trực tiếp</h3>
      </div>
      <BracketSVGTree rootData={rootNode} />
    </div>
  );
};
export default BracketTab;