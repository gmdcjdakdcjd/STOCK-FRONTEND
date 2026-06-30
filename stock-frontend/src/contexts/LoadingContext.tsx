import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

// 전역 로딩 컨텍스트의 인터페이스를 정의합니다.
interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// 전역 요청 횟수를 카운팅하고, React 외부의 fetch 인터셉터가 상태 변화 함수에 접근할 수 있도록 돕는 참조 변수들입니다.
let activeRequests = 0;
let globalShowLoading: ((message?: string) => void) | null = null;
let globalHideLoading: (() => void) | null = null;
let isFetchIntercepted = false;

// 애플리케이션 최상단에서 전역 상태를 주입하고 오버레이를 렌더링하는 Provider 컴포넌트입니다.
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("데이터를 불러오는 중입니다...");

  // 로딩 오버레이를 표시합니다. 커스텀 메시지를 지정할 수 있습니다.
  const showLoading = (message?: string) => {
    if (message) {
      setLoadingMessage(message);
    } else {
      setLoadingMessage("데이터를 불러오는 중입니다...");
    }
    setIsLoading(true);
  };

  // 로딩 오버레이를 감춥니다.
  const hideLoading = () => {
    setIsLoading(false);
  };

  // 컴포넌트가 마운트될 때 전역 fetch 함수를 가로채어 API 호출에 연동되도록 인터셉터를 등록합니다.
  useEffect(() => {
    globalShowLoading = showLoading;
    globalHideLoading = hideLoading;

    if (!isFetchIntercepted) {
      isFetchIntercepted = true;
      const originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url || "";

        // 로그인 여부 체크(/api/auth/me) 및 자동완성 검색 API는 오버레이 로딩 대상에서 제외합니다.
        const isSilent =
          url.includes("/api/auth/me") ||
          url.includes("/autocomplete/") ||
          url.includes("/api/common/autocomplete");

        if (!isSilent) {
          activeRequests++;
          if (activeRequests === 1 && globalShowLoading) {
            globalShowLoading("데이터를 불러오는 중입니다...");
          }
        }

        try {
          return await originalFetch(...args);
        } finally {
          if (!isSilent) {
            activeRequests = Math.max(0, activeRequests - 1);
            if (activeRequests === 0 && globalHideLoading) {
              globalHideLoading();
            }
          }
        }
      };
    }

    return () => {
      globalShowLoading = null;
      globalHideLoading = null;
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">{loadingMessage}</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

// 하위 컴포넌트에서 간편하게 로딩 상태를 열고 닫을 수 있도록 지원하는 커스텀 훅입니다.
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
