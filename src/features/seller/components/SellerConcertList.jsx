import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    Image,
    Calendar,
    MapPin,
    Users,
    Clock,
    Search,
    Filter,
    RefreshCw,
    Bot,
    X,
    ChevronDown,
    MoreVertical,
} from 'lucide-react';
import { concertService } from '../../../features/concert/services/concertService.js';
import AISummaryRegenerationSection from './AISummaryRegenerationSection.jsx';

/**
 * SellerConcertList.jsx (Responsive & Dark Theme Version)
 *
 * 판매자용 콘서트 목록 관리 컴포넌트 - 완전 반응형
 * - 백엔드 SellerConcertController의 API와 완전히 일치
 * - 페이징, 정렬, 필터링 기능 제공
 * - 콘서트 생성, 수정, 삭제, 상태 관리
 * - 포스터 이미지 업데이트 기능
 * - AI 요약 재생성 기능
 * - 모바일 우선 설계 및 카드 기반 레이아웃
 */
const SellerConcertList = ({
    sellerId,
    onCreateConcert,
    onEditConcert,
    refreshTrigger,
}) => {
    // ====== 상태 관리 ======
    const [concerts, setConcerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // AI 요약 모달 상태
    const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
    const [selectedConcertForAi, setSelectedConcertForAi] = useState(null);

    // 모바일 필터 드롭다운 상태
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // 각 카드별 액션 메뉴 상태
    const [expandedActions, setExpandedActions] = useState({});

    // 페이징 상태 (BE와 동일한 기본값)
    const [pagination, setPagination] = useState({
        page: 0, // BE: defaultValue = "0"
        size: 10, // BE: defaultValue = "10"
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: false,
    });

    // 정렬 상태 (BE ALLOWED_SORT_FIELDS와 일치)
    const [sorting, setSorting] = useState({
        sortBy: 'createdAt', // BE: defaultValue = "createdAt"
        sortDir: 'desc', // BE: defaultValue = "desc"
    });

    // 필터 상태
    const [filters, setFilters] = useState({
        status: 'ALL', // 전체, 또는 특정 상태
        searchKeyword: '',
    });

    // 화면 크기 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ====== BE API 호출 함수들 ======

    /**
     * 판매자 콘서트 목록 조회
     * GET /api/seller/concerts
     */
    const fetchConcerts = async () => {
        setLoading(true);
        try {
            const result = await concertService.getSellerConcerts(sellerId, {
                page: pagination.page,
                size: pagination.size,
                sortBy: sorting.sortBy,
                sortDir: sorting.sortDir,
            });

            if (result.success) {
                setConcerts(result.data.content);
                setPagination((prev) => ({
                    ...prev,
                    totalElements: result.data.totalElements,
                    totalPages: result.data.totalPages,
                    first: result.data.first,
                    last: result.data.last,
                }));
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('콘서트 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 상태별 콘서트 조회
     * GET /api/seller/concerts/status
     */
    const fetchConcertsByStatus = async (status) => {
        if (status === 'ALL') {
            fetchConcerts();
            return;
        }

        setLoading(true);
        try {
            const result = await concertService.getSellerConcertsByStatus(
                sellerId,
                status,
            );

            if (result.success) {
                setConcerts(result.data);
                // 상태별 조회는 페이징이 없으므로 리셋
                setPagination((prev) => ({
                    ...prev,
                    totalElements: result.data.length,
                    totalPages: 1,
                    first: true,
                    last: true,
                }));
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('콘서트 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 콘서트 삭제 (취소 처리)
     * DELETE /api/seller/concerts/{concertId}
     */
    const deleteConcert = async (concert) => {
        if (
            !confirm(
                `정말로 "${concert.title}" 콘서트를 삭제하시겠습니까?\n\n⚠️ 삭제된 콘서트는 복구할 수 없습니다.\n⚠️ 이미 예매된 티켓이 있다면 환불 처리가 필요합니다.`,
            )
        )
            return;

        if (concert.status === 'CANCELLED') {
            alert('이미 취소된 콘서트입니다.');
            return;
        }

        try {
            const result = await concertService.deleteConcert(
                sellerId,
                concert.concertId,
            );

            if (result.success) {
                alert('콘서트가 취소되었습니다.');
                fetchConcerts(); // 목록 새로고침
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('콘서트 취소에 실패했습니다.');
        }
    };

    // ====== 이벤트 핸들러들 ======

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleSizeChange = (newSize) => {
        setPagination((prev) => ({ ...prev, page: 0, size: newSize }));
    };

    const handleSortChange = (field) => {
        setSorting((prev) => ({
            sortBy: field,
            sortDir:
                prev.sortBy === field && prev.sortDir === 'asc'
                    ? 'desc'
                    : 'asc',
        }));
    };

    const handleStatusFilter = (status) => {
        setFilters((prev) => ({ ...prev, status }));
        setPagination((prev) => ({ ...prev, page: 0 })); // 첫 페이지로 리셋
        setShowMobileFilters(false); // 모바일 필터 닫기
    };

    // AI 요약 재생성 핸들러
    const handleAiSummaryRegeneration = (concert) => {
        // 취소된 콘서트는 AI 요약 재생성 불가
        if (concert.status === 'CANCELLED') {
            alert('취소된 콘서트는 AI 요약을 재생성할 수 없습니다.');
            return;
        }

        setSelectedConcertForAi(concert);
        setShowAiSummaryModal(true);
    };

    // AI 요약 모달 닫기 핸들러
    const handleCloseAiSummaryModal = () => {
        setShowAiSummaryModal(false);
        setSelectedConcertForAi(null);
    };

    // 액션 메뉴 토글
    const toggleActionMenu = (concertId) => {
        setExpandedActions((prev) => ({
            ...prev,
            [concertId]: !prev[concertId],
        }));
    };

    // ====== useEffect - 데이터 로딩 ======
    useEffect(() => {
        if (filters.status === 'ALL') {
            fetchConcerts();
        } else {
            fetchConcertsByStatus(filters.status);
        }
    }, [
        pagination.page,
        pagination.size,
        sorting.sortBy,
        sorting.sortDir,
        filters.status,
        refreshTrigger,
    ]);

    // ====== 상태별 스타일 및 텍스트 ======
    const getStatusBadge = (status) => {
        const statusConfig = {
            SCHEDULED: {
                color: 'bg-yellow-600 text-yellow-100',
                text: '예정됨',
            },
            ON_SALE: { color: 'bg-green-600 text-green-100', text: '예매중' },
            SOLD_OUT: { color: 'bg-red-600 text-red-100', text: '매진' },
            BOOKING_CLOSED: { color: 'bg-blue-600 text-blue-100', text: '예매 종료' },
            CANCELLED: { color: 'bg-gray-600 text-gray-100', text: '취소됨' },
            COMPLETED: {
                color: 'bg-purple-600 text-purple-100',
                text: '완료됨',
            },
        };

        const config = statusConfig[status] || statusConfig.SCHEDULED;
        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
            >
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateTimeString) => {
        if (isMobile) {
            return new Date(dateTimeString).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
            });
        }
        return new Date(dateTimeString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 모바일 카드 렌더링
    const renderMobileCard = (concert) => (
        <div
            key={concert.concertId}
            className="bg-gray-700 rounded-lg p-4 mb-4 border border-gray-600"
        >
            {/* 카드 헤더 */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {concert.posterImageUrl ? (
                            <img
                                src={concert.posterImageUrl}
                                alt={concert.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src="/images/basic-poster-image.png"
                                alt="기본 포스터 이미지"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm leading-tight mb-1">
                            {concert.title}
                        </h3>
                        <p className="text-sm text-gray-300 mb-2">
                            {concert.artist}
                        </p>
                        {getStatusBadge(concert.status)}
                    </div>
                </div>

                {/* 액션 메뉴 */}
                <div className="relative">
                    <button
                        onClick={() => toggleActionMenu(concert.concertId)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {expandedActions[concert.concertId] && (
                        <>
                            {/* 백드롭 */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() =>
                                    toggleActionMenu(concert.concertId)
                                }
                            />

                            {/* 액션 메뉴 */}
                            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 min-w-[120px]">
                                <button
                                    onClick={() => {
                                        if (concert.status === 'CANCELLED') {
                                            alert(
                                                '취소된 콘서트는 수정할 수 없습니다.',
                                            );
                                            return;
                                        }
                                        onEditConcert && onEditConcert(concert);
                                        toggleActionMenu(concert.concertId);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Edit size={14} />
                                    수정
                                </button>
                                <button
                                    onClick={() => {
                                        deleteConcert(concert);
                                        toggleActionMenu(concert.concertId);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    삭제
                                </button>
                                <button
                                    onClick={() => {
                                        handleAiSummaryRegeneration(concert);
                                        toggleActionMenu(concert.concertId);
                                    }}
                                    disabled={concert.status === 'CANCELLED'}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 ${
                                        concert.status === 'CANCELLED'
                                            ? 'text-gray-500 cursor-not-allowed'
                                            : 'text-green-400'
                                    }`}
                                >
                                    <Bot size={14} />
                                    AI 요약
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 카드 정보 */}
            <div className="space-y-2">
                {/* 공연일시 */}
                <div className="flex items-center gap-2 text-sm">
                    <Calendar
                        size={14}
                        className="text-gray-400 flex-shrink-0"
                    />
                    <span className="text-gray-200">
                        {formatDate(concert.concertDate)}
                    </span>
                </div>

                {/* 시간 */}
                <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-200">
                        {concert.startTime} - {concert.endTime}
                    </span>
                </div>

                {/* 장소 */}
                <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-200 truncate">
                        {concert.venueName}
                    </span>
                </div>

                {/* 좌석수 */}
                <div className="flex items-center gap-2 text-sm">
                    <Users size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-200">
                        {concert.totalSeats?.toLocaleString()}석
                    </span>
                </div>
            </div>

            {/* 카드 푸터 */}
            <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400">
                    {concert.updatedAt &&
                    concert.updatedAt !== concert.createdAt
                        ? `수정됨: ${formatDateTime(concert.updatedAt)}`
                        : `등록됨: ${formatDateTime(concert.createdAt)}`}
                </div>
            </div>
        </div>
    );

    // 데스크톱 테이블 행 렌더링
    const renderDesktopRow = (concert) => (
        <div
            key={concert.concertId}
            className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-600 transition-colors"
        >
            {/* 콘서트 정보 */}
            <div className="col-span-3">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {concert.posterImageUrl ? (
                            <img
                                src={concert.posterImageUrl}
                                alt={concert.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src="/images/basic-poster-image.png"
                                alt="기본 포스터 이미지"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white line-clamp-2 text-sm">
                            {concert.title}
                        </h3>
                        <p className="text-sm text-gray-300 truncate">
                            {concert.artist}
                        </p>
                    </div>
                </div>
            </div>

            {/* 공연일시 */}
            <div className="col-span-2">
                <div className="flex items-center gap-1 text-sm">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-200">
                        {formatDate(concert.concertDate)}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-300 mt-1">
                    <Clock size={14} className="text-gray-400" />
                    <span>
                        {concert.startTime} - {concert.endTime}
                    </span>
                </div>
            </div>

            {/* 장소 */}
            <div className="col-span-2">
                <div className="flex items-center gap-1 text-sm">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="line-clamp-2 text-gray-200">
                        {concert.venueName}
                    </span>
                </div>
            </div>

            {/* 좌석수 */}
            <div className="col-span-1">
                <div className="flex items-center gap-1 text-sm">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-gray-200">
                        {concert.totalSeats?.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* 상태 */}
            <div className="col-span-1">{getStatusBadge(concert.status)}</div>

            {/* 작업 버튼들 */}
            <div className="col-span-2">
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={() => {
                                if (concert.status === 'CANCELLED') {
                                    alert(
                                        '취소된 콘서트는 수정할 수 없습니다.',
                                    );
                                    return;
                                }
                                onEditConcert && onEditConcert(concert);
                            }}
                            className="p-1 text-blue-400 hover:bg-blue-900 hover:bg-opacity-30 rounded transition-colors"
                            title="수정"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => deleteConcert(concert)}
                            className="p-1 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded transition-colors"
                            title="삭제"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="text-sm">
                        <span className="text-gray-300">
                            {formatDateTime(
                                concert.updatedAt || concert.createdAt,
                            )}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">
                            {concert.updatedAt &&
                            concert.updatedAt !== concert.createdAt
                                ? '수정됨'
                                : '등록됨'}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI 요약 재생성 버튼 */}
            <div className="col-span-1">
                <button
                    onClick={() => handleAiSummaryRegeneration(concert)}
                    className={`p-2 rounded transition-colors ${
                        concert.status === 'CANCELLED'
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-green-400 hover:bg-green-900 hover:bg-opacity-30'
                    }`}
                    title={
                        concert.status === 'CANCELLED'
                            ? '취소된 콘서트는 AI 요약을 재생성할 수 없습니다'
                            : 'AI 요약 재생성'
                    }
                    disabled={concert.status === 'CANCELLED'}
                >
                    <Bot size={16} />
                </button>
            </div>
        </div>
    );

    // ====== 렌더링 ======
    return (
        <div className="p-3 sm:p-6 bg-gray-800 text-white rounded-lg">
            {/* 헤더 섹션 - 반응형 */}
            <div className="bg-gray-700 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-600">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            콘서트 관리
                        </h1>
                        <p className="text-gray-300 mt-1 text-sm sm:text-base">
                            등록한 콘서트를 관리하고 편집할 수 있습니다
                        </p>
                    </div>
                    <button
                        onClick={() => onCreateConcert && onCreateConcert()}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                    >
                        <Plus size={20} />
                        콘서트 등록
                    </button>
                </div>

                {/* 필터 및 검색 - 반응형 */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* 모바일 필터 드롭다운 */}
                    {isMobile ? (
                        <div className="relative w-full">
                            <button
                                onClick={() =>
                                    setShowMobileFilters(!showMobileFilters)
                                }
                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-600 text-gray-200 rounded-lg border border-gray-500 min-h-[44px]"
                            >
                                <span>
                                    {filters.status === 'ALL'
                                        ? '전체'
                                        : filters.status === 'SCHEDULED'
                                          ? '예정됨'
                                          : filters.status === 'ON_SALE'
                                            ? '예매중'
                                            : filters.status === 'SOLD_OUT'
                                              ? '매진'
                                              : filters.status === 'BOOKING_CLOSED'
                                                ? '예매 종료'
                                                  : filters.status === 'CANCELLED'
                                                    ? '취소됨'
                                                    : '완료됨'}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${showMobileFilters ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {showMobileFilters && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() =>
                                            setShowMobileFilters(false)
                                        }
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20">
                                        {[
                                            'ALL',
                                            'SCHEDULED',
                                            'ON_SALE',
                                            'SOLD_OUT',
                                            "BOOKING_CLOSED",
                                            'CANCELLED',
                                            'COMPLETED',
                                        ].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() =>
                                                    handleStatusFilter(status)
                                                }
                                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 transition-colors ${
                                                    filters.status === status
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-200'
                                                }`}
                                            >
                                                {status === 'ALL'
                                                    ? '전체'
                                                    : status === 'SCHEDULED'
                                                      ? '예정됨'
                                                      : status === 'ON_SALE'
                                                        ? '예매중'
                                                        : status === 'SOLD_OUT'
                                                          ? '매진'
                                                          : status === 'BOOKING_CLOSED'
                                                            ? '예매 종료'
                                                              : status ===
                                                                  'CANCELLED'
                                                                    ? '취소됨'
                                                                    : '완료됨'}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* 데스크톱 필터 버튼들 */
                        <div className="flex gap-2 flex-wrap">
                            {[
                                'ALL',
                                'SCHEDULED',
                                'ON_SALE',
                                'SOLD_OUT',
                                'BOOKING_CLOSED',
                                'CANCELLED',
                                'COMPLETED',
                            ].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusFilter(status)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        filters.status === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                    }`}
                                >
                                    {status === 'ALL'
                                        ? '전체'
                                        : status === 'SCHEDULED'
                                          ? '예정됨'
                                          : status === 'ON_SALE'
                                            ? '예매중'
                                            : status === 'SOLD_OUT'
                                              ? '매진'
                                              : status === 'BOOKING_CLOSED'
                                                ? '예매 종료'
                                                  : status === 'CANCELLED'
                                                    ? '취소됨'
                                                    : '완료됨'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 새로고침 버튼 */}
                    <button
                        onClick={() => fetchConcerts()}
                        className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="새로고침"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 sm:mb-6">
                    {error}
                </div>
            )}

            {/* 콘서트 목록 */}
            <div className="bg-gray-700 rounded-lg shadow-sm border border-gray-600">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-300">로딩 중...</p>
                    </div>
                ) : concerts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Calendar
                            size={48}
                            className="mx-auto mb-4 text-gray-500"
                        />
                        <p className="mb-2">등록된 콘서트가 없습니다.</p>
                        <button
                            onClick={() => onCreateConcert && onCreateConcert()}
                            className="mt-4 text-blue-400 hover:text-blue-300 min-h-[44px] px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            첫 번째 콘서트를 등록해보세요
                        </button>
                    </div>
                ) : (
                    <>
                        {isMobile ? (
                            /* 모바일 카드 레이아웃 */
                            <div className="p-4">
                                {concerts.map(renderMobileCard)}
                            </div>
                        ) : (
                            /* 데스크톱 테이블 레이아웃 */
                            <>
                                {/* 테이블 헤더 */}
                                <div className="border-b border-gray-600">
                                    <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-300">
                                        <div className="col-span-3">
                                            콘서트 정보
                                        </div>
                                        <div className="col-span-2">
                                            공연일시
                                        </div>
                                        <div className="col-span-2">장소</div>
                                        <div className="col-span-1">좌석수</div>
                                        <div className="col-span-1">상태</div>
                                        <div className="col-span-2">작업</div>
                                        <div className="col-span-1">
                                            AI 요약
                                        </div>
                                    </div>
                                </div>

                                {/* 콘서트 목록 */}
                                <div className="divide-y divide-gray-600">
                                    {concerts.map(renderDesktopRow)}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* 페이지네이션 - 반응형 */}
                {!loading && concerts.length > 0 && (
                    <div className="p-4 border-t border-gray-600">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-300 order-2 sm:order-1">
                                총 {pagination.totalElements}개 중{' '}
                                {pagination.page * pagination.size + 1}-
                                {Math.min(
                                    (pagination.page + 1) * pagination.size,
                                    pagination.totalElements,
                                )}
                                개 표시
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-2 order-1 sm:order-2">
                                {/* 페이지 크기 선택 */}
                                <select
                                    value={pagination.size}
                                    onChange={(e) =>
                                        handleSizeChange(Number(e.target.value))
                                    }
                                    className="text-sm border border-gray-500 bg-gray-700 text-white rounded px-2 py-1 min-h-[40px]"
                                >
                                    <option value={10}>10개씩</option>
                                    <option value={20}>20개씩</option>
                                    <option value={50}>50개씩</option>
                                    <option value={100}>100개씩</option>
                                </select>

                                {/* 페이지 버튼들 */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.page - 1,
                                            )
                                        }
                                        disabled={pagination.first}
                                        className="px-3 py-1 text-sm border border-gray-500 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                                    >
                                        {isMobile ? '‹' : '이전'}
                                    </button>

                                    {(() => {
                                        const currentPage = pagination.page;
                                        const totalPages =
                                            pagination.totalPages;
                                        const maxVisible = isMobile ? 3 : 5;

                                        let startPage, endPage;

                                        if (totalPages <= maxVisible) {
                                            startPage = 0;
                                            endPage = totalPages - 1;
                                        } else {
                                            startPage = Math.max(
                                                0,
                                                currentPage -
                                                    Math.floor(maxVisible / 2),
                                            );
                                            endPage = Math.min(
                                                totalPages - 1,
                                                currentPage +
                                                    Math.floor(maxVisible / 2),
                                            );

                                            if (
                                                endPage - startPage <
                                                maxVisible - 1
                                            ) {
                                                if (startPage === 0) {
                                                    endPage = Math.min(
                                                        totalPages - 1,
                                                        startPage +
                                                            maxVisible -
                                                            1,
                                                    );
                                                } else if (
                                                    endPage ===
                                                    totalPages - 1
                                                ) {
                                                    startPage = Math.max(
                                                        0,
                                                        endPage -
                                                            maxVisible +
                                                            1,
                                                    );
                                                }
                                            }
                                        }

                                        const pages = [];
                                        for (
                                            let i = startPage;
                                            i <= endPage;
                                            i++
                                        ) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() =>
                                                        handlePageChange(i)
                                                    }
                                                    className={`px-3 py-1 text-sm border rounded min-h-[40px] min-w-[40px] ${
                                                        i === currentPage
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'border-gray-500 bg-gray-700 text-white hover:bg-gray-600'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>,
                                            );
                                        }

                                        return pages;
                                    })()}

                                    <button
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.page + 1,
                                            )
                                        }
                                        disabled={pagination.last}
                                        className="px-3 py-1 text-sm border border-gray-500 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                                    >
                                        {isMobile ? '›' : '다음'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI 요약 재생성 모달 - 반응형 */}
            {showAiSummaryModal && selectedConcertForAi && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-gray-800 text-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-600">
                        {/* 모달 헤더 */}
                        <div className="sticky top-0 bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-600">
                            <h2 className="text-lg sm:text-xl font-bold text-white">
                                AI 요약 재생성 - {selectedConcertForAi.title}
                            </h2>
                            <button
                                onClick={handleCloseAiSummaryModal}
                                className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* AI 요약 재생성 섹션 */}
                        <div className="p-4 sm:p-6">
                            <AISummaryRegenerationSection
                                sellerId={sellerId}
                                concertId={selectedConcertForAi.concertId}
                                currentAiSummary={
                                    selectedConcertForAi.aiSummary
                                }
                                onSummaryUpdated={(newSummary) => {
                                    fetchConcerts();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerConcertList;
