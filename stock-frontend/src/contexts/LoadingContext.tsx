import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// 전역 로딩 컨텍스트의 인터페이스를 정의합니다.
interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

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
