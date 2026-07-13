// src/pages/manage/BatchHistoryPage.tsx

import { useEffect, useState } from "react";
import {
  getBatchHistoryDates,
  getMemberList,
  updateMemberGrade,
  getBatchHistoryByDate,
  uploadCsvFile,
  getBatchJobs,
  triggerBatchJob,
  getBatchHistoryByJob,
  updateBatchJobSchedule
} from "../../api/manageBatchApi";
import type {
  BatchDateGroupDTO,
  MemberDTO,
  BatchHistoryView,
  BatchJob
} from "../../api/manageBatchApi";
import BatchHistoryList from "./BatchHistoryList";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./batch-history.css";

/**
 * 배치 스케줄링 메타데이터를 사람이 읽기 편한 포맷의 텍스트로 변환합니다.
 */
const formatScheduleText = (
  scheduleGb: string,
  jobHour: string,
  jobMin: string,
  jobWeek?: string,
  jobDay?: string,
  jobMonth?: string
) => {
  const timeStr = `${(jobHour || "00").padStart(2, "0")}:${(jobMin || "00").padStart(2, "0")}`;
  if (scheduleGb === "D") {
    return `매일 (D) ${timeStr}`;
  }
  if (scheduleGb === "W") {
    const weekMap: Record<string, string> = {
      MON: "월요일", TUE: "화요일", WED: "수요일", THU: "목요일", FRI: "금요일", SAT: "토요일", SUN: "일요일"
    };
    return `매주 (${weekMap[jobWeek || ""] || jobWeek || "-"}) ${timeStr}`;
  }
  if (scheduleGb === "M") {
    return `매월 (${parseInt(jobDay || "1")}일) ${timeStr}`;
  }
  if (scheduleGb === "Y") {
    return `매년 (${parseInt(jobMonth || "1")}월 ${parseInt(jobDay || "1")}일) ${timeStr}`;
  }
  return `알 수 없음`;
};

/**
 * 종합 관리자 대시보드 컴포넌트입니다.
 * 시스템의 배치 실행 결과 이력을 달력(캘린더) 형태로 시각화하여 확인하고,
 * 특정 년-월-일을 지정해 조회 시 모달 팝업으로 상세 내역을 제공합니다.
 * 가입된 회원들의 등급 권한을 실시간으로 관리하고 필터링 검색을 제공하며,
 * 매월 수집해야 할 원천 데이터 CSV 파일을 직접 업로드해 덮어쓰기할 수 있는 툴을 지원합니다.
 */
export default function BatchHistoryPage() {
  const today = new Date();

  // 탭 상태 ("batch": 배치 실행 이력 | "upload": 배치 데이터 업로드 | "control": 배치 작업 제어 | "member": 회원 등급 관리)
  const [activeTab, setActiveTab] = useState<"batch" | "upload" | "control" | "member">("batch");

  // 드롭다운 선택 필터 상태 (년, 월, 일)
  const [selYear, setSelYear] = useState<number>(today.getFullYear());
  const [selMonth, setSelMonth] = useState<number>(today.getMonth()); // 0 ~ 11
  const [selDay, setSelDay] = useState<string>(""); // "" 이면 일 선택 안 함

  // 달력이 현재 렌더링해야 할 기준 연월 (기본값 오늘)
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  // 배치 기록용 상태 변수들 (캘린더 연동을 위해 200일치 넉넉히 호출)
  const [batchList, setBatchList] = useState<BatchDateGroupDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // 모달 제어용 상태 변수들 (yyyy-MM-dd 또는 null)
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, BatchHistoryView[]>>({});
  const [loadingDate, setLoadingDate] = useState<string | null>(null);

  // 회원 정보용 상태 변수들
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [submittingMid, setSubmittingMid] = useState<string | null>(null);

  // 회원 검색 필터 임시 입력값 상태
  const [tempSearchKeyword, setTempSearchKeyword] = useState("");
  const [tempGrade, setTempGrade] = useState("ALL");
  const [tempStatus, setTempStatus] = useState("ALL");

  // 회원 검색 최종 적용 필터 상태
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedGrade, setAppliedGrade] = useState("ALL");
  const [appliedStatus, setAppliedStatus] = useState("ALL");

  // 배치 소스 데이터 CSV 파일 선택용 로컬 상태
  const [fileEtf, setFileEtf] = useState<File | null>(null);
  const [fileKrx, setFileKrx] = useState<File | null>(null);
  const [fileNpsKr, setFileNpsKr] = useState<File | null>(null);
  const [fileNpsUs, setFileNpsUs] = useState<File | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // 배치 작업 제어(설정 리스트 및 재처리) 상태
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [filterJobName, setFilterJobName] = useState<string | null>(null);
  const [controlTypeFilter, setControlTypeFilter] = useState<"ALL" | "IN" | "OUT">("IN");

  // 배치 Job 검색 및 세부 필터링 상태 추가
  const [tempSearchJobKeyword, setTempSearchJobKeyword] = useState("");
  const [searchJobKeyword, setSearchJobKeyword] = useState("");
  const [filterScheduleGb, setFilterScheduleGb] = useState("ALL");
  const [filterJobHour, setFilterJobHour] = useState("ALL");
  const [todayExecFilter, setTodayExecFilter] = useState("ALL");

  // 단일 Job의 독립 실행 이력 팝업 모달 상태
  const [jobHistoryModalName, setJobHistoryModalName] = useState<string | null>(null);
  const [jobHistoryItems, setJobHistoryItems] = useState<BatchHistoryView[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(false);

  // 배치 스케줄 설정 편집 모달용 상태 추가
  const [editingJob, setEditingJob] = useState<BatchJob | null>(null);
  const [editScheduleGb, setEditScheduleGb] = useState("D");
  const [editJobHour, setEditJobHour] = useState("00");
  const [editJobMin, setEditJobMin] = useState("00");
  const [editJobWeek, setEditJobWeek] = useState("MON");
  const [editJobDay, setEditJobDay] = useState("01");
  const [editJobMonth, setEditJobMonth] = useState("01");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 모달 팝업 활성화 시 뒷배경 스크롤 잠금 설정
  useLockBodyScroll(!!modalDate || !!jobHistoryModalName || !!editingJob);

  // 컴포넌트 마운트 및 배치 필터 변경 시 이력 데이터 다시 로드
  useEffect(() => {
    loadData();
  }, [filterJobName]);

  // 대시보드 스탯 계산 및 회원 탭 대응을 위해 최초 마운트 시 회원 목록 로드
  useEffect(() => {
    loadMembers();
  }, []);

  // 배치 작업 설정 제어 탭 활성화 시 로드
  useEffect(() => {
    if (activeTab === "control") {
      loadBatchJobs();
    }
  }, [activeTab]);

  /**
   * 백엔드로부터 배치 작업 날짜별 그룹 이력 목록을 호출합니다.
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getBatchHistoryDates(1, 200, filterJobName || undefined);
      setBatchList(data.dtoList || []);
    } catch (err) {
      console.error("배치 이력 로딩 실패: ", err);
      alert("배치 데이터를 로드하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 전체 배치 설정 및 상태 목록을 로드합니다.
   */
  const loadBatchJobs = async () => {
    setJobsLoading(true);
    try {
      const data = await getBatchJobs();
      setJobs(data);
    } catch (err: any) {
      console.error("배치 작업 로딩 실패: ", err);
      alert(err.message || "배치 작업 설정 목록을 로드하는 중 오류가 발생했습니다.");
    } finally {
      setJobsLoading(false);
    }
  };

  /**
   * 백엔드로부터 전체 회원 정보 목록을 호출합니다.
   */
  const loadMembers = async () => {
    setMemberLoading(true);
    try {
      const data = await getMemberList();
      setMembers(data);
    } catch (err) {
      console.error("회원 목록 로딩 실패: ", err);
    } finally {
      setMemberLoading(false);
    }
  };

  /**
   * 특정 배치 Job의 전체 실행 로그 이력을 API로 조회하여 독립 팝업 모달로 띄워줍니다.
   */
  const handleViewHistoryOfJob = async (name: string) => {
    setJobHistoryModalName(name);
    setJobHistoryLoading(true);
    setJobHistoryItems([]);
    try {
      const data = await getBatchHistoryByJob(name, 50);
      setJobHistoryItems(data);
    } catch (err: any) {
      console.error("단일 Job 이력 로딩 실패: ", err);
      alert(err.message || "배치 이력을 불러오는 데 실패했습니다.");
      setJobHistoryModalName(null);
    } finally {
      setJobHistoryLoading(false);
    }
  };

  /**
   * 배치 스케줄 설정을 수정하기 위한 모달 팝업을 오픈하고 필드값을 로드합니다.
   */
  const handleOpenEditModal = (job: BatchJob) => {
    setEditingJob(job);
    setEditScheduleGb(job.scheduleGb);
    setEditJobHour(job.jobHour || "00");
    setEditJobMin(job.jobMin || "00");
    setEditJobWeek(job.jobWeek || "MON");
    setEditJobDay(job.jobDay || "01");
    setEditJobMonth(job.jobMonth || "01");
  };

  /**
   * 입력된 스케줄 설정을 백엔드 데이터베이스에 최종 업데이트 처리합니다.
   */
  const handleSaveSchedule = async () => {
    if (!editingJob) return;
    setEditSubmitting(true);
    try {
      await updateBatchJobSchedule(editingJob.type, editingJob.jobId, {
        scheduleGb: editScheduleGb,
        jobHour: editJobHour.padStart(2, "0"),
        jobMin: editJobMin.padStart(2, "0"),
        jobWeek: editScheduleGb === "W" ? editJobWeek : "",
        jobDay: (editScheduleGb === "M" || editScheduleGb === "Y") ? editJobDay.padStart(2, "0") : "",
        jobMonth: editScheduleGb === "Y" ? editJobMonth.padStart(2, "0") : ""
      });
      alert(`[${editingJob.jobName}] 배치 스케줄 설정이 성공적으로 업데이트되었습니다.`);
      setEditingJob(null);
      loadBatchJobs(); // 배치 목록 리프레시
    } catch (err: any) {
      console.error("스케줄 업데이트 에러:", err);
      alert(err.message || "스케줄 수정 수행 도중 오류가 발생했습니다.");
    } finally {
      setEditSubmitting(false);
    }
  };

  /**
   * 모달 팝업 내부에서 변경 설정 중인 해당 배치를 즉시 기동(재처리)시킵니다.
   */
  const handleTriggerJobDirect = async () => {
    if (!editingJob) return;
    const confirmRun = window.confirm(`[${editingJob.jobName}] 배치를 지금 즉시 강제 기동(재처리)하시겠습니까?`);
    if (!confirmRun) return;
    setEditSubmitting(true);
    try {
      await triggerBatchJob(editingJob.type, editingJob.jobId);
      alert("배치 즉시 재처리 명령이 성공적으로 전달되었습니다.");
      setEditingJob(null);
      loadBatchJobs(); // 배치 목록 리프레시
    } catch (e: any) {
      alert(e.message || "즉시 재처리 실행 요청에 실패했습니다.");
    } finally {
      setEditSubmitting(false);
    }
  };

  /**
   * 특정 날짜의 상세 배치 실행 내역 데이터를 백엔드로부터 조회하여 모달 팝업을 오픈합니다.
   * @param execDate 조회 대상 날짜 (yyyy-MM-dd)
   */
  const handleOpenModal = async (execDate: string) => {
    if (detailsCache[execDate]) {
      setModalDate(execDate);
      return;
    }

    if (loadingDate) return;

    setLoadingDate(execDate);
    try {
      const res = await getBatchHistoryByDate(execDate, 1, 200);
      setDetailsCache(prev => ({ ...prev, [execDate]: res.dtoList }));
      setModalDate(execDate);
    } catch (err) {
      console.error("상세 내역 로드 실패: ", err);
      alert("상세 내역을 가져오는데 실패했습니다.");
    } finally {
      setLoadingDate(null);
    }
  };

  const handleCloseModal = () => {
    setModalDate(null);
  };

  /**
   * 상단 드롭다운 선택 필터 후 '조회' 버튼을 클릭했을 때 실행되는 핸들러입니다.
   */
  const handleSearch = async () => {
    // '일'까지 선택되어 있는 경우 해당 날짜 상세 모달을 즉시 오픈
    if (selDay) {
      const targetDate = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(selDay).padStart(2, "0")}`;
      await handleOpenModal(targetDate);
    } else {
      // '일'이 선택되지 않은 경우, 달력의 위치를 사용자가 선택한 연/월로 점프시킵니다.
      setViewYear(selYear);
      setViewMonth(selMonth);
    }
  };

  /**
   * 오늘 날짜로 달력의 포커스를 맞추고, 오늘자 상세 배치 내역 모달을 즉시 팝업합니다.
   */
  const handleGoToToday = async () => {
    const tYear = today.getFullYear();
    const tMonth = today.getMonth();
    const tDay = today.getDate();

    // 드롭다운 및 달력 화면 기준 년월을 오늘 날짜로 세팅
    setSelYear(tYear);
    setSelMonth(tMonth);
    setSelDay(String(tDay));

    setViewYear(tYear);
    setViewMonth(tMonth);

    // 오늘자 날짜 문자열 구성 후 상세 이력 모달 팝업 실행
    const targetDate = `${tYear}-${String(tMonth + 1).padStart(2, "0")}-${String(tDay).padStart(2, "0")}`;
    await handleOpenModal(targetDate);
  };

  /**
   * 달력에서 좌우 달 이동 시 드롭다운과 동기화해주는 핸들러입니다.
   */
  const handleMonthChangeFromCalendar = (y: number, m: number) => {
    setViewYear(y);
    setViewMonth(m);
    setSelYear(y);
    setSelMonth(m);
    setSelDay(""); // 달을 이동하면 일 선택 드롭다운은 초기화
  };

  /**
   * 회원 검색 버튼 클릭 시 최종 입력 조건 필터를 리스트 렌더링 상태에 적용합니다.
   */
  const handleMemberSearch = () => {
    setAppliedKeyword(tempSearchKeyword);
    setAppliedGrade(tempGrade);
    setAppliedStatus(tempStatus);
  };

  /**
   * 특정 사용자의 이용 권한 등급을 수정하는 이벤트 핸들러입니다.
   * @param mid   수정할 회원의 아이디
   * @param newGrade 변경할 신규 등급 명칭
   */
  const handleGradeChange = async (mid: string, newGrade: string) => {
    if (!window.confirm(`${mid} 회원의 등급을 ${newGrade}(으)로 변경하시겠습니까?`)) {
      return;
    }

    setSubmittingMid(mid);
    try {
      await updateMemberGrade(mid, newGrade);
      alert("회원 등급이 성공적으로 변경되었습니다.");
      await loadMembers(); // 목록 최신 데이터 갱신
    } catch (err) {
      console.error("회원 등급 변경 실패: ", err);
      alert("등급 변경 처리 중 예외가 발생했습니다.");
    } finally {
      setSubmittingMid(null);
    }
  };

  /**
   * 관리자가 특정 CSV 데이터 원천 파일을 서버에 업로드 덮어쓰기하는 핸들러입니다.
   * @param type 구분 타겟 유형
   * @param file 업로드할 파일 객체
   */
  const handleCsvUpload = async (type: string, file: File | null) => {
    if (!file) {
      alert("업로드 처리할 CSV 파일을 먼저 선택해 주십시오.");
      return;
    }

    if (!window.confirm("정말로 이 CSV 파일을 업로드하여 기존 배치용 소스 데이터를 덮어쓰시겠습니까?")) {
      return;
    }

    setUploadingType(type);
    try {
      const res = await uploadCsvFile(file, type);
      alert(`배치 원천 파일 업로드 완료!\n저장 파일명: ${res.fileName}\n저장 물리 경로: ${res.savedPath}`);

      // 파일 상태 초기화
      if (type === "MONTHLY_ETF") setFileEtf(null);
      else if (type === "MONTHLY_KRX") setFileKrx(null);
      else if (type === "MONTHLY_NPS_KR") setFileNpsKr(null);
      else if (type === "MONTHLY_NPS_US") setFileNpsUs(null);

    } catch (err: any) {
      console.error("파일 업로드 에러:", err);
      alert(err.message || "파일 업로드 수행 도중 오류가 발생했습니다.");
    } finally {
      setUploadingType(null);
    }
  };

  // 스탯 수치 계산
  const activeUsersCount = members.filter(m => !m.del).length;
  const deletedUsersCount = members.filter(m => m.del).length;
  const basicUsersCount = members.filter(m => m.grade === "BASIC").length;
  const premiumUsersCount = members.filter(m => m.grade === "PREMIUM").length;

  // 검색 확정 조건(키워드, 등급, 계정상태, 가입유형)에 따른 회원 목록 필터링
  const filteredMembers = members.filter(m => {
    // 1. 키워드 (아이디 또는 이메일 포함여부)
    const matchKeyword =
      m.mid.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(appliedKeyword.toLowerCase()));

    // 2. 회원 등급 매칭
    const matchGrade = appliedGrade === "ALL" || m.grade === appliedGrade;

    // 3. 계정 상태 매칭 (정상/탈퇴)
    const isDeleted = m.del;
    const matchStatus =
      appliedStatus === "ALL" ||
      (appliedStatus === "ACTIVE" && !isDeleted) ||
      (appliedStatus === "DELETED" && isDeleted);

    return matchKeyword && matchGrade && matchStatus;
  });

  // 연도 선택 옵션 계산 (배치 데이터에 있는 범위 기준)
  const yearOptions = Array.from(
    new Set([
      today.getFullYear(),
      ...batchList.map(item => parseInt(item.execDate.substring(0, 4)))
    ])
  ).sort((a, b) => b - a);

  // 선택한 연도/월 기준 일자 옵션 배열 생성
  const maxDay = new Date(selYear, selMonth + 1, 0).getDate();
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);



  // 특정 잡에 대한 이력 필터링이 적용된 상세 아이템들
  const filteredItems = modalDate
    ? (filterJobName
        ? (detailsCache[modalDate] || []).filter(item => item.jobName === filterJobName)
        : (detailsCache[modalDate] || []))
    : [];

  const todayKstStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 10);

  return (
    <div className="batch-container">
      {/* 대시보드 최상단 타이틀 */}
      <div className="batch-header">
        <h3>종합 관리자 대시보드</h3>
        <span className="batch-header-subtitle">
          시스템 배치 작업 결과 확인 및 전체 회원의 등급 권한을 실시간으로 제어합니다.
        </span>
      </div>

      {/* 
        대시보드 통계 요약 카드 섹션 
        (사용자 요구사항에 따라 '배치 기록 보유일' 제거 및 '회원 등급 관리' 탭 활성화 시에만 출력)
      */}
      {/* 어드민 기능 탭 목록 */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "batch" ? "active" : ""}`}
          onClick={() => setActiveTab("batch")}
        >
          배치 실행 이력
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          배치 데이터 업로드
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "control" ? "active" : ""}`}
          onClick={() => setActiveTab("control")}
        >
          배치 작업 제어
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "member" ? "active" : ""}`}
          onClick={() => setActiveTab("member")}
        >
          회원 등급 관리
        </button>
      </div>

      {/* 
        대시보드 통계 요약 카드 섹션 
        (사용자 요구사항에 따라 '배치 기록 보유일' 제거 및 '회원 등급 관리' 탭 활성화 시에만 출력)
      */}
      {activeTab === "member" && (
        <div className="dashboard-stats" style={{ animation: "fadeIn 0.2s ease-out" }}>
          {/* 1. 계정 상태 현황 카드 */}
          <div className="stat-card">
            <div className="stat-icon users">👥</div>
            <div className="stat-content">
              <span className="stat-label">계정 상태 현황</span>
              <span className="stat-value" style={{ fontSize: "16px", fontWeight: "700" }}>
                정상 {activeUsersCount.toLocaleString()}명 / 탈퇴 {deletedUsersCount.toLocaleString()}명
              </span>
            </div>
          </div>

          {/* 2. 회원 등급 분포 카드 */}
          <div className="stat-card">
            <div className="stat-icon premium">👑</div>
            <div className="stat-content">
              <span className="stat-label">회원 등급 분포</span>
              <span className="stat-value" style={{ fontSize: "16px", fontWeight: "700" }}>
                PREMIUM {premiumUsersCount.toLocaleString()}명 / BASIC {basicUsersCount.toLocaleString()}명
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 각 탭의 실제 컨텐츠 바디 */}
      {activeTab === "batch" && (
        /* 배치 실행 이력 컨텐츠 영역 */
        <div className="admin-card">
          {filterJobName && (
            <div className="active-filter-bar" style={{ animation: "fadeIn 0.2s ease-out" }}>
              <span>
                필터링 적용 중: <strong>{filterJobName}</strong> (달력 상세 이력 모달에 필터가 적용됩니다)
              </span>
              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => setFilterJobName(null)}
              >
                필터 해제
              </button>
            </div>
          )}

          {/* 년, 월, 일 드롭다운 & 조회 버튼 컨트롤 영역 */}
          <div
            className="search-container"
            style={{
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "16px",
              marginBottom: "20px"
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
              날짜 직접 지정:
            </span>

            {/* 연도 드롭다운 */}
            <select
              className="admin-select"
              value={selYear}
              onChange={e => {
                setSelYear(Number(e.target.value));
                setSelDay(""); // 년도 변경 시 일 초기화
              }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>

            {/* 월 드롭다운 */}
            <select
              className="admin-select"
              value={selMonth}
              onChange={e => {
                setSelMonth(Number(e.target.value));
                setSelDay(""); // 월 변경 시 일 초기화
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}월
                </option>
              ))}
            </select>

            {/* 일 드롭다운 */}
            <select
              className="admin-select"
              value={selDay}
              onChange={e => setSelDay(e.target.value)}
            >
              <option value="">일 선택(안 함)</option>
              {dayOptions.map(d => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>

            {/* 조회 버튼 */}
            <button
              type="button"
              className="btn-primary"
              onClick={handleSearch}
              style={{ marginLeft: "8px" }}
            >
              조회
            </button>

            {/* 오늘 바로가기 단축 버튼 */}
            <button
              type="button"
              className="btn-primary"
              onClick={handleGoToToday}
              style={{
                marginLeft: "4px",
                background: "linear-gradient(135deg, #10b981, #059669) !important",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)"
              }}
            >
              오늘
            </button>
          </div>

          {loading && batchList.length === 0 ? (
            <div className="no-data-msg">배치 데이터를 불러오는 중입니다...</div>
          ) : (
            /* 기본 달력(캘린더) 뷰 - 셀 클릭 또는 조회 시 모달을 띄웁니다. */
            <BatchHistoryList
              list={batchList}
              viewYear={viewYear}
              viewMonth={viewMonth}
              onMonthChange={handleMonthChangeFromCalendar}
              onOpenSingleView={handleOpenModal}
              loadingDate={loadingDate}
            />
          )}
        </div>
      )}

      {activeTab === "member" && (
        /* 회원 등급 관리 컨텐츠 영역 */
        <div className="admin-card">
          {/* 회원 다중 필터 검색 바 */}
          <div
            className="search-container"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "16px",
              marginBottom: "20px"
            }}
          >
            {/* 검색 키워드 인풋 (아이디/이메일) */}
            <input
              type="text"
              placeholder="회원 아이디 또는 이메일 입력..."
              className="search-input"
              style={{ flex: "none", width: "240px", margin: 0 }}
              value={tempSearchKeyword}
              onChange={e => setTempSearchKeyword(e.target.value)}
            />

            {/* 등급 필터 셀렉트 */}
            <select
              className="admin-select"
              value={tempGrade}
              onChange={e => setTempGrade(e.target.value)}
            >
              <option value="ALL">전체 등급</option>
              <option value="BASIC">BASIC 회원</option>
              <option value="PREMIUM">PREMIUM 회원</option>
            </select>

            {/* 계정 상태 필터 셀렉트 */}
            <select
              className="admin-select"
              value={tempStatus}
              onChange={e => setTempStatus(e.target.value)}
            >
              <option value="ALL">전체 상태</option>
              <option value="ACTIVE">정상 사용</option>
              <option value="DELETED">탈퇴 계정</option>
            </select>

            {/* 가입경로 필터 셀렉트 (홈페이지 가입만 존재하므로 당분간 주석 처리)
            <select
              className="admin-select"
              value={tempSocial}
              onChange={e => setTempSocial(e.target.value)}
            >
              <option value="ALL">전체 가입경로</option>
              <option value="LOCAL">일반 가입</option>
              <option value="SOCIAL">소셜 로그인 가입</option>
            </select>
            */}

            {/* 검색 버튼 */}
            <button
              type="button"
              className="btn-primary"
              style={{ marginLeft: "8px" }}
              onClick={handleMemberSearch}
            >
              검색
            </button>
          </div>

          {memberLoading && members.length === 0 ? (
            <div className="no-data-msg">회원 데이터를 불러오는 중입니다...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>아이디</th>
                    <th>이메일</th>
                    {/* <th>가입 유형</th> (홈페이지 가입 전용이므로 주석 처리) */}
                    <th>상태</th>
                    <th>현재 등급</th>
                    <th>등급 제어</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map(member => (
                      <tr key={member.mid}>
                        <td style={{ fontWeight: 700 }}>{member.mid}</td>
                        <td>{member.email || "-"}</td>
                        {/* 가입 유형 컬럼 주석 처리
                        <td>
                          <span className={`badge ${member.social ? "social" : "local"}`}>
                            {member.social ? "소셜 회원" : "일반 가입"}
                          </span>
                        </td>
                        */}
                        <td>
                          <span className={`badge ${member.del ? "deleted" : "active-user"}`}>
                            {member.del ? "탈퇴 계정" : "정상 사용"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${member.grade.toLowerCase()}`}>
                            {member.grade}
                          </span>
                        </td>
                        <td>
                          <select
                            className="admin-select"
                            value={member.grade}
                            disabled={submittingMid === member.mid}
                            onChange={e => handleGradeChange(member.mid, e.target.value)}
                          >
                            <option value="BASIC">BASIC</option>
                            <option value="PREMIUM">PREMIUM</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="no-data-msg">
                        검색 조건과 일치하는 회원이 존재하지 않습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "upload" && (
        /* 배치 데이터 업로드 컨텐츠 영역 */
        <div className="admin-card">
          <div className="upload-header" style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
              배치 소스 파일 업로드 (CSV)
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
              매월 수동 수집되는 국민연금 주식 매수 내역, KRX 전상장사 기본 정보 및 국내 ETF 요약 CSV 파일들을 서버 물리 디렉토리에 직접 덮어씁니다.
              <br />
              업로드 완료 후 해당 데이터 기반 배치 작업이 활성화됩니다.
            </p>
          </div>

          <div className="upload-grid">
            {/* 1. KOREA_COMPANY_INFO.csv 업로드 슬롯 */}
            <div className="upload-card">
              <span className="upload-badge">MONTHLY_KRX_CSV</span>
              <h5>KOREA_COMPANY_INFO.csv</h5>
              <p style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "700", margin: "4px 0 10px 0" }}>
                * 업로드 시 자동 파일명 변환 처리됨
              </p>
              <p>국내 시장 상장 전기업 기본 개요 정보 데이터 소스</p>
              <input
                type="file"
                id="file-krx-input"
                accept=".csv"
                style={{ display: "none" }}
                disabled={uploadingType !== null}
                onChange={e => setFileKrx(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-krx-input" className="upload-file-label">
                파일 선택
              </label>
              {fileKrx && <span className="selected-filename">{fileKrx.name}</span>}
              <button
                type="button"
                className="upload-action-btn"
                disabled={!fileKrx || uploadingType !== null}
                onClick={() => handleCsvUpload("MONTHLY_KRX", fileKrx)}
              >
                {uploadingType === "MONTHLY_KRX" ? "업로드 중..." : "업로드 수행"}
              </button>
            </div>

            {/* 2. KOREA_ETF_INFO.csv 업로드 슬롯 */}
            <div className="upload-card">
              <span className="upload-badge">MONTHLY_ETF_CSV</span>
              <h5>KOREA_ETF_INFO.csv</h5>
              <p style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "700", margin: "4px 0 10px 0" }}>
                * 업로드 시 자동 파일명 변환 처리됨
              </p>
              <p>국내 ETF 기본 요약 정보 데이터 원천 소스</p>
              <input
                type="file"
                id="file-etf-input"
                accept=".csv"
                style={{ display: "none" }}
                disabled={uploadingType !== null}
                onChange={e => setFileEtf(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-etf-input" className="upload-file-label">
                파일 선택
              </label>
              {fileEtf && <span className="selected-filename">{fileEtf.name}</span>}
              <button
                type="button"
                className="upload-action-btn"
                disabled={!fileEtf || uploadingType !== null}
                onClick={() => handleCsvUpload("MONTHLY_ETF", fileEtf)}
              >
                {uploadingType === "MONTHLY_ETF" ? "업로드 중..." : "업로드 수행"}
              </button>
            </div>

            {/* 3. NPS_INFO_KR.csv 업로드 슬롯 */}
            <div className="upload-card">
              <span className="upload-badge">MONTHLY_NPS_INFO_KR_CSV</span>
              <h5>NPS_INFO_KR.csv</h5>
              <p style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "700", margin: "4px 0 10px 0" }}>
                * 업로드 시 자동 파일명 변환 처리됨
              </p>
              <p>국민연금 국내 주식 지분율 보유 및 매수 이력 소스</p>
              <input
                type="file"
                id="file-npskr-input"
                accept=".csv"
                style={{ display: "none" }}
                disabled={uploadingType !== null}
                onChange={e => setFileNpsKr(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-npskr-input" className="upload-file-label">
                파일 선택
              </label>
              {fileNpsKr && <span className="selected-filename">{fileNpsKr.name}</span>}
              <button
                type="button"
                className="upload-action-btn"
                disabled={!fileNpsKr || uploadingType !== null}
                onClick={() => handleCsvUpload("MONTHLY_NPS_KR", fileNpsKr)}
              >
                {uploadingType === "MONTHLY_NPS_KR" ? "업로드 중..." : "업로드 수행"}
              </button>
            </div>

            {/* 4. NPS_INFO_US.csv 업로드 슬롯 */}
            <div className="upload-card">
              <span className="upload-badge">MONTHLY_NPS_INFO_US_CSV</span>
              <h5>NPS_INFO_US.csv</h5>
              <p style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "700", margin: "4px 0 10px 0" }}>
                * 업로드 시 자동 파일명 변환 처리됨
              </p>
              <p>국민연금 해외(미국 등) 주식 보유 내역 원천 데이터 소스</p>
              <input
                type="file"
                id="file-npsus-input"
                accept=".csv"
                style={{ display: "none" }}
                disabled={uploadingType !== null}
                onChange={e => setFileNpsUs(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-npsus-input" className="upload-file-label">
                파일 선택
              </label>
              {fileNpsUs && <span className="selected-filename">{fileNpsUs.name}</span>}
              <button
                type="button"
                className="upload-action-btn"
                disabled={!fileNpsUs || uploadingType !== null}
                onClick={() => handleCsvUpload("MONTHLY_NPS_US", fileNpsUs)}
              >
                {uploadingType === "MONTHLY_NPS_US" ? "업로드 중..." : "업로드 수행"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "control" && (() => {
        const filteredJobs = jobs.filter(job => {
          // 1. 유형 필터
          if (controlTypeFilter !== "ALL" && job.type !== controlTypeFilter) return false;

          // 2. 검색어 필터 (Job명 / 설명)
          if (searchJobKeyword) {
            const keyword = searchJobKeyword.toLowerCase();
            const matchName = job.jobName.toLowerCase().includes(keyword);
            const matchInfo = job.jobInfo && job.jobInfo.toLowerCase().includes(keyword);
            if (!matchName && !matchInfo) return false;
          }

          // 3. 주기 필터 (D: 일, W: 주, M: 월, Y: 년)
          if (filterScheduleGb !== "ALL" && job.scheduleGb !== filterScheduleGb) return false;

          // 4. 시간대 필터
          if (filterJobHour !== "ALL") {
            const hJob = parseInt(job.jobHour);
            const hFilter = parseInt(filterJobHour);
            if (isNaN(hJob) || hJob !== hFilter) return false;
          }

          // 5. 오늘 실행 여부 필터
          if (todayExecFilter !== "ALL") {
            const isTodayRun = job.lastExecInfo === todayKstStr;
            if (todayExecFilter === "Y" && !isTodayRun) return false;
            if (todayExecFilter === "N" && isTodayRun) return false;
          }

          return true;
        });

        return (
          /* 배치 작업 제어 컨텐츠 영역 */
          <div className="admin-card">
            <div
              className="upload-header"
              style={{
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                  배치 작업 정보 및 재처리 제어
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
                  시스템에 탑재된 수집형(IN) 및 분석출력형(OUT) 배치 작업 목록을 실시간으로 확인하고,
                  <br />
                  실패한 배치 또는 특정 배치를 즉시 **다시 기동(재처리)** 시키도록 명령을 전달합니다.
                </p>
              </div>

              {/* 배치 유형 필터 조작계 (눈에 띄는 버튼 그룹 스타일) */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#475569" }}>유형 필터:</span>
                <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {/*
                  <button
                    type="button"
                    onClick={() => setControlTypeFilter("ALL")}
                    style={{
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: controlTypeFilter === "ALL" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "transparent",
                      color: controlTypeFilter === "ALL" ? "#ffffff" : "#475569",
                      boxShadow: controlTypeFilter === "ALL" ? "0 2px 6px rgba(29, 78, 216, 0.2)" : "none"
                    }}
                  >
                    전체 보기 (in/out)
                  </button>
                  */}
                  <button
                    type="button"
                    onClick={() => setControlTypeFilter("IN")}
                    style={{
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: controlTypeFilter === "IN" ? "linear-gradient(135deg, #10b981, #047857)" : "transparent",
                      color: controlTypeFilter === "IN" ? "#ffffff" : "#475569",
                      boxShadow: controlTypeFilter === "IN" ? "0 2px 6px rgba(4, 120, 87, 0.2)" : "none"
                    }}
                  >
                    in
                  </button>
                  <button
                    type="button"
                    onClick={() => setControlTypeFilter("OUT")}
                    style={{
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: controlTypeFilter === "OUT" ? "linear-gradient(135deg, #6366f1, #4338ca)" : "transparent",
                      color: controlTypeFilter === "OUT" ? "#ffffff" : "#475569",
                      boxShadow: controlTypeFilter === "OUT" ? "0 2px 6px rgba(67, 56, 202, 0.2)" : "none"
                    }}
                  >
                    out
                  </button>
                </div>
              </div>
            </div>

            {/* 배치 Job 검색 및 세부 필터링 패널 */}
            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "flex-end"
              }}
            >
              {/* 1. Job 검색어 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 280px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#475569" }}>배치 Job 검색 (명칭/설명)</span>
                <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                  <input
                    type="text"
                    placeholder="검색어를 입력하세요..."
                    value={tempSearchJobKeyword}
                    onChange={e => setTempSearchJobKeyword(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        setSearchJobKeyword(tempSearchJobKeyword);
                      }
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      background: "#ffffff",
                      flex: 1
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setSearchJobKeyword(tempSearchJobKeyword)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: "0 2px 4px rgba(29, 78, 216, 0.1)"
                    }}
                    onMouseOver={e => e.currentTarget.style.filter = "brightness(1.1)"}
                    onMouseOut={e => e.currentTarget.style.filter = "none"}
                  >
                    검색
                  </button>
                </div>
              </div>

              {/* 2. 주기 필터 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "150px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#475569" }}>주기 필터</span>
                <select
                  value={filterScheduleGb}
                  onChange={e => setFilterScheduleGb(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  <option value="ALL">전체 주기</option>
                  <option value="D">일배치 (매일)</option>
                  <option value="W">주배치 (매주)</option>
                  <option value="M">월배치 (매월)</option>
                  <option value="Y">년배치 (매년)</option>
                </select>
              </div>

              {/* 3. 시간대 필터 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "180px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#475569" }}>실행 시간대</span>
                <select
                  value={filterJobHour}
                  onChange={e => setFilterJobHour(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  <option value="ALL">전체 시간대</option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const val = i.toString().padStart(2, "0");
                    const nextVal = ((i + 1) % 24).toString().padStart(2, "0");
                    return (
                      <option key={val} value={val}>
                        {val}시 ~ {nextVal}시
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 4. 오늘 실행 여부 필터 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "160px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#475569" }}>오늘 실행 여부</span>
                <select
                  value={todayExecFilter}
                  onChange={e => setTodayExecFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  <option value="ALL">전체 보기</option>
                  <option value="Y">오늘 실행 완료</option>
                  <option value="N">오늘 실행 미완료</option>
                </select>
              </div>

              {/* 5. 초기화 버튼 */}
              <button
                type="button"
                onClick={() => {
                  setTempSearchJobKeyword("");
                  setSearchJobKeyword("");
                  setFilterScheduleGb("ALL");
                  setFilterJobHour("ALL");
                  setTodayExecFilter("ALL");
                  setControlTypeFilter("IN");
                }}
                style={{
                  padding: "9px 16px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseOut={e => e.currentTarget.style.background = "#ffffff"}
              >
                필터 초기화
              </button>
            </div>

            {jobsLoading ? (
              <div className="no-data-msg">배치 작업 정보를 불러오는 중입니다...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table" style={{ tableLayout: "fixed", width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "110px" }}>유형</th>
                      <th style={{ width: "250px" }}>배치 Job명</th>
                      <th>배치 상세 정보</th>
                      <th style={{ width: "120px" }}>스케줄</th>
                      <th style={{ width: "80px" }}>시간</th>
                      <th style={{ width: "140px", textAlign: "center", whiteSpace: "nowrap" }}>마지막 실행일</th>
                      <th style={{ width: "240px" }}>제어 및 이력</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map(job => (
                        <tr key={`${job.type}-${job.jobId}`}>
                          <td>
                            <span className={`badge ${job.type === "IN" ? "in-type" : "out-type"}`}>
                              {job.type === "IN" ? "in" : "out"}
                            </span>
                          </td>
                          <td
                            style={{
                              fontWeight: "700",
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                            title={job.jobName}
                          >
                            {job.jobName}
                          </td>
                          <td
                            style={{
                              color: "#475569",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                            title={job.jobInfo}
                          >
                            {job.jobInfo || "-"}
                          </td>
                          <td>
                            <span className="badge local" style={{ whiteSpace: "nowrap" }}>
                              {job.scheduleGb === "D" && "매일 (D)"}
                              {job.scheduleGb === "W" && `매주 (${job.jobWeek})`}
                              {job.scheduleGb === "M" && `매월 (${job.jobDay}일)`}
                              {job.scheduleGb === "Y" && `매년 (${job.jobMonth}/${job.jobDay})`}
                            </span>
                          </td>
                          <td style={{ fontVariantNumeric: "tabular-nums" }}>
                            {job.jobHour}:{job.jobMin}
                          </td>
                          <td style={{ fontVariantNumeric: "tabular-nums", textAlign: "center" }}>
                            {job.lastExecInfo ? (
                              job.lastExecInfo === todayKstStr ? (
                                <span className="badge active-user" style={{ whiteSpace: "nowrap", display: "inline-flex", justifyContent: "center" }}>
                                  {job.lastExecInfo}
                                </span>
                              ) : (
                                job.lastExecInfo
                              )
                            ) : (
                              "-"
                            )}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <button
                                type="button"
                                className="btn-control-trigger"
                                onClick={() => handleOpenEditModal(job)}
                              >
                                수정 및 재처리
                              </button>
                              <button
                                type="button"
                                className="btn-control-history"
                                onClick={() => handleViewHistoryOfJob(job.jobName)}
                              >
                                이력 보기
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="no-data-msg">
                          조건에 부합하는 배치 작업이 존재하지 않습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* 모달 팝업 렌더링 */}
      {modalDate && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-body" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                [{modalDate}] 상세 실행 내역
                {filterJobName && (
                  <span style={{ fontSize: "12px", color: "#3b82f6", marginLeft: "10px", fontWeight: "normal" }}>
                    (필터: {filterJobName})
                  </span>
                )}
              </h3>
              <button type="button" className="close-btn" onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            <div className="batch-detail-scroll-container">
              <table className="batch-detail-table">
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>Job명</th>
                    <th>시작</th>
                    <th>종료</th>
                    <th>상태</th>
                    <th>소요(ms)</th>
                    <th>결과 메시지</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.histId}>
                        <td>
                          <span className={`type-badge ${item.type.toLowerCase()}`}>
                            {item.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{item.jobName}</td>
                        <td style={{ color: "#6b7280" }}>
                          {item.execStartTime?.substring(11, 19) || "-"}
                        </td>
                        <td style={{ color: "#6b7280" }}>
                          {item.execEndTime?.substring(11, 19) || "-"}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${item.execStatus === "SUCCESS" ? "success" : "fail"}`}
                          >
                            {item.execStatus}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {item.durationMs?.toLocaleString() ?? 0}
                        </td>
                        <td
                          style={{
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#6b7280"
                          }}
                          title={item.execMessage}
                        >
                          {item.execMessage || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="no-data-msg">
                        상세 내역이 없습니다. (해당 날짜에 수행 기록이 없거나 데이터가 비어 있습니다.)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={handleCloseModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 단일 Job 실행 이력 모달 팝업 렌더링 */}
      {jobHistoryModalName && (
        <div className="modal-overlay" onClick={() => setJobHistoryModalName(null)}>
          <div className="modal-body" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>[{jobHistoryModalName}] 최근 실행 이력 (최대 50건)</h3>
              <button type="button" className="close-btn" onClick={() => setJobHistoryModalName(null)}>
                &times;
              </button>
            </div>

            <div className="batch-detail-scroll-container">
              {jobHistoryLoading ? (
                <div className="no-data-msg">이력 데이터를 가져오는 중입니다...</div>
              ) : (
                <table className="batch-detail-table">
                  <thead>
                    <tr>
                      <th>실행일</th>
                      <th>유형</th>
                      <th>상태</th>
                      <th>소요(ms)</th>
                      <th>결과 메시지</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobHistoryItems.length > 0 ? (
                      jobHistoryItems.map(item => (
                        <tr key={item.histId}>
                          <td style={{ fontWeight: 700 }}>{item.execDate}</td>
                          <td>
                            <span className={`type-badge ${item.type.toLowerCase()}`}>
                              {item.type}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${item.execStatus === "SUCCESS" ? "success" : "fail"}`}>
                              {item.execStatus}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {item.durationMs?.toLocaleString() ?? 0}
                          </td>
                          <td
                            style={{
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "#6b7280"
                            }}
                            title={item.execMessage}
                          >
                            {item.execMessage || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="no-data-msg">
                          해당 배치 Job의 최근 실행 이력이 존재하지 않습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={() => setJobHistoryModalName(null)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 배치 스케줄 설정 편집 모달 팝업 렌더링 */}
      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-body" onClick={e => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <h3>[{editingJob.jobName}] 재처리 및 스케줄 설정 변경</h3>
              <button type="button" className="close-btn" onClick={() => setEditingJob(null)}>
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
              {/* 1. 배치 기본 정보 요약 카드 */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  color: "#334155"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontWeight: "800", color: "#64748b" }}>배치 Job명</span>
                  <span style={{ fontFamily: "monospace", fontWeight: "800", color: "#0f172a" }}>{editingJob.jobName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontWeight: "800", color: "#64748b" }}>상세 설명</span>
                  <span style={{ color: "#475569", fontWeight: "500" }}>{editingJob.jobInfo || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "800", color: "#64748b" }}>현재 스케줄</span>
                  <span style={{ color: "#0f172a", fontWeight: "700" }}>
                    {formatScheduleText(
                      editingJob.scheduleGb,
                      editingJob.jobHour,
                      editingJob.jobMin,
                      editingJob.jobWeek,
                      editingJob.jobDay,
                      editingJob.jobMonth
                    )}
                  </span>
                </div>
              </div>

              {/* 스케줄 주기 선택 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>실행 주기</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { val: "D", label: "매일 (D)" },
                    { val: "W", label: "매주 (W)" },
                    { val: "M", label: "매월 (M)" },
                    { val: "Y", label: "매년 (Y)" }
                  ].map(item => (
                    <label
                      key={item.val}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px",
                        borderRadius: "8px",
                        border: editScheduleGb === item.val ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                        background: editScheduleGb === item.val ? "#eff6ff" : "#ffffff",
                        color: editScheduleGb === item.val ? "#1d4ed8" : "#475569",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <input
                        type="radio"
                        name="edit-schedule-gb"
                        value={item.val}
                        checked={editScheduleGb === item.val}
                        onChange={e => setEditScheduleGb(e.target.value)}
                        style={{ display: "none" }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* 주배치(W)인 경우 요일 선택 */}
              {editScheduleGb === "W" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>실행 요일 선택</span>
                  <select
                    value={editJobWeek}
                    onChange={e => setEditJobWeek(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      cursor: "pointer"
                    }}
                  >
                    <option value="MON">월요일 (MON)</option>
                    <option value="TUE">화요일 (TUE)</option>
                    <option value="WED">수요일 (WED)</option>
                    <option value="THU">목요일 (THU)</option>
                    <option value="FRI">금요일 (FRI)</option>
                    <option value="SAT">토요일 (SAT)</option>
                    <option value="SUN">일요일 (SUN)</option>
                  </select>
                </div>
              )}

              {/* 월배치(M) 또는 년배치(Y)인 경우 일자 선택 */}
              {(editScheduleGb === "M" || editScheduleGb === "Y") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>실행 일자 선택</span>
                  <select
                    value={editJobDay}
                    onChange={e => setEditJobDay(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => {
                      const dStr = (i + 1).toString().padStart(2, "0");
                      return (
                        <option key={dStr} value={dStr}>
                          {i + 1}일
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* 년배치(Y)인 경우 월 선택 */}
              {editScheduleGb === "Y" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>실행 월 선택</span>
                  <select
                    value={editJobMonth}
                    onChange={e => setEditJobMonth(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const mStr = (i + 1).toString().padStart(2, "0");
                      return (
                        <option key={mStr} value={mStr}>
                          {i + 1}월
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* 시간 및 분 선택 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>시 (Hour)</span>
                  <select
                    value={editJobHour}
                    onChange={e => setEditJobHour(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hStr = i.toString().padStart(2, "0");
                      return (
                        <option key={hStr} value={hStr}>
                          {hStr}시
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>분 (Minute)</span>
                  <select
                    value={editJobMin}
                    onChange={e => setEditJobMin(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: 60 }, (_, i) => {
                      const mStr = i.toString().padStart(2, "0");
                      return (
                        <option key={mStr} value={mStr}>
                          {mStr}분
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* 2. 변경 예정 비교 가이드 영역 */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginTop: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e40af" }}>다음과 같이 변경됩니다</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", marginTop: "2px" }}>
                  <span style={{ color: "#64748b", textDecoration: "line-through", fontWeight: "500" }}>
                    {formatScheduleText(
                      editingJob.scheduleGb,
                      editingJob.jobHour,
                      editingJob.jobMin,
                      editingJob.jobWeek,
                      editingJob.jobDay,
                      editingJob.jobMonth
                    )}
                  </span>
                  <span style={{ color: "#3b82f6", fontWeight: "800" }}>➔</span>
                  <span style={{ color: "#1d4ed8", fontWeight: "800" }}>
                    {formatScheduleText(
                      editScheduleGb,
                      editJobHour,
                      editJobMin,
                      editJobWeek,
                      editJobDay,
                      editJobMonth
                    )}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#1e3a8a", opacity: 0.8, marginTop: "2px" }}>
                  * [설정 저장] 시 위 정보가 반영되며 다음 가동 주기부터 적용됩니다.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={editSubmitting}
                onClick={() => setEditingJob(null)}
                style={{ marginRight: "auto" }}
              >
                취소
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={editSubmitting}
                  onClick={handleTriggerJobDirect}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: "0 2px 6px rgba(5, 150, 105, 0.2)"
                  }}
                >
                  즉시 재처리
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={editSubmitting}
                  onClick={handleSaveSchedule}
                >
                  {editSubmitting ? "저장 중..." : "설정 저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
