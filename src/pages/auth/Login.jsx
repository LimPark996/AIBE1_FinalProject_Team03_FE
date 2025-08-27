import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    loginUser,
    socialLoginUser,
} from '../../features/auth/services/loginService';
import { AuthContext } from '../../context/AuthContext';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

// 반응형 Hook (Profile.jsx와 동일)
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

export default function Login() {
    const { isMobile, isTablet } = useResponsive();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!username || !password) {
            setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        const userData = await loginUser({ username, password });
        setIsLoading(false);

        if (userData) {
            login(userData);
            navigate('/');
        } else {
            setErrorMessage(
                '로그인 실패: 아이디 또는 비밀번호를 확인해주세요.',
            );
        }
    };

    const handleSocialLogin = (provider) => {
        socialLoginUser(provider);
    };

    return (
        <div
            style={{
                backgroundColor: '#111827', // gray-900
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
                          ? 'max-w-5xl mx-auto p-4 overflow-x-hidden'
                          : 'max-w-7xl mx-auto p-6 overflow-x-hidden'
                }
                style={{
                    backgroundColor: '#111827',
                    minHeight: '100vh',
                    color: '#FFFFFF',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {/* Page Title */}
                <div className="text-center mb-8">
                    <h2
                        className={
                            isMobile
                                ? 'text-2xl font-bold mb-2 break-words'
                                : isTablet
                                  ? 'text-3xl font-bold mb-2 break-words'
                                  : 'text-4xl font-bold mb-2 break-words'
                        }
                        style={{
                            color: '#FFFFFF',
                            wordBreak: 'keep-all',
                            overflowWrap: 'break-word',
                        }}
                    >
                        다시 오신 것을 환영합니다
                    </h2>
                    <p
                        className="text-gray-400"
                        style={{
                            fontSize: isMobile ? '14px' : '16px',
                            padding: isMobile ? '0 16px' : '0',
                        }}
                    >
                        계정에 로그인하여 콘서트를 예매하세요
                    </p>
                </div>

                {/* Content Area - Profile.jsx와 동일한 카드 스타일 */}
                <div
                    className="w-full"
                    style={{
                        maxWidth: isMobile
                            ? '100%'
                            : isTablet
                              ? '500px'
                              : '600px',
                    }}
                >
                    <div
                        className="rounded-2xl"
                        style={{
                            backgroundColor: '#1f2937', // gray-800
                            border: '1px solid #374151', // gray-700
                            padding: isMobile
                                ? '20px'
                                : isTablet
                                  ? '24px'
                                  : '32px',
                        }}
                    >
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* 아이디 입력 */}
                            <div className="relative">
                                <label
                                    htmlFor="username"
                                    className="block mb-2 text-sm font-medium text-gray-300"
                                >
                                    아이디
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    placeholder="아이디를 입력하세요"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                                <User className="absolute left-3 bottom-3 text-gray-400 w-5 h-5" />
                            </div>

                            {/* 비밀번호 입력 */}
                            <div className="relative">
                                <label
                                    htmlFor="password"
                                    className="block mb-2 text-sm font-medium text-gray-300"
                                >
                                    비밀번호
                                </label>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="비밀번호를 입력하세요"
                                    className="w-full pl-10 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                                <Lock className="absolute left-3 bottom-3 text-gray-400 w-5 h-5" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-0 bottom-0 text-gray-300 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {/* 에러 메시지 */}
                            {errorMessage && (
                                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            {/* 로그인 버튼 */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full ${
                                    isLoading
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                } text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2`}
                            >
                                {isLoading && (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                <span>
                                    {isLoading ? '로그인 중...' : '로그인'}
                                </span>
                            </button>
                        </form>

                        {/* 구분선 */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-gray-800 text-gray-400">
                                    또는 다음으로 계속하기
                                </span>
                            </div>
                        </div>

                        {/* 소셜 로그인 */}
                        <div className="space-y-3">
                            {/* Google */}
                            <button
                                onClick={() => handleSocialLogin('google')}
                                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors font-medium"
                            >
                                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                    <svg
                                        className="w-full h-full"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                                구글로 계속하기
                            </button>

                            {/* Kakao */}
                            <button
                                onClick={() => handleSocialLogin('kakao')}
                                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-[#FEE500] text-black hover:bg-yellow-300 transition-colors font-medium"
                            >
                                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                    <svg
                                        className="w-full h-full"
                                        viewBox="0 0 24 24"
                                        fill="black"
                                    >
                                        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
                                    </svg>
                                </div>
                                카카오로 계속하기
                            </button>

                        {/* 회원가입 링크 */}
                        <div className="text-center pt-6 mt-6 border-t border-gray-600">
                            <p className="text-gray-400 text-sm">
                                계정이 없으신가요?{' '}
                                <button
                                    onClick={() => navigate('/register')}
                                    className="ml-2 text-white hover:text-blue-300 font-medium transition-colors"
                                >
                                    회원가입
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* 모바일에서 하단 여백 */}
                {isMobile && <div className="h-16" aria-hidden="true"></div>}
            </div>
        </div>
    );
}
