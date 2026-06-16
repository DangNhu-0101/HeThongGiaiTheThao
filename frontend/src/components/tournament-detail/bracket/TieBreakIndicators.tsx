import type { TieBreakRule } from "@/types/bracketTree";

const TieBreakIndicators = ({ rules }: { rules: TieBreakRule[] }) => {
  return (
    <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-accent rounded-full"></div>
        <h3 className="font-bold text-lg uppercase text-foreground">Chỉ số phụ (Tie-Break)</h3>
        <span className="bg-accent/20 text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Áp dụng</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-muted/30 border border-border/50 rounded-lg p-5 flex flex-col h-full hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">
                {rule.id}
              </div>
              <h4 className="font-bold text-sm text-foreground leading-tight">{rule.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {rule.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default TieBreakIndicators;
