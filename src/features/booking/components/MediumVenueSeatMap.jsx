// src/features/booking/components/MediumVenueSeatMap.jsx

import React, { useState, useEffect, useMemo } from 'react';

/**
 * 중형 공연장용 좌석 맵 (1,500~15,000석)
 * 구역 탭으로 선택 후 해당 구역의 좌석을 표시
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
    },
    R: {
        label: 'R석',
        color: 'text-purple-400',
        bg: 'bg-purple-500/20',
        border: 'border-purple-500',
        activeBg: 'bg-purple-500',
    },
    S: {
        label: 'S석',
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500',
        activeBg: 'bg-blue-500',
    },
    A: {
        label: 'A석',
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        border: 'border-green-500',
        activeBg: 'bg-green-500',
    },
};

export default function MediumVenueSeatMap({
    seatStatuses = [],
    selectedSeats = [],
    onSeatClick,
    isReserving = false,
    statistics = {},
}) {
    const [activeSection, setActiveSection] = useState(null);
    const [blinkingSeat, setBlinkingSeat] = useState(null);

    const sectionOrder = ['VIP', 'R', 'S', 'A'];

    // 좌석 데이터를 섹션별로 그룹핑
    const sectionData = useMemo(() => {
        const data = {};

         seatStatuses.forEach((seat) => {
                const grade = seat.grade;  // "VIP", "R", "S", "A"
                const row = seat.seatRow;
                const num = seat.seatNumber;

            if (!data[grade]) {
                        data[grade] = {
                            rows: {},
                            totalSeats: 0,
                            availableSeats: 0,
                            price: seat.price,
                        };
                    }

                    if (!data[grade].rows[row]) {
                        data[grade].rows[row] = [];
                    }

                    data[grade].rows[row].push({ ...seat, num, row });
                    data[grade].totalSeats++;
                    if (seat.status === 'AVAILABLE') {
                        data[grade].availableSeats++;
                    }
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

    // 열 정렬 함수
    const sortRows = (rows) => {
        return Object.keys(rows).sort((a, b) => {
            const aNum = parseInt(a, 10);
            const bNum = parseInt(b, 10);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return a.localeCompare(b);
        });
    };

    const currentSectionData = activeSection ? sectionData[activeSection] : null;

    return (
        <div className="bg-[#22222C] p-4 sm:p-6 rounded-lg">
            {/* 스테이지 */}
            <div className="bg-gradient-to-b from-gray-600 to-gray-700 w-3/4 mx-auto h-12 flex items-center justify-center rounded-t-full mb-6 shadow-lg">
                <span className="text-white font-bold tracking-widest">STAGE</span>
            </div>

            {/* 구역 미니맵 */}
            <SectionMinimap
                sectionData={sectionData}
                activeSection={activeSection}
                onSectionClick={setActiveSection}
                sectionOrder={sectionOrder}
            />

            {/* 구역 탭 */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {sectionOrder
                    .filter((section) => sectionData[section])
                    .map((section) => {
                        const style = gradeStyles[section];
                        const isActive = activeSection === section;
                        const data = sectionData[section];

                        return (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition-all
                                    border ${style.border}
                                    ${isActive
                                        ? `${style.activeBg} text-white`
                                        : `${style.bg} ${style.color} hover:opacity-80`
                                    }
                                `}
                            >
                                <div className="text-sm font-bold">{style.label}</div>
                                <div className="text-xs opacity-80">
                                    {data.availableSeats}/{data.totalSeats}석
                                </div>
                            </button>
                        );
                    })}
            </div>

            {/* 선택된 구역의 좌석 표시 */}
            {currentSectionData && (
                <div className="bg-[#1a1a24] rounded-lg p-4">
                    {/* 구역 정보 헤더 */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                        <div>
                            <span className={`font-bold text-lg ${gradeStyles[activeSection]?.color}`}>
                                {gradeStyles[activeSection]?.label}
                            </span>
                            <span className="text-gray-400 text-sm ml-2">
                                ({currentSectionData.availableSeats}석 예매 가능)
                            </span>
                        </div>
                        <div className="text-white font-bold">
                            {currentSectionData.price?.toLocaleString()}원
                        </div>
                    </div>

                    {/* 좌석 그리드 */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {sortRows(currentSectionData.rows).map((rowName) => (
                            <div key={rowName} className="flex items-center gap-2">
                                <span className="w-10 text-gray-400 text-xs text-right flex-shrink-0">
                                    {rowName}열
                                </span>

                                <div className="flex-grow flex justify-center gap-1 flex-wrap">
                                    {currentSectionData.rows[rowName]
                                        .sort((a, b) => a.num - b.num)
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
                                                onClick={() => handleSeatClick(seat)}
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
                </div>
            )}

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

/**
 * 구역 미니맵 컴포넌트
 */
function SectionMinimap({ sectionData, activeSection, onSectionClick, sectionOrder }) {
    return (
        <div className="mb-6">
            <div className="flex justify-center">
                <div className="relative w-64 h-40">
                    {/* 스테이지 표시 */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-gray-600 rounded-t-full" />

                    {/* 구역 블록들 */}
                    <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-1">
                        {sectionOrder
                            .filter((section) => sectionData[section])
                            .map((section, index) => {
                                const style = gradeStyles[section];
                                const isActive = activeSection === section;
                                const data = sectionData[section];
                                const availabilityRate = data.totalSeats > 0
                                    ? (data.availableSeats / data.totalSeats) * 100
                                    : 0;

                                // 구역 크기 계산 (아래로 갈수록 커짐)
                                const width = 80 + index * 30;

                                return (
                                    <button
                                        key={section}
                                        onClick={() => onSectionClick(section)}
                                        className={`
                                            h-6 rounded transition-all cursor-pointer
                                            border-2 ${style.border}
                                            ${isActive
                                                ? `${style.activeBg} opacity-100`
                                                : `${style.bg} opacity-60 hover:opacity-80`
                                            }
                                        `}
                                        style={{ width: `${width}px` }}
                                        title={`${style.label}: ${data.availableSeats}/${data.totalSeats}석 (${availabilityRate.toFixed(0)}% 가능)`}
                                    >
                                        <span className="text-[10px] text-white font-bold">
                                            {section}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>
            <p className="text-center text-gray-500 text-xs mt-2">
                구역을 클릭하여 좌석을 선택하세요
            </p>
        </div>
    );
}