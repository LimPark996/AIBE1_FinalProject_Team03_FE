// src/features/booking/components/SmallVenueSeatMap.jsx

import React, { useState, useEffect } from 'react';

/**
 * 소형 공연장용 좌석 맵 (600~1,500석)
 * 전체 좌석을 한 화면에 표시
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

// 등급별 색상
const getGradeColor = (grade) => {
    switch (grade) {
        case 0:
        case 'VIP':
            return 'border-yellow-400';
        case 1:
        case 'R':
            return 'border-purple-400';
        case 2:
        case 'S':
            return 'border-blue-400';
        case 3:
        case 'A':
            return 'border-green-400';
        default:
            return 'border-gray-400';
    }
};

export default function SmallVenueSeatMap({
    seatStatuses = [],
    selectedSeats = [],
    onSeatClick,
    isReserving = false,
}) {
    const [blinkingSeat, setBlinkingSeat] = useState(null);

    const sectionOrder = ['VIP', 'R', 'S', 'A'];

    // 좌석 데이터를 섹션 > 열 > 좌석 구조로 그룹핑
    const sections = seatStatuses.reduce((acc, seat) => {
        const [section, row, numStr] = seat.seatInfo.split('-');
        const num = parseInt(numStr, 10);
        if (!acc[section]) acc[section] = {};
        if (!acc[section][row]) acc[section][row] = [];
        acc[section][row].push({ ...seat, num, section, row });
        return acc;
    }, {});

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

    // 열 정렬 함수 (A, B, C, ... 또는 1, 2, 3, ...)
    const sortRows = (rows) => {
        return Object.keys(rows).sort((a, b) => {
            const aNum = parseInt(a, 10);
            const bNum = parseInt(b, 10);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return a.localeCompare(b);
        });
    };

    return (
        <div className="bg-[#22222C] p-4 sm:p-6 rounded-lg">
            {/* 스테이지 */}
            <div className="bg-gradient-to-b from-gray-600 to-gray-700 w-4/5 mx-auto h-14 flex items-center justify-center rounded-t-full mb-8 shadow-lg">
                <span className="text-white font-bold text-lg tracking-widest">STAGE</span>
            </div>

            {/* 섹션별 좌석 */}
            <div className="space-y-8">
                {sectionOrder
                    .filter((sectionName) => sections[sectionName])
                    .map((sectionName) => (
                        <div key={sectionName} className="relative">
                            {/* 섹션 헤더 */}
                            <div className="flex items-center justify-center mb-4">
                                <div className={`px-4 py-1 rounded-full text-sm font-bold ${
                                    sectionName === 'VIP' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500' :
                                    sectionName === 'R' ? 'bg-purple-500/20 text-purple-400 border border-purple-500' :
                                    sectionName === 'S' ? 'bg-blue-500/20 text-blue-400 border border-blue-500' :
                                    'bg-green-500/20 text-green-400 border border-green-500'
                                }`}>
                                    {sectionName} 구역
                                </div>
                            </div>

                            {/* 열별 좌석 */}
                            <div className="space-y-2">
                                {sortRows(sections[sectionName]).map((rowName) => (
                                    <div key={rowName} className="flex items-center gap-2">
                                        {/* 열 라벨 */}
                                        <span className="w-8 text-gray-400 text-xs text-right flex-shrink-0">
                                            {rowName}열
                                        </span>

                                        {/* 좌석들 */}
                                        <div className="flex-grow flex justify-center gap-1 flex-wrap">
                                            {sections[sectionName][rowName]
                                                .sort((a, b) => a.num - b.num)
                                                .map((seat) => (
                                                    <button
                                                        key={seat.seatId}
                                                        disabled={seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE'}
                                                        className={`
                                                            w-7 h-7 sm:w-8 sm:h-8
                                                            flex items-center justify-center
                                                            text-[10px] sm:text-xs font-bold text-white
                                                            rounded-md transition-all duration-150
                                                            border-b-2 ${getGradeColor(seat.grade)}
                                                            ${getSeatStatusClass(seat.status, selectedSeatIds.has(seat.seatId))}
                                                            ${blinkingSeat === seat.seatId ? 'animate-pulse scale-110' : ''}
                                                            ${seat.status === 'AVAILABLE' ? 'hover:scale-105 active:scale-95' : ''}
                                                        `}
                                                        onClick={() => handleSeatClick(seat)}
                                                        title={`${seat.seatInfo} - ${seat.price?.toLocaleString()}원`}
                                                    >
                                                        {seat.num}
                                                    </button>
                                                ))}
                                        </div>

                                        {/* 오른쪽 열 라벨 */}
                                        <span className="w-8 text-gray-400 text-xs text-left flex-shrink-0">
                                            {rowName}열
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>

            {/* 등급별 가격 정보 */}
            <GradePriceInfo seatStatuses={seatStatuses} />
        </div>
    );
}

/**
 * 등급별 가격 정보 표시
 */
function GradePriceInfo({ seatStatuses }) {
    // 등급별 가격 추출
    const gradeInfo = seatStatuses.reduce((acc, seat) => {
        const [section] = seat.seatInfo.split('-');
        if (!acc[section]) {
            acc[section] = seat.price;
        }
        return acc;
    }, {});

    const gradeOrder = ['VIP', 'R', 'S', 'A'];
    const gradeLabels = {
        VIP: { label: 'VIP석', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        R: { label: 'R석', color: 'text-purple-400', bg: 'bg-purple-500/20' },
        S: { label: 'S석', color: 'text-blue-400', bg: 'bg-blue-500/20' },
        A: { label: 'A석', color: 'text-green-400', bg: 'bg-green-500/20' },
    };

    return (
        <div className="mt-8 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap justify-center gap-4">
                {gradeOrder
                    .filter((grade) => gradeInfo[grade] !== undefined)
                    .map((grade) => (
                        <div
                            key={grade}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${gradeLabels[grade].bg}`}
                        >
                            <span className={`font-medium ${gradeLabels[grade].color}`}>
                                {gradeLabels[grade].label}
                            </span>
                            <span className="text-white font-bold">
                                {gradeInfo[grade]?.toLocaleString()}원
                            </span>
                        </div>
                    ))}
            </div>
        </div>
    );
}