import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runScreenerWithFilters, saveScreenerCondition, getScreenerConditions, deleteScreenerCondition, getDeletedScreenerConditions, restoreScreenerCondition } from "../../api/screenerApi";
import { fetchKodexSummary, fetchKodexHoldings } from "../../api/kodexApi";
import { fetchTigerSummary, fetchTigerHoldings } from "../../api/tigerApi";
import EtfSearchModal from "./EtfSearchModal";
import ConditionSaveModal from "./ConditionSaveModal";
import ConditionListModal from "./ConditionListModal";
import ConditionRestoreModal from "./ConditionRestoreModal";
import CreateEtfModal from "../myStock/CreateEtfModal"; // ETF 생성 모달 임포트
import EditEtfModal from "../myStock/EditEtfModal"; // ETF 수정 모달 임포트
import UnsavedChangesConfirmModal from "./UnsavedChangesConfirmModal";
import "./MyConditionPage.css";
import "../result/result-detail.css"; // ResultDetail 공통 테이블 스타일을 재사용합니다.

/* 조건식 필터 옵션 인터페이스 정의 */
interface FilterOption {
  baseKey: string;
  label: string;
  hasCurrency: boolean; /* 통화 기호 (원 / $) 표시 여부 */
  onlyKR?: boolean; /* 한국 시장 전용 여부 */
}

/* 화면에 표시할 후보 필터 조건 목록 (접미사를 제외한 Base Key 구조) */
const FILTER_OPTIONS: FilterOption[] = [
  { baseKey: "DAILY_120D_NEW_HIGH", label: "120일 신고가", hasCurrency: true },
  { baseKey: "DAILY_120D_NEW_LOW", label: "120일 신저가", hasCurrency: true },
  { baseKey: "DAILY_BB_LOWER_TOUCH", label: "볼린저밴드 하단선 터치값", hasCurrency: true },
  { baseKey: "DAILY_BB_UPPER_TOUCH", label: "볼린저밴드 상단선 터치값", hasCurrency: true },
  { baseKey: "DAILY_TOUCH_MA60", label: "일봉 60일선 터치값", hasCurrency: true },
  { baseKey: "WEEKLY_TOUCH_MA60", label: "주봉 60주선 터치값", hasCurrency: true },
  { baseKey: "RSI_30_UNHEATED", label: "RSI 하단 (30 이하) 진입값", hasCurrency: false },
  { baseKey: "RSI_70_OVERHEATED", label: "RSI 상단 (70 이상) 진입값", hasCurrency: false },
  { baseKey: "WEEKLY_52W_NEW_HIGH", label: "52주 신고가", hasCurrency: true },
  { baseKey: "WEEKLY_52W_NEW_LOW", label: "52주 신저가", hasCurrency: true },
  { baseKey: "DAILY_DROP_SPIKE", label: "급락 스파이크", hasCurrency: true },
  { baseKey: "DAILY_RISE_SPIKE", label: "급등 스파이크", hasCurrency: true },
  { baseKey: "DAILY_TOP20_VOLUME", label: "상위 20 거래량", hasCurrency: true },
];

export default function MyConditionPage() {
  const navigate = useNavigate();

  /* 상태 관리: 현재 선택한 시장 (kr: 한국 시장, us: 미국 시장) */
  const [market, setMarket] = useState<"kr" | "us">("kr");

  /* 상태 관리: 체크된 필터 조건의 baseKey 목록 */
  const [checkedFilterKeys, setCheckedFilterKeys] = useState<string[]>([]);

  /* 상태 관리: 시가총액 필터 선택 ("" | "RANK_MARKET_CAP_30" | "RANK_MARKET_CAP_100" | "RANK_MARKET_CAP_200") */
  const [marketCapFilter, setMarketCapFilter] = useState<string>("");

  /* 상태 관리: 백엔드로부터 응답받은 스크리닝 결과 종목 리스트 */
  const [results, setResults] = useState<any[]>([]);

  /* 상태 관리: 테이블에서 다중 선택된 종목 코드 리스트 */
  const [checkedCodes, setCheckedCodes] = useState<string[]>([]);

  /* 상태 관리: 로그인 인증 완료 여부 */
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  /* 상태 관리: 스크리닝 실행 로딩 여부 */
  const [isRunning, setIsRunning] = useState<boolean>(false);

  /* 상태 관리: 에러 발생 메시지 */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ========================================================
     특정 ETF 구성 종목 필터링용 상태 및 훅 정의
     ======================================================== */
  const useEtfFilter = true; /* ETF 선택 영역은 항상 활성화하여 노출합니다. */
  const [etfBrand, setEtfBrand] = useState<"KODEX" | "TIGER">("KODEX");
  const [etfQuery, setEtfQuery] = useState<string>("");
  const [etfSearchInput, setEtfSearchInput] = useState<string>("");
  const [etfList, setEtfList] = useState<{ etfId: string; etfName: string }[]>([]);
  const [selectedEtfs, setSelectedEtfs] = useState<{ etfId: string; etfName: string }[]>([]);
  const [etfHoldings, setEtfHoldings] = useState<Set<string>>(new Set());
  const [etfLoading, setEtfLoading] = useState<boolean>(false);
  /* ETF 다중 선택 검색 모달 팝업의 활성화 상태 */
  const [isEtfModalOpen, setIsEtfModalOpen] = useState<boolean>(false);
  /* 조건 저장 모달 팝업의 활성화 상태 및 저장할 조건식 이름 */
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveConditionName, setSaveConditionName] = useState<string>("");
  /* 저장된 조건식 불러오기 모달 상태 및 목록 데이터 */
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [savedConditions, setSavedConditions] = useState<any[]>([]);
  /* 삭제된 조건식 복구 모달 상태 및 목록 데이터 */
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);
  const [deletedConditions, setDeletedConditions] = useState<any[]>([]);
  const [showCreateEtf, setShowCreateEtf] = useState<boolean>(false);
  const [showAddToEtf, setShowAddToEtf] = useState<boolean>(false);
  const [hasEtf, setHasEtf] = useState<boolean>(false);
  /* 변경사항 미저장 알림 커스텀 컨펌 모달 상태 */
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState<boolean>(false);
  /* 현재 불러와서 수정/적용 중인 조건식의 정보 (null이면 새로 저장 모드) */
  const [activeConditionId, setActiveConditionId] = useState<number | null>(null);
  const [activeConditionName, setActiveConditionName] = useState<string>("");
  /* 상태 관리: 불러온 당시 혹은 저장 완료 시점의 원본 조건 상태 스냅샷 (변경 감지용) */
  const [originalConditionSnapshot, setOriginalConditionSnapshot] = useState<{
    filters: string[];
    marketCapFilter: string;
    selectedEtfs: { etfId: string; etfName: string }[];
  } | null>(null);

  /* 변경 사항(Dirty) 감지 헬퍼 함수 */
  const isConditionDirty = () => {
    if (activeConditionId === null || !originalConditionSnapshot) return false;

    // 1. 현재 화면의 지표 필터와 스냅샷 비교 (정렬하여 비교)
    const currentFilters = [...checkedFilterKeys].sort();
    const originalFilters = [...originalConditionSnapshot.filters].sort();
    if (JSON.stringify(currentFilters) !== JSON.stringify(originalFilters)) return true;

    // 2. 시가총액 필터 비교
    if (marketCapFilter !== originalConditionSnapshot.marketCapFilter) return true;

    // 3. ETF 필터 비교
    const currentEtfIds = selectedEtfs.map(e => e.etfId).sort();
    const originalEtfIds = originalConditionSnapshot.selectedEtfs.map(e => e.etfId).sort();
    if (JSON.stringify(currentEtfIds) !== JSON.stringify(originalEtfIds)) return true;

    return false;
  };
  /* 화면에 표시할 세련된 토스트(Toast) 팝업 알림 상태 */
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  /* 로그인 상태 확인 API 훅 */
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  // 사용자가 소유한 ETF 목록이 존재하는지 초기 로드 확인
  useEffect(() => {
    fetch("/api/myetf/list?page=1&size=1")
      .then(res => res.json())
      .then(data => {
        const dtoList = data && data.dtoList ? data.dtoList : [];
        setHasEtf(dtoList.length > 0);
      })
      .catch(() => {
        setHasEtf(false);
      });
  }, []);



  // 브라우저 탭 닫기 / 새로고침 시 저장되지 않은 변경사항이 있으면 경고 표시
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isConditionDirty()) {
        e.preventDefault();
        e.returnValue = ""; // 현대 브라우저에서 경고창을 띄우기 위한 조치
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [checkedFilterKeys, marketCapFilter, selectedEtfs, originalConditionSnapshot, activeConditionId]);

  /* ETF 요약 목록 조회 API 훅 */
  useEffect(() => {
    if (!useEtfFilter) return;
    setEtfLoading(true);

    if (etfBrand === "KODEX") {
      fetchKodexSummary(etfQuery || undefined, true)
        .then((data) => {
          setEtfList(data.map((item) => ({ etfId: item.etfId, etfName: item.etfName })));
        })
        .catch(() => setEtfList([]))
        .finally(() => setEtfLoading(false));
    } else {
      fetchTigerSummary(etfQuery || undefined, true)
        .then((data) => {
          setEtfList(data.map((item) => ({ etfId: item.etfId, etfName: item.etfName })));
        })
        .catch(() => setEtfList([]))
        .finally(() => setEtfLoading(false));
    }
  }, [etfBrand, etfQuery, useEtfFilter]);

  /* 선택한 다중 ETF들의 구성 종목(Holdings) 코드 목록 조회 및 브랜드별 내부 교집합 후 브랜드 간 교집합 병합 API 훅 */
  useEffect(() => {
    if (!useEtfFilter || selectedEtfs.length === 0) {
      setEtfHoldings(new Set());
      return;
    }

    setEtfLoading(true);

    // KODEX와 TIGER 그룹으로 분류합니다.
    const kodexEtfs = selectedEtfs.filter((etf) => !etf.etfName.toUpperCase().includes("TIGER"));
    const tigerEtfs = selectedEtfs.filter((etf) => etf.etfName.toUpperCase().includes("TIGER"));

    // 특정 그룹 내 ETF들의 종목코드 교집합(AND)을 구하는 헬퍼 함수
    const fetchHoldingsForList = async (etfListForBrand: typeof selectedEtfs, isTiger: boolean) => {
      const promises = etfListForBrand.map((etf) => {
        if (isTiger) {
          return fetchTigerHoldings(etf.etfId)
            .then((data) => (Array.isArray(data) ? data.map((item) => item.stockCode) : []))
            .catch(() => [] as string[]);
        } else {
          return fetchKodexHoldings(etf.etfId)
            .then((data) => (Array.isArray(data) ? data.map((item) => item.stockCode) : []))
            .catch(() => [] as string[]);
        }
      });

      const resultsArray = await Promise.all(promises);
      const validArrays = resultsArray.filter((arr) => Array.isArray(arr) && arr.length > 0);

      if (validArrays.length === 0) {
        return new Set<string>();
      }

      // 첫 번째 유효 ETF의 구성 종목 목록을 기준으로 교집합(AND)을 구합니다.
      let intersectionSet = new Set<string>(validArrays[0]);
      for (let i = 1; i < validArrays.length; i++) {
        const currentSet = new Set<string>(validArrays[i]);
        const nextIntersection = new Set<string>();
        intersectionSet.forEach((code) => {
          if (currentSet.has(code)) {
            nextIntersection.add(code);
          }
        });
        intersectionSet = nextIntersection;
      }
      return intersectionSet;
    };

    const processAll = async () => {
      try {
        const [kodexIntersection, tigerIntersection] = await Promise.all([
          kodexEtfs.length > 0 ? fetchHoldingsForList(kodexEtfs, false) : Promise.resolve(null),
          tigerEtfs.length > 0 ? fetchHoldingsForList(tigerEtfs, true) : Promise.resolve(null),
        ]);

        if (kodexIntersection && tigerIntersection) {
          // KODEX 내부 교집합 그룹과 TIGER 내부 교집합 그룹 간의 최종 교집합(AND)을 구합니다.
          const finalIntersection = new Set<string>();
          kodexIntersection.forEach((code) => {
            if (tigerIntersection.has(code)) {
              finalIntersection.add(code);
            }
          });
          setEtfHoldings(finalIntersection);
        } else if (kodexIntersection) {
          // KODEX만 선택된 경우에는 KODEX 내부 교집합 적용
          setEtfHoldings(kodexIntersection);
        } else if (tigerIntersection) {
          // TIGER만 선택된 경우에는 TIGER 내부 교집합 적용
          setEtfHoldings(tigerIntersection);
        } else {
          setEtfHoldings(new Set());
        }
      } catch {
        setEtfHoldings(new Set());
      } finally {
        setEtfLoading(false);
      }
    };

    processAll();
  }, [selectedEtfs, useEtfFilter]);

  /* 시장이 바뀔 때 기존 선택 정보 및 결과 데이터 초기화 */
  const handleMarketChange = (newMarket: "kr" | "us") => {
    if (market !== newMarket) {
      setMarket(newMarket);
      setCheckedFilterKeys([]);
      setResults([]);
      setCheckedCodes([]);
      setErrorMessage(null);
      setMarketCapFilter("");
      setEtfBrand("KODEX");
      setEtfQuery("");
      setEtfSearchInput("");
      setEtfList([]);
      setSelectedEtfs([]);
      setEtfHoldings(new Set());

      // 불러온 조건식 정보 초기화 (가드 역할)
      setActiveConditionId(null);
      setActiveConditionName("");
      setOriginalConditionSnapshot(null); // 변경 감지 스냅샷 초기화

      showToast("분석 대상 시장이 전환되어 모든 필터와 활성 조건식이 초기화되었습니다.", "info");
    }
  };

  /* 선택된 모든 조건 필터 및 검색 결과 초기화 함수 */
  const handleResetFilters = () => {
    setCheckedFilterKeys([]);
    setMarketCapFilter("");
    setEtfBrand("KODEX");
    setEtfQuery("");
    setEtfSearchInput("");
    setEtfList([]);
    setSelectedEtfs([]);
    setEtfHoldings(new Set());
    setResults([]);
    setCheckedCodes([]);
    setErrorMessage(null);
    setActiveConditionId(null);
    setActiveConditionName("");
    setOriginalConditionSnapshot(null); // 변경 감지 스냅샷 초기화
    showToast("모든 분석 조건이 초기화되었습니다.", "info");
  };

  /* 현재 활성화된 스크리닝 조건들을 저장하기 위해 이름 입력 및 요약 팝업 모달을 띄우는 함수 */
  const handleSaveConditions = () => {
    const finalFilters = checkedFilterKeys.map((key) => `${key}_${market.toUpperCase()}`);
    if (marketCapFilter) {
      finalFilters.push(`${marketCapFilter}_${market.toUpperCase()}`);
    }

    // 저장할 조건이 전혀 없는 상황을 밸리데이션 검사
    if (finalFilters.length === 0 && selectedEtfs.length === 0) {
      alert("저장할 조건이 없습니다. 최소 한 개 이상의 조건 혹은 ETF 필터를 설정해 주세요.");
      return;
    }

    if (activeConditionId && activeConditionName) {
      // 이미 불러온 조건식을 수정하는 모드인 경우 (사용자용 입력창에는 접미사를 떼고 보여줌)
      setSaveConditionName(activeConditionName.replace(/_(KR|US)$/i, ""));
    } else {
      // 새로운 조건식으로 신규 저장하는 모드인 경우
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
      setSaveConditionName("나만의 조건식_" + dateStr);
    }
    setIsSaveModalOpen(true);
  };

  /* 저장 완료 실행 버튼 클릭 시 호출되는 최종 콜백 핸들러 (실제 백엔드 API 연동 완료) */
  const handleConfirmSave = async () => {
    if (!saveConditionName.trim()) {
      alert("조건식 이름은 필수 입력 항목입니다.");
      return;
    }

    const cleanName = saveConditionName.trim().replace(/_(KR|US)$/i, "");
    const finalName = cleanName + (market === "kr" ? "_KR" : "_US");

    const finalFilters = checkedFilterKeys.map((key) => `${key}_${market.toUpperCase()}`);
    if (marketCapFilter) {
      finalFilters.push(`${marketCapFilter}_${market.toUpperCase()}`);
    }

    try {
      // 백엔드 API 호출 실행 (마지막 파라미터로 activeConditionId 전달하여 수정/저장 분기)
      await saveScreenerCondition(
        finalName,
        market,
        finalFilters,
        selectedEtfs,
        activeConditionId
      );

      showToast(`"${cleanName}" 조건식이 성공적으로 ${activeConditionId ? "수정" : "저장"}되었습니다.`, "success");

      // 수정된 이름 반영 (내부 전역 변수에는 접미사가 부착된 오리지널 명칭을 저장)
      setActiveConditionName(finalName);

      // 수정 완료 후 변경감지용 스냅샷 갱신
      setOriginalConditionSnapshot({
        filters: checkedFilterKeys,
        marketCapFilter: marketCapFilter,
        selectedEtfs: selectedEtfs,
      });

      setIsSaveModalOpen(false); // 모달 닫기
    } catch (err: any) {
      console.error("조건식 저장 중 오류 발생:", err);
      showToast("조건식 저장 실패: " + err.message, "error");
    }
  };

  /* 백엔드에 저장된 내 조건식 리스트를 조회해 모달을 엽니다. */
  const handleLoadConditions = () => {
    // 수정 중인 상황에서 저장하지 않고 불러오기를 시도할 경우 경고 알림
    if (isConditionDirty()) {
      if (!window.confirm("변경된 조건식이 저장되지 않았습니다.\n저장하지 않고 불러오시겠습니까?")) {
        return;
      }
    }
    getScreenerConditions()
      .then((data) => {
        setSavedConditions(data || []);
        setIsListModalOpen(true);
      })
      .catch((err) => {
        console.error("조건식 목록 조회 오류:", err);
        alert("조건식 목록을 불러오는 중 오류가 발생했습니다: " + err.message);
      });
  };

  /* 불러온 특정 조건식을 현재 필터들에 복원/바인딩 처리하고 자동 스크리닝을 실행합니다. */
  const handleApplyCondition = async (cond: any) => {
    // 1. 활성 조건식 ID 및 이름 상태 연동 (수정 모드로 진입 보장)
    setActiveConditionId(cond.id);
    setActiveConditionName(cond.name);

    // 2. 시장 설정 복원
    setMarket(cond.market);

    // 3. 스크리닝 필터 및 시가총액 복원
    const restoredKeys: string[] = [];
    let restoredMarketCap = "";

    if (cond.filters) {
      cond.filters.forEach((fullKey: string) => {
        // 끝의 _KR 또는 _US 서픽스 제거
        const baseKey = fullKey.replace(/_(KR|US)$/i, "");
        if (baseKey.startsWith("RANK_MARKET_CAP")) {
          restoredMarketCap = baseKey;
        } else {
          restoredKeys.push(baseKey);
        }
      });
    }

    setCheckedFilterKeys(restoredKeys);
    setMarketCapFilter(restoredMarketCap);

    // 4. ETF 및 홀딩스 종목 복원
    const holdingsSet = new Set<string>();
    if (cond.market === "kr" && cond.selectedEtfs && cond.selectedEtfs.length > 0) {
      setSelectedEtfs(cond.selectedEtfs);
      setEtfLoading(true);
      try {
        let isFirst = true;

        for (const etf of cond.selectedEtfs) {
          const fetchFunc = etf.etfId.startsWith("TIGER") || etf.etfName.includes("TIGER")
            ? fetchTigerHoldings
            : fetchKodexHoldings;

          const rawHoldings = await fetchFunc(etf.etfId);
          // 각 홀딩 객체(TigerEtfHolding 또는 KodexEtfHolding)에서 stockCode 문자열만 추출하여 매핑합니다.
          const cleanCodes = rawHoldings.map((item: any) => item.stockCode);
          const currentHoldings = new Set<string>(cleanCodes);

          if (isFirst) {
            currentHoldings.forEach(code => holdingsSet.add(code));
            isFirst = false;
          } else {
            // 교집합 교정
            holdingsSet.forEach(code => {
              if (!currentHoldings.has(code)) {
                holdingsSet.delete(code);
              }
            });
          }
        }
        setEtfHoldings(holdingsSet);
      } catch (err) {
        console.error("ETF 종목 리스트 복원 중 오류:", err);
      } finally {
        setEtfLoading(false);
      }
    } else {
      setSelectedEtfs([]);
      setEtfHoldings(new Set());
    }

    // 불러오기가 성공적으로 세팅되었을 때 원본 변경 감지용 스냅샷 저장
    setOriginalConditionSnapshot({
      filters: restoredKeys,
      marketCapFilter: restoredMarketCap,
      selectedEtfs: cond.selectedEtfs || [],
    });

    // 5. 복원된 로컬 변수들을 즉시 취합하여 백엔드 스크리닝 자동 실행
    setIsRunning(true);
    setResults([]);
    setErrorMessage(null);
    setIsListModalOpen(false); // 리스트 모달 사전 닫기

    try {
      const finalFilters = restoredKeys.map((key) => `${key}_${cond.market.toUpperCase()}`);
      if (restoredMarketCap) {
        finalFilters.push(`${restoredMarketCap}_${cond.market.toUpperCase()}`);
      }

      const etfCodes = cond.selectedEtfs && cond.selectedEtfs.length > 0 ? Array.from(holdingsSet) : [];

      // API를 호출하여 즉각 검색 실행
      const searchRes = await runScreenerWithFilters(finalFilters, etfCodes, cond.market);
      setResults(searchRes || []);
      showToast(`"${cond.name}" 조건식이 적용되었습니다.\n검색버튼을 눌러주세요`, "success");
    } catch (err: any) {
      console.error("조건식 불러온 후 자동 스크리닝 실행 실패:", err);
      setErrorMessage(err.message || "조건식 불러오기 복원 후 자동 스크리닝 실행에 실패했습니다.");
      showToast("조건식 적용 후 자동 검색 실패", "error");
    } finally {
      setIsRunning(false);
    }
  };

  /* 저장되어 있는 특정 조건식을 삭제 처리합니다. */
  const handleDeleteCondition = (id: number) => {
    if (!window.confirm("이 조건식을 삭제하시겠습니까?")) {
      return;
    }

    deleteScreenerCondition(id)
      .then(() => {
        showToast("조건식이 삭제되었습니다.", "success");
        // 목록 갱신
        return getScreenerConditions();
      })
      .then((data) => {
        setSavedConditions(data || []);
      })
      .catch((err) => {
        console.error("조건식 삭제 오류:", err);
        showToast("조건식 삭제 실패: " + err.message, "error");
      });
  };

  /* 삭제되어 있는 내 조건식 리스트를 조회해 복구 모달을 엽니다. */
  const handleLoadDeletedConditions = () => {
    // 수정 중인 상황에서 저장하지 않고 복구 리스트 열기를 시도할 경우 경고 알림
    if (isConditionDirty()) {
      if (!window.confirm("변경된 조건식이 저장되지 않았습니다.\n저장하지 않고 복구 창을 여시겠습니까?")) {
        return;
      }
    }
    getDeletedScreenerConditions()
      .then((data) => {
        setDeletedConditions(data || []);
        setIsRestoreModalOpen(true);
      })
      .catch((err) => {
        console.error("삭제된 조건식 목록 조회 오류:", err);
        alert("삭제된 조건식 목록을 불러오는 중 오류가 발생했습니다: " + err.message);
      });
  };

  /* 변경사항을 감지하여 저장하지 않고 내 관심 종목으로 이동하려 할 때 경고를 주는 헬퍼 이동 함수 */
  const handleGoToMyStock = () => {
    if (isConditionDirty()) {
      if (!window.confirm("변경된 조건식이 저장되지 않았습니다.\n저장하지 않고 내 관심 종목으로 이동하시겠습니까?")) {
        return;
      }
    }
    navigate("/stock/myStock");
  };

  /* ETF 가기 핸들러 (Dirty Check 포함) */
  const handleGoToMyEtf = () => {
    if (isConditionDirty()) {
      if (!window.confirm("변경된 조건식이 저장되지 않았습니다.\n저장하지 않고 나의 ETF 화면으로 이동하시겠습니까?")) {
        return;
      }
    }
    navigate("/myetf/list");
  };


  /* 삭제된 특정 조건식을 복구(활성화) 처리합니다. */
  const handleRestoreCondition = (id: number, name: string) => {
    if (!window.confirm(`"${name.replace(/_(KR|US)$/i, "")}" 조건식을 복구하시겠습니까?`)) {
      return;
    }

    restoreScreenerCondition(id)
      .then(() => {
        showToast("조건식이 성공적으로 복구되었습니다.", "success");
        // 삭제된 목록 갱신
        return getDeletedScreenerConditions();
      })
      .then((data) => {
        setDeletedConditions(data || []);
        // 활성 조건식 목록도 갱신하여 불러오기 창에 즉시 나타나도록 함
        return getScreenerConditions();
      })
      .then((data) => {
        setSavedConditions(data || []);
      })
      .catch((err) => {
        console.error("조건식 복구 오류:", err);
        showToast("조건식 복구 실패: " + err.message, "error");
      });
  };



  /* ETF 칩 제거 함수 */
  const removeEtfChip = (etfId: string) => {
    setSelectedEtfs(selectedEtfs.filter((item) => item.etfId !== etfId));
  };

  /* 조건 체크박스 선택/해제 이벤트 */
  const handleCheckboxChange = (filterKey: string) => {
    if (checkedFilterKeys.includes(filterKey)) {
      setCheckedFilterKeys(checkedFilterKeys.filter((key) => key !== filterKey));
    } else {
      setCheckedFilterKeys([...checkedFilterKeys, filterKey]);
    }
  };

  /* 결과 테이블 개별 종목 선택 토글 */
  const toggleOneCode = (code: string) => {
    setCheckedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  /* 결과 테이블 전체 종목 선택 토글 */
  const toggleAllCodes = (checked: boolean, codes: string[]) => {
    setCheckedCodes(checked ? codes : []);
  };

  /* '조건 검색 실행' 버튼 클릭 시 백엔드 호출 */
  const handleRunSearch = async () => {
    const finalFilters = checkedFilterKeys.map((key) => `${key}_${market.toUpperCase()}`);

    // 시가총액 단일 선택 필터가 지정되어 있다면 필터 목록에 결합하여 함께 전달합니다.
    if (marketCapFilter) {
      finalFilters.push(`${marketCapFilter}_${market.toUpperCase()}`);
    }

    const etfCodes = selectedEtfs.length > 0 ? Array.from(etfHoldings) : [];

    // 조건 필터도 없고 ETF 선택 목록도 비어 있는 경우 조회를 방지합니다.
    if (finalFilters.length === 0 && selectedEtfs.length === 0) {
      alert("최소 한 개 이상의 조건을 선택하거나 ETF 필터를 추가해 주세요.");
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setResults([]);
    setCheckedCodes([]);

    try {
      /* 조립된 필터 키 목록과 선택한 ETF의 교집합 종목 코드 목록을 백엔드로 직접 전송 */
      const response = await runScreenerWithFilters(finalFilters, etfCodes, market);

      if (response && response.status === "success" && Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        throw new Error(response.message || "올바르지 않은 응답 포맷입니다.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "스크리닝 연동 중 오류가 발생했습니다.");
    } finally {
      setIsRunning(false);
    }
  };

  /* 실질적으로 백엔드 관심종목 추가 API를 호출하는 헬퍼 함수 */
  const executeAddMyStock = () => {
    setShowUnsavedChangesConfirm(false); // 모달 닫기
    const today = new Date().toISOString().substring(0, 10);
    const suffix = market === "kr" ? "_KR" : "_US";
    const targetStrategyName = (activeConditionName || "나만의 조건식").trim().replace(/_(KR|US)$/i, "");
    const payload = results
      .filter((r) => checkedCodes.includes(r.code))
      .map((r) => ({
        code: r.code,
        name: r.name,
        strategyName: targetStrategyName + suffix,
        priceAtAdd: r.currentPrice,
        memo: today,
      }));

    fetch("/api/mystock/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        showToast(`선택한 종목들이 '${targetStrategyName}' 조건명으로 관심 종목에 추가되었습니다.`, "success");
        setCheckedCodes([]);
      })
      .catch((err) => {
        console.error("관심 종목 등록 오류:", err);
        showToast("관심 종목 등록에 실패했습니다. 로그인 상태를 다시 확인해 주세요.", "error");
      });
  };

  /* 선택된 종목들을 내 관심 종목으로 일괄 추가하는 함수 */
  const handleAddMyStock = () => {
    if (!authenticated) {
      showToast("로그인 후 이용 가능합니다.", "error");
      return;
    }

    if (checkedCodes.length === 0) {
      showToast("선택된 종목이 없습니다.", "info");
      return;
    }

    // 변경 사항 유무와 관계없이 무조건 커스텀 컨펌 모달을 노출하여 사용자 승인을 받음
    setShowUnsavedChangesConfirm(true);
  };



  /* 시장 선택에 맞춘 필터 조건 라벨명을 얻는 헬퍼 함수 */
  const getFilterLabel = (filter: FilterOption) => {
    if (filter.hasCurrency) {
      return `${filter.label} (${market === "kr" ? "원" : "$"})`;
    }
    return filter.label;
  };

  /* ETF 필터 선택 여부에 따라 교집합 필터링된 최종 포착 종목 목록을 컴포넌트 레벨에서 계산 */
  const displayedResults = (Array.isArray(results) ? results : []).filter((r) => {
    if (useEtfFilter && selectedEtfs.length > 0) {
      return etfHoldings.has(r.code);
    }
    return true;
  });

  return (
    <div className="mycondition-container">
      {/* 상단 타이틀 영역 */}
      <div className="mycondition-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className="mycondition-title">나만의 조건식</h1>
          <p className="mycondition-subtitle" style={{ margin: 0 }}>
            원하는 투자 조건들을 선택하고 여러 조건들을 동시에 만족하는 교집합 종목들을 추출합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn-load-conditions"
            onClick={handleLoadConditions}
            style={{
              padding: "10px 18px",
              fontSize: "0.875rem",
              fontWeight: "700",
              borderRadius: "10px",
              border: "1px solid #4f46e5",
              background: "#eff6ff",
              color: "#4f46e5",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(79, 70, 229, 0.05)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#eff6ff";
              e.currentTarget.style.color = "#4f46e5";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            내 조건식 불러오기
          </button>
          <button
            type="button"
            className="btn-restore-conditions"
            onClick={handleLoadDeletedConditions}
            style={{
              padding: "10px 18px",
              fontSize: "0.875rem",
              fontWeight: "700",
              borderRadius: "10px",
              border: "1px solid #10b981",
              background: "#ecfdf5",
              color: "#10b981",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.05)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#10b981";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ecfdf5";
              e.currentTarget.style.color = "#10b981";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            삭제된 조건식 복구
          </button>
        </div>
      </div>

      <div className="mycondition-content" style={{ gridTemplateColumns: "1fr" }}>
        <div className="mycondition-main">
          {/* 에러 발생 시 알림 배너 */}
          {errorMessage && (
            <div className="error-banner" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "15px" }}>
              {errorMessage}
            </div>
          )}

          {/* 1단계: 시장 선택 카드 */}
          <div className="detail-card" style={{ marginBottom: "10px" }}>
            <h3 className="detail-title">
              <span className="step-badge">Step 01</span>
              대상 시장 선택
            </h3>
            <p className="detail-desc">분석을 진행할 주식 시장을 선택해 주세요.</p>

            <div style={{ display: "flex", gap: "15px" }}>
              <button
                type="button"
                onClick={() => handleMarketChange("kr")}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                  border: market === "kr" ? "2px solid #2563eb" : "2px solid #e5e7eb",
                  background: market === "kr" ? "#eff6ff" : "#ffffff",
                  color: market === "kr" ? "#1e40af" : "#4b5563",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                국내 시장 (KR)
              </button>
              <button
                type="button"
                onClick={() => handleMarketChange("us")}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                  border: market === "us" ? "2px solid #2563eb" : "2px solid #e5e7eb",
                  background: market === "us" ? "#eff6ff" : "#ffffff",
                  color: market === "us" ? "#1e40af" : "#4b5563",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                미국 시장 (US)
              </button>
            </div>
          </div>

          {/* 2단계: 조건 필터 선택 카드 */}
          <div className="detail-card">
            <h3 className="detail-title">
              <span className="step-badge">Step 02</span>
              조건 필터 체크
            </h3>
            <p className="detail-desc">적용할 주식 스크리닝 필터를 선택해 주세요 (선택한 모든 조건의 교집합 종목이 추출됩니다).</p>

            <div className="filter-checkbox-grid">
              {FILTER_OPTIONS
                .filter((filter) => !filter.onlyKR || market === "kr")
                .map((filter) => {
                  const isChecked = checkedFilterKeys.includes(filter.baseKey);
                  return (
                    <label
                      key={filter.baseKey}
                      className={`filter-checkbox-label ${isChecked ? "checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="filter-checkbox-input"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(filter.baseKey)}
                      />
                      <div className="filter-checkbox-text">
                        <span className="filter-checkbox-name">
                          {getFilterLabel(filter)}
                        </span>
                        <span className="filter-checkbox-code">
                          {filter.baseKey}_{market.toUpperCase()}
                        </span>
                      </div>
                    </label>
                  );
                })}
            </div>

            {/* 시가총액 및 ETF 필터링 조건은 국내 시장(KR)에서만 활성화됩니다. */}
            {market === "kr" && (
              <>
                {/* 시가총액 랭킹 조건 단일 선택 그룹 (택 1) */}
                <div className="cap-radio-container">
                  <span className="cap-radio-title">
                    시가총액 상위 랭킹 필터 (택 1)
                  </span>
                  <div className="cap-radio-group">
                    {[
                      { val: "", label: "적용 안 함" },
                      { val: "RANK_MARKET_CAP_30", label: "상위 30" },
                      { val: "RANK_MARKET_CAP_100", label: "상위 100" },
                      { val: "RANK_MARKET_CAP_200", label: "상위 200" }
                    ].map((item) => (
                      <label
                        key={item.val}
                        className={`cap-radio-label ${marketCapFilter === item.val ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="market-cap-radio"
                          className="cap-radio-input"
                          checked={marketCapFilter === item.val}
                          onChange={() => setMarketCapFilter(item.val)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 특정 ETF 구성 종목 필터 옵션 (항상 활성화하여 상설 노출) */}
                <div className="etf-filter-panel">
                  <div className="etf-panel-header">
                    <span className="etf-panel-title">
                      특정 ETF 구성 종목으로 결과 필터링 (교집합 추출)
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* 운용사 브랜드 선택 버튼 그룹 */}
                    <div className="etf-row">
                      <span className="etf-row-label">운용사 선택:</span>
                      <button
                        type="button"
                        className={`btn-brand-tab ${etfBrand === "KODEX" ? "active" : ""}`}
                        onClick={() => setEtfBrand("KODEX")}
                      >
                        KODEX
                      </button>
                      <button
                        type="button"
                        className={`btn-brand-tab ${etfBrand === "TIGER" ? "active" : ""}`}
                        onClick={() => setEtfBrand("TIGER")}
                      >
                        TIGER
                      </button>
                    </div>

                    {/* ETF 이름 찾기 검색창 */}
                    <div className="etf-row">
                      <span className="etf-row-label">ETF 검색:</span>
                      <input
                        type="text"
                        className="etf-search-input"
                        placeholder="예: 200, 레버리지, 반도체 등"
                        value={etfSearchInput}
                        onChange={(e) => setEtfSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setEtfQuery(etfSearchInput);
                            setIsEtfModalOpen(true);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-etf-search"
                        onClick={() => {
                          setEtfQuery(etfSearchInput);
                          setIsEtfModalOpen(true);
                        }}
                      >
                        찾기
                      </button>
                    </div>

                    {/* 선택된 ETF 목록 칩 표시 */}
                    {selectedEtfs.length > 0 && (
                      <div style={{ display: "flex", gap: "5px", alignItems: "flex-start", flexDirection: "column", marginTop: "4px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#4b5563" }}>선택된 ETF 목록 ({selectedEtfs.length}/5):</span>
                        <div className="etf-chips-container">
                          {selectedEtfs.map((etf) => (
                            <span key={etf.etfId} className="etf-chip">
                              {etf.etfName}
                              <button
                                type="button"
                                className="etf-chip-delete"
                                onClick={() => removeEtfChip(etf.etfId)}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </>
            )}

            {/* 현재 선택된 조건 요약 패널 */}
            <div
              className="selected-summary-panel"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px 22px",
                marginTop: "20px",
                marginBottom: "20px",
                boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.01)"
              }}
            >
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.925rem", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                현재 선택된 분석 조건 요약
              </h4>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {/* 대상 시장 표시 칩 */}
                <span className="summary-chip market-chip" style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0369a1", fontSize: "0.8rem", fontWeight: "700", padding: "6px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center" }}>
                  시장: {market === "kr" ? "국내 시장 (KR)" : "미국 시장 (US)"}
                </span>

                {/* 시가총액 조건 표시 칩 (삭제 버튼 포함) */}
                {market === "kr" && marketCapFilter && (
                  <span className="summary-chip cap-chip" style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#b45309", fontSize: "0.8rem", fontWeight: "700", padding: "6px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    시총: {[
                      { val: "RANK_MARKET_CAP_30", label: "상위 30위" },
                      { val: "RANK_MARKET_CAP_100", label: "상위 100위" },
                      { val: "RANK_MARKET_CAP_200", label: "상위 200" }
                    ].find(item => item.val === marketCapFilter)?.label || "적용 안 함"}
                    <button
                      type="button"
                      onClick={() => setMarketCapFilter("")}
                      style={{ border: "none", background: "transparent", color: "#b45309", cursor: "pointer", fontSize: "0.75rem", display: "inline-flex", padding: 0, alignItems: "center", fontWeight: "700" }}
                      title="시가총액 조건 해제"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {/* 선택한 스크리닝 필터 조건들 표시 (삭제 버튼 포함) */}
                {checkedFilterKeys.map(key => {
                  const filterOpt = FILTER_OPTIONS.find(f => f.baseKey === key);
                  if (!filterOpt) return null;
                  return (
                    <span
                      key={key}
                      className="summary-chip filter-chip"
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        color: "#475569",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {getFilterLabel(filterOpt)}
                      <button
                        type="button"
                        onClick={() => setCheckedFilterKeys(prev => prev.filter(k => k !== key))}
                        style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.75rem", display: "inline-flex", padding: 0, alignItems: "center", fontWeight: "700" }}
                        title="조건 해제"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}

                {/* 선택한 ETF 필터들 표시 (삭제 버튼 포함) */}
                {market === "kr" && selectedEtfs.map(etf => (
                  <span
                    key={etf.etfId}
                    className="summary-chip etf-summary-chip"
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #dbeafe",
                      color: "#1e40af",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    ETF: {etf.etfName}
                    <button
                      type="button"
                      onClick={() => removeEtfChip(etf.etfId)}
                      style={{ border: "none", background: "transparent", color: "#60a5fa", cursor: "pointer", fontSize: "0.75rem", display: "inline-flex", padding: 0, alignItems: "center", fontWeight: "700" }}
                      title="ETF 필터 해제"
                    >
                      ✕
                    </button>
                  </span>
                ))}

                {/* 아무것도 선택하지 않은 경우의 예외 안내 표시 */}
                {checkedFilterKeys.length === 0 && (!marketCapFilter || market !== "kr") && (selectedEtfs.length === 0 || market !== "kr") && (
                  <span style={{ fontSize: "0.825rem", color: "#94a3b8", fontWeight: "500", padding: "4px 0" }}>
                    아직 선택된 분석 조건이 없습니다. 위에서 조건을 선택해 주세요.
                  </span>
                )}
              </div>
            </div>

            <div className="detail-actions" style={{ border: "none", paddingTop: 0, display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn-reset-screening"
                onClick={handleResetFilters}
                style={{
                  flex: "0 0 160px",
                  padding: "14px",
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#1e293b";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#475569";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                조건 초기화
              </button>

              <button
                type="button"
                className="btn-save-screening"
                onClick={handleSaveConditions}
                style={{
                  flex: "0 0 160px",
                  padding: "14px",
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  borderRadius: "12px",
                  border: "1px solid #4f46e5",
                  background: "#ffffff",
                  color: "#4f46e5",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#eff6ff";
                  e.currentTarget.style.borderColor = "#2563eb";
                  e.currentTarget.style.color = "#2563eb";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#4f46e5";
                  e.currentTarget.style.color = "#4f46e5";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {activeConditionId ? "조건 수정" : "조건 저장"}
              </button>

              <button
                className="btn-run-screening"
                onClick={handleRunSearch}
                disabled={isRunning}
                style={{ flex: 1 }}
              >
                {isRunning ? "조건 만족 종목 스크리닝 중..." : `${market.toUpperCase()} 시장 조건 검색 실행`}
              </button>
            </div>
          </div>

          {/* 3단계: 스크리닝 포착 종목 목록 카드 (관심종목 추가 기능 버튼들은 임시 제거) */}
          <div className="result-card" style={{ marginTop: "15px" }}>
            <div className="result-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>포착 종목 목록 (전체 {displayedResults.length}개)</span>
                {displayedResults.length > 200 && (
                  <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: "normal" }}>
                    * 상위 200개 종목만 표에 출력됩니다.
                  </span>
                )}
              </div>

              <div className="detail-header-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {activeConditionId !== null && (
                  <>
                    <button
                      type="button"
                      className="btn-outline-pill"
                      onClick={handleGoToMyStock}
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      ⭐ 내 종목 보러가기
                    </button>

                    <button
                      type="button"
                      className="btn-primary-pill"
                      onClick={handleAddMyStock}
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      📌 선택 종목 추가
                    </button>

                    {/* 시각적 구분 수직 막대 추가 */}
                    <span
                      style={{
                        width: "1px",
                        height: "16px",
                        backgroundColor: "#cbd5e1",
                        margin: "0 4px",
                        alignSelf: "center"
                      }}
                    />
                  </>
                )}

                <button
                  type="button"
                  className="btn-outline-pill"
                  onClick={handleGoToMyEtf}
                  style={{ padding: "6px 12px", fontSize: "0.8rem", fontWeight: "600" }}
                >
                  나의 ETF 가기
                </button>
                <button
                  type="button"
                  className="btn-outline-pill"
                  disabled={!hasEtf}
                  title={!hasEtf ? "생성된 ETF가 없습니다" : undefined}
                  onClick={() => hasEtf && setShowAddToEtf(true)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    opacity: !hasEtf ? 0.5 : 1,
                    cursor: !hasEtf ? "not-allowed" : "pointer"
                  }}
                >
                  기존 ETF 추가
                </button>
                <button
                  type="button"
                  className="btn-primary-pill"
                  onClick={() => setShowCreateEtf(true)}
                  style={{ padding: "6px 12px", fontSize: "0.8rem", fontWeight: "600" }}
                >
                  신규 ETF 생성
                </button>
              </div>
            </div>

            {activeConditionId === null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  marginBottom: "15px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  상단의 <strong>'내 조건식 불러오기'</strong>를 통해 조건식을 불러오시면, 출력된 종목들을 선택하여 내 <strong>관심종목에 등록</strong>할 수 있습니다.
                </span>
              </div>
            )}

            <div className="result-table-wrapper" style={{ overflowX: "auto" }}>
              <table className="detail-table align-table" style={{ width: "100%" }}>
                <colgroup>
                  {activeConditionId !== null && <col style={{ width: "48px" }} />}
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "125px" }} />
                  <col style={{ width: "125px" }} />
                </colgroup>
                <thead>
                  <tr>
                    {activeConditionId !== null && (
                      <th className="col-check" style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={displayedResults.length > 0 && checkedCodes.length === displayedResults.length}
                          onChange={(e) => toggleAllCodes(e.target.checked, displayedResults.map(r => r.code))}
                        />
                      </th>
                    )}
                    <th className="col-code">종목코드</th>
                    <th className="col-name">종목명</th>
                    <th className="col-detail"></th>
                    <th className="col-num">현재가(종가)</th>
                    <th className="col-num">고가</th>
                    <th className="col-num">저가</th>
                  </tr>
                </thead>
                <tbody>
                  {isRunning ? (
                    <tr>
                      <td colSpan={activeConditionId !== null ? 7 : 6} style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
                        조건에 부합하는 종목을 실시간으로 스크리닝 중입니다. 잠시만 기다려 주세요.
                      </td>
                    </tr>
                  ) : displayedResults.length === 0 ? (
                    <tr>
                      <td colSpan={activeConditionId !== null ? 7 : 6} style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                        {errorMessage ? "에러가 발생하여 조회가 중단되었습니다." : "상단의 필터를 선택하고 실행 버튼을 눌러 스크리닝된 종목 리스트를 확인하세요."}
                      </td>
                    </tr>
                  ) : (
                    /* 대용량 데이터로 인한 React 렌더링 정지(Unresponsive)를 방지하기 위해 최대 200개로 슬라이스하여 매핑합니다. */
                    displayedResults.slice(0, 200).map((r) => (
                      <tr key={r.code}>
                        {activeConditionId !== null && (
                          <td className="col-check" style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={checkedCodes.includes(r.code)}
                              onChange={() => toggleOneCode(r.code)}
                            />
                          </td>
                        )}
                        <td className="col-code" style={{ fontFamily: "monospace" }}>{r.code}</td>
                        <td className="col-name" style={{ fontWeight: 600 }}>{r.name}</td>
                        <td className="col-detail">
                          <button
                            className="detail-link-btn"
                            onClick={() => navigate(`/stock/searchStock?code=${encodeURIComponent(r.code)}&name=${encodeURIComponent(r.name)}`)}
                          >
                            종목상세
                          </button>
                        </td>
                        <td className="col-num">
                          {r.currentPrice ? `${r.currentPrice.toLocaleString()} ${market === "kr" ? "원" : "$"}` : "-"}
                        </td>
                        <td className="col-num">
                          {r.high ? `${r.high.toLocaleString()} ${market === "kr" ? "원" : "$"}` : "-"}
                        </td>
                        <td className="col-num">
                          {r.low ? `${r.low.toLocaleString()} ${market === "kr" ? "원" : "$"}` : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* ETF 검색 결과 다중 선택 모달 팝업 */}
      <EtfSearchModal
        isOpen={isEtfModalOpen}
        onClose={() => setIsEtfModalOpen(false)}
        onConfirm={(tempEtfs) => {
          setSelectedEtfs(tempEtfs);
          setIsEtfModalOpen(false);
        }}
        etfBrand={etfBrand}
        setEtfBrand={setEtfBrand}
        etfSearchInput={etfSearchInput}
        setEtfSearchInput={setEtfSearchInput}
        etfQuery={etfQuery}
        setEtfQuery={setEtfQuery}
        etfList={etfList}
        etfLoading={etfLoading}
        selectedEtfs={selectedEtfs}
      />

      {/* 조건 저장 및 선택된 조건 요약 확인 모달 팝업 */}
      <ConditionSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        conditionName={saveConditionName}
        setConditionName={setSaveConditionName}
        onSave={handleConfirmSave}
        market={market}
        checkedFilterKeys={checkedFilterKeys}
        marketCapFilter={marketCapFilter}
        selectedEtfs={selectedEtfs}
        filterOptions={FILTER_OPTIONS}
        isEditMode={!!activeConditionId}
      />

      {/* 저장된 조건식 목록 및 불러오기/삭제 관리 모달 팝업 */}
      <ConditionListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        conditions={savedConditions}
        onApply={handleApplyCondition}
        onDelete={handleDeleteCondition}
        filterOptions={FILTER_OPTIONS}
      />

      {/* 삭제된 조건식 복구 관리 모달 팝업 */}
      <ConditionRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        conditions={deletedConditions}
        onRestore={handleRestoreCondition}
        filterOptions={FILTER_OPTIONS}
      />

      {/* ETF 생성 및 기존 수정 모달 팝업 추가 연동 */}
      {showCreateEtf && (
        <CreateEtfModal
          open={showCreateEtf}
          myStocks={displayedResults.map(r => ({
            code: r.code,
            name: r.name,
            market: (r.market || market).toUpperCase() as "KR" | "US",
            currentPrice: r.currentPrice || null,
          }))}
          leftPanelTitle="스크리닝 포착 종목"
          onClose={() => setShowCreateEtf(false)}
          onCreated={() => {
            setShowCreateEtf(false);
            setHasEtf(true);
          }}
        />
      )}

      {showAddToEtf && (
        <EditEtfModal
          open={showAddToEtf}
          myStocks={displayedResults.map(r => ({
            code: r.code,
            name: r.name,
            market: (r.market || market).toUpperCase() as "KR" | "US",
            currentPrice: r.currentPrice || null,
          }))}
          leftPanelTitle="스크리닝 포착 종목"
          onClose={() => setShowAddToEtf(false)}
          onSaved={() => setShowAddToEtf(false)}
        />
      )}

      <UnsavedChangesConfirmModal
        isOpen={showUnsavedChangesConfirm}
        onClose={() => setShowUnsavedChangesConfirm(false)}
        onConfirm={executeAddMyStock}
        conditionName={(activeConditionName || "나만의 조건식").trim().replace(/_(KR|US)$/i, "")}
        isDirty={activeConditionId !== null && isConditionDirty()}
      />

      {/* 세련된 토스트(Toast) 팝업 알림 */}
      {toast && (
        <div
          className="toast-popup-container"
          style={{
            position: "fixed",
            top: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1500,
            background: "#ffffff",
            border: toast.type === "success" ? "1px solid #10b981" : toast.type === "error" ? "1px solid #ef4444" : "1px solid #3b82f6",
            borderLeftWidth: "6px",
            borderRadius: "10px",
            padding: "14px 20px",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "toastSlideDown 0.3s ease-out",
            minWidth: "320px"
          }}
        >
          {toast.type === "success" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.type === "info" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#334155", whiteSpace: "pre-line" }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
