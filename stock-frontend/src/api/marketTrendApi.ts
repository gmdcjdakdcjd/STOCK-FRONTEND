const fetchOptions = { credentials: "include" as const };

export async function fetchDepositSummary() {
    const res = await fetch("/api/market-trend/deposit/summary", fetchOptions);
    if (!res.ok) throw new Error("Deposit Summary API error");
    return res.json();
}

export async function fetchInvestorLatest() {
    const res = await fetch("/api/market-trend/investor/latest", fetchOptions);
    if (!res.ok) throw new Error("Investor Latest API error");
    return res.json();
}

export async function fetchProgramLatest() {
    const res = await fetch("/api/market-trend/program/latest", fetchOptions);
    if (!res.ok) throw new Error("Program Latest API error");
    return res.json();
}

// =========================
// 하단 페이징 리스트
// =========================

export async function fetchDepositList(page = 1, size = 10) {
    const res = await fetch(`/api/market-trend/deposit?page=${page}&size=${size}`, fetchOptions);
    if (!res.ok) throw new Error("Deposit List API error");
    return res.json();
}

export async function fetchInvestorList(page = 1, size = 10) {
    const res = await fetch(`/api/market-trend/investor?page=${page}&size=${size}`, fetchOptions);
    if (!res.ok) throw new Error("Investor List API error");
    return res.json();
}

export async function fetchProgramList(page = 1, size = 10) {
    const res = await fetch(`/api/market-trend/program?page=${page}&size=${size}`, fetchOptions);
    if (!res.ok) throw new Error("Program List API error");
    return res.json();
}
