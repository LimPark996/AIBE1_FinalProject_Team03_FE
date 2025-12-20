// src/features/booking/components/LargeVenueSeatMap.jsx

import React, { useState, useEffect, useMemo } from 'react';

/**
 * 대형 공연장용 좌석 맵 (15,000석 이상)
 * 3단계 선택: 구역 선택 → 블록(열 그룹) 선택 → 좌석 선택
 */

// 좌석 상태에 따른 스타일 클래스
const getSeatStatusClass = (status, isSelected) => {
    if (isSelected) {
        return 'bg-[#6B8EFE] ring-2 ring-white cursor-pointer';
    }
    switch (status) {
        case 'AVAILABLE':
            return 'bg-[#22C55E] hover:bg-green-400 cursor-pointer';
        case 'BOOKED':
            return 'bg-red-500 cursor-not-allowed';
        default:
            return 'bg-gray-600 cursor-not-allowed';
    }
};

// 등급별 스타일 정보
const gradeStyles = {
    VIP: {
        label: 'VIP석',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500',
        activeBg: 'bg-yellow-500',
        gradient: 'from-yellow-600 to-yellow-500',
    },
    R: {
        label: 'R석',
        color: 'text-purple-400',
        bg: 'bg-purple-500/20',
        border: 'border-purple-500',
        activeBg: 'bg-purple-500',
        gradient: 'from-purple-600 to-purple-500',
    },
    S: {
        label: 'S석',
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500',
        activeBg: 'bg-blue-500',
        gradient: 'from-blue-600 to-blue-500',
    },
    A: {
        label: 'A석',
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        border: 'border-green-500',
        activeBg: 'bg-green-500',
        gradient: 'from-green-600 to-green-500',
    },
};

// 블록당 열 수 설정
const ROWS_PER_BLOCK = 5;

export default function LargeVenueSeatMap({
    seatStatuses = [],
    selectedSeats = [],
    onSeatClick,
    isReserving = false,
    statistics = {},
}) {
    // 선택 상태: section → block → seats
    const [activeSection, setActiveSection] = useState(null);
    const [activeBlock, setActiveBlock] = useState(null);
    const [blinkingSeat, setBlinkingSeat] = useState(null);

    const sectionOrder = ['VIP', 'R', 'S', 'A'];

    // 좌석 데이터를 섹션 > 블록 > 열 > 좌석 구조로 그룹핑
    const sectionData = useMemo(() => {
        const data = {};

        seatStatuses.forEach((seat) => {
            const row = seat.seatRow; // "01"
            const num = seat.seatNumber; // 1
            const grade = seat.grade;

            if (!data[grade]) {
                data[grade] = {
                    rows: {},
                    blocks: {},
                    totalSeats: 0,
                    availableSeats: 0,
                    price: seat.price,
                    rowList: [],
                };
            }

            if (!data[grade].rows[row]) {
                data[grade].rows[row] = [];
                data[grade].rowList.push(row);
            }

            data[grade].rows[row].push({ ...seat, num, row });
            data[grade].totalSeats++;
            if (seat.status === 'AVAILABLE') {
                data[grade].availableSeats++;
            }
        });

        // 블록 생성 (열을 ROWS_PER_BLOCK개씩 그룹화)
        Object.keys(data).forEach((grade) => {
            const sortedRows = sortRows(data[grade].rowList);
            const blocks = {};

            sortedRows.forEach((row, index) => {
                const blockIndex = Math.floor(index / ROWS_PER_BLOCK);
                const blockName = `블록 ${blockIndex + 1}`;

                if (!blocks[blockName]) {
                    blocks[blockName] = {
                        rows: [],
                        totalSeats: 0,
                        availableSeats: 0,
                        rowRange: { start: row, end: row },
                    };
                }

                blocks[blockName].rows.push(row);
                blocks[blockName].rowRange.end = row;
                blocks[blockName].totalSeats += data[grade].rows[row].length;
                blocks[blockName].availableSeats += data[grade].rows[row]
                    .filter((s) => s.status === 'AVAILABLE').length;
            });

            data[section].blocks = blocks;
        });

        return data;
    }, [seatStatuses]);

    // 첫 번째 사용 가능한 섹션을 기본 선택
    useEffect(() => {
        if (!activeSection) {
            const firstSection = sectionOrder.find((s) => sectionData[s]);
            if (firstSection) setActiveSection(firstSection);
        }
    }, [sectionData, activeSection]);

    // 섹션 변경 시 블록 초기화
    useEffect(() => {
        setActiveBlock(null);
    }, [activeSection]);

    const selectedSeatIds = new Set(selectedSeats.map((s) => s.seatId));

    const handleSeatClick = (seat) => {
        if (seat.status !== 'AVAILABLE' && !selectedSeatIds.has(seat.seatId)) return;
        if (onSeatClick) {
            setBlinkingSeat(seat.seatId);
            onSeatClick(seat);
        }
    };

    useEffect(() => {
        if (!isReserving && blinkingSeat) {
            const timer = setTimeout(() => setBlinkingSeat(null), 300);
            return () => clearTimeout(timer);
        }
    }, [isReserving, blinkingSeat]);

    const currentSectionData = activeSection ? sectionData[activeSection] : null;
    const currentBlockData = activeBlock && currentSectionData
        ? currentSectionData.blocks[activeBlock]
        : null;

    // 뒤로가기 핸들러
    const handleBack = () => {
        if (activeBlock) {
            setActiveBlock(null);
        }
    };

    return (
        <div className="bg-[#22222C] p-4 sm:p-6 rounded-lg">
            {/* 스테이지 */}
            <div className="bg-gradient-to-b from-gray-600 to-gray-700 w-3/4 mx-auto h-12 flex items-center justify-center rounded-t-full mb-4 shadow-lg">
                <span className="text-white font-bold tracking-widest">STAGE</span>
            </div>

            {/* 네비게이션 브레드크럼 */}
            <NavigationBreadcrumb
                activeSection={activeSection}
                activeBlock={activeBlock}
                onSectionClick={() => setActiveBlock(null)}
                onHomeClick={() => { setActiveSection(null); setActiveBlock(null); }}
                gradeStyles={gradeStyles}
            />

            {/* Step 1: 구역 선택 (항상 표시) */}
            <SectionSelector
                sectionData={sectionData}
                activeSection={activeSection}
                onSectionClick={setActiveSection}
                sectionOrder={sectionOrder}
                gradeStyles={gradeStyles}
            />

            {/* Step 2: 블록 선택 (구역 선택 후) */}
            {activeSection && !activeBlock && currentSectionData && (
                <BlockSelector
                    sectionName={activeSection}
                    blocks={currentSectionData.blocks}
                    onBlockClick={setActiveBlock}
                    gradeStyles={gradeStyles}
                    price={currentSectionData.price}
                />
            )}

            {/* Step 3: 좌석 선택 (블록 선택 후) */}
            {activeBlock && currentBlockData && currentSectionData && (
                <SeatGrid
                    sectionName={activeSection}
                    blockName={activeBlock}
                    blockData={currentBlockData}
                    rowsData={currentSectionData.rows}
                    selectedSeatIds={selectedSeatIds}
                    blinkingSeat={blinkingSeat}
                    onSeatClick={handleSeatClick}
                    onBack={handleBack}
                    gradeStyles={gradeStyles}
                    price={currentSectionData.price}
                />
            )}
        </div>
    );
}

// 열 정렬 함수
function sortRows(rows) {
    return [...rows].sort((a, b) => {
        const aNum = parseInt(a, 10);
        const bNum = parseInt(b, 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.localeCompare(b);
    });
}

/**
 * 네비게이션 브레드크럼
 */
function NavigationBreadcrumb({ activeSection, activeBlock, onSectionClick, onHomeClick, gradeStyles }) {
    return (
        <div className="flex items-center gap-2 mb-4 text-sm">
            <button
                onClick={onHomeClick}
                className="text-gray-400 hover:text-white transition-colors"
            >
                전체
            </button>

            {activeSection && (
                <>
                    <span className="text-gray-600">/</span>
                    <button
                        onClick={onSectionClick}
                        className={`${gradeStyles[activeSection]?.color} hover:opacity-80 transition-opacity`}
                    >
                        {gradeStyles[activeSection]?.label}
                    </button>
                </>
            )}

            {activeBlock && (
                <>
                    <span className="text-gray-600">/</span>
                    <span className="text-white">{activeBlock}</span>
                </>
            )}
        </div>
    );
}

/**
 * 구역 선택 컴포넌트
 */
function SectionSelector({ sectionData, activeSection, onSectionClick, sectionOrder, gradeStyles }) {
    return (
        <div className="mb-6">
            {/* 구역 미니맵 */}
            <div className="flex justify-center mb-4">
                <div className="relative w-80 h-32">
                    {/* 스테이지 */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-3 bg-gray-600 rounded-t-full" />

                    {/* 구역 블록들 */}
                    <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-1">
                        {sectionOrder
                            .filter((section) => sectionData[section])
                            .map((section, index) => {
                                const style = gradeStyles[section];
                                const isActive = activeSection === section;
                                const data = sectionData[section];
                                const availabilityRate = data.totalSeats > 0
                                    ? (data.availableSeats / data.totalSeats) * 100
                                    : 0;
                                const width = 100 + index * 40;

                                return (
                                    <button
                                        key={section}
                                        onClick={() => onSectionClick(section)}
                                        className={`
                                            h-5 rounded transition-all cursor-pointer flex items-center justify-center
                                            border ${style.border}
                                            ${isActive
                                                ? `${style.activeBg} opacity-100 scale-105`
                                                : `${style.bg} opacity-70 hover:opacity-90`
                                            }
                                        `}
                                        style={{ width: `${width}px` }}
                                    >
                                        <span className="text-[10px] text-white font-medium">
                                            {section} ({availabilityRate.toFixed(0)}%)
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* 구역 버튼 */}
            <div className="flex justify-center gap-2 flex-wrap">
                {sectionOrder
                    .filter((section) => sectionData[section])
                    .map((section) => {
                        const style = gradeStyles[section];
                        const isActive = activeSection === section;
                        const data = sectionData[section];

                        return (
                            <button
                                key={section}
                                onClick={() => onSectionClick(section)}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition-all
                                    border ${style.border}
                                    ${isActive
                                        ? `${style.activeBg} text-white shadow-lg`
                                        : `${style.bg} ${style.color} hover:opacity-80`
                                    }
                                `}
                            >
                                <div className="text-sm font-bold">{style.label}</div>
                                <div className="text-xs opacity-80">
                                    {data.availableSeats.toLocaleString()}/{data.totalSeats.toLocaleString()}석
                                </div>
                            </button>
                        );
                    })}
            </div>
        </div>
    );
}

/**
 * 블록 선택 컴포넌트
 */
function BlockSelector({ sectionName, blocks, onBlockClick, gradeStyles, price }) {
    const style = gradeStyles[sectionName];
    const blockNames = Object.keys(blocks).sort((a, b) => {
        const aNum = parseInt(a.match(/\d+/)?.[0] || 0, 10);
        const bNum = parseInt(b.match(/\d+/)?.[0] || 0, 10);
        return aNum - bNum;
    });

    return (
        <div className="bg-[#1a1a24] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                <div>
                    <span className={`font-bold text-lg ${style.color}`}>
                        {style.label}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                        블록을 선택하세요
                    </span>
                </div>
                <div className="text-white font-bold">
                    {price?.toLocaleString()}원
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {blockNames.map((blockName) => {
                    const block = blocks[blockName];
                    const availabilityRate = block.totalSeats > 0
                        ? (block.availableSeats / block.totalSeats) * 100
                        : 0;

                    return (
                        <button
                            key={blockName}
                            onClick={() => onBlockClick(blockName)}
                            className={`
                                p-3 rounded-lg border ${style.border} ${style.bg}
                                hover:opacity-80 transition-all
                                flex flex-col items-center
                            `}
                        >
                            <span className={`font-bold ${style.color}`}>{blockName}</span>
                            <span className="text-gray-400 text-xs">
                                {block.rowRange.start}~{block.rowRange.end}열
                            </span>
                            <span className="text-white text-sm mt-1">
                                {block.availableSeats}/{block.totalSeats}석
                            </span>
                            {/* 가용률 바 */}
                            <div className="w-full h-1 bg-gray-700 rounded-full mt-2">
                                <div
                                    className={`h-full rounded-full ${
                                        availabilityRate > 50 ? 'bg-green-500' :
                                        availabilityRate > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${availabilityRate}%` }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * 좌석 그리드 컴포넌트
 */
function SeatGrid({
    sectionName,
    blockName,
    blockData,
    rowsData,
    selectedSeatIds,
    blinkingSeat,
    onSeatClick,
    onBack,
    gradeStyles,
    price,
}) {
    const style = gradeStyles[sectionName];

    return (
        <div className="bg-[#1a1a24] rounded-lg p-4">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <span className={`font-bold text-lg ${style.color}`}>
                            {style.label} - {blockName}
                        </span>
                        <span className="text-gray-400 text-sm ml-2">
                            ({blockData.rowRange.start}~{blockData.rowRange.end}열)
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-white font-bold">{price?.toLocaleString()}원</div>
                    <div className="text-gray-400 text-xs">
                        {blockData.availableSeats}석 예매 가능
                    </div>
                </div>
            </div>

            {/* 좌석 그리드 */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {sortRows(blockData.rows).map((rowName) => (
                    <div key={rowName} className="flex items-center gap-2">
                        <span className="w-10 text-gray-400 text-xs text-right flex-shrink-0">
                            {rowName}열
                        </span>

                        <div className="flex-grow flex justify-center gap-1 flex-wrap">
                            {rowsData[rowName]
                                ?.sort((a, b) => a.num - b.num)
                                .map((seat) => (
                                    <button
                                        key={seat.seatId}
                                        disabled={seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE'}
                                        className={`
                                            w-6 h-6 sm:w-7 sm:h-7
                                            flex items-center justify-center
                                            text-[9px] sm:text-[10px] font-bold text-white
                                            rounded transition-all duration-150
                                            ${getSeatStatusClass(seat.status, selectedSeatIds.has(seat.seatId))}
                                            ${blinkingSeat === seat.seatId ? 'animate-pulse scale-110' : ''}
                                            ${seat.status === 'AVAILABLE' ? 'hover:scale-110 active:scale-95' : ''}
                                        `}
                                        onClick={() => onSeatClick(seat)}
                                        title={`${seat.seatInfo} - ${seat.price?.toLocaleString()}원`}
                                    >
                                        {seat.num}
                                    </button>
                                ))}
                        </div>

                        <span className="w-10 text-gray-400 text-xs text-left flex-shrink-0">
                            {rowName}열
                        </span>
                    </div>
                ))}
            </div>

            {/* 스크롤바 스타일 */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1a1a24;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4a4a5a;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #5a5a6a;
                }
            `}</style>
        </div>
    );
}