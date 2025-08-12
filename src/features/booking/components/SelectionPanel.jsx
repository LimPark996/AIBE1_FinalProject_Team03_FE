// src/features/booking/components/SelectionPanel.jsx
import { X, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchSelectedSeatPrices } from '../services/seatPriceAPI';

const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function SelectionPanel({
    selectedSeats = [],
    concertId,
    timer,
    onClear,
    onRemove,
    onCheckout,
}) {
    const [seatPrices, setSeatPrices] = useState({});
    const [error, setError] = useState(null);

    const SERVICE_FEE = 2000; // 고정 수수료

    // 좌석이 선택될 때마다 가격 정보를 가져옵니다
    useEffect(() => {
        if (selectedSeats.length === 0) {
            setSeatPrices({});
            return;
        }

        const fetchPrices = async () => {
            setError(null);

            try {
                const seatIds = selectedSeats.map(seat => seat.seatId);
                const response = await fetchSelectedSeatPrices(concertId, seatIds);

                // seatId를 키로 하는 객체로 변환
                const priceMap = {};
                response.forEach(seatPrice => {
                    priceMap[seatPrice.concertSeatId] = {
                        price: seatPrice.price,
                        seatInfo: seatPrice.seatInfo
                    };
                });
                setSeatPrices(priceMap);

            } catch (err) {
                console.error('좌석 가격 조회 오류:', err);
                setError('가격 정보를 불러올 수 없습니다.');

                // 에러 발생 시 기본값 설정 (기존 하드코딩 값 사용)
                const defaultPriceMap = {};
                selectedSeats.forEach(seat => {
                    defaultPriceMap[seat.seatId] = {
                        price: 50000, // 기본값
                        seatInfo: seat.seatInfo
                    };
                });
                setSeatPrices(defaultPriceMap);
            }
        };

        fetchPrices();
    }, [selectedSeats, concertId]);

    // 총액 계산
    const subtotal = selectedSeats.reduce((sum, seat) => {
        const priceInfo = seatPrices[seat.seatId];
        return sum + (priceInfo ? Number(priceInfo.price) : 0);
    }, 0);

    const total = subtotal + SERVICE_FEE;

    return (
        <div className="bg-[#1A202C] rounded-2xl p-6 sticky top-8 flex flex-col gap-6">
            {/* 1. 선택 좌석 정보 */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-gray-200">
                    선택한 좌석
                </h2>
                {selectedSeats.length > 0 ? (
                    <>
                        {/* 선택된 좌석 목록 */}
                        <div className="border-t border-gray-700 pt-4 mt-2 space-y-3">
                            {selectedSeats.map((seat) => {
                                const priceInfo = seatPrices[seat.seatId];
                                return (
                                    <div
                                        key={seat.seatId}
                                        className="flex justify-between items-center animate-fade-in"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-gray-300 text-sm">
                                                {seat.seatInfo}
                                            </span>
                                            {priceInfo && (
                                                <span className="text-blue-400 text-xs">
                                                    {Number(priceInfo.price).toLocaleString()}원
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onRemove(seat.seatId)}
                                            className="text-gray-500 hover:text-white"
                                            aria-label={`${seat.seatInfo} 좌석 선택 취소`}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={onClear}
                            className="text-sm text-[#6B8EFE] hover:underline mt-2"
                        >
                            전체 선택 취소
                        </button>
                    </>
                ) : (
                    <p className="text-gray-400 text-sm pt-4 mt-2 border-t border-gray-700">
                        선택 가능한 좌석을 클릭하세요.
                    </p>
                )}
            </div>

            {/* 2. 가격 정보 */}
            <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-200">
                    가격 정보
                </h2>
                {error && (
                    <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded">
                        {error}
                    </div>
                )}
                <div className="text-sm space-y-2 text-gray-300">
                    <div className="flex justify-between">
                        <span>티켓 가격:</span>
                        <span className="text-white">
                            {subtotal.toLocaleString()}원
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>예매 수수료:</span>
                        <span className="text-white">
                            {SERVICE_FEE.toLocaleString()}원
                        </span>
                    </div>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">
                        총 결제 금액:
                    </span>
                    <span className="font-bold text-2xl text-[#6B8EFE]">
                        {total.toLocaleString()}원
                    </span>
                </div>
            </div>

            {/* 3. 구매 버튼 및 타이머 */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-yellow-400">
                        <Clock size={16} />
                        <span className="font-mono">{formatTime(timer)}</span>
                    </div>
                    <span className="text-gray-400">결제 남은 시간</span>
                </div>
                <button
                    onClick={onCheckout}
                    disabled={selectedSeats.length === 0}
                    className="w-full bg-[#6B8EFE] text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    결제하기
                </button>
            </div>
        </div>
    );
}