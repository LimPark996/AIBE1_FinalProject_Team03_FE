// src/features/booking/components/SeatMap.jsx

import React from 'react';
import LargeVenueSeatMap from './LargeVenueSeatMap';
import MediumVenueSeatMap from './MediumVenueSeatMap';
import SmallVenueSeatMap from './SmallVenueSeatMap';

/**
 * 공연장 규모에 따라 적절한 좌석 맵 컴포넌트를 렌더링하는 메인 컴포넌트
 *
 * @param {Object} props
 * @param {Array} props.seatStatuses - 좌석 상태 배열 [{seatId, seatInfo, status, price, grade}, ...]
 * @param {Array} props.selectedSeats - 선택된 좌석 배열
 * @param {Function} props.onSeatClick - 좌석 클릭 핸들러
 * @param {boolean} props.isReserving - 예약 진행 중 여부
 * @param {Object} props.venueInfo - 공연장 정보 {venueId, venueName, capacity, capacityType}
 * @param {Object} props.statistics - 좌석 통계 {totalSeats, availableSeats, bookedSeats, ...}
 */
export default function SeatMap({
    seatStatuses = [],
    selectedSeats = [],
    onSeatClick,
    isReserving = false,
    venueInfo = {},
    statistics = {},
}) {
    // 공연장 규모 결정 (capacityType 또는 totalSeats 기반)
    const getVenueSize = () => {
        // capacityType이 있으면 우선 사용
        if (venueInfo.capacityType) {
            return venueInfo.capacityType; // 'LARGE', 'MEDIUM', 'SMALL'
        }

        // 없으면 좌석 수로 판단
        const totalSeats = statistics.totalSeats || seatStatuses.length;

        if (totalSeats >= 15000) return 'LARGE';
        if (totalSeats >= 1500) return 'MEDIUM';
        return 'SMALL';
    };

    const venueSize = getVenueSize();

    // 공통 props
    const commonProps = {
        seatStatuses,
        selectedSeats,
        onSeatClick,
        isReserving,
        venueInfo,
        statistics,
    };

    // 규모별 컴포넌트 렌더링
    const renderSeatMap = () => {
        switch (venueSize) {
            case 'LARGE':
                return <LargeVenueSeatMap {...commonProps} />;
            case 'MEDIUM':
                return <MediumVenueSeatMap {...commonProps} />;
            case 'SMALL':
            default:
                return <SmallVenueSeatMap {...commonProps} />;
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
                            venueSize === 'LARGE' ? 'bg-purple-600 text-white' :
                            venueSize === 'MEDIUM' ? 'bg-blue-600 text-white' :
                            'bg-green-600 text-white'
                        }`}>
                            {venueSize === 'LARGE' ? '대형 공연장' :
                             venueSize === 'MEDIUM' ? '중형 공연장' : '소형 공연장'}
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

/**
 * 좌석 상태 범례 컴포넌트
 */
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