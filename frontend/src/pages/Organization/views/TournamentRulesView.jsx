import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const KNOCKOUT_ROUNDS = ['Round of 128', 'Round of 64', 'Round of 32', 'Round of 16', 'Round of 8', 'Quarter Final', 'Semi Final', 'Final'];
const WILDCARD_CRITERIA_LIST = [
  { id: 'pointDiff',  label: 'Hiệu số'            },
  { id: 'totalScore', label: 'Tổng điểm ghi được' },
  { id: 'headToHead', label: 'Đối đầu'             },
  { id: 'random',     label: 'Bốc thăm'            },
];
const RANKING_CRITERIA_LIST = [
  { id: 'points',     label: 'Điểm'               },
  { id: 'pointDiff',  label: 'Hiệu số'            },
  { id: 'headToHead', label: 'Đối đầu'            },
  { id: 'totalScore', label: 'Tổng điểm ghi được' },
  { id: 'random',     label: 'Random'             },
];

const CSS = `
 
  .rv-wrap {
    min-height: 100vh;
    background: var(--sky-mist);
    font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
    padding: 32px 16px 60px;
  }
  .rv-inner { max-width: 900px; margin: 0 auto; }

  /* PAGE HEADER */
  .rv-page-header { margin-bottom: 28px; }
  .rv-page-tag {
    font-size: 10px; font-weight: 700;
    color: var(--ocean-mid);
    text-transform: uppercase; letter-spacing: 2px;
    margin-bottom: 6px;
  }
  .rv-page-title {
    font-size: 22px; font-weight: 700;
    color: var(--ocean-deep); margin: 0 0 4px;
  }
  .rv-page-sub { font-size: 13px; color: #7a8fa0; }
  .rv-page-sub b { color: var(--ocean-deep); font-weight: 600; }

  /* SPORT TABS */
  .rv-sport-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px; }
  .rv-sport-tab {
    padding: 7px 20px;
    border-radius: 20px;
    font-size: 12px; font-weight: 600;
    border: 1px solid rgba(1,138,190,0.22);
    background: var(--bg-white);
    color: #7a8fa0;
    cursor: pointer; white-space: nowrap;
    transition: all 0.15s;
  }
  .rv-sport-tab.active {
    background: var(--ocean-mid);
    border-color: var(--ocean-mid);
    color: #fff;
  }
  .rv-sport-tab:hover:not(.active) { border-color: var(--ocean-mid); color: var(--ocean-deep); }

  /* STAGE COUNT CONTROL */
  .rv-stage-ctrl {
    display: flex; align-items: center; gap: 12px;
    background: var(--bg-white);
    border: 1px solid rgba(2,69,122,0.1);
    border-radius: 12px;
    padding: 14px 20px;
    margin-bottom: 20px;
  }
  .rv-stage-ctrl-label { font-size: 12px; font-weight: 700; color: var(--ocean-deep); text-transform: uppercase; letter-spacing: 1px; flex: 1; }
  .rv-count-btn {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(1,138,190,0.25);
    background: var(--sky-mist);
    color: var(--ocean-deep);
    font-size: 16px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .rv-count-btn:hover { background: var(--ocean-pale); }
  .rv-count-num { font-size: 15px; font-weight: 700; color: var(--ocean-deep); min-width: 20px; text-align: center; }

  /* STAGE NODE */
  .rv-stage {
    background: var(--bg-white);
    border: 1px solid rgba(2,69,122,0.1);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 14px;
    transition: box-shadow 0.15s;
  }
  .rv-stage:hover { box-shadow: 0 4px 16px rgba(2,69,122,0.08); }
  .rv-stage.depth-1 { border-color: rgba(169,153,220,0.25); margin-left: 20px; }
  .rv-stage.depth-2 { border-color: rgba(189,0,20,0.18); margin-left: 36px; }
  .rv-stage.depth-3 { border-color: rgba(1,138,190,0.2); margin-left: 52px; }

  /* STAGE HEADER */
  .rv-stage-header {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px;
    cursor: pointer;
    background: rgba(214,231,238,0.35);
    border-bottom: 1px solid rgba(2,69,122,0.07);
    user-select: none;
    transition: background 0.15s;
  }
  .rv-stage-header:hover { background: rgba(214,231,238,0.55); }
  .rv-stage-collapse {
    width: 20px; height: 20px;
    border-radius: 5px;
    border: 1px solid rgba(2,69,122,0.18);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: var(--ocean-mid); flex-shrink: 0;
    font-weight: 700;
  }
  .rv-stage-name { font-size: 13px; font-weight: 700; color: var(--ocean-deep); flex: 1; }
  .rv-stage-type-badge {
    font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.5px;
    flex-shrink: 0;
  }
  .rv-stage-type-badge.group    { background: rgba(1,138,190,0.12); color: var(--ocean-mid); }
  .rv-stage-type-badge.knockout { background: rgba(189,0,20,0.1);   color: var(--logo-red);  }
  .rv-badge-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .rv-badge {
    font-size: 11px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px;
    border: 1px solid;
  }
  .rv-badge-cyan   { color: var(--ocean-mid);     border-color: rgba(1,138,190,0.25);  background: rgba(1,138,190,0.07);  }
  .rv-badge-green  { color: #16a34a;               border-color: rgba(22,163,74,0.25);  background: rgba(22,163,74,0.07);  }
  .rv-badge-orange { color: #ea580c;               border-color: rgba(234,88,12,0.25);  background: rgba(234,88,12,0.07);  }
  .rv-badge-purple { color: var(--purple-accent);  border-color: rgba(169,153,220,0.25); background: rgba(169,153,220,0.07); }

  /* STAGE BODY */
  .rv-stage-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }

  /* ROW / META CONTROLS */
  .rv-meta-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }

  /* FIELDS */
  .rv-field { display: flex; flex-direction: column; gap: 4px; }
  .rv-label {
    font-size: 10px; font-weight: 700;
    color: var(--ocean-mid);
    text-transform: uppercase; letter-spacing: 1.5px;
  }
  .rv-input, .rv-select, .rv-textarea {
    padding: 7px 11px;
    border: 1px solid rgba(1,138,190,0.22);
    background: var(--sky-mist);
    color: var(--dark-base);
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .rv-textarea {
    padding: 10px 12px;
    resize: vertical;
    min-height: 60px;
  }
  .rv-input:focus, .rv-select:focus, .rv-textarea:focus {
    border-color: var(--ocean-mid);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(1,138,190,0.1);
  }
  .rv-input-sm { width: 90px; }
  .rv-input-md { width: 130px; }
  .rv-select-sm { width: 130px; }
  .rv-select-md { width: 160px; }

  /* PANEL (sub-sections) */
  .rv-panel {
    border: 1px solid rgba(2,69,122,0.1);
    border-radius: 12px;
    overflow: hidden;
  }
  .rv-panel-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px;
    background: rgba(214,231,238,0.35);
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid transparent;
    transition: background 0.15s;
  }
  .rv-panel-head:hover { background: rgba(214,231,238,0.6); }
  .rv-panel-head.open { border-bottom-color: rgba(2,69,122,0.08); }
  .rv-panel-title {
    font-size: 11px; font-weight: 700;
    color: var(--ocean-deep);
    text-transform: uppercase; letter-spacing: 1.5px;
  }
  .rv-panel-title.purple { color: var(--purple-accent); }
  .rv-panel-title.red    { color: var(--logo-red); }
  .rv-panel-chevron { font-size: 9px; color: var(--ocean-pale); font-weight: 700; }
  .rv-panel-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }

  /* TOGGLE SWITCH */
  .rv-toggle-row { display: flex; align-items: center; gap: 10px; }
  .rv-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
  .rv-toggle input { display: none; }
  .rv-toggle-track {
    position: absolute; inset: 0;
    border-radius: 10px;
    background: rgba(1,138,190,0.15);
    border: 1px solid rgba(1,138,190,0.2);
    cursor: pointer; transition: background 0.2s;
  }
  .rv-toggle input:checked + .rv-toggle-track { background: var(--ocean-mid); border-color: var(--ocean-mid); }
  .rv-toggle-thumb {
    position: absolute; top: 3px; left: 3px;
    width: 12px; height: 12px;
    border-radius: 50%; background: #fff;
    pointer-events: none;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .rv-toggle input:checked ~ .rv-toggle-thumb { transform: translateX(16px); }
  .rv-toggle-label { font-size: 12px; font-weight: 600; color: var(--ocean-deep); cursor: pointer; }

  /* CHIP SELECTORS (criteria, rank) */
  .rv-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .rv-chip {
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(1,138,190,0.22);
    background: #fff;
    font-size: 12px; font-weight: 500;
    color: #7a8fa0;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
  }
  .rv-chip.sel-blue   { background: rgba(1,138,190,0.12); border-color: var(--ocean-mid); color: var(--ocean-deep); font-weight: 600; }
  .rv-chip.sel-green  { background: rgba(22,163,74,0.1);  border-color: #16a34a;          color: #15803d;           font-weight: 600; }
  .rv-chip.sel-orange { background: rgba(234,88,12,0.1);  border-color: #ea580c;          color: #c2410c;           font-weight: 600; }
  .rv-chip.sel-purple { background: rgba(169,153,220,0.12); border-color: var(--purple-accent); color: #7c60c8; font-weight: 600; }

  /* PRIORITY LIST */
  .rv-priority-list { display: flex; flex-direction: column; gap: 4px; }
  .rv-priority-row {
    display: flex; align-items: center; gap: 8px;
    background: var(--sky-mist);
    border: 1px solid rgba(2,69,122,0.08);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
  }
  .rv-priority-num { font-weight: 700; color: var(--ocean-mid); min-width: 18px; }
  .rv-priority-name { flex: 1; color: var(--ocean-deep); font-weight: 500; }
  .rv-prio-btn {
    width: 22px; height: 22px;
    border-radius: 5px;
    border: 1px solid rgba(2,69,122,0.15);
    background: #fff;
    color: var(--ocean-deep);
    font-size: 10px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .rv-prio-btn:hover:not(:disabled) { background: var(--ocean-pale); }
  .rv-prio-btn:disabled { opacity: 0.25; cursor: default; }

  /* BRANCH CARD */
  .rv-branch-list { display: flex; flex-direction: column; gap: 10px; }
  .rv-branch {
    background: var(--sky-mist);
    border: 1px solid rgba(2,69,122,0.12);
    border-radius: 12px;
    padding: 14px;
  }
  .rv-branch-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .rv-branch-name-input {
    flex: 1;
    padding: 5px 10px;
    border: 1px solid rgba(1,138,190,0.2);
    border-radius: 7px;
    background: #fff;
    font-size: 12px; font-weight: 600;
    color: var(--ocean-deep);
    font-family: inherit; outline: none;
  }
  .rv-branch-name-input:focus { border-color: var(--ocean-mid); }
  .rv-branch-stats { display: flex; gap: 14px; margin-top: 10px; font-size: 11px; }
  .rv-branch-stat-in  { color: var(--ocean-mid); font-weight: 600; }
  .rv-branch-stat-out { color: #16a34a;          font-weight: 600; }

  /* KNOCKOUT SUMMARY */
  .rv-ko-summary {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  .rv-ko-box {
    border-radius: 10px;
    padding: 14px;
    text-align: center;
    border: 1px solid;
  }
  .rv-ko-box-win  { background: rgba(22,163,74,0.07);  border-color: rgba(22,163,74,0.22);  }
  .rv-ko-box-loss { background: rgba(189,0,20,0.07);    border-color: rgba(189,0,20,0.18);   }
  .rv-ko-box-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .rv-ko-box-win  .rv-ko-box-label { color: #16a34a; }
  .rv-ko-box-loss .rv-ko-box-label { color: var(--logo-red); }
  .rv-ko-box-val  { font-size: 28px; font-weight: 700; line-height: 1; }
  .rv-ko-box-win  .rv-ko-box-val { color: #16a34a; }
  .rv-ko-box-loss .rv-ko-box-val { color: var(--logo-red); }
  .rv-ko-box-sub  { font-size: 11px; color: #9aadba; margin-top: 3px; }

  /* ADD SUBSTAGE BTN */
  .rv-add-sub-btn {
    font-size: 12px; font-weight: 600;
    color: var(--ocean-mid);
    border: 1px dashed rgba(1,138,190,0.3);
    border-radius: 8px;
    padding: 8px 16px;
    background: none; cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .rv-add-sub-btn:hover { border-color: var(--ocean-mid); background: rgba(1,138,190,0.05); }
  .rv-add-branch-btn {
    font-size: 12px; font-weight: 600;
    color: var(--purple-accent);
    border: 1px dashed rgba(169,153,220,0.35);
    border-radius: 8px;
    padding: 7px 14px;
    background: none; cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .rv-add-branch-btn:hover { border-color: var(--purple-accent); background: rgba(169,153,220,0.06); }

  /* REMOVE BTN */
  .rv-remove-btn {
    font-size: 11px; font-weight: 600;
    color: var(--logo-red);
    background: rgba(189,0,20,0.07);
    border: 1px solid rgba(189,0,20,0.18);
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer; transition: background 0.15s;
    flex-shrink: 0;
  }
  .rv-remove-btn:hover { background: rgba(189,0,20,0.14); }

  /* SUBSTAGE WRAPPER */
  .rv-substages { display: flex; flex-direction: column; gap: 10px; }
  .rv-substage-wrap { position: relative; }
  .rv-substage-remove {
    position: absolute; top: -6px; right: -6px; z-index: 10;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--bg-white);
    border: 1px solid rgba(189,0,20,0.3);
    color: var(--logo-red);
    font-size: 10px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .rv-substage-remove:hover { background: rgba(189,0,20,0.1); }

  /* MATCH GRID */
  .rv-match-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }

  /* SAVE BTN */
  .rv-save-btn {
    width: 100%; padding: 14px;
    border-radius: 12px;
    border: none; cursor: pointer;
    font-size: 14px; font-weight: 700;
    font-family: inherit;
    letter-spacing: 0.5px;
    background: var(--ocean-mid);
    color: #fff;
    transition: background 0.15s, transform 0.12s;
    margin-top: 24px;
  }
  .rv-save-btn:hover:not(:disabled) { background: #019fd8; transform: translateY(-1px); }
  .rv-save-btn:disabled { background: #a0b8c8; cursor: not-allowed; }

  /* STATES */
  .rv-state {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh;
    font-size: 16px; font-weight: 600;
    color: var(--ocean-mid);
  }
     /* ─── RESPONSIVE ─── */
  @media (max-width: 1024px) {
    .rv-inner { max-width: 95%; }
    .rv-stage { margin-left: 0 !important; }
    .rv-stage.depth-1 { margin-left: 16px !important; }
    .rv-stage.depth-2 { margin-left: 24px !important; }
    .rv-stage.depth-3 { margin-left: 32px !important; }
  }

  @media (max-width: 768px) {
    .rv-wrap { padding: 20px 12px; }
    .rv-meta-row { flex-direction: column; align-items: stretch; }
    .rv-match-grid { grid-template-columns: 1fr; }
    .rv-ko-summary { grid-template-columns: 1fr; gap: 8px; }
    .rv-branch-list { gap: 12px; }
    .rv-branch { padding: 12px; }
    .rv-branch-header { flex-wrap: wrap; }
    .rv-stage-body { padding: 12px; }
    .rv-stage-header { flex-wrap: wrap; gap: 8px; }
    .rv-panel-body { padding: 12px; }
    .rv-badge-row { order: 3; width: 100%; justify-content: flex-start; }
  }

  @media (max-width: 640px) {
    .rv-page-title { font-size: 18px; }
    .rv-stage-name { font-size: 12px; }
    .rv-sport-tab { padding: 6px 14px; font-size: 11px; }
    .rv-input, .rv-select { font-size: 14px; }
    .rv-chip { padding: 6px 12px; font-size: 11px; }
    .rv-priority-row { flex-wrap: wrap; }
    .rv-ko-box-val { font-size: 22px; }
    .rv-branch-stats { flex-direction: column; gap: 4px; }
    .rv-branch-name-input { font-size: 13px; }
  }
`;

const generateId = () => crypto.randomUUID();

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const TournamentRulesView = () => {
  const { id } = useParams();
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [tournament,   setTournament]   = useState(null);
  const [selectedSport,setSelectedSport]= useState('');
  const [stageCount,   setStageCount]   = useState(1);
  const [stageTree,    setStageTree]    = useState([]);

  const [formatDescription, setFormatDescription] = useState(''); // Thể thức thi đấu
const [ruleDescription, setRuleDescription] = useState('');     // Luật thi đấu

  const createBranch = (name = 'Nhánh mới') => ({
    id: generateId(), name,
    numberOfGroups: 2, playersPerGroup: 4, selectedRanks: [1, 2],
  });

  const createStage = (stageNumber, parentId = null, branchName = '') => ({
    id: generateId(), parentId, stageNumber,
    stageName: branchName ? `${branchName} — Vòng ${stageNumber}` : `Vòng ${stageNumber}`,
    type: 'GROUP_STAGE', branchName,
    hasBranches: false, branches: [createBranch('Nhánh chính')],
    hasWildcards: false, wildcardsCount: 0,
    wildcardCriteria: ['pointDiff', 'totalScore', 'headToHead'],
    wildcardPriorityOrder: ['pointDiff', 'totalScore', 'headToHead', 'random'],
    winPoints: 1, lossPoints: 0,
    rankingCriteria: ['points', 'pointDiff', 'headToHead', 'totalScore'],
    rankingPriorityOrder: ['points', 'pointDiff', 'headToHead', 'totalScore', 'random'],
    matchFormat: '1_SET', touchPoint: 11, winByGap: 1, maxPoints: null, changeSideAt: 6,
    substages: [], knockoutRound: '', hasBronzeMatch: false, totalTeamsIn: 0,
  });

  useEffect(() => {
    const newTree = [];
    for (let i = 0; i < stageCount; i++) {
      const prev = i > 0 ? newTree[i - 1] : null;
      newTree.push(createStage(i + 1, prev?.id || null));
    }
    setStageTree(newTree);
  }, [stageCount]);

  useEffect(() => {
    if (!id) return;
    api.get(`/tournaments/${id}`)
      .then(res => {
        if (res.data?.success) {
          setTournament(res.data.data);
          if (res.data.data.sportsConfig?.length > 0)
            setSelectedSport(res.data.data.sportsConfig[0].sport);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── UPDATERS ── */
  const updateStage = useCallback((stageId, field, value) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const walk = stages => {
        for (const s of stages) {
          if (s.id === stageId) {
            s[field] = value;
            if (field === 'type' && value === 'KNOCKOUT') {
              s.hasBranches = false; s.branches = [createBranch('Nhánh chính')];
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const updateBranch = useCallback((stageId, branchId, field, value) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const walk = stages => {
        for (const s of stages) {
          if (s.id === stageId) { const b = s.branches.find(b => b.id === branchId); if (b) b[field] = value; return true; }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const toggleRank = useCallback((stageId, branchId, rank) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const walk = stages => {
        for (const s of stages) {
          if (s.id === stageId) {
            const b = s.branches.find(b => b.id === branchId);
            if (b) {
              const idx = b.selectedRanks.indexOf(rank);
              if (idx > -1) { if (b.selectedRanks.length > 1) b.selectedRanks.splice(idx, 1); }
              else { b.selectedRanks.push(rank); b.selectedRanks.sort((a, b) => a - b); }
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const addBranch = useCallback((stageId) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const walk = stages => {
        for (const s of stages) {
          if (s.id === stageId && s.type === 'GROUP_STAGE') {
            s.branches.push(createBranch(`Nhánh ${s.branches.length + 1}`));
            s.hasBranches = true; return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const removeBranch = useCallback((stageId, branchId) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const walk = stages => {
        for (const s of stages) {
          if (s.id === stageId) {
            if (s.branches.length > 1) s.branches = s.branches.filter(b => b.id !== branchId);
            if (s.branches.length <= 1) s.hasBranches = false; return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const addSubstage = useCallback((parentId, branchName = '') => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const walk = stages => {
        for (const s of stages) {
          if (s.id === parentId) {
            const n = (s.substages?.length || 0) + 1;
            s.substages = [...(s.substages || []), createStage(n, s.id, branchName)]; return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const removeSubstage = useCallback((parentId, subId) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const walk = stages => {
        for (const s of stages) {
          if (s.id === parentId) { s.substages = (s.substages || []).filter(x => x.id !== subId); return true; }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const toggleCriteria = useCallback((stageId, type, criteriaId) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const field = type === 'wildcard' ? 'wildcardCriteria' : 'rankingCriteria';
      const walk = stages => {
        for (const s of stages) {
          if (s.id === stageId) {
            const arr = s[field]; const idx = arr.indexOf(criteriaId);
            if (idx > -1) arr.splice(idx, 1); else arr.push(criteriaId); return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const movePriority = useCallback((stageId, type, index, dir) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const orderField    = type === 'ranking' ? 'rankingPriorityOrder'  : 'wildcardPriorityOrder';
      const criteriaField = type === 'ranking' ? 'rankingCriteria'       : 'wildcardCriteria';
      const walk = stages => {
        for (const s of stages) {
          if (s.id === stageId) {
            const filtered = s[orderField].filter(id => s[criteriaField]?.includes(id));
            const ai = s[orderField].indexOf(filtered[index]);
            const ti = ai + dir;
            if (ti >= 0 && ti < s[orderField].length)
              [s[orderField][ai], s[orderField][ti]] = [s[orderField][ti], s[orderField][ai]];
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/stages/save-stages/${id}`, { 
    sportType: selectedSport, 
    formatDescription,
    ruleDescription,
    stageTree 
    });
      alert('Lưu thành công!');
    } catch (err) {
      console.error(err); alert('Lỗi khi lưu!');
    } finally { setSaving(false); }
  };

  if (loading) return <><style>{CSS}</style><div className="rv-state">Đang tải...</div></>;
  if (!tournament) return <><style>{CSS}</style><div className="rv-state" style={{color:'var(--logo-red)'}}>Không tìm thấy dữ liệu</div></>;

  return (
    <>
      <style>{CSS}</style>
      <div className="rv-wrap">
        <div className="rv-inner">

          {/* PAGE HEADER */}
          <div className="rv-page-header">
            <div className="rv-page-tag">Cấu hình giải đấu</div>
            <h1 className="rv-page-title">Vòng đấu & Luật thi đấu</h1>
            <p className="rv-page-sub">Giải: <b>{tournament.displayName || tournament.name}</b></p>
          </div>

          {/* SPORT TABS */}
          {tournament.sportsConfig?.length > 1 && (
            <div className="rv-sport-tabs">
              {tournament.sportsConfig.map((s, i) => (
                <button key={i} className={`rv-sport-tab${selectedSport === s.sport ? ' active' : ''}`}
                  onClick={() => setSelectedSport(s.sport)}>
                  {s.sport}
                </button>
              ))}
            </div>
          )}

        <div className="rv-panel" style={{marginBottom: 20}}>
  <div className="rv-panel-body" style={{gap: 16, background: '#fff'}}>
    <div className="rv-field">
      <label className="rv-stage-name">Thể thức thi đấu</label>
      <textarea 
        className="rv-input" 
        rows="2"
        value={formatDescription}
        onChange={e => setFormatDescription(e.target.value)}
        placeholder="VD: Thi đấu vòng tròn tính điểm, chọn 2 đội nhất mỗi bảng vào knock-out..."
        style={{resize: 'vertical', minHeight: 60, fontFamily: 'inherit'}}
      />
    </div>
    <div className="rv-field" style={{marginTop: 8}}>
      <div className="rv-stage-name">Luật thi đấu</div>
      <textarea 
        className="rv-input" 
        rows="3"
        value={ruleDescription}
        onChange={e => setRuleDescription(e.target.value)}
        placeholder="VD: Áp dụng luật pickleball quốc tế, giao bóng chạm lưới vẫn tính..."
        style={{resize: 'vertical', minHeight: 80, fontFamily: 'inherit'}}
      />
    </div>
  </div>
</div>

          {/* STAGE TREE */}
          <div>
            {stageTree.map((stage, idx) => (
              <StageNode key={stage.id} stage={stage} depth={0} stageIndex={idx}
                onUpdate={updateStage} onUpdateBranch={updateBranch} onToggleRank={toggleRank}
                onAddBranch={addBranch} onRemoveBranch={removeBranch}
                onAddSubstage={addSubstage} onRemoveSubstage={removeSubstage}
                onMovePriority={movePriority} onToggleCriteria={toggleCriteria} />
            ))}
          </div>

          {/* SAVE */}
          <button className="rv-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu cấu hình vòng đấu'}
          </button>

        </div>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════
   STAGE NODE
════════════════════════════════════════════════ */
const StageNode = ({ stage, depth, stageIndex, onUpdate, onUpdateBranch, onToggleRank, onAddBranch, onRemoveBranch, onAddSubstage, onRemoveSubstage, onMovePriority, onToggleCriteria }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isGroup = stage.type === 'GROUP_STAGE';

  const totalTeams = isGroup
    ? stage.branches.reduce((s, b) => s + b.numberOfGroups * b.playersPerGroup, 0)
    : stage.totalTeamsIn;
  const advancing = isGroup
    ? stage.branches.reduce((s, b) => s + b.numberOfGroups * b.selectedRanks.length, 0)
    : Math.floor(totalTeams / 2);

  const depthClass = depth > 0 ? ` depth-${Math.min(depth, 3)}` : '';

  return (
    <div className={`rv-stage${depthClass}`}>

      {/* HEADER */}
      <div className="rv-stage-header" onClick={() => setCollapsed(c => !c)}>
        <div className="rv-stage-collapse">{collapsed ? '▶' : '▼'}</div>
        <span className="rv-stage-name">{stage.stageName}</span>
        <span className={`rv-stage-type-badge ${isGroup ? 'group' : 'knockout'}`}>
          {isGroup ? 'Vòng bảng' : stage.knockoutRound || 'Knockout'}
        </span>
        <div className="rv-badge-row" onClick={e => e.stopPropagation()}>
          <span className="rv-badge rv-badge-cyan">Vào: {totalTeams}</span>
          <span className="rv-badge rv-badge-green">{isGroup ? 'Đi tiếp' : 'Thắng'}: {advancing}</span>
          {stage.hasWildcards && <span className="rv-badge rv-badge-orange">Vớt: {stage.wildcardsCount}</span>}
          {stage.hasBronzeMatch && <span className="rv-badge rv-badge-purple">Hạng 3</span>}
        </div>
      </div>

      {!collapsed && (
        <div className="rv-stage-body">

          {/* META CONTROLS */}
          <div className="rv-meta-row">
            <div className="rv-field">
              <label className="rv-label">Tên vòng</label>
              <input className="rv-input rv-input-md" value={stage.stageName}
                onChange={e => onUpdate(stage.id, 'stageName', e.target.value)} />
            </div>
            <div className="rv-field">
              <label className="rv-label">Loại vòng</label>
              <select className="rv-select rv-select-sm" value={stage.type}
                onChange={e => onUpdate(stage.id, 'type', e.target.value)}>
                <option value="GROUP_STAGE">Vòng bảng</option>
                <option value="KNOCKOUT">Loại trực tiếp</option>
              </select>
            </div>
            
             {/*  KNOCKOUT */}
             {!isGroup && (
              <>
                <div className="rv-field">
                  <label className="rv-label">Vòng knockout</label>
                  <select className="rv-select rv-select-md" value={stage.knockoutRound}
                    onChange={e => onUpdate(stage.id, 'knockoutRound', e.target.value)}>
                    <option value="">Chọn vòng...</option>
                    {KNOCKOUT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="rv-field">
                  <label className="rv-label">Số đội vào</label>
                  <input type="number" min="2" className="rv-input rv-input-sm"
                    value={stage.totalTeamsIn}
                    onChange={e => onUpdate(stage.id, 'totalTeamsIn', parseInt(e.target.value) || 0)} />
                </div>
              </>
            )}
            </div>
            {/* END META FIELDS */}

            <div style={{flex:1}} />
            {/* MATCH RULES */}
          <MatchPanel stage={stage} onUpdate={onUpdate} />
          
          {/* RANKING */}
              <RankingPanel stage={stage} onUpdate={onUpdate} onToggleCriteria={onToggleCriteria} onMovePriority={onMovePriority} />

            
          

          {/* ── GROUP STAGE ── */}
          {isGroup && (
            <>
              {/* BRANCH TOGGLE */}
              <div className="rv-toggle-row">
                <label className="rv-toggle">
                  <input type="checkbox" checked={stage.hasBranches}
                    onChange={e => onUpdate(stage.id, 'hasBranches', e.target.checked)} />
                  <div className="rv-toggle-track" />
                  <div className="rv-toggle-thumb" />
                </label>
                <span className="rv-toggle-label">Chia nhánh khu vực</span>
              </div>

              {/* BRANCHES */}
              <div className="rv-panel">
                <div className="rv-panel-body">
                  <div className="rv-branch-list">
                    {stage.branches.map(branch => (
                      <BranchCard key={branch.id} branch={branch} stageId={stage.id}
                        showRemove={stage.hasBranches && stage.branches.length > 1}
                        onUpdate={onUpdateBranch} onToggleRank={onToggleRank}
                        onRemove={() => onRemoveBranch(stage.id, branch.id)}
                        onAddSubstage={() => onAddSubstage(stage.id, branch.name)} />
                    ))}
                  </div>
                  {stage.hasBranches && (
                    <button className="rv-add-branch-btn" onClick={() => onAddBranch(stage.id)}>
                      + Thêm nhánh
                    </button>
                  )}
                </div>
              </div>

              
            </>
          )}

          {/* ── KNOCKOUT STAGE ── */}
          {!isGroup && (
            <>
              <div className="rv-ko-summary">
                <div className="rv-ko-box rv-ko-box-win">
                  <div className="rv-ko-box-label">Thắng — đi tiếp</div>
                  <div className="rv-ko-box-val">{advancing}</div>
                  <div className="rv-ko-box-sub">đội</div>
                </div>
                <div className="rv-ko-box rv-ko-box-loss">
                  <div className="rv-ko-box-label">Thua — bị loại</div>
                  <div className="rv-ko-box-val">{totalTeams - advancing}</div>
                  <div className="rv-ko-box-sub">đội</div>
                </div>
              </div>

              {/* BRONZE MATCH */}
              <div className="rv-toggle-row">
                <label className="rv-toggle">
                  <input type="checkbox" checked={stage.hasBronzeMatch}
                    onChange={e => onUpdate(stage.id, 'hasBronzeMatch', e.target.checked)} />
                  <div className="rv-toggle-track" style={stage.hasBronzeMatch ? {background:'var(--purple-accent)', borderColor:'var(--purple-accent)'} : {}} />
                  <div className="rv-toggle-thumb" />
                </label>
                <span className="rv-toggle-label">Có trận tranh hạng 3</span>
              </div>

              {/* WILDCARD — chỉ KNOCKOUT */}
              <WildcardPanel stage={stage} onUpdate={onUpdate} onToggleCriteria={onToggleCriteria} onMovePriority={onMovePriority} />
               <button className="rv-add-sub-btn" onClick={() => onAddSubstage(stage.id)}>
            + Thêm vòng sau
          </button> 
            </>
          )}
          {/* END NHÁNH / KNOCKOUT */}

          

          {/* SUBSTAGES */}
          {stage.substages?.length > 0 && (
            <div className="rv-substages">
              {stage.substages.map((sub, idx) => (
                <div key={sub.id} className="rv-substage-wrap">
                  <button className="rv-substage-remove" onClick={() => onRemoveSubstage(stage.id, sub.id)}>✕</button>
                  <StageNode stage={sub} depth={depth + 1} stageIndex={idx}
                    onUpdate={onUpdate} onUpdateBranch={onUpdateBranch} onToggleRank={onToggleRank}
                    onAddBranch={onAddBranch} onRemoveBranch={onRemoveBranch}
                    onAddSubstage={onAddSubstage} onRemoveSubstage={onRemoveSubstage}
                    onMovePriority={onMovePriority} onToggleCriteria={onToggleCriteria} />
                </div>
              ))}
            </div>
          )}

         
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   BRANCH CARD
════════════════════════════════════════════════ */
const BranchCard = ({ branch, stageId, showRemove, onUpdate, onToggleRank, onRemove, onAddSubstage }) => (
  <div className="rv-branch">
    <div className="rv-branch-header">
      <input className="rv-branch-name-input" value={branch.name}
        onChange={e => onUpdate(stageId, branch.id, 'name', e.target.value)} />
      <button className="rv-add-sub-btn" style={{fontSize:11,padding:'4px 10px'}} onClick={onAddSubstage}>+ Vòng sau</button>
      {showRemove && <button className="rv-remove-btn" onClick={onRemove}>Xóa</button>}
    </div>
    <div className="rv-match-grid">
      <div className="rv-field">
        <label className="rv-label">Số bảng</label>
        <input type="number" min="1" className="rv-input" value={branch.numberOfGroups}
          onChange={e => onUpdate(stageId, branch.id, 'numberOfGroups', parseInt(e.target.value) || 1)} />
      </div>
      <div className="rv-field">
        <label className="rv-label">Đội / bảng</label>
        <input type="number" min="2" className="rv-input" value={branch.playersPerGroup}
          onChange={e => onUpdate(stageId, branch.id, 'playersPerGroup', parseInt(e.target.value) || 2)} />
      </div>
    </div>
    <div className="rv-field" style={{marginTop:10}}>
      <label className="rv-label">Hạng đi tiếp</label>
      <div className="rv-chips">
        {Array.from({ length: branch.playersPerGroup }, (_, i) => i + 1).map(rank => {
          const sel = branch.selectedRanks.includes(rank);
          return (
            <span key={rank} className={`rv-chip${sel ? ' sel-green' : ''}`}
              onClick={() => onToggleRank(stageId, branch.id, rank)}>
              Hạng {rank}
            </span>
          );
        })}
      </div>
    </div>
    <div className="rv-branch-stats">
      <span className="rv-branch-stat-in">Tổng vào: {branch.numberOfGroups * branch.playersPerGroup}</span>
      <span className="rv-branch-stat-out">Đi tiếp: {branch.numberOfGroups * branch.selectedRanks.length}</span>
    </div>
  </div>
);

/* ════════════════════════════════════════════════
   MATCH PANEL
════════════════════════════════════════════════ */
const MatchPanel = ({ stage, onUpdate }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rv-panel">
      <div className={`rv-panel-head${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="rv-panel-title">Luật thi đấu</span>
        <span className="rv-panel-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="rv-panel-body">
          <div className="rv-match-grid">
            <div className="rv-field">
              <label className="rv-label">Loại trận</label>
              <select className="rv-select" value={stage.matchFormat}
                onChange={e => onUpdate(stage.id, 'matchFormat', e.target.value)}>
                <option value="1_SET">1 Set</option>
                <option value="BO3">BO3</option>
                <option value="BO5">BO5</option>
              </select>
            </div>
            <div className="rv-field">
              <label className="rv-label">Điểm chạm</label>
              <input type="number" min="1" className="rv-input" value={stage.touchPoint}
                onChange={e => onUpdate(stage.id, 'touchPoint', parseInt(e.target.value) || 0)} />
            </div>
            <div className="rv-field">
              <label className="rv-label">Cách biệt</label>
              <input type="number" min="1" className="rv-input" value={stage.winByGap}
                onChange={e => onUpdate(stage.id, 'winByGap', parseInt(e.target.value) || 0)} />
            </div>
            <div className="rv-field">
              <label className="rv-label">Giới hạn</label>
              <input type="number" className="rv-input" value={stage.maxPoints || ''}
                placeholder="Không giới hạn"
                onChange={e => onUpdate(stage.id, 'maxPoints', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
            <div className="rv-field">
              <label className="rv-label">Đổi sân tại</label>
              <input type="number" min="1" className="rv-input" value={stage.changeSideAt}
                onChange={e => onUpdate(stage.id, 'changeSideAt', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   RANKING PANEL (GROUP_STAGE only)
════════════════════════════════════════════════ */
const RankingPanel = ({ stage, onUpdate, onToggleCriteria, onMovePriority }) => {
  const [open, setOpen] = useState(false);
  const filtered = stage.rankingPriorityOrder.filter(id => stage.rankingCriteria?.includes(id));
  return (
    <div className="rv-panel">
      <div className={`rv-panel-head${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="rv-panel-title">Xếp hạng bảng</span>
        <span className="rv-panel-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="rv-panel-body">
          <div className="rv-match-grid">
            <div className="rv-field">
              <label className="rv-label">Điểm thắng</label>
              <input type="number" className="rv-input" value={stage.winPoints}
                onChange={e => onUpdate(stage.id, 'winPoints', parseInt(e.target.value) || 0)} />
            </div>
            <div className="rv-field">
              <label className="rv-label">Điểm thua</label>
              <input type="number" className="rv-input" value={stage.lossPoints}
                onChange={e => onUpdate(stage.id, 'lossPoints', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="rv-field">
            <label className="rv-label">Tiêu chí xếp hạng</label>
            <div className="rv-chips">
              {RANKING_CRITERIA_LIST.map(c => (
                <span key={c.id}
                  className={`rv-chip${stage.rankingCriteria?.includes(c.id) ? ' sel-blue' : ''}`}
                  onClick={() => onToggleCriteria(stage.id, 'ranking', c.id)}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          {filtered.length > 0 && (
            <div className="rv-field">
              <label className="rv-label">Thứ tự ưu tiên</label>
              <div className="rv-priority-list">
                {filtered.map((cid, idx) => {
                  const c = RANKING_CRITERIA_LIST.find(x => x.id === cid);
                  return (
                    <div key={cid} className="rv-priority-row">
                      <button className="rv-prio-btn" disabled={idx === 0}
                        onClick={() => onMovePriority(stage.id, 'ranking', idx, -1)}>▲</button>
                      <button className="rv-prio-btn" disabled={idx === filtered.length - 1}
                        onClick={() => onMovePriority(stage.id, 'ranking', idx, 1)}>▼</button>
                      <span className="rv-priority-num">{idx + 1}.</span>
                      <span className="rv-priority-name">{c?.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   WILDCARD PANEL (KNOCKOUT only)
════════════════════════════════════════════════ */
const WildcardPanel = ({ stage, onUpdate, onToggleCriteria, onMovePriority }) => {
  const [open, setOpen] = useState(false);
  const filtered = stage.wildcardPriorityOrder.filter(id => stage.wildcardCriteria?.includes(id));
  return (
    <div className="rv-panel" style={{borderColor:'rgba(234,88,12,0.18)'}}>
      <div className={`rv-panel-head${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}
        style={{background: open ? 'rgba(234,88,12,0.05)' : undefined}}>
        <span className="rv-panel-title red">Vé vớt (Lucky Losers)</span>
        <span className="rv-panel-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="rv-panel-body">
          <div className="rv-toggle-row">
            <label className="rv-toggle">
              <input type="checkbox" checked={stage.hasWildcards}
                onChange={e => onUpdate(stage.id, 'hasWildcards', e.target.checked)} />
              <div className="rv-toggle-track"
                style={stage.hasWildcards ? {background:'#ea580c', borderColor:'#ea580c'} : {}} />
              <div className="rv-toggle-thumb" />
            </label>
            <span className="rv-toggle-label">Áp dụng vé vớt cho đội thua</span>
          </div>
          {stage.hasWildcards && (
            <>
              <div className="rv-field">
                <label className="rv-label">Số lượng vé vớt</label>
                <input type="number" min="0" className="rv-input rv-input-sm" value={stage.wildcardsCount}
                  onChange={e => onUpdate(stage.id, 'wildcardsCount', parseInt(e.target.value) || 0)} />
              </div>
              <div className="rv-field">
                <label className="rv-label">Tiêu chí chọn</label>
                <div className="rv-chips">
                  {WILDCARD_CRITERIA_LIST.map(c => (
                    <span key={c.id}
                      className={`rv-chip${stage.wildcardCriteria?.includes(c.id) ? ' sel-orange' : ''}`}
                      onClick={() => onToggleCriteria(stage.id, 'wildcard', c.id)}>
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
              {filtered.length > 0 && (
                <div className="rv-field">
                  <label className="rv-label">Thứ tự ưu tiên</label>
                  <div className="rv-priority-list">
                    {filtered.map((cid, idx) => {
                      const c = WILDCARD_CRITERIA_LIST.find(x => x.id === cid);
                      return (
                        <div key={cid} className="rv-priority-row">
                          <button className="rv-prio-btn" disabled={idx === 0}
                            onClick={() => onMovePriority(stage.id, 'wildcard', idx, -1)}>▲</button>
                          <button className="rv-prio-btn" disabled={idx === filtered.length - 1}
                            onClick={() => onMovePriority(stage.id, 'wildcard', idx, 1)}>▼</button>
                          <span className="rv-priority-num" style={{color:'#ea580c'}}>{idx + 1}.</span>
                          <span className="rv-priority-name">{c?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentRulesView;