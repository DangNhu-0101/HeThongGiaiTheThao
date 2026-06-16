import { mockBracketTreeData, mockTieBreakRules } from "@/data/mockBracketTree";
import type { BracketTreeNode, TieBreakRule } from "@/types/bracketTree";

export const bracketService = {
  async getBracketTreeData(tournamentId: string): Promise<{ rootNode: BracketTreeNode, rules: TieBreakRule[] }> {
    // Dùng biến tournamentId để linter không báo lỗi
    console.log("Đang tải dữ liệu nhánh đấu cho giải:", tournamentId);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          rootNode: mockBracketTreeData, 
          rules: mockTieBreakRules 
        });
      }, 500);
    });
  }
};