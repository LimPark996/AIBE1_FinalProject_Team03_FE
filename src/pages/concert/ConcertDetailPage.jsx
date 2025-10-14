import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ConcertDetail from '../../features/concert/components/ConcertDetail.jsx';
import AISummary from '../../features/concert/components/AISummary.jsx';
import ReviewList from '../../features/concert/components/ReviewList.jsx';
import ExpectationList from '../../features/concert/components/ExpectationList.jsx';
import Modal from '../../shared/components/ui/Modal.jsx';
import ReviewForm from '../../features/concert/components/ReviewForm.jsx';
import ExpectationForm from '../../features/concert/components/ExpectationForm.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';

import { useConcertDetail } from '../../features/concert/hooks/useConcertDetail.js';
import { useReviews } from '../../features/concert/hooks/useReviews.js';
import { useExpectations } from '../../features/concert/hooks/useExpectations.js';
import { useBookingQueue } from '../../features/booking/hooks/useBookingQueue';
import { useSeatGrades } from '../../features/concert/hooks/useSeatGrades';

// 🎯 반응형 Hook 추가
const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [screenWidth, setScreenWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1200,
    );

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setScreenWidth(width);
            setIsMobile(width <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        isMobile,
        isTablet: screenWidth <= 1024 && screenWidth > 768,
        isDesktop: screenWidth > 1024,
        screenWidth,
    };
};

function ConcertDetailPage() {
    const { concertId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useContext(AuthContext);
    const { isMobile, isTablet } = useResponsive(); // 🎯 반응형 Hook 사용

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showExpectationForm, setShowExpectationForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [editingExpectation, setEditingExpectation] = useState(null);
    const [expandedReviews, setExpandedReviews] = useState(new Set());
    const [expandedExpectations, setExpandedExpectations] = useState(new Set());

    // 콘서트 상태별 설정 (함수 상단으로 이동)
    const statusConfig = {
        SOLD_OUT: {
            buttonText: '매진',
            statusText: '매진',
            color: 'text-red-600',
        },
        CANCELLED: {
            buttonText: '취소됨',
            statusText: '취소됨',
            color: 'text-gray-600',
        },
        SCHEDULED: {
            buttonText: '예매 대기',
            statusText: '예매 대기',
            color: 'text-yellow-600',
        },
        ON_SALE: {
            buttonText: '예매하기',
            statusText: '예매 중',
            color: 'text-green-600',
        },
        COMPLETED: {
            buttonText: '공연 완료',
            statusText: '공연 완료',
            color: 'text-gray-600',
        },
    };

    // 콘서트 상세 정보 hook
    const parsedConcertId = parseInt(concertId);
    if (isNaN(parsedConcertId)) {
        return (
            <div
                className={`text-center text-red-500 ${isMobile ? 'py-6 px-4' : 'py-10'}`}
            >
                잘못된 콘서트 ID 입니다.
            </div>
        );
    }

    const {
        concert,
        aiSummary,
        loading: concertLoading,
        error: concertError,
        fetchAISummary,
        aiSummaryLoading,
    } = useConcertDetail(parsedConcertId);

    // 리뷰 목록 hook
    const {
        reviews,
        loading: reviewsLoading,
        error: reviewsError,
        currentPage: reviewsPage,
        totalPages: reviewsTotalPages,
        totalElements: reviewsTotal,
        goToPage: goToReviewsPage,
        changeSorting: changeReviewsSorting,
        sortBy: reviewsSortBy,
        sortDir: reviewsSortDir,
        createReview,
        updateReview,
        deleteReview,
        actionLoading,
    } = useReviews(parsedConcertId);

    // 기대평 목록 hook
    const {
        expectations,
        loading: expectationsLoading,
        error: expectationsError,
        currentPage: expectationsPage,
        totalPages: expectationsTotalPages,
        totalElements: expectationsTotal,
        goToPage: goToExpectationsPage,
        changePageSize: changeExpectationPageSize,
        createExpectation,
        updateExpectation,
        deleteExpectation,
        actionLoading: expectationActionLoading,
    } = useExpectations(parsedConcertId);

    const { enterQueue, isEntering } = useBookingQueue(concertId);

    const { seatGrades, loading: gradesLoading, error: gradesError } = useSeatGrades(parsedConcertId);

    // 리뷰 클릭 핸들러 (상세보기나 수정 등)
    const handleReviewClick = (review) => {
        setExpandedReviews((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(review.id)) {
                newSet.delete(review.id); // 이미 펼쳐져 있으면 접기
            } else {
                newSet.add(review.id); // 접혀있으면 펼치기
            }
            return newSet;
        });
    };

    // 기대평 클릭 핸들러
    const handleExpectationClick = (expectation) => {
        setExpandedExpectations((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(expectation.id)) {
                newSet.delete(expectation.id);
            } else {
                newSet.add(expectation.id);
            }
            return newSet;
        });
    };

    // 리뷰 작성/수정/삭제 핸들러들
    const handleCreateReview = () => {
        if (!currentUser || !currentUser.userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }
        setShowReviewForm(true);
    };
    const handleEditReview = (review) => {
        setEditingReview(review);
        setShowReviewForm(true);
    };
    const handleDeleteReview = async (reviewId) => {
        if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
            try {
                await deleteReview(reviewId);
                alert('리뷰가 삭제되었습니다.');
            } catch (error) {
                alert('리뷰 삭제에 실패했습니다.');
            }
        }
    };

    // 기대평 작성/수정/삭제 핸들러들
    const handleCreateExpectation = () => {
        if (!currentUser || !currentUser.userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }
        setShowExpectationForm(true);
    };
    const handleEditExpectation = (expectation) => {
        setEditingExpectation(expectation);
        setShowExpectationForm(true);
    };
    const handleDeleteExpectation = async (expectationId) => {
        if (window.confirm('정말로 이 기대평을 삭제하시겠습니까?')) {
            try {
                await deleteExpectation(expectationId);
                alert('기대평이 삭제되었습니다.');
            } catch (error) {
                console.error('기대평 삭제 실패:', error);
                alert('기대평 삭제에 실패했습니다.');
            }
        }
    };

    // 콘서트 정보 로딩 중이면 로딩 표시
    if (concertLoading) {
        return (
            <div
                style={{
                    backgroundColor: '#0F172A', // 기존 색상 유지
                    minHeight: '100vh',
                    width: '100vw',
                    margin: 0,
                    padding: 0,
                    overflowX: 'hidden',
                }}
            >
                <div
                    className={
                        isMobile
                            ? 'p-4 overflow-x-hidden'
                            : isTablet
                              ? 'max-w-4xl mx-auto p-4 overflow-x-hidden'
                              : 'max-w-6xl mx-auto p-6 overflow-x-hidden'
                    }
                    style={{
                        backgroundColor: '#0F172A',
                        minHeight: '100vh',
                        color: '#FFFFFF',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* 로딩 카드 */}
                    <div
                        className="rounded-xl shadow-md"
                        style={{
                            backgroundColor: '#1E293B',
                            border: '1px solid #374151',
                            padding: isMobile
                                ? '40px 20px'
                                : isTablet
                                  ? '50px 30px'
                                  : '60px 40px',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: isMobile ? '32px' : '40px',
                                height: isMobile ? '32px' : '40px',
                                border: '4px solid #374151',
                                borderTop: '4px solid #3B82F6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px',
                            }}
                        />
                        <div
                            style={{
                                color: '#FFFFFF',
                                fontSize: isMobile ? '14px' : '18px',
                            }}
                        >
                            콘서트 상세 정보 로딩 중...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 콘서트 정보 에러 시 에러 표시
    if (concertError) {
        return (
            <div
                className={`text-center text-red-500 ${isMobile ? 'py-6 px-4' : 'py-10'}`}
            >
                에러: {concertError}
            </div>
        );
    }

    // 콘서트 정보가 없으면 안내 메시지
    if (!concert) {
        return (
            <div
                className={`text-center text-gray-500 ${isMobile ? 'py-6 px-4' : 'py-10'}`}
            >
                콘서트 정보를 찾을 수 없습니다.
            </div>
        );
    }

    // 현재 콘서트 상태 확인
    const currentStatus = statusConfig[concert.status] || statusConfig.ON_SALE;

    return (
        <div
            style={{
                backgroundColor: '#0F172A',
                minHeight: '100vh',
                width: '100vw',
                margin: 0,
                padding: 0,
                // 🎯 가로 스크롤 방지
                overflowX: 'hidden',
            }}
        >
            <div
                // 🎯 반응형 클래스 적용
                className={
                    isMobile
                        ? 'p-4 overflow-x-hidden'
                        : isTablet
                          ? 'max-w-4xl mx-auto p-4 overflow-x-hidden'
                          : 'max-w-6xl mx-auto p-6 overflow-x-hidden'
                }
                style={{
                    backgroundColor: '#0F172A',
                    minHeight: '100vh',
                    color: '#FFFFFF',
                    // 🎯 박스 사이징
                    boxSizing: 'border-box',
                }}
            >
                <h1
                    // 🎯 반응형 제목 크기
                    className={
                        isMobile
                            ? 'text-xl font-bold mb-4 text-center break-words'
                            : isTablet
                              ? 'text-2xl font-bold mb-5 text-center break-words'
                              : 'text-4xl font-bold mb-6 text-center break-words'
                    }
                    style={{
                        color: '#FFFFFF',
                        // 🎯 모바일에서 패딩 추가
                        padding: isMobile ? '0 8px' : '0',
                        // 🎯 긴 제목 처리
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                    }}
                >
                    {concert.title}
                </h1>

                {/* 🎯 반응형 그리드 레이아웃 */}
                <div
                    className={
                        isMobile
                            ? 'space-y-6' // 모바일: 세로 스택
                            : isTablet
                              ? 'space-y-6' // 태블릿: 세로 스택
                              : 'grid grid-cols-1 lg:grid-cols-3 gap-8' // 데스크톱: 3컬럼 그리드
                    }
                >
                    {/* 좌측 상세 콘텐츠 */}
                    <div
                        className={
                            isMobile
                                ? ''
                                : isTablet
                                  ? ''
                                  : 'lg:col-span-2 space-y-8'
                        }
                    >
                        {/* 각 섹션들 - 반응형 간격 적용 */}
                        <div
                            className={`space-y-${isMobile ? '4' : isTablet ? '5' : '8'}`}
                        >
                            {/* 콘서트 상세 정보 */}
                            <div
                                className="rounded-xl shadow-md"
                                style={{
                                    backgroundColor: '#1E293B',
                                    border: '1px solid #374151',
                                    // 🎯 반응형 패딩
                                    padding: isMobile
                                        ? '16px'
                                        : isTablet
                                          ? '20px'
                                          : '24px',
                                }}
                            >
                                <ConcertDetail
                                    concert={concert}
                                    loading={concertLoading}
                                    error={concertError}
                                    onBookingClick={enterQueue}
                                    isBooking={isEntering}
                                    showBookingButton={!isMobile} // 🎯 모바일에서는 사이드바 버튼 사용
                                    compact={isMobile} // 🎯 모바일에서 컴팩트 모드
                                />
                            </div>

                            {/* AI 요약 컴포넌트 */}
                            {(aiSummary || aiSummaryLoading) && (
                                <div
                                    className="rounded-xl shadow-md"
                                    style={{
                                        backgroundColor: '#1E293B',
                                        border: '1px solid #374151',
                                        padding: isMobile
                                            ? '16px'
                                            : isTablet
                                              ? '20px'
                                              : '24px',
                                    }}
                                >
                                    <AISummary
                                        summary={aiSummary}
                                        loading={aiSummaryLoading}
                                        onRefresh={fetchAISummary}
                                        showRefreshButton={false}
                                        compact={isMobile} // 🎯 모바일에서 컴팩트 모드
                                    />
                                </div>
                            )}

                            {/* 리뷰 목록 컴포넌트 */}
                            <div
                                className="rounded-xl shadow-md"
                                style={{
                                    backgroundColor: '#1E293B',
                                    border: '1px solid #374151',
                                    padding: isMobile
                                        ? '16px'
                                        : isTablet
                                          ? '20px'
                                          : '24px',
                                }}
                            >
                                <ReviewList
                                    reviews={reviews}
                                    loading={reviewsLoading}
                                    error={reviewsError}
                                    currentPage={reviewsPage}
                                    totalPages={reviewsTotalPages}
                                    totalElements={reviewsTotal}
                                    sortBy={reviewsSortBy}
                                    sortDir={reviewsSortDir}
                                    onReviewClick={handleReviewClick}
                                    onSortChange={changeReviewsSorting}
                                    onPageChange={goToReviewsPage}
                                    showSortOptions={true}
                                    showPagination={true}
                                    compact={isMobile} // 🎯 모바일에서 컴팩트 모드
                                    expandedItems={expandedReviews}
                                    currentUserId={currentUser?.userId}
                                    onCreateReview={handleCreateReview}
                                    onEditReview={handleEditReview}
                                    onDeleteReview={handleDeleteReview}
                                />
                            </div>

                            {/* 기대평 목록 컴포넌트 */}
                            <div
                                className="rounded-xl shadow-md"
                                style={{
                                    backgroundColor: '#1E293B',
                                    border: '1px solid #374151',
                                    padding: isMobile
                                        ? '16px'
                                        : isTablet
                                          ? '20px'
                                          : '24px',
                                }}
                            >
                                <ExpectationList
                                    expectations={expectations}
                                    loading={expectationsLoading}
                                    error={expectationsError}
                                    currentPage={expectationsPage}
                                    totalPages={expectationsTotalPages}
                                    totalElements={expectationsTotal}
                                    onExpectationClick={handleExpectationClick}
                                    onPageChange={goToExpectationsPage}
                                    onPageSizeChange={changeExpectationPageSize}
                                    showPagination={true}
                                    compact={isMobile} // 🎯 모바일에서 컴팩트 모드
                                    expandedItems={expandedExpectations}
                                    currentUserId={currentUser?.userId}
                                    onCreateExpectation={
                                        handleCreateExpectation
                                    }
                                    onEditExpectation={handleEditExpectation}
                                    onDeleteExpectation={
                                        handleDeleteExpectation
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* 우측 티켓 정보 사이드바 */}
                    <div
                        className={
                            isMobile
                                ? 'p-4 rounded-xl shadow-md space-y-3' // 모바일: 일반 div
                                : isTablet
                                  ? 'p-5 rounded-xl shadow-md space-y-4' // 태블릿: 일반 div
                                  : 'lg:sticky lg:top-24 lg:self-start p-6 rounded-xl shadow-md space-y-4 h-fit' // 데스크톱: sticky
                        }
                        style={{
                            backgroundColor: '#1E293B',
                            border: '1px solid #374151',
                            // 🎯 모바일에서 하단 여백
                            marginBottom: isMobile ? '16px' : '0',
                        }}
                    >
                        <h2
                            className={
                                isMobile
                                    ? 'text-lg font-bold'
                                    : 'text-xl font-bold'
                            }
                            style={{ color: '#3B82F6' }}
                        >
                            티켓 등급 및 가격
                        </h2>
                        {gradesLoading ? (
                            <div className="text-gray-400 text-sm py-4">
                                가격 정보를 불러오는 중...
                            </div>
                        ) : gradesError ? (
                            <div className="text-red-400 text-sm py-4">
                                {gradesError}
                            </div>
                        ) : seatGrades.length === 0 ? (
                            <div className="text-gray-400 text-sm py-4">
                                좌석 정보가 없습니다.
                            </div>
                        ) : (
                            seatGrades.map((grade) => (
                            <div
                                key={grade.grade}
                                className="flex justify-between rounded-lg shadow-sm"
                                style={{
                                    backgroundColor: '#374151',
                                    border: '1px solid #4B5563',
                                    // 🎯 반응형 패딩
                                    padding: isMobile
                                        ? '12px 16px'
                                        : '16px 20px',
                                }}
                            >
                                <span
                                    className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}
                                    style={{ color: '#FFFFFF' }}
                                >
                                    {grade.gradeName}
                                </span>
                                <span
                                    className={`font-bold ${isMobile ? 'text-sm' : 'text-base'}`}
                                    style={{ color: '#3B82F6' }}
                                >
                                    {Number(grade.price).toLocaleString()}원
                                </span>
                            </div>
                        ))}

                        <button
                            onClick={enterQueue}
                            className={`w-full font-bold rounded-lg transition hover:scale-[1.02] disabled:cursor-not-allowed ${
                                isMobile
                                    ? 'py-3 px-4 text-base mt-3'
                                    : 'py-3 px-6 text-lg mt-2'
                            }`}
                            style={{
                                backgroundColor:
                                    concert.status === 'ON_SALE' && !isEntering
                                        ? '#3B82F6'
                                        : '#6B7280',
                                color: '#FFFFFF',
                                border: 'none',
                                // 🎯 모바일에서 터치 영역 확보
                                minHeight: isMobile ? '48px' : 'auto',
                            }}
                            onMouseEnter={(e) => {
                                if (
                                    concert.status === 'ON_SALE' &&
                                    !isEntering
                                ) {
                                    e.target.style.backgroundColor = '#2563EB';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (
                                    concert.status === 'ON_SALE' &&
                                    !isEntering
                                ) {
                                    e.target.style.backgroundColor = '#3B82F6';
                                }
                            }}
                            disabled={
                                concert.status === 'SOLD_OUT' ||
                                concert.status === 'CANCELLED' ||
                                concert.status === 'COMPLETED' ||
                                concert.status === 'SCHEDULED' ||
                                isEntering
                            }
                        >
                            {isEntering
                                ? '처리 중...'
                                : currentStatus.buttonText}
                        </button>

                        {/* 콘서트 상태 표시 */}
                        <div
                            className={`text-center mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}
                            style={{ color: '#9CA3AF' }}
                        >
                            현재 상태:{' '}
                            <span
                                className="font-semibold"
                                style={{ color: '#3B82F6' }}
                            >
                                {currentStatus.statusText}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 🎯 모달들도 반응형 props 전달 */}
                {showReviewForm && (
                    <Modal
                        isOpen={showReviewForm}
                        onClose={() => {
                            setShowReviewForm(false);
                            setEditingReview(null);
                        }}
                        title={editingReview ? '리뷰 수정' : '리뷰 작성'}
                        isMobile={isMobile} // 🎯 모바일 여부 전달
                    >
                        <ReviewForm
                            mode={editingReview ? 'edit' : 'create'}
                            initialData={editingReview}
                            concertId={parsedConcertId}
                            userId={currentUser?.userId}
                            userNickname={
                                currentUser?.nickname || currentUser?.username
                            }
                            onSubmit={async (reviewData) => {
                                try {
                                    if (editingReview) {
                                        await updateReview(
                                            editingReview.id,
                                            reviewData,
                                        );
                                    } else {
                                        await createReview(reviewData);
                                    }
                                    setShowReviewForm(false);
                                    setEditingReview(null);
                                    alert('리뷰가 저장되었습니다.');
                                } catch (error) {
                                    console.error('리뷰 저장 실패:', error);
                                    alert('리뷰 저장에 실패했습니다.');
                                }
                            }}
                            onCancel={() => {
                                setShowReviewForm(false);
                                setEditingReview(null);
                            }}
                            loading={actionLoading}
                            compact={isMobile} // 🎯 모바일에서 컴팩트 모드
                        />
                    </Modal>
                )}

                {showExpectationForm && (
                    <Modal
                        isOpen={showExpectationForm}
                        onClose={() => {
                            setShowExpectationForm(false);
                            setEditingExpectation(null);
                        }}
                        title={
                            editingExpectation ? '기대평 수정' : '기대평 작성'
                        }
                        isMobile={isMobile} // 🎯 모바일 여부 전달
                    >
                        <ExpectationForm
                            mode={editingExpectation ? 'edit' : 'create'}
                            initialData={editingExpectation}
                            concertId={parsedConcertId}
                            userId={currentUser?.userId}
                            userNickname={
                                currentUser?.nickname || currentUser?.username
                            }
                            onSubmit={async (expectationData) => {
                                try {
                                    if (editingExpectation) {
                                        await updateExpectation(
                                            editingExpectation.id,
                                            expectationData,
                                        );
                                    } else {
                                        await createExpectation(
                                            expectationData,
                                        );
                                    }
                                    setShowExpectationForm(false);
                                    setEditingExpectation(null);
                                    alert('기대평이 저장되었습니다.');
                                } catch (error) {
                                    console.error('기대평 저장 실패:', error);
                                    alert('기대평 저장에 실패했습니다.');
                                }
                            }}
                            onCancel={() => {
                                setShowExpectationForm(false);
                                setEditingExpectation(null);
                            }}
                            loading={expectationActionLoading}
                            compact={isMobile} // 🎯 모바일에서 컴팩트 모드
                        />
                    </Modal>
                )}
            </div>
        </div>
    );
}

export default ConcertDetailPage;
