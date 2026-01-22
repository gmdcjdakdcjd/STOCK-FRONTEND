import { useState } from "react";
import "./RestoreEtfModal.css";

interface Props {
  etfName: string;
  activeCodes: string[];
  onRestored: () => void;
}

export default function RestoreEtfModal({
  etfName,
  activeCodes,
  onRestored,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = () => {
    fetch(`/api/myetf/history?etfName=${encodeURIComponent(etfName)}`)
      .then(res => res.json())
      .then(setItems);
  };

  const restore = (histId: number) => {
    if (!confirm("이 종목을 복구하시겠습니까?")) return;

    fetch("/api/myetf/restore", {
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
                items.map(item => {
                  const alreadyExists = activeCodes.includes(item.code);

                  return (
                    <div key={item.histId} className="restore-row">
                      <div className="restore-info">
                        <div className="name">
                          {item.name} ({item.code})
                        </div>

                        <div className="meta">
                          편입일 {item.createdAtDisplay} · 편입가 {item.priceAtAddDisplay}원 · 수량 {item.quantity}
                          {item.deletedAtDisplay && ` · 삭제일 ${item.deletedAtDisplay}`}
                        </div>

                        {alreadyExists && (
                          <div className="restore-reason">
                            이미 ETF에 포함된 종목입니다
                            <br />
                            기존 종목 삭제 후 복구 가능합니다
                          </div>
                        )}
                      </div>

                      <button
                        className={`primary-btn ${alreadyExists ? "disabled" : ""}`}
                        disabled={alreadyExists}
                        onClick={() => {
                          if (alreadyExists) {
                            alert(
                              "이미 ETF에 포함된 종목입니다.\n기존 종목을 삭제한 후 복구할 수 있습니다."
                            );
                            return;
                          }
                          restore(item.histId);
                        }}
                      >
                        {alreadyExists ? "복구 불가" : "복구"}
                      </button>
                    </div>

                  );
                })
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
