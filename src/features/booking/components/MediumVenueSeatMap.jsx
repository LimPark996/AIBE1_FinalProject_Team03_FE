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

export default function MediumVenueSeatMap({
    concertId,
    selectedSeats = [],
    onSeatClick,
    isReserving = false,
    gradeInfo = [],  // 등급별 가격 정보 [{grade, gradeName, price}, ...]
}) {
    const [activeGrade, setActiveGrade] = useState(null);
    const [gradeSeats, setGradeSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [blinkingSeat, setBlinkingSeat] = useState(null);

    const gradeOrder = ['VIP', 'R', 'S', 'A'];

    // 등급 선택 시 해당 등급 좌석 전체 로드
    useEffect(() => {
        if (!activeGrade || !concertId) return;

        const loadGradeSeats = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await concertService.getSeatsByGrade(concertId, activeGrade);
                setGradeSeats(data.seats || []);
            } catch (err) {
                console.error('등급별 좌석 로드 실패:', err);
                setError('좌석 정보를 불러올 수 없습니다.');
                setGradeSeats([]);
            } finally {
                setLoading(false);
            }
        };

        loadGradeSeats();
    }, [activeGrade, concertId]);

    // 첫 번째 등급 자동 선택
    useEffect(() => {
        if (!activeGrade && gradeInfo.length > 0) {
            const firstGrade = gradeOrder.find(g =>
                gradeInfo.some(info => info.grade === g)
            );
            if (firstGrade) setActiveGrade(firstGrade);
        }
    }, [gradeInfo, activeGrade]);

    // 좌석 데이터를 section > row 구조로 그룹핑
    const sectionData = useMemo(() => {
        const data = {};

        gradeSeats.forEach((seat) => {
            const section = seat.section;
            const row = seat.seatRow;

            if (!data[section]) {
                data[section] = {
                    rows: {},
                    totalSeats: 0,
                    availableSeats: 0,
                };
            }

            if (!data[section].rows[row]) {
                data[section].rows[row] = [];
            }

            data[section].rows[row].push(seat);
            data[section].totalSeats++;
            if (seat.isAvailable) {
                data[section].availableSeats++;
            }
        });

        return data;
    }, [gradeSeats]);

    // section 정렬
    const sortedSections = Object.keys(sectionData).sort();

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

    // 열 정렬 함수
    const sortRows = (rows) => {
        return Object.keys(rows).sort((a, b) => {
            const aNum = parseInt(a, 10);
            const bNum = parseInt(b, 10);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return a.localeCompare(b);
        });
    };

    const currentGradeInfo = gradeInfo.find(g => g.grade === activeGrade);
    const currentStyle = gradeStyles[activeGrade] || gradeStyles.A;

    return (
        <div className="bg-[#22222C] p-4 sm:p-6 rounded-lg">
            {/* 스테이지 */}
            <div className="bg-gradient-to-b from-gray-600 to-gray-700 w-3/4 mx-auto h-12 flex items-center justify-center rounded-t-full mb-6 shadow-lg">
                <span className="text-white font-bold tracking-widest">STAGE</span>
            </div>

            {/* 등급 탭 */}
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

            {/* 로딩/에러/좌석 표시 */}
            {loading ? (
                <div className="text-center py-10 text-gray-400">
                    <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin mb-2" />
                    <div>좌석 정보를 불러오는 중...</div>
                </div>
            ) : error ? (
                <div className="text-center py-10 text-red-400">{error}</div>
            ) : gradeSeats.length > 0 ? (
                <div className="space-y-6">
                    {/* 등급 정보 헤더 */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                        <div>
                            <span className={`font-bold text-lg ${currentStyle.color}`}>
                                {currentStyle.label}
                            </span>
                            <span className="text-gray-400 text-sm ml-2">
                                (총 {gradeSeats.length}석 / 예매가능 {gradeSeats.filter(s => s.isAvailable).length}석)
                            </span>
                        </div>
                        <div className="text-white font-bold">
                            {currentGradeInfo?.price?.toLocaleString()}원
                        </div>
                    </div>

                    {/* Section별 좌석 표시 */}
                    <div className="space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {sortedSections.map((sectionName) => (
                            <div key={sectionName} className="bg-[#1a1a24] rounded-lg p-4">
                                {/* Section 헤더 */}
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                                    <span className="text-white font-semibold">
                                        {sectionName}구역
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        {sectionData[sectionName].availableSeats}/{sectionData[sectionName].totalSeats}석
                                    </span>
                                </div>

                                {/* 열별 좌석 */}
                                <div className="space-y-2">
                                    {sortRows(sectionData[sectionName].rows).map((rowName) => (
                                        <div key={rowName} className="flex items-center gap-2">
                                            <span className="w-10 text-gray-400 text-xs text-right flex-shrink-0">
                                                {rowName}열
                                            </span>

                                            <div className="flex-grow flex justify-center gap-1 flex-wrap">
                                                {sectionData[sectionName].rows[rowName]
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
                        ))}
                    </div>
                </div>
            ) : activeGrade ? (
                <div className="text-center py-10 text-gray-400">
                    해당 등급에 좌석이 없습니다.
                </div>
            ) : (
                <div className="text-center py-10 text-gray-400">
                    등급을 선택해주세요
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