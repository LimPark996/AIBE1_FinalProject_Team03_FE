// src/features/booking/components/SeatMap.jsx

import React from 'react';
import LargeVenueSeatMap from './LargeVenueSeatMap';
import MediumVenueSeatMap from './MediumVenueSeatMap';
import SmallVenueSeatMap from './SmallVenueSeatMap';

export default function SeatMap({
    concertId,
    gradeInfo = [],
    capacityType = 'SMALL',  // ← 직접 받음
    seatStatuses = [],
    selectedSeats = [],
    onSeatClick,
    isReserving = false,
    venueInfo = {},
    statistics = {},
}) {
    // 규모별 컴포넌트 렌더링
    const renderSeatMap = () => {
        switch (capacityType) {
            case 'LARGE':
                return (
                    <LargeVenueSeatMap
                        concertId={concertId}
                        gradeInfo={gradeInfo}
                        selectedSeats={selectedSeats}
                        onSeatClick={onSeatClick}
                        isReserving={isReserving}
                    />
                );
            case 'MEDIUM':
                return (
                    <MediumVenueSeatMap
                        concertId={concertId}
                        gradeInfo={gradeInfo}
                        selectedSeats={selectedSeats}
                        onSeatClick={onSeatClick}
                        isReserving={isReserving}
                    />
                );
            case 'SMALL':
            default:
                return (
                    <SmallVenueSeatMap
                        seatStatuses={seatStatuses}
                        selectedSeats={selectedSeats}
                        onSeatClick={onSeatClick}
                        isReserving={isReserving}
                    />
                );
        }
    };

    return (
        <div className="seat-map-container">
            {/* 공연장 정보 헤더 */}
            <div className="bg-[#1a1a24] p-4 rounded-t-lg border-b border-gray-700">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-white font-bold text-lg">
                            {venueInfo.venueName || '공연장'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            총 {(statistics.totalSeats || seatStatuses.length).toLocaleString()}석
                            {statistics.availableSeats !== undefined && (
                                <span className="ml-2 text-green-400">
                                    (예매 가능: {statistics.availableSeats.toLocaleString()}석)
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            capacityType === 'LARGE' ? 'bg-purple-600 text-white' :
                            capacityType === 'MEDIUM' ? 'bg-blue-600 text-white' :
                            'bg-green-600 text-white'
                        }`}>
                            {capacityType === 'LARGE' ? '대형 공연장' :
                             capacityType === 'MEDIUM' ? '중형 공연장' : '소형 공연장'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 좌석 맵 */}
            {renderSeatMap()}

            {/* 범례 */}
            <SeatLegend />
        </div>
    );
}

function SeatLegend() {
    const legendItems = [
        { color: 'bg-[#22C55E]', label: '선택 가능' },
        { color: 'bg-[#6B8EFE]', label: '선택됨' },
        { color: 'bg-red-500', label: '예매 완료' },
        { color: 'bg-gray-600', label: '선택 불가' },
    ];

    return (
        <div className="bg-[#1a1a24] p-4 rounded-b-lg border-t border-gray-700">
            <div className="flex flex-wrap justify-center gap-4">
                {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${item.color}`} />
                        <span className="text-gray-300 text-sm">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}