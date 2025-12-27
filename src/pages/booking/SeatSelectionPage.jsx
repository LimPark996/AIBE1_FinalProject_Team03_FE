// src/pages/booking/SeatSelectionPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { concertService } from '../../features/concert/services/concertService';
import { usePayment } from '../../features/booking/hooks/usePayment';
import { useSeatReservation } from '../../features/booking/hooks/useSeatReservation';
import ConcertInfoHeader from '../../features/booking/components/ConcertInfoHeader';
import SeatMap from '../../features/booking/components/SeatMap';
import SelectionPanel from '../../features/booking/components/SelectionPanel';
import LoadingSpinner from '../../shared/components/ui/LoadingSpinner';
import { useToast } from '../../shared/hooks/useToast.jsx';

export default function SeatSelectionPage() {
    const { concertId } = useParams();
    const [concertInfo, setConcertInfo] = useState(null);
    const [gradeInfo, setGradeInfo] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const { proceedToPayment, isProcessing, paymentError } = usePayment();
    const { showError, showInfo, showWarning } = useToast();

    // 1. 훅을 호출하여 좌석 관련 모든 상태와 함수를 가져옵니다.
    const {
        seatStatuses,
        selectedSeats,
        isReserving,
        error: reservationError, // 페이지 에러와 구분하기 위해 이름 변경
        timer,
        isPolling,
        refreshSeatStatuses,
        startPolling,
        stopPolling,
        handleSeatClick,
        handleRemoveSeat,
        handleClearSelection,
        clearError,
        refreshTrigger,
    } = useSeatReservation(concertId, {
        enablePolling: true,
        capacityType: concertInfo?.venueCapacityType
    });

    // 2. 페이지 최초 로드 시, 콘서트 정보와 좌석 정보를 모두 로드합니다.
    useEffect(() => {
        const loadPageData = async () => {
            setPageLoading(true);
            setPageError(null);
            try {
                const concertData =
                    await concertService.getConcertById(concertId);
                setConcertInfo(concertData.data);

                const grades = await concertService.getSeatGrades(concertId);
                                setGradeInfo(grades);

                const capacityType = concertData.data.venueCapacityType;
                            if (capacityType === 'SMALL') {
                                await refreshSeatStatuses();  // 전체 좌석 로드
                            }

                // 폴링 시스템 시작 (JWT 토큰 만료 시간 확인을 위해)
                try {
                    await startPolling();
                } catch (error) {
                    console.log('폴링 시스템 시작 실패:', error);
                }
            } catch (err) {
                setPageError(
                    err.message || '페이지 데이터를 불러오지 못했습니다.',
                );
            } finally {
                setPageLoading(false);
            }
        };
        loadPageData();
    }, [concertId, refreshSeatStatuses, startPolling]);

    // 3. 페이지 언마운트 시 폴링 정리
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    // 4. 좌석 예약 에러 처리
    useEffect(() => {
        if (reservationError) {
            let friendlyMessage = '좌석 선택 중 문제가 발생했습니다.';

            if (reservationError.includes('유저')) {
                showError(
                    '다른 유저가 선점 중인 좌석입니다. 다른 좌석을 선택해 주세요.',
                );
            } else if (reservationError.includes('최대 2개')) {
                showWarning('좌석은 최대 2개까지 선점할 수 있습니다.');
            } else if (reservationError.includes('만료')) {
                showError('선점 시간이 만료되었습니다. 다시 선택해주세요.');
            } else if (
                reservationError.includes('네트워크') ||
                reservationError.includes('연결')
            ) {
                showError('네트워크 연결을 확인하고 다시 시도해주세요.');
            } else if (reservationError.includes('서버')) {
                showError(
                    '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
                );
            } else {
                showError(friendlyMessage);
            }
            // 에러 메시지를 표시한 후 에러 상태 초기화
            clearError();
        }
    }, [reservationError, showError, showWarning, clearError]);

    const handleCheckout = async () => {
        // 결제 전 좌석 선점 상태 확인
        if (selectedSeats.length === 0) {
            alert('선택된 좌석이 없습니다.');
            return;
        }

        // 타이머 확인 - 선점 시간이 만료되었는지 체크
        if (timer <= 0) {
            alert('좌석 선점 시간이 만료되었습니다. 다시 선택해주세요.');
            handleClearSelection();
            return;
        }

        try {
            await proceedToPayment(concertId, selectedSeats);
            alert('결제가 성공적으로 완료되었습니다.');
            // 결제 성공 시 성공 페이지로 이동하는 로직 (필요 시)
        } catch (error) {
            // 결제 훅에서 에러가 발생하면, 여기서 좌석 복구 로직을 실행
            console.error('결제 실패:', error);
            if (error.message.includes('사용자가 결제를 취소했습니다.')) {
                showInfo('결제가 취소되었습니다.');
            } else {
                showError(`결제에 실패했습니다: ${error.message}`);
            }
            await refreshSeatStatuses();
        }
    };

    if (pageLoading)
        return <LoadingSpinner message="콘서트 정보를 불러오는 중..." />;
    if (pageError) {
        alert(
            `죄송합니다. ${pageError.includes('불러오') ? '콘서트 정보를 가져오는 중 문제가 발생했습니다.' : '서비스에 일시적인 문제가 발생했습니다.'} 잠시 후 다시 시도해주세요.`,
        );
        return <LoadingSpinner message="다시 시도하는 중..." />;
    }

    return (
        <div className="bg-[#111922] min-h-screen text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">
                <ConcertInfoHeader concertInfo={concertInfo} />

                <div className="mt-8 flex flex-col lg:flex-row gap-8">
                    <div className="flex-grow lg:w-2/3">
                        <SeatMap
                            concertId={concertId}
                            gradeInfo={gradeInfo}
                            capacityType={concertInfo?.venueCapacityType}
                            seatStatuses={seatStatuses}
                            selectedSeats={selectedSeats}
                            onSeatClick={handleSeatClick}
                            isReserving={isReserving}
                            refreshTrigger={refreshTrigger}
                        />
                    </div>
                    <div className="lg:w-1/3 lg:max-w-sm">
                        <SelectionPanel
                            selectedSeats={selectedSeats}
                            concertId={concertId}
                            timer={timer}
                            onClear={handleClearSelection}
                            onRemove={handleRemoveSeat}
                            onCheckout={handleCheckout}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
