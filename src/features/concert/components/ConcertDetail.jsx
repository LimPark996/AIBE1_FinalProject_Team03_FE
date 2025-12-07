// src/features/concert/components/ConcertDetail.jsx

// ===== IMPORT 섹션 =====
import React, { useEffect, useState, useRef } from 'react';
import { Calendar, MapPin, Users, Clock, Ticket, Info } from 'lucide-react';

// 콘서트 관련 타입과 상수들을 import
import { ConcertStatusLabels, ConcertStatusColors } from '../types/concert.js';

/**
 * ===== ConcertDetail 컴포넌트 (반응형 개선 버전) =====
 *
 * 🎯 주요 개선사항:
 * 1. 모바일에서 포스터와 정보 세로 배치
 * 2. 예매 버튼 모바일에서 하단 고정 (sticky)
 * 3. 정보 테이블을 모바일에서 카드 형태로 변경
 * 4. 터치 친화적 UI 요소들
 * 5. 반응형 타이포그래피 및 간격
 * 6. 모바일에서 접기/펼치기 가능한 섹션들
 */
const ConcertDetail = ({
    // ===== 필수 props =====
    concert, // 콘서트 상세 정보 객체
    loading = false, // 로딩 상태
    error = null, // 에러 상태

    // ===== 액션 props =====
    onBookingClick, // 예매하기 버튼 클릭 핸들러
    isBooking = false,
    onRefresh, // 새로고침 버튼 클릭 핸들러

    // ===== UI 제어 props =====
    showBookingButton = true, // 예매 버튼 표시 여부
    showRefreshButton = false, // 새로고침 버튼 표시 여부

    // ===== 스타일 props =====
    className = '', // 추가 CSS 클래스
    compact = false, // 컴팩트 모드
}) => {
    // ===== 반응형 상태 관리 =====
    const [isMobile, setIsMobile] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const bookingButtonRef = useRef(null);

    // ===== 화면 크기 감지 =====
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== 데이터 가공 함수들 =====

    /**
     * 날짜와 시간을 사용자 친화적 형태로 변환
     */
    const formatConcertDateTime = () => {
        if (!concert?.concertDate || !concert?.startTime) {
            return '날짜 미정';
        }

        try {
            const dateTimeString = `${concert.concertDate}T${concert.startTime}`;
            const dateTime = new Date(dateTimeString);

            if (isNaN(dateTime.getTime())) {
                return '날짜 형식 오류';
            }

            // 🎯 모바일에서는 더 간결한 포맷
            if (isMobile) {
                const dateOptions = {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                };
                const timeOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                };

                const formattedDate = dateTime.toLocaleDateString(
                    'ko-KR',
                    dateOptions,
                );
                const formattedTime = dateTime.toLocaleTimeString(
                    'ko-KR',
                    timeOptions,
                );

                return `${formattedDate} ${formattedTime}`;
            } else {
                const dateOptions = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                };
                const timeOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                };

                const formattedDate = dateTime.toLocaleDateString(
                    'ko-KR',
                    dateOptions,
                );
                const formattedTime = dateTime.toLocaleTimeString(
                    'ko-KR',
                    timeOptions,
                );

                return `${formattedDate} ${formattedTime}`;
            }
        } catch (error) {
            console.warn('날짜 형식 변환 실패:', error);
            return `${concert.concertDate} ${concert.startTime}`;
        }
    };

    /**
     * 공연 종료 시간 포맷팅
     */
    const formatEndTime = () => {
        if (!concert?.endTime) return '';

        try {
            const endDateTime = new Date(
                `${concert.concertDate}T${concert.endTime}`,
            );
            return endDateTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch (error) {
            return concert.endTime;
        }
    };

    /**
     * 예매 기간 포맷팅
     */
    const formatBookingPeriod = () => {
        if (!concert?.bookingStartDate || !concert?.bookingEndDate) {
            return '예매 기간 미정';
        }

        try {
            const startDate = new Date(concert.bookingStartDate);
            const endDate = new Date(concert.bookingEndDate);

            const startFormatted = startDate.toLocaleDateString('ko-KR', {
                year: isMobile ? '2-digit' : 'numeric',
                month: 'short',
                day: 'numeric',
            });

            const endFormatted = endDate.toLocaleDateString('ko-KR', {
                year: isMobile ? '2-digit' : 'numeric',
                month: 'short',
                day: 'numeric',
            });

            return `${startFormatted} ~ ${endFormatted}`;
        } catch (error) {
            return '예매 기간 형식 오류';
        }
    };

    /**
     * 포스터 이미지 에러 처리 (개선)
     */
    const handleImageError = (event) => {
        // 이미 기본 이미지인 경우 무한 루프 방지
        if (event.target.src.includes('/images/basic-poster-image.png')) {
            setImageError(true);
            setImageLoaded(true); // 기본 이미지라도 로딩 완료로 처리
            return;
        }

        // 에러 발생 시 기본 이미지로 변경
        event.target.src = '/images/basic-poster-image.png';
        setImageError(true);
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
        // 에러 상태는 초기화하지 않음 (기본 이미지 사용 여부 추적용)
    };

    /**
     * 예매 버튼 클릭 핸들러
     */
    const handleBookingClick = () => {
        if (onBookingClick && typeof onBookingClick === 'function') {
            onBookingClick(concert);
        }
    };

    /**
     * 새로고침 버튼 클릭 핸들러
     */
    const handleRefreshClick = () => {
        if (onRefresh && typeof onRefresh === 'function') {
            onRefresh();
        }
    };

    // ===== 상태별 UI 결정 =====

    /**
     * 예매 버튼 표시 여부 및 텍스트 결정
     */
    const getBookingButtonInfo = () => {
        if (!concert || !showBookingButton) {
            return { show: false, text: '', disabled: true };
        }

        switch (concert.status) {
            case 'SCHEDULED':
                return {
                    show: true,
                    text: '예매 대기 중',
                    disabled: true,
                    style: { backgroundColor: '#fbbf24', color: '#92400e' },
                };
            case 'ON_SALE':
                return {
                    show: true,
                    text: '예매하기',
                    disabled: false,
                    style: { backgroundColor: '#059669', color: '#ffffff' },
                };
            case 'SOLD_OUT':
                return {
                    show: true,
                    text: '매진',
                    disabled: true,
                    style: { backgroundColor: '#dc2626', color: '#ffffff' },
                };
            case 'BOOKING_CLOSED':
                return {
                    show: true,
                    text: '예매 종료',
                    disabled: true,
                    style: { backgroundColor: '#ea580c', color: '#ffffff' },
                };
            case 'CANCELLED':
                return {
                    show: false,
                    text: '취소된 공연',
                    disabled: true,
                };
            case 'COMPLETED':
                return {
                    show: false,
                    text: '공연 완료',
                    disabled: true,
                };
            default:
                return {
                    show: true,
                    text: '상태 확인 중',
                    disabled: true,
                    style: { backgroundColor: '#6b7280', color: '#ffffff' },
                };
        }
    };

    /**
     * 상태 배지 스타일
     */
    const getStatusBadgeStyles = (status) => {
        const baseStyles = {
            display: 'inline-block',
            padding: isMobile ? '8px 12px' : '6px 12px',
            borderRadius: '8px',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 'bold',
            marginBottom: isMobile ? '12px' : '16px',
        };

        switch (status) {
            case 'SCHEDULED':
                return {
                    ...baseStyles,
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                };
            case 'ON_SALE':
                return {
                    ...baseStyles,
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                };
            case 'SOLD_OUT':
                return {
                    ...baseStyles,
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                };
            case 'CANCELLED':
                return {
                    ...baseStyles,
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                };
            case 'BOOKING_CLOSED':
                return {
                    ...baseStyles,
                    backgroundColor: '#fed7aa',
                    color: '#c2410c',
                };
            case 'COMPLETED':
                return {
                    ...baseStyles,
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                };
            default:
                return {
                    ...baseStyles,
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                };
        }
    };

    // ===== 조건부 렌더링 =====

    /**
     * 로딩 상태 (반응형 개선)
     */
    if (loading) {
        return (
            <div className={`concert-detail ${className}`}>
                <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-800 text-white rounded-lg">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="text-center lg:text-left">
                            <div className="text-lg sm:text-xl text-gray-300">
                                콘서트 정보를 불러오는 중...
                            </div>
                            <div className="text-sm text-gray-400 mt-2">
                                잠시만 기다려주세요
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * 에러 상태 (반응형 개선)
     */
    if (error) {
        return (
            <div className={`concert-detail ${className}`}>
                <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-800 text-white rounded-lg">
                    <div className="text-center py-12">
                        <div className="text-5xl sm:text-6xl mb-4">😵</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-red-400 mb-3">
                            콘서트 정보를 불러올 수 없습니다
                        </h3>
                        <p className="text-sm sm:text-base text-gray-300 mb-6 max-w-md mx-auto">
                            {typeof error === 'string'
                                ? error
                                : '알 수 없는 오류가 발생했습니다.'}
                        </p>

                        {(showRefreshButton || onRefresh) && (
                            <button
                                onClick={handleRefreshClick}
                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                                🔄 다시 시도
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * 콘서트 정보가 없을 때
     */
    if (!concert) {
        return (
            <div className={`concert-detail ${className}`}>
                <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-800 text-white rounded-lg">
                    <div className="text-center py-12">
                        <div className="text-5xl sm:text-6xl mb-4">🎭</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-300">
                            콘서트 정보가 없습니다
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    // 예매 버튼 정보 가져오기
    const bookingInfo = getBookingButtonInfo();

    // ===== 메인 렌더링 (정상 상태) =====

    return (
        <div className={`concert-detail ${className}`}>
            {/* 🎯 반응형 컨테이너 */}
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-800 text-white rounded-lg relative">
                {/* 🎯 상단: 포스터 + 기본 정보 (반응형 레이아웃) */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6 lg:mb-8">
                    {/* 🎯 포스터 이미지 섹션 (반응형) */}
                    <div className="flex-shrink-0 mx-auto lg:mx-0">
                        <div className="relative w-64 h-80 sm:w-72 sm:h-96 lg:w-80 lg:h-[480px] bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                            <img
                                src={
                                    concert.posterImageUrl ||
                                    '/images/basic-poster-image.png'
                                }
                                alt={`${concert.title} 포스터`}
                                className="w-full h-full object-cover transition-opacity duration-300"
                                style={{ opacity: imageLoaded ? 1 : 0 }}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                loading="lazy"
                            />

                            {/* 로딩 중일 때만 스피너 표시 */}
                            {!imageLoaded && !imageError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                    <div className="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🎯 기본 정보 섹션 (반응형) */}
                    <div className="flex-1 text-center lg:text-left">
                        {/* 상태 배지 */}
                        <div style={getStatusBadgeStyles(concert.status)}>
                            {ConcertStatusLabels[concert.status] ||
                                concert.status}
                        </div>

                        {/* 제목 */}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 lg:mb-4 leading-tight">
                            {concert.title}
                        </h1>

                        {/* 아티스트 */}
                        <div className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-4 lg:mb-6 flex items-center justify-center lg:justify-start gap-2">
                            🎤 {concert.artist}
                        </div>

                        {/* 🎯 핵심 정보 카드 (모바일 최적화) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                            {/* 날짜 정보 */}
                            <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                    <Calendar size={16} />
                                    <span className="text-xs sm:text-sm font-medium">
                                        공연일시
                                    </span>
                                </div>
                                <div className="text-sm sm:text-base text-white font-medium">
                                    {formatConcertDateTime()}
                                </div>
                                {formatEndTime() && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        종료: {formatEndTime()}
                                    </div>
                                )}
                            </div>

                            {/* 장소 정보 */}
                            <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                                <div className="flex items-center gap-2 text-green-400 mb-1">
                                    <MapPin size={16} />
                                    <span className="text-xs sm:text-sm font-medium">
                                        공연장
                                    </span>
                                </div>
                                <div className="text-sm sm:text-base text-white font-medium truncate">
                                    {concert.venueName}
                                </div>
                                {concert.venueAddress && (
                                    <div className="text-xs text-gray-400 mt-1 truncate">
                                        {concert.venueAddress}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 설명 (있는 경우에만) */}
                        {concert.description && !compact && (
                            <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
                                <div className="text-sm sm:text-base text-gray-300 leading-relaxed">
                                    {concert.description}
                                </div>
                            </div>
                        )}

                        {/* 🎯 예매 버튼 (데스크톱용 - 인라인) */}
                        {bookingInfo.show && !isMobile && (
                            <button
                                onClick={handleBookingClick}
                                disabled={bookingInfo.disabled || isBooking}
                                className="w-full sm:w-auto px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105"
                                style={{
                                    ...bookingInfo.style,
                                    minWidth: '200px',
                                }}
                            >
                                {isBooking ? '처리 중...' : bookingInfo.text}
                            </button>
                        )}
                    </div>
                </div>

                {/* 🎯 상세 정보 섹션들 (항상 펼쳐진 상태) */}
                {!compact && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* 공연 정보 섹션 */}
                        <div className="bg-gray-700 rounded-lg border border-gray-600 p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="text-blue-400" size={20} />
                                <h3 className="text-lg sm:text-xl font-bold text-white">
                                    공연 정보
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">
                                            총 좌석 수
                                        </div>
                                        <div className="flex items-center gap-2 text-white">
                                            <Users
                                                size={16}
                                                className="text-purple-400"
                                            />
                                            <span>
                                                {concert.totalSeats?.toLocaleString() ||
                                                    '정보 없음'}
                                                석
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">
                                            공연 시간
                                        </div>
                                        <div className="flex items-center gap-2 text-white">
                                            <Clock
                                                size={16}
                                                className="text-orange-400"
                                            />
                                            <span>
                                                {concert.startTime} -{' '}
                                                {concert.endTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 예매 정보 섹션 */}
                        <div className="bg-gray-700 rounded-lg border border-gray-600 p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Ticket className="text-green-400" size={20} />
                                <h3 className="text-lg sm:text-xl font-bold text-white">
                                    예매 정보
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">
                                        예매 기간
                                    </div>
                                    <div className="text-white">
                                        {formatBookingPeriod()}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">
                                            연령 제한
                                        </div>
                                        <div className="text-white">
                                            {concert.minAge
                                                ? `${concert.minAge}세 이상`
                                                : '전 연령 관람가'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">
                                            최대 구매
                                        </div>
                                        <div className="text-white">
                                            1인당{' '}
                                            {concert.maxTicketsPerUser || 4}
                                            매까지
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🎯 모바일 하단 고정 예매 버튼 */}
                {bookingInfo.show && isMobile && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700 z-50">
                        <button
                            ref={bookingButtonRef}
                            onClick={handleBookingClick}
                            disabled={bookingInfo.disabled || isBooking}
                            className="w-full py-4 rounded-lg text-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                            style={bookingInfo.style}
                        >
                            {isBooking ? '처리 중...' : bookingInfo.text}
                        </button>
                    </div>
                )}

                {/* 🎯 모바일에서 하단 여백 (고정 버튼 공간 확보) */}
                {bookingInfo.show && isMobile && <div className="h-20"></div>}
            </div>
        </div>
    );
};

// ===== 기본 PROPS =====
ConcertDetail.defaultProps = {
    loading: false,
    error: null,
    showBookingButton: true,
    showRefreshButton: false,
    className: '',
    compact: false,
};

export default ConcertDetail;
