import { useState, useEffect } from 'react';
import { concertService } from '../services/concertService';

/**
 * 콘서트의 좌석 등급 및 가격 정보를 가져오는 Hook
 */
export function useSeatGrades(concertId) {
    const [seatGrades, setSeatGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!concertId) {
            setLoading(false);
            return;
        }

        const loadSeatGrades = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await concertService.getSeatGrades(concertId);
                setSeatGrades(data);

            } catch (err) {
                console.error('좌석 등급 정보 조회 실패:', err);
                setError(err.message || '좌석 등급 정보를 불러올 수 없습니다.');
                setSeatGrades([]);
            } finally {
                setLoading(false);
            }
        };

        loadSeatGrades();
    }, [concertId]);

    return { seatGrades, loading, error };
}