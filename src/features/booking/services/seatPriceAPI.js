// src/features/booking/services/seatPriceAPI.js
import apiClient from '../../../shared/utils/apiClient';

/**
 * 콘서트의 모든 좌석 가격 정보를 조회합니다.
 * @param {number} concertId 콘서트 ID
 * @returns {Promise<Array>} 좌석 가격 정보 배열
 */
export async function fetchConcertSeatPrices(concertId) {
    const response = await apiClient.get(`/seats/concerts/${concertId}/prices`);
    return response.data;
}

/**
 * 선택된 좌석들의 가격 정보를 조회합니다.
 * @param {number} concertId 콘서트 ID
 * @param {number[]} seatIds 좌석 ID 배열 (concertSeatId)
 * @returns {Promise<Array>} 선택된 좌석들의 가격 정보 배열
 */
export async function fetchSelectedSeatPrices(concertId, seatIds) {
    const params = new URLSearchParams();
    seatIds.forEach(id => params.append('seatIds', id));

    const response = await apiClient.get(`/seats/concerts/${concertId}/prices/selected?${params.toString()}`);
    return response.data;
}