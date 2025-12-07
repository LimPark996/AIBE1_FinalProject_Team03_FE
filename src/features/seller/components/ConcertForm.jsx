import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    Users,
    Image,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import apiClient from '../../../shared/utils/apiClient.js';
import { concertService } from '../../concert/services/concertService.js';
import { fileUploadService } from '../../../shared/services/fileUploadService.js';

/**
 * ConcertForm.jsx (Responsive Version)
 *
 * 판매자용 콘서트 등록/수정 폼 컴포넌트
 * - 모바일, 태블릿, 데스크톱 완전 반응형 지원
 * - 백엔드 SellerConcertController의 API와 완전히 일치
 * - POST /api/seller/concerts (생성)
 * - PUT /api/seller/concerts/{concertId} (수정)
 * - 백엔드 DTO 검증 규칙과 동일한 클라이언트 검증
 */
const ConcertForm = ({
    isOpen,
    onClose,
    onSuccess,
    concert = null, // 수정 모드일 때 기존 콘서트 데이터
    sellerId,
    modal = true, // 모달 모드 여부
}) => {
    // ====== 상태 관리 ======
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [filePreview, setFilePreview] = useState(null);
    const [imageLoadError, setImageLoadError] = useState(false);
    const [imageLoadTesting, setImageLoadTesting] = useState(false);
    const fileInputRef = useRef(null);

    // ✅ 세션 추적 및 롤백 관련 상태
    const [originalPosterUrl, setOriginalPosterUrl] = useState(''); // 원본 포스터 URL
    const [uploadedInSession, setUploadedInSession] = useState([]); // 세션 중 업로드된 URL들
    const [isFormDirty, setIsFormDirty] = useState(false); // 폼 변경 여부

    // 폼 데이터 - 백엔드 DTO와 완전히 일치
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        venueName: '',
        concertDate: '',
        startTime: '',
        endTime: '',
        totalSeats: '',
        bookingStartDate: '',
        bookingEndDate: '',
        description: '',
        venueAddress: '',
        minAge: 0,
        maxTicketsPerUser: 4,
        posterImageUrl: '',
        status: 'SCHEDULED',
    });

    const isEditMode = !!concert;

    // ====== 초기화 ======
    useEffect(() => {
        if (isEditMode && concert) {
            const initialPosterUrl = concert.posterImageUrl || '';

            setFormData({
                title: concert.title || '',
                artist: concert.artist || '',
                description: concert.description || '',
                venueName: concert.venueName || '',
                venueAddress: concert.venueAddress || '',
                concertDate: concert.concertDate || '',
                startTime: concert.startTime || '',
                endTime: concert.endTime || '',
                totalSeats: concert.totalSeats?.toString() || '',
                bookingStartDate: concert.bookingStartDate
                    ? new Date(concert.bookingStartDate)
                          .toISOString()
                          .slice(0, 16)
                    : '',
                bookingEndDate: concert.bookingEndDate
                    ? new Date(concert.bookingEndDate)
                          .toISOString()
                          .slice(0, 16)
                    : '',
                minAge: concert.minAge || 0,
                maxTicketsPerUser: concert.maxTicketsPerUser || 4,
                posterImageUrl: concert.posterImageUrl || '',
                status: concert.status || 'SCHEDULED',
            });

            setOriginalPosterUrl(initialPosterUrl);
        } else {
            // 생성 모드: 기본값으로 초기화
            setFormData({
                title: '',
                artist: '',
                description: '',
                venueName: '',
                venueAddress: '',
                concertDate: '',
                startTime: '',
                endTime: '',
                totalSeats: '',
                bookingStartDate: '',
                bookingEndDate: '',
                minAge: 0,
                maxTicketsPerUser: 4,
                posterImageUrl: '',
                status: 'SCHEDULED',
            });
            setOriginalPosterUrl('');
        }

        // ✅ 세션 상태 초기화
        setUploadedInSession([]);
        setIsFormDirty(false);
        setImageLoadError(false);
        setImageLoadTesting(false);
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        setUploading(false);
        setErrors({});
        setSubmitError('');
        setSubmitSuccess('');

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [isEditMode, concert]);

    // ✅ 컴포넌트 언마운트 시 정리 (중복 제거)
    useEffect(() => {
        return () => {
            fileUploadService.clearActiveUploads();
        };
    }, []);

    // ====== 입력 핸들러 ======
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        let processedValue = value;
        if (type === 'number') {
            processedValue = value === '' ? '' : Number(value);
        }

        setFormData((prev) => ({
            ...prev,
            [name]: processedValue,
        }));

        setIsFormDirty(true);

        // 해당 필드의 에러 클리어
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    // ====== 클라이언트 검증 ======
    const validateForm = () => {
        const newErrors = {};

        // 필수 문자열 필드 검증 (NotBlank)
        if (!formData.title?.trim()) {
            newErrors.title = '콘서트 제목은 필수입니다';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = '콘서트 제목은 100자 이하여야 합니다';
        }

        if (!formData.artist?.trim()) {
            newErrors.artist = '아티스트명은 필수입니다';
        } else if (formData.artist.trim().length > 50) {
            newErrors.artist = '아티스트명은 50자 이하여야 합니다';
        }

        if (!formData.venueName?.trim()) {
            newErrors.venueName = '공연장명은 필수입니다';
        } else if (formData.venueName.trim().length > 100) {
            newErrors.venueName = '공연장명은 100자 이하여야 합니다';
        }

        // 선택 문자열 필드 길이 검증
        if (formData.description && formData.description.length > 1000) {
            newErrors.description = '콘서트 설명은 1000자 이하여야 합니다';
        }

        if (formData.venueAddress && formData.venueAddress.length > 200) {
            newErrors.venueAddress = '공연장 주소는 200자 이하여야 합니다';
        }

        // 날짜 필드 검증 (NotNull, Future)
        if (!formData.concertDate) {
            newErrors.concertDate = '콘서트 날짜는 필수입니다';
        } else {
            const concertDate = new Date(formData.concertDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (concertDate <= today) {
                newErrors.concertDate =
                    '콘서트 날짜는 현재 날짜보다 이후여야 합니다';
            }
        }

        // 시간 필드 검증 (NotNull)
        if (!formData.startTime) {
            newErrors.startTime = '시작 시간은 필수입니다';
        }

        if (!formData.endTime) {
            newErrors.endTime = '종료 시간은 필수입니다';
        }

        // 시간 순서 검증
        if (formData.startTime && formData.endTime) {
            if (formData.endTime <= formData.startTime) {
                newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다';
            }
        }

        // 좌석 수 검증 (NotNull, Positive, Max)
        if (!formData.totalSeats) {
            newErrors.totalSeats = '총 좌석 수는 필수입니다';
        } else {
            const seats = parseInt(formData.totalSeats);
            if (isNaN(seats) || seats <= 0) {
                newErrors.totalSeats = '총 좌석 수는 양수여야 합니다';
            } else if (seats > 100000) {
                newErrors.totalSeats = '총 좌석 수는 100,000석 이하여야 합니다';
            }
        }

        // 예매 일시 검증 (NotNull, Future)
        if (!formData.bookingStartDate) {
            newErrors.bookingStartDate = '예매 시작일시는 필수입니다';
        }

        if (!formData.bookingEndDate) {
            newErrors.bookingEndDate = '예매 종료일시는 필수입니다';
        }

        // 예매 시간 순서 검증
        if (formData.bookingStartDate && formData.bookingEndDate) {
            const bookingStart = new Date(formData.bookingStartDate);
            const bookingEnd = new Date(formData.bookingEndDate);

            if (bookingEnd <= bookingStart) {
                newErrors.bookingEndDate =
                    '예매 종료일시는 예매 시작일시보다 늦어야 합니다';
            }
        }

        // 예매 기간과 공연 날짜 검증
        if (
            formData.bookingEndDate &&
            formData.concertDate &&
            formData.startTime
        ) {
            const bookingEnd = new Date(formData.bookingEndDate);
            const concertStart = new Date(
                `${formData.concertDate}T${formData.startTime}`,
            );

            if (bookingEnd >= concertStart) {
                newErrors.bookingEndDate =
                    '예매 종료일시는 공연 시작 전이어야 합니다';
            }
        }

        // 연령 제한 검증 (Min, Max)
        const minAge = parseInt(formData.minAge);
        if (isNaN(minAge) || minAge < 0) {
            newErrors.minAge = '최소 연령은 0세 이상이어야 합니다';
        } else if (minAge > 100) {
            newErrors.minAge = '최소 연령은 100세 이하여야 합니다';
        }

        // 최대 티켓 수 검증 (Min, Max)
        const maxTickets = parseInt(formData.maxTicketsPerUser);
        if (isNaN(maxTickets) || maxTickets < 1) {
            newErrors.maxTicketsPerUser =
                '사용자당 최대 티켓 수는 1개 이상이어야 합니다';
        } else if (maxTickets > 10) {
            newErrors.maxTicketsPerUser =
                '사용자당 최대 티켓 수는 10개 이하여야 합니다';
        }

        // 포스터 URL 패턴 검증
        if (formData.posterImageUrl) {
            try {
                const url = new URL(formData.posterImageUrl);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    newErrors.posterImageUrl = '올바른 URL 형식이 아닙니다';
                }
            } catch (e) {
                newErrors.posterImageUrl = '올바른 URL 형식이 아닙니다';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ====== API 호출 ======
    const createConcert = async () => {
        const createData = {
            title: formData.title.trim(),
            artist: formData.artist.trim(),
            description: formData.description?.trim() || null,
            venueName: formData.venueName.trim(),
            venueAddress: formData.venueAddress?.trim() || null,
            concertDate: formData.concertDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            totalSeats: formData.totalSeats,
            bookingStartDate: formData.bookingStartDate,
            bookingEndDate: formData.bookingEndDate,
            minAge: formData.minAge,
            maxTicketsPerUser: formData.maxTicketsPerUser,
            posterImageUrl: formData.posterImageUrl?.trim() || null,
            status: formData.status,
        };

        return await concertService.createConcert(sellerId, createData);
    };

    const updateConcert = async () => {
        const updateData = {};

        // 변경된 필드만 포함
        if (formData.title?.trim()) updateData.title = formData.title.trim();
        if (formData.artist?.trim()) updateData.artist = formData.artist.trim();
        if (formData.description !== undefined)
            updateData.description = formData.description?.trim() || null;
        if (formData.venueName?.trim())
            updateData.venueName = formData.venueName.trim();
        if (formData.venueAddress !== undefined)
            updateData.venueAddress = formData.venueAddress?.trim() || null;
        if (formData.concertDate) updateData.concertDate = formData.concertDate;
        if (formData.startTime) updateData.startTime = formData.startTime;
        if (formData.endTime) updateData.endTime = formData.endTime;
        if (formData.totalSeats) updateData.totalSeats = formData.totalSeats;
        if (formData.bookingStartDate)
            updateData.bookingStartDate = formData.bookingStartDate;
        if (formData.bookingEndDate)
            updateData.bookingEndDate = formData.bookingEndDate;
        if (formData.minAge !== undefined) updateData.minAge = formData.minAge;
        if (formData.maxTicketsPerUser !== undefined)
            updateData.maxTicketsPerUser = formData.maxTicketsPerUser;
        if (formData.status) updateData.status = formData.status;
        if (formData.posterImageUrl !== undefined)
            updateData.posterImageUrl = formData.posterImageUrl?.trim() || null;

        return await concertService.updateConcert(
            sellerId,
            concert.concertId,
            updateData,
        );
    };

    // ====== 세션 롤백 함수 ======
    const rollbackSessionUploads = async () => {
        if (uploadedInSession.length === 0) return;

        console.log('🔄 세션 중 업로드된 파일들 롤백 시작:', uploadedInSession);

        for (const uploadedUrl of uploadedInSession) {
            try {
                if (isEditMode && concert?.concertId) {
                    // ✅ 수정 모드: 각 업로드된 파일을 개별적으로 삭제
                    // 고유 파일명이므로 URL로 직접 삭제 가능
                    await fileUploadService.deleteSpecificFile(
                        uploadedUrl,
                        concert.concertId,
                        sellerId,
                    );
                    console.log(
                        '✅ 롤백 완료 (Supabase 개별 파일 삭제):',
                        uploadedUrl,
                    );
                } else {
                    // ✅ 생성 모드: 임시 업로드된 파일들 삭제
                    await fileUploadService.deleteSpecificFile(
                        uploadedUrl,
                        null,
                        sellerId,
                    );
                    console.log('✅ 롤백 완료 (임시 파일 삭제):', uploadedUrl);
                }
            } catch (error) {
                console.error('❌ 롤백 실패:', uploadedUrl, error);
            }
        }

        // 롤백 완료 후 추적 배열 초기화
        setUploadedInSession([]);
    };

    // ====== 폼 닫기 핸들러 ======
    const handleClose = async () => {
        console.log('🚪 폼 닫기 시도:', {
            isFormDirty: isFormDirty,
            uploadedInSessionCount: uploadedInSession.length,
            currentPosterUrl: formData.posterImageUrl,
        });
        let shouldClose = true;

        // 변경사항이 있는 경우 확인
        if (isFormDirty || uploadedInSession.length > 0) {
            const message = isEditMode
                ? '수정 중인 내용이 있습니다. 정말 취소하시겠습니까?\n(업로드된 이미지가 있다면 삭제됩니다)'
                : '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?\n(업로드된 이미지가 있다면 삭제됩니다)';

            shouldClose = confirm(message);
            console.log('🔍 폼 닫기 확인 결과:', shouldClose);
        }

        if (shouldClose) {
            // 세션 중 업로드된 파일들 롤백
            if (uploadedInSession.length > 0) {
                console.log('🔄 폼 닫기 - 세션 롤백 시작:', uploadedInSession);
                await rollbackSessionUploads();

                if (isEditMode) {
                    // 수정 모드: 원본 URL로 복구 (완전한 복구!)
                    setFormData((prev) => ({
                        ...prev,
                        posterImageUrl: originalPosterUrl,
                    }));

                    // 원본 URL이 있다면 DB도 원본으로 복구
                    if (originalPosterUrl && concert?.concertId) {
                        try {
                            await fileUploadService.restoreOriginalPoster(
                                concert.concertId,
                                sellerId,
                                originalPosterUrl,
                            );
                            console.log(
                                '✅ DB 원본 URL 복구 완료:',
                                originalPosterUrl,
                            );
                        } catch (error) {
                            console.error('❌ DB 원본 URL 복구 실패:', error);
                        }
                    }
                }
            }

            // 진행 중인 업로드 정리
            fileUploadService.clearActiveUploads();
            console.log('✅ 폼 닫기 완료');
            onClose();
        }
    };

    // ====== 폼 제출 핸들러 (단일 정의) ======
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        console.log('📤 폼 제출 시작:', {
            isEditMode: isEditMode,
            formData: formData,
            uploadedInSession: uploadedInSession,
        });

        setLoading(true);
        setSubmitError('');
        setSubmitSuccess('');

        try {
            const result = isEditMode
                ? await updateConcert()
                : await createConcert();

            console.log('✅ 폼 제출 결과:', result);

            if (result && result.success !== false) {
                setSubmitSuccess(
                    isEditMode
                        ? '콘서트가 수정되었습니다.'
                        : '콘서트가 성공적으로 등록되었습니다.',
                );
                // 성공 시 세션 추적 초기화 (더 이상 롤백하지 않음)
                setUploadedInSession([]);
                setIsFormDirty(false);

                console.log('✅ 폼 제출 성공 - 세션 상태 초기화 완료');

                setTimeout(() => {
                    onSuccess && onSuccess(result.data);
                    onClose();
                }, 1500);
            } else {
                console.error('❌ 폼 제출 실패:', result?.message);
                setSubmitError(
                    result?.message || '처리 중 오류가 발생했습니다.',
                );
                // 실패 시 롤백
                if (uploadedInSession.length > 0) {
                    console.log('🔄 폼 제출 실패 - 롤백 시작');
                    await rollbackSessionUploads();
                    if (isEditMode) {
                        setFormData((prev) => ({
                            ...prev,
                            posterImageUrl: originalPosterUrl,
                        }));

                        // DB도 원본으로 복구
                        if (originalPosterUrl && concert?.concertId) {
                            try {
                                await fileUploadService.restoreOriginalPoster(
                                    concert.concertId,
                                    sellerId,
                                    originalPosterUrl,
                                );
                            } catch (error) {
                                console.error('❌ DB 원본 복구 실패:', error);
                            }
                        }
                    } else {
                        setFormData((prev) => ({
                            ...prev,
                            posterImageUrl: '',
                        }));
                    }
                }
            }
        } catch (error) {
            setSubmitError('네트워크 오류가 발생했습니다.');

            // 에러 시에도 롤백
            if (uploadedInSession.length > 0) {
                console.log('🔄 폼 제출 에러 - 롤백 시작');
                await rollbackSessionUploads();
                if (isEditMode) {
                    setFormData((prev) => ({
                        ...prev,
                        posterImageUrl: originalPosterUrl,
                    }));

                    if (originalPosterUrl && concert?.concertId) {
                        try {
                            await fileUploadService.restoreOriginalPoster(
                                concert.concertId,
                                sellerId,
                                originalPosterUrl,
                            );
                        } catch (error) {
                            console.error('❌ DB 원본 복구 실패:', error);
                        }
                    }
                } else {
                    setFormData((prev) => ({ ...prev, posterImageUrl: '' }));
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // ====== 파일 관련 핸들러 ======
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 기존 선택된 파일과 미리보기 초기화
        setSelectedFile(null);
        setFilePreview(null);
        setImageLoadError(false);

        // 파일 검증
        const validation = fileUploadService.validateFile(file);
        if (!validation.valid) {
            alert(validation.error);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setSelectedFile(file);

        // 미리보기 생성
        try {
            const dataURL = await fileUploadService.fileToDataURL(file);
            setFilePreview(dataURL);
        } catch (error) {
            console.error('미리보기 생성 실패:', error);
            alert('이미지 미리보기 생성에 실패했습니다.');
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        if (uploading) {
            alert('이미 업로드가 진행 중입니다.');
            return;
        }

        if (fileUploadService.getActiveUploadCount() > 0) {
            alert(
                '다른 파일 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.',
            );
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // ✅ 기존 이미지가 있는 경우 확인 메시지
            if (
                formData.posterImageUrl &&
                !confirm('기존 이미지를 새 이미지로 교체하시겠습니까?')
            ) {
                return;
            }

            // ✅ 고유 파일명으로 업로드 (백엔드에서 자동으로 고유 파일명 생성됨)
            const result = await fileUploadService.uploadPosterImage(
                selectedFile,
                isEditMode ? concert.concertId : null,
                (progress) => setUploadProgress(progress),
            );

            if (result && result.success !== false) {
                // ✅ 캐시 버스터 추가 (고유 파일명이지만 브라우저 캐싱 방지용)
                const urlWithCacheBuster = `${result.data}?t=${Date.now()}`;

                // ✅ 업로드된 URL을 세션 추적에 추가 (원본 URL, 캐시 버스터 제거)
                const cleanUrl = result.data; // 캐시 버스터 없는 원본 URL
                setUploadedInSession((prev) => [...prev, cleanUrl]);

                setFormData((prev) => ({
                    ...prev,
                    posterImageUrl: urlWithCacheBuster,
                }));

                setIsFormDirty(true);
                setImageLoadError(false);
                alert('포스터 이미지가 업로드되었습니다!');

                // 선택된 파일 정보 초기화
                setSelectedFile(null);
                setFilePreview(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                console.log('✅ 새 이미지 URL 설정 완료:', urlWithCacheBuster);
                console.log('✅ 세션 중 업로드된 URL들:', [
                    ...uploadedInSession,
                    cleanUrl,
                ]);
            } else {
                throw new Error(result?.message || '업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`업로드 실패: ${error.message}`);

            setSelectedFile(null);
            setFilePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        setUploading(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.files = null;
        }
    };

    const handlePosterUrlChange = async (e) => {
        const url = e.target.value;

        // 기본 input 변경 처리
        handleInputChange(e);

        // 이미지 로드 에러 상태 리셋
        setImageLoadError(false);
        setImageLoadTesting(false);

        // URL이 비어있으면 검증 스킵
        if (!url.trim()) {
            return;
        }

        const urlValidation = fileUploadService.validateImageUrl(url);
        if (!urlValidation.valid) {
            setImageLoadError(true);
        }

        console.log('⚠️ 이미지 로드 테스트 시작');
        setImageLoadTesting(true);

        try {
            const loadTest = await fileUploadService.testImageLoad(url);
            if (!loadTest.loadable) {
                setImageLoadError(true);
            }
        } catch (error) {
            console.error('이미지 로드 테스트 실패:', error);
            setImageLoadError(true);
        } finally {
            setImageLoadTesting(false);
        }
    };

    const handleRemoveUploadedImage = async () => {
        if (!formData.posterImageUrl) {
            console.log('🔍 이미지 제거 시도 - 제거할 URL이 없음');
            return;
        }

        console.log('🗑️ 이미지 제거 시작:', {
            currentUrl: formData.posterImageUrl,
            isEditMode: isEditMode,
            concertId: concert?.concertId,
            sellerId: sellerId,
        });

        if (
            !confirm(
                '포스터 이미지를 완전히 삭제하시겠습니까?\n(Supabase와 DB에서 모두 제거됩니다)',
            )
        ) {
            console.log('🔍 이미지 제거 취소됨');
            return;
        }

        try {
            // 현재 URL이 세션 중 업로드된 것인지 확인 (캐시 버스터 제거)
            const currentUrlBase = formData.posterImageUrl.split('?')[0];
            const isSessionUpload = uploadedInSession.includes(currentUrlBase);

            console.log('🔍 제거 대상 분석:', {
                currentUrlBase: currentUrlBase,
                isSessionUpload: isSessionUpload,
                uploadedInSession: uploadedInSession,
            });

            if (isEditMode && concert?.concertId) {
                // 수정 모드에서 기존 콘서트 이미지 삭제
                console.log('🗑️ 수정 모드 - 특정 파일 삭제 API 호출');

                const deleteResult = await fileUploadService.deleteSpecificFile(
                    currentUrlBase,
                    concert.concertId,
                    sellerId,
                );

                console.log('🔍 삭제 API 응답:', deleteResult);

                if (deleteResult.success) {
                    // 세션 추적에서 제거
                    if (isSessionUpload) {
                        console.log('🔄 세션 추적에서 제거');
                        setUploadedInSession((prev) =>
                            prev.filter((url) => url !== currentUrlBase),
                        );
                    }

                    // 핵심: 폼 상태 업데이트
                    console.log(
                        '🔄 폼 상태 업데이트 - posterImageUrl을 빈 문자열로 설정',
                    );
                    setFormData((prev) => ({
                        ...prev,
                        posterImageUrl: '',
                    }));

                    // 기타 상태 초기화
                    setImageLoadError(false);
                    setSelectedFile(null);
                    setFilePreview(null);

                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }

                    setIsFormDirty(true);
                    console.log('✅ 이미지 제거 완료 - 상태 업데이트됨');
                    alert('포스터 이미지가 완전히 삭제되었습니다.');
                } else {
                    console.error('❌ 삭제 API 실패:', deleteResult.message);
                    alert(`포스터 삭제 실패: ${deleteResult.message}`);
                }
            } else {
                // 생성 모드 또는 임시 업로드의 경우
                console.log('🗑️ 생성 모드 - 임시 파일 삭제');
                if (isSessionUpload) {
                    try {
                        await fileUploadService.deleteSpecificFile(
                            currentUrlBase,
                            null,
                            sellerId,
                        );
                        console.log('✅ 임시 파일 삭제 완료');
                    } catch (error) {
                        console.error('❌ 임시 파일 삭제 실패:', error);
                    }

                    setUploadedInSession((prev) =>
                        prev.filter((url) => url !== currentUrlBase),
                    );
                }

                // 폼 상태 업데이트
                console.log('🔄 생성 모드 - 폼 상태 초기화');
                setFormData((prev) => ({
                    ...prev,
                    posterImageUrl: '', // null이 아닌 빈 문자열
                }));

                setImageLoadError(false);
                setSelectedFile(null);
                setFilePreview(null);
                setIsFormDirty(true);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                console.log('✅ 생성 모드 이미지 제거 완료');
                alert('이미지가 제거되었습니다.');
            }
            // 디버깅: 최종 상태 확인
            console.log('🔍 이미지 제거 후 최종 상태:', {
                posterImageUrl: formData.posterImageUrl,
                uploadedInSession: uploadedInSession,
                isFormDirty: isFormDirty,
            });
        } catch (error) {
            console.error('❌ 포스터 삭제 중 오류:', error);
            alert('포스터 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleImageLoadError = (e) => {
        console.error('이미지 로드 실패:', e.target.src);
        setImageLoadError(true);
    };

    const handleImageLoadSuccess = () => {
        console.log('이미지 로드 성공');
        setImageLoadError(false);
    };

    // 이미지 미리보기 렌더링 부분 개선 (반응형)
    const renderImagePreview = () => {
        if (!formData.posterImageUrl || errors.posterImageUrl) {
            return null;
        }

        return (
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-200">
                        미리보기
                    </p>
                    <button
                        type="button"
                        onClick={handleRemoveUploadedImage}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        이미지 제거
                    </button>
                </div>

                {/* 반응형 이미지 컨테이너 */}
                <div className="w-full max-w-xs sm:w-32 h-48 border border-gray-600 rounded-lg overflow-hidden relative mx-auto sm:mx-0">
                    {!imageLoadError ? (
                        <>
                            <img
                                src={formData.posterImageUrl}
                                alt="포스터 미리보기"
                                className="w-full h-full object-cover"
                                onError={handleImageLoadError}
                                onLoad={handleImageLoadSuccess}
                            />
                            {imageLoadTesting && (
                                <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <div className="text-xs">
                                            로딩 중...
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-gray-800 text-gray-400 flex flex-col items-center justify-center text-sm p-4">
                            <div className="text-center">
                                <div className="text-red-400 mb-2 text-lg">
                                    ⚠️
                                </div>
                                <div className="text-xs leading-relaxed">
                                    이미지를 불러올 수<br />
                                    없습니다.
                                    <br />
                                    URL을 확인해주세요.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    // 모달 모드가 아닐 때는 isOpen 체크 안 함
    if (modal && !isOpen) return null;

    // ====== 폼 컨텐츠 렌더링 함수 (반응형 개선) ======
    const renderFormContent = () => (
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* 기본 정보 섹션 */}
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        기본 정보
                    </h3>
                </div>

                {/* 콘서트 제목 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        콘서트 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.title ? 'border-red-500' : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="콘서트 제목을 입력하세요"
                        maxLength={100}
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.title}
                        </p>
                    )}
                </div>

                {/* 아티스트명 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        아티스트명 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="artist"
                        value={formData.artist}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.artist ? 'border-red-500' : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="아티스트명을 입력하세요"
                        maxLength={50}
                    />
                    {errors.artist && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.artist}
                        </p>
                    )}
                </div>

                {/* 콘서트 설명 */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        콘서트 설명
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.description
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="콘서트에 대한 상세 설명을 입력하세요"
                        maxLength={1000}
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.description}
                        </p>
                    )}
                </div>

                {/* 공연장 정보 섹션 */}
                <div className="lg:col-span-2 mt-4 lg:mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MapPin size={20} />
                        공연장 정보
                    </h3>
                </div>

                {/* 공연장명 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        공연장명 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="venueName"
                        value={formData.venueName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.venueName
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="공연장명을 입력하세요"
                        maxLength={100}
                    />
                    {errors.venueName && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.venueName}
                        </p>
                    )}
                </div>

                {/* 공연장 주소 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        공연장 주소
                    </label>
                    <input
                        type="text"
                        name="venueAddress"
                        value={formData.venueAddress}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.venueAddress
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="공연장 주소를 입력하세요"
                        maxLength={200}
                    />
                    {errors.venueAddress && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.venueAddress}
                        </p>
                    )}
                </div>

                {/* 일시 정보 섹션 */}
                <div className="lg:col-span-2 mt-4 lg:mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar size={20} />
                        일시 정보
                    </h3>
                </div>

                {/* 첫 번째 행: 공연 날짜, 총 좌석 수 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        공연 날짜 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        name="concertDate"
                        value={formData.concertDate}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.concertDate
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white`}
                    />
                    {errors.concertDate && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.concertDate}
                        </p>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        총 좌석 수 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="totalSeats"
                        value={formData.totalSeats}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.totalSeats
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="총 좌석 수를 입력하세요"
                        min={1}
                        max={100000}
                    />
                    {errors.totalSeats && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.totalSeats}
                        </p>
                    )}
                </div>

                {/* 두 번째 행: 시작/종료 시간 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        시작 시간 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.startTime
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white`}
                    />
                    {errors.startTime && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.startTime}
                        </p>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        종료 시간 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.endTime
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white`}
                    />
                    {errors.endTime && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.endTime}
                        </p>
                    )}
                </div>

                {/* 예매 정보 섹션 */}
                <div className="lg:col-span-2 mt-4 lg:mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} />
                        예매 정보
                    </h3>
                </div>

                {/* 예매 시작/종료 일시 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        예매 시작일시 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="bookingStartDate"
                        value={formData.bookingStartDate}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.bookingStartDate
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white`}
                    />
                    {errors.bookingStartDate && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.bookingStartDate}
                        </p>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        예매 종료일시 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="bookingEndDate"
                        value={formData.bookingEndDate}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.bookingEndDate
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white`}
                    />
                    {errors.bookingEndDate && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.bookingEndDate}
                        </p>
                    )}
                </div>

                {/* 추가 설정 섹션 */}
                <div className="lg:col-span-2 mt-4 lg:mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users size={20} />
                        추가 설정
                    </h3>
                </div>

                {/* 연령 제한과 최대 티켓 수 */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        최소 연령 제한
                    </label>
                    <input
                        type="number"
                        name="minAge"
                        value={formData.minAge}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.minAge ? 'border-red-500' : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="최소 연령을 입력하세요"
                        min={0}
                        max={100}
                    />
                    {errors.minAge && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.minAge}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                        0세는 연령 제한 없음을 의미합니다
                    </p>
                </div>

                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        사용자당 최대 구매 티켓 수
                    </label>
                    <input
                        type="number"
                        name="maxTicketsPerUser"
                        value={formData.maxTicketsPerUser}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            errors.maxTicketsPerUser
                                ? 'border-red-500'
                                : 'border-gray-600'
                        } bg-gray-700 text-white placeholder-gray-400`}
                        placeholder="최대 구매 가능 티켓 수"
                        min={1}
                        max={10}
                    />
                    {errors.maxTicketsPerUser && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.maxTicketsPerUser}
                        </p>
                    )}
                </div>

                {/* 콘서트 상태 선택 - 전체 너비 */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        콘서트 상태
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    >
                        <option value="SCHEDULED">예정됨</option>
                        <option value="ON_SALE">예매중</option>
                        <option value="SOLD_OUT">매진</option>
                        <option value="BOOKING_CLOSED">예매 종료</option>
                        <option value="CANCELLED">취소됨</option>
                        <option value="COMPLETED">완료됨</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-400">
                        {isEditMode
                            ? '상태 변경 시 신중하게 선택해주세요'
                            : '초기 콘서트 상태를 선택해주세요'}
                    </p>
                </div>

                {/* 포스터 이미지 섹션 */}
                <div className="lg:col-span-2 mt-4 lg:mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Image size={20} />
                        포스터 이미지
                    </h3>
                </div>

                {/* 파일 업로드 섹션 - 반응형 개선 */}
                <div className="lg:col-span-2 mb-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        포스터 이미지 파일 업로드
                    </label>

                    {/* 파일 선택 - 반응형 */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="flex-1 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            disabled={uploading}
                        />

                        <div className="flex gap-2">
                            {selectedFile && (
                                <button
                                    type="button"
                                    onClick={handleFileUpload}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                                >
                                    {uploading
                                        ? `업로드 중... ${uploadProgress}%`
                                        : '업로드'}
                                </button>
                            )}

                            {selectedFile && !uploading && (
                                <button
                                    type="button"
                                    onClick={handleClearFile}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
                                >
                                    취소
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 선택된 파일 정보 */}
                    {selectedFile && (
                        <div className="text-sm text-gray-400 mb-2 break-all">
                            선택된 파일: {selectedFile.name} (
                            {fileUploadService.formatFileSize(
                                selectedFile.size,
                            )}
                            )
                        </div>
                    )}

                    {/* 업로드 진행률 바 */}
                    {uploading && (
                        <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    {/* 파일 미리보기 - 반응형 */}
                    {filePreview && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-200 mb-2">
                                업로드할 이미지 미리보기
                            </p>
                            <div className="w-full max-w-xs sm:w-32 h-48 border border-gray-600 rounded-lg overflow-hidden mx-auto sm:mx-0">
                                <img
                                    src={filePreview}
                                    alt="업로드할 이미지 미리보기"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                        또는 아래에 직접 URL을 입력하세요
                    </p>
                </div>

                {/* 포스터 이미지 URL - 반응형 개선 */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                        포스터 이미지 URL (직접 입력)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="url"
                                name="posterImageUrl"
                                value={formData.posterImageUrl}
                                onChange={handlePosterUrlChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                                    errors.posterImageUrl || imageLoadError
                                        ? 'border-red-500'
                                        : 'border-gray-600'
                                } bg-gray-700 text-white placeholder-gray-400`}
                                placeholder="https://example.com/poster.jpg"
                            />
                            {imageLoadTesting && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        {formData.posterImageUrl && (
                            <button
                                type="button"
                                onClick={handleRemoveUploadedImage}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm whitespace-nowrap sm:self-start"
                                title="이미지 제거"
                            >
                                ✕ 제거
                            </button>
                        )}
                    </div>

                    {errors.posterImageUrl && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.posterImageUrl}
                        </p>
                    )}

                    {imageLoadError &&
                        formData.posterImageUrl &&
                        !imageLoadTesting && (
                            <div className="mt-2 p-3 bg-yellow-800 border border-yellow-600 rounded text-yellow-200 text-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="text-lg">⚠️</span>
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            이미지를 불러올 수 없습니다
                                        </div>
                                        <div className="text-xs mt-1 text-yellow-300">
                                            • URL이 올바른지 확인해주세요
                                            <br />
                                            • 외부 사이트의 경우 접근 제한이
                                            있을 수 있습니다
                                            <br />• 파일 업로드를 이용하시는
                                            것을 권장합니다
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    <p className="mt-1 text-xs text-gray-400">
                        지원 형식: jpg, jpeg, png, gif, webp
                        <br className="sm:hidden" />
                        <span className="hidden sm:inline"> • </span>
                        외부 이미지는 CORS 정책에 따라 로드되지 않을 수
                        있습니다.
                    </p>

                    {formData.posterImageUrl &&
                        !errors.posterImageUrl &&
                        renderImagePreview()}
                </div>
            </div>

            {/* 폼 액션 버튼들 - 반응형 개선 */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-600">
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto px-6 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors order-2 sm:order-1"
                    disabled={loading}
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                    {loading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {loading
                        ? '처리 중...'
                        : isEditMode
                          ? '수정하기'
                          : '등록하기'}
                </button>
            </div>
        </form>
    );

    // 모달 모드 렌더링 - 반응형 개선
    if (modal) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-gray-800 text-white rounded-lg w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-600">
                    {/* 헤더 - 반응형 */}
                    <div className="sticky top-0 z-10 bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-600">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                            {isEditMode ? '콘서트 수정' : '콘서트 등록'}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                            aria-label="닫기"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* 성공/에러 메시지 - 반응형 */}
                    {submitSuccess && (
                        <div className="mx-4 sm:mx-6 mt-4 p-3 sm:p-4 bg-green-800 border border-green-600 rounded-lg flex items-start gap-2">
                            <CheckCircle
                                size={20}
                                className="text-green-600 flex-shrink-0 mt-0.5"
                            />
                            <span className="text-green-100 text-sm sm:text-base">
                                {submitSuccess}
                            </span>
                        </div>
                    )}
                    {submitError && (
                        <div className="mx-4 sm:mx-6 mt-4 p-3 sm:p-4 bg-red-800 border border-red-600 rounded-lg flex items-start gap-2">
                            <AlertCircle
                                size={20}
                                className="text-red-600 flex-shrink-0 mt-0.5"
                            />
                            <span className="text-red-100 text-sm sm:text-base break-words">
                                {submitError}
                            </span>
                        </div>
                    )}

                    {/* 폼 */}
                    {renderFormContent()}
                </div>
            </div>
        );
    }

    // 페이지 모드 렌더링 - 반응형 개선
    return (
        <div className="w-full p-2 sm:p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-5xl mx-auto border border-gray-600">
                {/* 성공/에러 메시지 - 반응형 */}
                {submitSuccess && (
                    <div className="mb-4 p-3 sm:p-4 bg-green-800 border-green-600 border rounded-lg flex items-start gap-2">
                        <CheckCircle
                            size={20}
                            className="text-green-300 flex-shrink-0 mt-0.5"
                        />
                        <span className="text-green-100 text-sm sm:text-base">
                            {submitSuccess}
                        </span>
                    </div>
                )}

                {submitError && (
                    <div className="mb-4 p-3 sm:p-4 bg-red-800 border-red-600 border rounded-lg flex items-start gap-2">
                        <AlertCircle
                            size={20}
                            className="text-red-300 flex-shrink-0 mt-0.5"
                        />
                        <span className="text-red-100 text-sm sm:text-base break-words">
                            {submitError}
                        </span>
                    </div>
                )}

                {/* 폼 */}
                {renderFormContent()}
            </div>
        </div>
    );
};

export default ConcertForm;
