import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { fetchMyEtfDetail } from "../../api/myEtfApi";
import EtfSummaryCard from "./EtfSummaryCard";
import EtfItemTable from "./EtfItemTable";
import EditEtfModal from "./EditEtfModal";
import RestoreEtfModal from "./RestoreEtfModal";

import type { MyEtfDetailResponseDTO } from "./myEtf.types";
import BasicLayout from "../../layouts/BasicLayout";
import { useNavigate } from "react-router-dom";

import "./MyEtfDetailPage.css";

export default function MyEtfDetailPage() {
  const [params] = useSearchParams();
  const etfName = params.get("etfName");
  const navigate = useNavigate();
  const [data, setData] =
    useState<MyEtfDetailResponseDTO | null>(null);

  useEffect(() => {
    if (!etfName) return;
    fetchMyEtfDetail(etfName).then(setData);
  }, [etfName]);

  if (!data) {
    return (
      <BasicLayout>
        <div className="myetf-detail-loading">Loading...</div>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout>
      <div className="myetf-detail-page">
        {/* =========================
            Header
           ========================= */}
        <div className="detail-header">
          <div className="title-area">
            <h2>{data.etfName}</h2>

            {data.etfDescription && (
              <div className="etf-description">
                {data.etfDescription}
              </div>
            )}
            <button
              className="back-btn"
              onClick={() => navigate(-1)}
            >
              ← 이전 화면 가기
            </button>
          </div>

          <div className="action-area">
            <EditEtfModal
              etfName={data.etfName}
              onSaved={() =>
                fetchMyEtfDetail(data.etfName).then(setData)
              }
            />
            <RestoreEtfModal
              etfName={data.etfName}
              activeCodes={data.itemList.map(i => i.code)}   // ⭐ 이 줄 추가
              onRestored={() =>
                fetchMyEtfDetail(data.etfName).then(setData)
              }
            />

          </div>
        </div>

        {/* =========================
            Summary
           ========================= */}
        <EtfSummaryCard summary={data.summary} />

        {/* =========================
            Items
           ========================= */}
        <EtfItemTable items={data.itemList} />
      </div>
    </BasicLayout>
  );
}
