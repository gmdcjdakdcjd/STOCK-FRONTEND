import { useLayoutEffect } from "react";

/**
 *  모달 오픈 시 배경(body) 스크롤을 방지하는 커스텀 훅
 * @param active - true일 때 스크롤을 잠급니다. (기본값: true)
 */
export function useLockBodyScroll(active: boolean = true) {
    useLayoutEffect(() => {
        if (!active) return;

        // 현재 overflow 스타일 저장
        const originalStyle = window.getComputedStyle(document.body).overflow;

        // 스크롤 방지
        document.body.style.overflow = "hidden";

        // 언마운트 또는 active가 false로 변할 때 복구
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [active]);
}
