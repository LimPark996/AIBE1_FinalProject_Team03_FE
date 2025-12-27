// src/features/booking/components/LargeVenueSeatMap.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { concertService } from '../../concert/services/concertService';

// 좌석 상태에 따른 스타일 클래스
const getSeatStatusClass = (isAvailable, isSelected) => {
    if (isSelected) {
        return 'bg-[#6B8EFE] ring-2 ring-white cursor-pointer';
    }
    if (isAvailable) {
        return 'bg-[#22C55E] hover:bg-green-400 cursor-pointer';
    }
    return 'bg-red-500 cursor-not-allowed';
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

export default function LargeVenueSeatMap({
    concertId,
    gradeInfo = [],
    selectedSeats = [],
    onSeatClick,
    isReserving = false,
    refreshTrigger,
}) {
    // 3단계 선택 상태
    const [activeGrade, setActiveGrade] = useState(null);
    const [activeSection, setActiveSection] = useState(null);

    // 데이터 상태
    const [gradeSections, setGradeSections] = useState([]);  // 해당 등급의 구역 목록
    const [sectionSeats, setSectionSeats] = useState([]);    // 해당 구역의 좌석 목록
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [blinkingSeat, setBlinkingSeat] = useState(null);

    const gradeOrder = ['VIP', 'R', 'S', 'A'];

    // 1단계: 등급 선택 시 → 해당 등급의 구역 목록 로드
    useEffect(() => {
        if (!activeGrade || !concertId) return;

        const loadGradeSections = async () => {
            setLoading(true);
            setError(null);
            setActiveSection(null);
            setSectionSeats([]);

            try {
                const sections = await concertService.getSectionCounts(concertId, activeGrade);
                setGradeSections(sections);

            } catch (err) {
                console.error('등급별 구역 로드 실패:', err);
                setError('구역 정보를 불러올 수 없습니다.');
                setGradeSections([]);
            } finally {
                setLoading(false);
            }
        };

        loadGradeSections();
    }, [activeGrade, concertId]);

    // 2단계: 구역 선택 시 → 해당 등급+구역의 좌석 로드
    useEffect(() => {
        if (!activeGrade || !activeSection || !concertId) return;

        const loadSectionSeats = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await concertService.getSeatsByGradeAndSection(
                    concertId,
                    activeGrade,
                    activeSection
                );
                setSectionSeats(data.seats || []);
            } catch (err) {
                console.error('구역별 좌석 로드 실패:', err);
                setError('좌석 정보를 불러올 수 없습니다.');
                setSectionSeats([]);
            } finally {
                setLoading(false);
            }
        };

        loadSectionSeats();
    }, [activeGrade, activeSection, concertId,refreshTrigger]);

    // 첫 번째 등급 자동 선택
    useEffect(() => {
        if (!activeGrade && gradeInfo.length > 0) {
            const firstGrade = gradeOrder.find(g =>
                gradeInfo.some(info => info.grade === g)
            );
            if (firstGrade) setActiveGrade(firstGrade);
        }
    }, [gradeInfo, activeGrade]);

    // 좌석을 열별로 그룹핑
    const seatsByRow = useMemo(() => {
        const grouped = {};
        sectionSeats.forEach(seat => {
            const row = seat.seatRow;
            if (!grouped[row]) grouped[row] = [];
            grouped[row].push(seat);
        });
        return grouped;
    }, [sectionSeats]);

    const sortedRows = Object.keys(seatsByRow).sort((a, b) => {
        const aNum = parseInt(a, 10);
        const bNum = parseInt(b, 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.localeCompare(b);
    });

    const selectedSeatIds = new Set(selectedSeats.map((s) => s.seatId));

    const handleSeatClick = (seat) => {
        if (!seat.isAvailable && !selectedSeatIds.has(seat.seatId)) return;
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

    const handleBack = () => {
        if (activeSection) {
            setActiveSection(null);
            setSectionSeats([]);
        }
    };

    const currentGradeInfo = gradeInfo.find(g => g.grade === activeGrade);
    const currentStyle = gradeStyles[activeGrade] || gradeStyles.A;

    return (
        <div className="bg-[#22222C] p-4 sm:p-6 rounded-lg">
            {/* 스테이지 */}
            <div className="bg-gradient-to-b from-gray-600 to-gray-700 w-3/4 mx-auto h-12 flex items-center justify-center rounded-t-full mb-4 shadow-lg">
                <span className="text-white font-bold tracking-widest">STAGE</span>
            </div>

            {/* 네비게이션 브레드크럼 */}
            <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-gray-400">전체</span>
                {activeGrade && (
                    <>
                        <span className="text-gray-600">/</span>
                        <button
                            onClick={() => { setActiveSection(null); setSectionSeats([]); }}
                            className={`${currentStyle.color} hover:opacity-80`}
                        >
                            {currentStyle.label}
                        </button>
                    </>
                )}
                {activeSection && (
                    <>
                        <span className="text-gray-600">/</span>
                        <span className="text-white">{activeSection}구역</span>
                    </>
                )}
            </div>

            {/* Step 1: 등급 탭 */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {gradeOrder
                    .filter(grade => gradeInfo.some(g => g.grade === grade))
                    .map((grade) => {
                        const info = gradeInfo.find(g => g.grade === grade);
                        const style = gradeStyles[grade];
                        const isActive = activeGrade === grade;

                        return (
                            <button
                                key={grade}
                                onClick={() => setActiveGrade(grade)}
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
                                    {info?.price?.toLocaleString()}원
                                </div>
                            </button>
                        );
                    })}
            </div>

            {/* 로딩 */}
            {loading && (
                <div className="text-center py-10 text-gray-400">
                    <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin mb-2" />
                    <div>불러오는 중...</div>
                </div>
            )}

            {/* 에러 */}
            {error && !loading && (
                <div className="text-center py-10 text-red-400">{error}</div>
            )}

            {/* Step 2: 구역 선택 (등급 선택 후, 구역 미선택) */}
            {!loading && !error && activeGrade && !activeSection && gradeSections.length > 0 && (
                <div className="bg-[#1a1a24] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                        <div>
                            <span className={`font-bold text-lg ${currentStyle.color}`}>
                                {currentStyle.label}
                            </span>
                            <span className="text-gray-400 text-sm ml-2">
                                구역을 선택하세요
                            </span>
                        </div>
                        <div className="text-white font-bold">
                            {currentGradeInfo?.price?.toLocaleString()}원
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {gradeSections.map((section) => {
                            const availabilityRate = section.totalSeats > 0
                                ? (section.availableSeats / section.totalSeats) * 100
                                : 0;

                            return (
                                <button
                                    key={section.name}
                                    onClick={() => setActiveSection(section.name)}
                                    className={`
                                        p-3 rounded-lg border ${currentStyle.border} ${currentStyle.bg}
                                        hover:opacity-80 transition-all
                                        flex flex-col items-center
                                    `}
                                >
                                    <span className={`font-bold ${currentStyle.color}`}>
                                        {section.section}구역
                                    </span>
                                    <span className="text-white text-sm mt-1">
                                        {section.availableSeats}/{section.totalSeats}석
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
            )}

            {/* Step 3: 좌석 선택 (구역 선택 후) */}
            {!loading && !error && activeSection && sectionSeats.length > 0 && (
                <div className="bg-[#1a1a24] rounded-lg p-4">
                    {/* 헤더 */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <span className={`font-bold text-lg ${currentStyle.color}`}>
                                    {currentStyle.label} - {activeSection}구역
                                </span>
                                <span className="text-gray-400 text-sm ml-2">
                                    ({sectionSeats.filter(s => s.isAvailable).length}석 예매 가능)
                                </span>
                            </div>
                        </div>
                        <div className="text-white font-bold">
                            {currentGradeInfo?.price?.toLocaleString()}원
                        </div>
                    </div>

                    {/* 좌석 그리드 */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {sortedRows.map((rowName) => (
                            <div key={rowName} className="flex items-center gap-2">
                                <span className="w-10 text-gray-400 text-xs text-right flex-shrink-0">
                                    {rowName}열
                                </span>

                                <div className="flex-grow flex justify-center gap-1 flex-wrap">
                                    {seatsByRow[rowName]
                                        .sort((a, b) => a.seatNumber - b.seatNumber)
                                        .map((seat) => (
                                            <button
                                                key={seat.seatId}
                                                disabled={!seat.isAvailable && !selectedSeatIds.has(seat.seatId)}
                                                className={`
                                                    w-6 h-6 sm:w-7 sm:h-7
                                                    flex items-center justify-center
                                                    text-[9px] sm:text-[10px] font-bold text-white
                                                    rounded transition-all duration-150
                                                    ${getSeatStatusClass(seat.isAvailable, selectedSeatIds.has(seat.seatId))}
                                                    ${blinkingSeat === seat.seatId ? 'animate-pulse scale-110' : ''}
                                                    ${seat.isAvailable ? 'hover:scale-110 active:scale-95' : ''}
                                                `}
                                                onClick={() => handleSeatClick(seat)}
                                                title={`${seat.seatLabel} - ${currentGradeInfo?.price?.toLocaleString()}원`}
                                            >
                                                {seat.seatNumber}
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

            {/* 데이터 없음 */}
            {!loading && !error && activeGrade && !activeSection && gradeSections.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    해당 등급에 구역이 없습니다.
                </div>
            )}

            {!loading && !error && activeSection && sectionSeats.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    해당 구역에 좌석이 없습니다.
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