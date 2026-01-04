// src/features/booking/hooks/useSeatReservation.js

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    reserveSeat,
    releaseSeat,
    fetchAllSeatStatus,
    extendAccessKey,
    invalidateAccessKey,
} from '../services/bookingService';
import {
    getPollingInterval,
    isBackendPollingSupported,
    createStablePollingManager,
} from '../services/seatService';

export const useSeatReservation = (concertId, options = {}) => {
    const { enablePolling = true, capacityType = null } = options;

    // ===== 1단계: 상태 선언 =====
    const [seatStatuses, setSeatStatuses] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isReserving, setIsReserving] = useState(false);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isPolling, setIsPolling] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ===== 2단계: ref 선언 =====
    const selectedSeatsRef = useRef(selectedSeats);
    const pollingManagerRef = useRef(null);
    const stablePollingManagerRef = useRef(null);
    const isStartingPollingRef = useRef(false);
    const timerWasRunningRef = useRef(false);

    const MAX_SEATS_SELECTABLE = 4;

    // ===== 3단계: 기본 함수들 (의존성 순서대로) =====

    const abortControllerRef = useRef(null);

    // concertId 변경 시 상태 초기화
    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // 상태 초기화
        setSeatStatuses([]);
        setSelectedSeats([]);
        setError(null);
        setTimer(0);
        setRefreshTrigger(0);

        console.log(`🔥 concertId 변경됨: ${concertId} - 상태 초기화 완료`);
    }, [concertId]);

    const refreshSeatStatuses = useCallback(async () => {
        try {
            const data = await fetchAllSeatStatus(concertId);
            setSeatStatuses(data);
            const myReservedSeats = data.filter(
                (s) => s.isReservedByCurrentUser,
            );
            setSelectedSeats(myReservedSeats);
        } catch (err) {
            setError(
                err.message || '좌석 정보를 가져오는 중 문제가 발생했습니다.',
            );
        }
    }, [concertId]);

    const updateSeatStatuses = useCallback((seatUpdates) => {
        console.log('🔥 좌석 상태 부분 업데이트:', seatUpdates);

        setSeatStatuses((prevSeats) => {
            const updatedSeats = [...prevSeats];

            seatUpdates.forEach((updatedSeat) => {
                const index = updatedSeats.findIndex(
                    (seat) => seat.seatId === updatedSeat.seatId,
                );
                if (index !== -1) {
                    updatedSeats[index] = {
                        ...updatedSeats[index],
                        ...updatedSeat,
                    };
                    console.log(
                        `🔥 좌석 ${updatedSeat.seatId} 상태 업데이트: ${updatedSeats[index].status}`,
                    );
                }
            });

            const myReservedSeats = updatedSeats.filter(
                (s) => s.isReservedByCurrentUser,
            );
            setSelectedSeats(myReservedSeats);

            return updatedSeats;
        });
    }, []);

    // executePollingCycle을 startPolling보다 먼저 정의
    const executePollingCycle = useCallback(async () => {
        try {
            // SMALL만 폴링하므로 조건 분기 불필요
            console.log('🔥 SMALL 좌석 상태 새로고침');
            await refreshSeatStatuses();

            setRefreshTrigger(prev => prev + 1);
            setError(null);
            setConnectionStatus('connected');
        } catch (error) {
            console.error('🔥 폴링 사이클 에러:', error);
            setError(error.message);
            setConnectionStatus('error');
        }
    }, [refreshSeatStatuses]);

    const stopPolling = useCallback(() => {
        console.log('🔥 폴링 시스템 중지');
        setIsPolling(false);
        setConnectionStatus('disconnected');

        isStartingPollingRef.current = false;

        if (stablePollingManagerRef.current) {
            stablePollingManagerRef.current.stop();
            stablePollingManagerRef.current = null;
        }

        pollingManagerRef.current = null;
    }, []);

    // startPolling은 executePollingCycle 다음에 정의
    const startPolling = useCallback(async () => {
        // SMALL이 아니면 폴링 시작 안 함
        if (capacityType !== 'SMALL') {
            console.log('🔥 MEDIUM/LARGE는 폴링 비활성화');
            return;
        }

        if (isStartingPollingRef.current || isPolling || !enablePolling) {
            return;
        }

        isStartingPollingRef.current = true;

        try {
            if (stablePollingManagerRef.current) {
                stablePollingManagerRef.current.stop();
                stablePollingManagerRef.current = null;
            }
            if (pollingManagerRef.current) {
                pollingManagerRef.current = null;
            }

            setIsPolling(true);
            setConnectionStatus('connecting');

            if (isBackendPollingSupported()) {
                console.log('🔥 폴링 시스템 시작 (35초 간격)');

                const stableManager = createStablePollingManager(concertId, {
                    onUpdate: () => {
                        console.log(
                            `🔥 폴링 업데이트 트리거 (capacityType: ${capacityType})`);
                            refreshSeatStatuses();
                            setRefreshTrigger(prev => prev + 1);
                    },
                    onError: (error) => {
                        console.error('🔥 폴링 에러:', error);
                        setError(error.message);
                        setConnectionStatus('error');
                    },
                    onStatusChange: (isConnected) => {
                        setConnectionStatus(
                            isConnected ? 'connected' : 'disconnected',
                        );
                    },
                });

                stablePollingManagerRef.current = stableManager;
                stableManager.start();

                pollingManagerRef.current = {
                    stopPolling: () => {
                        stableManager.stop();
                        setIsPolling(false);
                        setConnectionStatus('disconnected');
                    },
                };
            } else {
                console.log(
                    '🔥 백엔드 Long Polling 비활성화 - 일반 주기적 새로고침 모드',
                );

                const pollingInterval = getPollingInterval();
                console.log(
                    `🔥 ${pollingInterval / 1000}초 주기 좌석 상태 새로고침 시스템 시작`,
                );

                pollingManagerRef.current = {
                    stopPolling: () => {
                        setIsPolling(false);
                        setConnectionStatus('disconnected');
                    },
                };

                await executePollingCycle();

                const runPollingLoop = async () => {
                    let cycleCount = 0;
                    while (isPolling && enablePolling) {
                        cycleCount++;
                        console.log(`🔥 폴링 사이클 #${cycleCount} 대기 중...`);

                        const pollingInterval = getPollingInterval();
                        await new Promise((resolve) =>
                            setTimeout(resolve, pollingInterval),
                        );

                        if (!isPolling || !enablePolling) {
                            console.log('🔥 폴링 루프 중단:', {
                                isPolling,
                                enablePolling,
                            });
                            break;
                        }

                        await executePollingCycle();
                    }
                    console.log('🔥 폴링 루프 종료');
                };

                runPollingLoop();
            }

            setConnectionStatus('connected');
        } finally {
            isStartingPollingRef.current = false;
        }
    }, [
        concertId,
        isPolling,
        enablePolling,
        refreshSeatStatuses,
        capacityType,
        executePollingCycle,
    ]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const getPollingStatus = useCallback(() => {
        if (stablePollingManagerRef.current) {
            return stablePollingManagerRef.current.getStatus();
        }
        return {
            isPolling: isPolling,
            retryCount: 0,
            lastUpdateTime: null,
        };
    }, [isPolling]);

    // ===== 4단계: 핸들러 함수들 =====

    const handleSeatClick = useCallback(
        async (seat) => {
            const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);

            if (!isSelected && selectedSeats.length >= 4) {
                setError('좌석은 최대 4개까지 선점할 수 있습니다.');
                return;
            }

            setIsReserving(true);
            setError(null);

            if (isSelected) {
                // 선점 해제: Optimistic UI
                setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
                try {
                    await releaseSeat(concertId, seat.seatId);
                    if (capacityType === 'SMALL') {
                        await refreshSeatStatuses();
                    }
                } catch (err) {
                    // 실패 시 롤백 (다시 추가)
                    setSelectedSeats(prev => [...prev, seat]);
                    setError(err.message);
                } finally {
                    setIsReserving(false);
                }
            } else {
                // 선점: Optimistic UI
                const isAvailable = seat.status === 'AVAILABLE' || seat.isAvailable === true;
                if (!isAvailable) {
                    setError('다른 유저가 선점 중인 좌석입니다. 다른 좌석을 선택해 주세요.');
                    setIsReserving(false);
                    return;
                }

                // 즉시 UI 변경 (파란색으로!)
                setSelectedSeats(prev => [...prev, {
                    ...seat,
                    isReservedByCurrentUser: true,
                    remainingSeconds: 300,
                }]);

                try {
                    const result = await reserveSeat(concertId, seat.seatId);

                    if (capacityType === 'SMALL') {
                        await refreshSeatStatuses();
                    } else {
                        // MEDIUM/LARGE: 서버 데이터로 업데이트 (추가가 아니라 교체!)
                        const seatData = result.data || result;
                        setSelectedSeats(prev => prev.map(s =>
                            s.seatId === seat.seatId
                                ? {
                                    seatId: seatData.seatId,
                                    seatInfo: seatData.seatInfo,
                                    seatLabel: seatData.seatInfo,
                                    grade: seatData.grade,
                                    price: seatData.price,
                                    seatRow: seatData.seatRow,
                                    seatNumber: seatData.seatNumber,
                                    status: seatData.status,
                                    isReservedByCurrentUser: true,
                                    remainingSeconds: seatData.remainingSeconds || 300,
                                    expiresAt: seatData.expiresAt,
                                }
                                : s
                        ));
                    }
                } catch (err) {
                    // 실패 시 롤백 (제거)
                    setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
                    setError(err.message);
                } finally {
                    setIsReserving(false);
                }
            }
        },
        [concertId, selectedSeats, refreshSeatStatuses, capacityType],
    );

    const handleClearSelection = useCallback(async () => {
        setIsReserving(true);
        try {
            await Promise.all(
                selectedSeats.map((seat) =>
                    releaseSeat(concertId, seat.seatId),
                ),
            );
            await refreshSeatStatuses();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsReserving(false);
        }
    }, [
        concertId,
        selectedSeats,
        refreshSeatStatuses,
    ]);

    const handleRemoveSeat = useCallback(
        (seatId) => {
            const seatToRemove = selectedSeats.find((s) => s.seatId === seatId);
            if (seatToRemove)
                handleSeatClick(seatToRemove).catch(console.error);
        },
        [selectedSeats, handleSeatClick],
    );

    const handleRestoreComplete = useCallback(async () => {
        try {
            setSelectedSeats([]);
            setTimer(0);
            setError(null);
            await refreshSeatStatuses();
            console.log('좌석 복구 후 상태 초기화 완료');
        } catch (err) {
            console.error('좌석 복구 후 상태 초기화 실패:', err);
            setError(err.message);
        }
    }, [refreshSeatStatuses]);

    // ===== 5단계: useEffect들 (모든 함수 정의 이후) =====

    useEffect(() => {
        selectedSeatsRef.current = selectedSeats;
    }, [selectedSeats]);

    useEffect(() => {
        if (selectedSeats.length > 0 && timer === 0) {
            const minSeconds = Math.min(
                ...selectedSeats.map((s) => s.remainingSeconds),
            );
            setTimer(minSeconds > 0 ? minSeconds : 0);
        } else if (selectedSeats.length === 0) {
            setTimer(0);
        }
    }, [selectedSeats, timer]);

    useEffect(() => {
        if (timer > 0) {
            timerWasRunningRef.current = true;
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        }

        // 타이머가 "돌다가" 0이 됐을 때만 만료 처리
        if (timer <= 0 && timerWasRunningRef.current) {
            if (selectedSeatsRef.current.length > 0) {
                alert('선점 시간이 만료되었습니다.');
                handleClearSelection().catch(console.error);
            }
            timerWasRunningRef.current = false;
        }
    }, [timer, handleClearSelection]);

    useEffect(() => {
        const EXTENSION_INTERVAL_MS = 60 * 1000;

        console.log('[AccessKey] 페이지 진입. 자동 연장 시스템을 시작합니다.');
        const intervalId = setInterval(() => {
            console.log('[AccessKey] 주기적인 자동 연장을 시도합니다.');
            extendAccessKey(concertId).catch((err) => {
                console.warn(
                    '액세스 키 자동 연장에 실패했습니다:',
                    err.message,
                );
            });
        }, EXTENSION_INTERVAL_MS);

        return () => {
            console.log(
                '[AccessKey] 페이지 이탈. 자동 연장 시스템을 중단합니다.',
            );
            clearInterval(intervalId);
        };
    }, [concertId]);

    useEffect(() => {
        return () => {
            if (stablePollingManagerRef.current) {
                stablePollingManagerRef.current.stop();
            }
            if (pollingManagerRef.current) {
                pollingManagerRef.current.stopPolling();
            }
            const seatsToRelease = selectedSeatsRef.current;  // ref로 최신 값 접근
                    if (seatsToRelease.length > 0) {
                        Promise.all(
                            seatsToRelease.map(seat =>
                                releaseSeat(concertId, seat.seatId).catch(console.error)
                            )
                        );
                    }
            console.log('[AccessKey] 페이지 이탈. 액세스키를 폐기합니다.');
            invalidateAccessKey(concertId).catch((err) => {
                console.warn(
                    '페이지 이탈 시 액세스키 폐기 중 오류 발생:',
                    err.message,
                );
            });
        };
    }, [concertId]);

    // ===== 6단계: return =====
    return {
        seatStatuses,
        selectedSeats,
        isReserving,
        error,
        timer,
        isPolling,
        connectionStatus,
        pollingStatus: getPollingStatus(),
        refreshSeatStatuses,
        startPolling,
        stopPolling,
        handleSeatClick,
        handleRemoveSeat,
        handleClearSelection,
        handleRestoreComplete,
        clearError,
        refreshTrigger,
    };
};