import React, { useState, useEffect } from 'react';

const DynamicStageConfig = () => {
    const [stageCount, setStageCount] = useState(1);
    
    const [stages, setStages] = useState([{
        id: crypto.randomUUID(), 
        stageName: "Vòng 1",
        type: "GROUP_STAGE", 
        hasBranches: false,
        branchCount: 1,
        numberOfGroups: 2,
        playersPerGroup: 4,
        advanceCriteria: "TOP_2",
        hasBronzeMatch: false,
        hasWildcards: false,
        wildcardsCount: 0
    }]);

    useEffect(() => {
        setStages(prevStages => {
            const currentLength = prevStages.length;
            const newCount = Number(stageCount);

            if (newCount > currentLength) {
                const additionalStages = Array.from({ length: newCount - currentLength }).map((_, index) => ({
                    id: crypto.randomUUID(),
                    stageName: `Vòng ${currentLength + index + 1}`,
                    type: "GROUP_STAGE",
                    hasBranches: false,
                    branchCount: 1,
                    numberOfGroups: 2,
                    playersPerGroup: 4,
                    advanceCriteria: "TOP_2",
                    hasBronzeMatch: false,
                    hasWildcards: false,
                    wildcardsCount: 0
                }));
                return [...prevStages, ...additionalStages];
            } else if (newCount < currentLength && newCount > 0) {
                return prevStages.slice(0, newCount);
            }
            return prevStages;
        });
    }, [stageCount]);

    const updateStage = (index, field, value) => {
        const newStages = [...stages];
        newStages[index][field] = value;
        setStages(newStages);
    };

    const handleSave = () => {
        console.log("Payload gửi Backend:", stages);
        alert("Đã lưu cấu hình vòng đấu! Kiểm tra Console để xem Payload.");
    };

    return (
        <>
            <style>{`
                .dsc-container {
                    padding: 24px;
                    background: #0f172a;
                    border-radius: 12px;
                    max-width: 100%;
                    margin: 0 auto;
                    border: 1px solid #1e293b;
                }

                @media (max-width: 768px) {
                    .dsc-container {
                        padding: 16px;
                    }
                }

                @media (max-width: 640px) {
                    .dsc-container {
                        padding: 12px;
                    }
                }

                .dsc-title {
                    font-size: 1.25rem;
                    font-weight: 900;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    color: #22d3ee;
                }

                @media (max-width: 640px) {
                    .dsc-title {
                        font-size: 1rem;
                    }
                }

                .dsc-stage-count {
                    margin-bottom: 2rem;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 1rem;
                    background: rgba(30,41,59,0.5);
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid #334155;
                }

                .dsc-stage-count-label {
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    color: #22d3ee;
                }

                @media (max-width: 640px) {
                    .dsc-stage-count-label {
                        font-size: 0.7rem;
                    }
                }

                .dsc-stage-count-input {
                    width: 80px;
                    padding: 8px;
                    background: #0f172a;
                    border: 1px solid #06b6d4;
                    border-radius: 8px;
                    text-align: center;
                    color: white;
                    font-weight: 700;
                }

                @media (max-width: 640px) {
                    .dsc-stage-count-input {
                        width: 70px;
                        padding: 6px;
                    }
                }

                .dsc-stage-count-hint {
                    font-size: 0.7rem;
                    color: #64748b;
                    font-style: italic;
                }

                @media (max-width: 640px) {
                    .dsc-stage-count-hint {
                        font-size: 0.6rem;
                    }
                }

                .dsc-stages {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .dsc-stage {
                    padding: 1.25rem;
                    border: 1px solid #475569;
                    background: rgba(30,41,59,0.8);
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                }

                @media (max-width: 640px) {
                    .dsc-stage {
                        padding: 1rem;
                    }
                }

                .dsc-stage-header {
                    font-size: 1.125rem;
                    font-weight: 900;
                    color: white;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #0891b2;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }

                @media (max-width: 640px) {
                    .dsc-stage-header {
                        font-size: 1rem;
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }

                .dsc-stage-badge {
                    font-size: 0.7rem;
                    font-weight: 400;
                    color: #06b6d4;
                    background: #083344;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .dsc-grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                @media (max-width: 640px) {
                    .dsc-grid-2 {
                        grid-template-columns: 1fr;
                        gap: 0.75rem;
                    }
                }

                .dsc-label {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #22d3ee;
                    margin-bottom: 0.25rem;
                }

                .dsc-input, .dsc-select {
                    width: 100%;
                    padding: 8px;
                    background: #0f172a;
                    border: 1px solid #475569;
                    border-radius: 6px;
                    color: white;
                    font-size: 0.875rem;
                    outline: none;
                }

                .dsc-input:focus, .dsc-select:focus {
                    border-color: #06b6d4;
                }

                @media (max-width: 640px) {
                    .dsc-input, .dsc-select {
                        padding: 10px;
                        font-size: 16px;
                    }
                }

                .dsc-branch-section {
                    background: rgba(15,23,42,0.5);
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    border: 1px solid #334155;
                }

                .dsc-checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #eab308;
                    cursor: pointer;
                    width: fit-content;
                }

                @media (max-width: 640px) {
                    .dsc-checkbox-label {
                        font-size: 0.8rem;
                    }
                }

                .dsc-group-config {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    background: rgba(8,145,178,0.3);
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid #155e75;
                    margin-bottom: 1rem;
                }

                @media (max-width: 768px) {
                    .dsc-group-config {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 640px) {
                    .dsc-group-config {
                        grid-template-columns: 1fr;
                        gap: 0.75rem;
                    }
                }

                .dsc-knockout-config {
                    background: rgba(168,85,247,0.3);
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    border: 1px solid #7e22ce;
                }

                .dsc-wildcard-section {
                    background: rgba(234,88,12,0.2);
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid #9a3412;
                }

                .dsc-save-btn {
                    width: 100%;
                    margin-top: 2rem;
                    background: #0891b2;
                    color: white;
                    font-weight: 900;
                    padding: 1rem;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .dsc-save-btn:hover {
                    background: #06b6d4;
                    transform: translateY(-1px);
                }

                @media (max-width: 640px) {
                    .dsc-save-btn {
                        padding: 14px;
                        font-size: 0.875rem;
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="dsc-container">
                <h2 className="dsc-title">🏆 Cấu hình giai đoạn thi đấu</h2>
                
                <div className="dsc-stage-count">
                    <label className="dsc-stage-count-label">Số lượng vòng đấu (Stages):</label>
                    <input 
                        type="number" 
                        min="1" max="10"
                        value={stageCount}
                        onChange={(e) => setStageCount(e.target.value)}
                        className="dsc-stage-count-input"
                    />
                    <span className="dsc-stage-count-hint">Thay đổi số lượng để hệ thống tự động sinh form</span>
                </div>

                <div className="dsc-stages">
                    {stages.map((stage, index) => (
                        <div key={stage.id} className="dsc-stage">
                            <h3 className="dsc-stage-header">
                                <span>🔹 VÒNG {index + 1}</span>
                                <span className="dsc-stage-badge">
                                    {stage.type === 'GROUP_STAGE' ? 'VÒNG BẢNG' : stage.type === 'KNOCKOUT' ? 'LOẠI TRỰC TIẾP' : 'HỆ THỤY SĨ'}
                                </span>
                            </h3>

                            <div className="dsc-grid-2">
                                <div>
                                    <label className="dsc-label">Tên vòng đấu</label>
                                    <input 
                                        type="text" 
                                        value={stage.stageName}
                                        onChange={(e) => updateStage(index, 'stageName', e.target.value)}
                                        className="dsc-input"
                                    />
                                </div>
                                <div>
                                    <label className="dsc-label">Hình thức</label>
                                    <select 
                                        value={stage.type}
                                        onChange={(e) => updateStage(index, 'type', e.target.value)}
                                        className="dsc-select"
                                    >
                                        <option value="GROUP_STAGE">Vòng Bảng (Group Stage)</option>
                                        <option value="KNOCKOUT">Loại trực tiếp (Knockout)</option>
                                        <option value="SWISS_SYSTEM">Hệ Thụy Sĩ (Swiss)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="dsc-branch-section">
                                <label className="dsc-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={stage.hasBranches}
                                        onChange={(e) => updateStage(index, 'hasBranches', e.target.checked)}
                                        className="accent-yellow-500 w-4 h-4"
                                    />
                                    CHIA NHÁNH THI ĐẤU KHU VỰC Ở VÒNG NÀY?
                                </label>
                                
                                {stage.hasBranches && (
                                    <div className="animate-fade-in" style={{ marginTop: '12px', paddingLeft: '24px' }}>
                                        <span className="dsc-label">Nhập số lượng nhánh (VD: Bắc, Trung, Nam = 3):</span>
                                        <input 
                                            type="number" min="2"
                                            value={stage.branchCount}
                                            onChange={(e) => updateStage(index, 'branchCount', parseInt(e.target.value) || 1)}
                                            className="dsc-input"
                                            style={{ width: '80px', marginTop: '4px' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {stage.type === 'GROUP_STAGE' && (
                                <div className="dsc-group-config">
                                    <div>
                                        <label className="dsc-label">Số lượng bảng</label>
                                        <input type="number" value={stage.numberOfGroups} onChange={(e) => updateStage(index, 'numberOfGroups', e.target.value)} className="dsc-input" />
                                    </div>
                                    <div>
                                        <label className="dsc-label">Số Đội/Bảng</label>
                                        <input type="number" value={stage.playersPerGroup} onChange={(e) => updateStage(index, 'playersPerGroup', e.target.value)} className="dsc-input" />
                                    </div>
                                    <div>
                                        <label className="dsc-label">Điều kiện lấy vé chính</label>
                                        <select value={stage.advanceCriteria} onChange={(e) => updateStage(index, 'advanceCriteria', e.target.value)} className="dsc-select">
                                            <option value="TOP_1">Chỉ lấy Nhất Bảng (Top 1)</option>
                                            <option value="TOP_2">Lấy Nhất & Nhì (Top 2)</option>
                                            <option value="TOP_3">Lấy Nhất, Nhì, Ba (Top 3)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {stage.type === 'KNOCKOUT' && (
                                <div className="dsc-knockout-config">
                                    <label className="dsc-checkbox-label" style={{ color: '#c084fc' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={stage.hasBronzeMatch}
                                            onChange={(e) => updateStage(index, 'hasBronzeMatch', e.target.checked)}
                                            className="accent-purple-500"
                                        />
                                        CÓ TỔ CHỨC TRẬN TRANH HẠNG 3 (HUY CHƯƠNG ĐỒNG)
                                    </label>
                                </div>
                            )}

                            <div className="dsc-wildcard-section">
                                <label className="dsc-checkbox-label" style={{ color: '#fb923c' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={stage.hasWildcards}
                                        onChange={(e) => updateStage(index, 'hasWildcards', e.target.checked)}
                                        className="accent-orange-500"
                                    />
                                    ÁP DỤNG VÉ VỚT (LUCKY LOSERS / WILDCARDS)?
                                </label>
                                
                                {stage.hasWildcards && (
                                    <div className="animate-fade-in" style={{ marginTop: '12px', paddingLeft: '24px', background: 'rgba(15,23,42,0.5)', padding: '12px', borderRadius: '8px' }}>
                                        <span className="dsc-label">Nhập số lượng vé vớt ở vòng này:</span>
                                        <input 
                                            type="number" min="1"
                                            value={stage.wildcardsCount}
                                            onChange={(e) => updateStage(index, 'wildcardsCount', parseInt(e.target.value) || 0)}
                                            className="dsc-input"
                                            style={{ width: '80px', marginTop: '4px', color: '#fb923c', fontWeight: 'bold' }}
                                        />
                                        <span className="dsc-stage-count-hint" style={{ display: 'block', marginTop: '8px' }}>
                                            *Hệ thống sẽ tự động chọn các đội bị loại có thành tích tốt nhất (Điểm số, Hiệu số) để lấp vào nhánh vòng trong.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <button onClick={handleSave} className="dsc-save-btn">
                    XÁC NHẬN & LƯU CẤU HÌNH VÒNG ĐẤU
                </button>
            </div>
        </>
    );
};

export default DynamicStageConfig;