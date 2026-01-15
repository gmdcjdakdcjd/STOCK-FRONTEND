import { useState } from "react";
import "./RestoreEtfModal.css";

interface Props {
  etfName: string;
  onRestored: () => void;
}

export default function RestoreEtfModal({
  etfName,
  onRestored,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = () => {
    fetch(`/myetf/api/history?etfName=${encodeURIComponent(etfName)}`)
      .then(res => res.json())
      .then(setItems);
  };

  const restore = (histId: number) => {
    if (!confirm("이 종목을 복구하시겠습니까?")) return;

    fetch("/myetf/api/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historyIds: [histId] }),
    }).then(() => {
      alert("복구되었습니다.");
      setOpen(false);
      onRestored();
    });
  };

  return (
    <>
      <button
        className="ghost-btn"
        onClick={() => {
          setOpen(true);
          load();
        }}
      >
        종목 복구
      </button>

      {open && (
        <div className="modal-overlay">
          <div className="modal-body restore-modal">
            <header className="modal-header">
              <h3>삭제된 종목 복구</h3>
              <button className="close-btn" onClick={() => setOpen(false)}>
                ✕
              </button>
            </header>

            <div className="restore-content">
              {items.length === 0 ? (
                <div className="restore-empty">
                  복구 가능한 종목이 없습니다
                </div>
              ) : (
                items.map(item => (
                  <div key={item.histId} className="restore-row">
                    <span className="name">
                      {item.name} ({item.code})
                    </span>
                    <button
                      className="primary-btn"
                      onClick={() => restore(item.histId)}
                    >
                      복구
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
