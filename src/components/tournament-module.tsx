import { SwipeActionRow } from './swipe-action-row';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Spinner } from './ui/spinner';
import { ContentRegion } from './content-region';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, ChevronRight, Trophy, Trash2 } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { uid, type Active } from '../lib/store';
import type { Tournament, TournamentGame, TournamentSummary } from '../lib/tournaments';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { SectionHeading } from './section-heading';
import { LoadingStatus } from './loading-status';
import { PaginationControls } from './pagination-controls';
import { TournamentSetup } from './tournament-setup';
import { TournamentDetail } from './tournament-detail';

type Props = {
  selected: string;
  onSelect: (id: string) => void;
  canManage: boolean;
  onDeleted: (id: string) => void;
  active: Active | null;
  onStart: (t: Tournament, g: TournamentGame) => void;
  onError: (message: string) => void;
};
export default function TournamentModule({
  selected,
  onSelect,
  canManage,
  onDeleted,
  active,
  onStart,
  onError,
}: Props) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [list, setList] = useState<TournamentSummary[]>([]),
    [detail, setDetail] = useState<Tournament | null>(null);
  const [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(uid),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    setRevealed(null);
  }, [page, selected]);
  useEffect(() => {
    const timer = window.setInterval(() => setRefresh((v) => v + 1), 15000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void (
      selected
        ? api.tournament(selected).then((result) => {
            if (mounted) setDetail(result.tournament);
          })
        : api.tournaments(page).then((result) => {
            if (mounted) {
              setList(result.tournaments);
              setTotal(result.total);
              setPage(result.page);
            }
          })
    )
      .catch((error) => {
        if (mounted) {
          if (selected && error instanceof ApiError && error.status === 404) {
            setDetail(null);
            onSelect('');
          }
          onError(error.message);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selected, page, refresh]);
  return (
    <>
      <SectionHeading
        title="ทัวร์นาเมนต์"
        eyebrow="PLAY FAIR. PLAY TOGETHER."
        action={
          !selected && (
            <Button
              className="primary"
              onClick={() => {
                setDraft(uid());
                setOpen(true);
              }}
            >
              <Plus size={16} />
              สร้างทัวร์นาเมนต์
            </Button>
          )
        }
      />
      {selected && (
        <Button
          className="tournament-back"
          variant="ghost"
          onClick={() => {
            onSelect('');
            setDetail(null);
          }}
        >
          <ArrowLeft size={16} />
          ทัวร์นาเมนต์ทั้งหมด
        </Button>
      )}
      <ContentRegion loading={loading} empty={selected ? detail?.id !== selected : !list.length}>
        {loading && !detail && !list.length ? (
          <LoadingStatus>กำลังเตรียมข้อมูล…</LoadingStatus>
        ) : selected ? (
          detail && detail.id === selected ? (
            <TournamentDetail
              key={detail.id}
              tournament={detail}
              active={active}
              onStart={onStart}
            />
          ) : (
            <LoadingStatus>กำลังเตรียมข้อมูล…</LoadingStatus>
          )
        ) : (
          <>
            <div className="tournament-list">
              {list.length ? (
                list.map((item) => (
                  <SwipeActionRow
                    key={item.id}
                    enabled={canManage}
                    open={revealed === item.id}
                    disabled={deletingBusy}
                    onOpenChange={(open) =>
                      setRevealed((current) =>
                        open ? item.id : current === item.id ? null : current,
                      )
                    }
                    actionLabel={`ลบทัวร์นาเมนต์ ${item.name}`}
                    onAction={() => setDeleting({ id: item.id, name: item.name })}
                  >
                    <Card className="panel tournament-list-card">
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {item.teamCount} คู่ · {item.target} แต้ม · {item.finishedCount}/
                          {item.gameCount} แมตช์
                        </p>
                      </div>
                      <div className="tournament-list-actions">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDetail(null);
                            onSelect(item.id);
                          }}
                        >
                          ดูรายการ
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </Card>
                  </SwipeActionRow>
                ))
              ) : (
                <Card className="panel payment-empty">
                  <Trophy size={36} />
                  <h3>ยังไม่มีทัวร์นาเมนต์</h3>
                  <p>เลือกผู้ร่วมเล่นและจัดคู่เพื่อเริ่มรายการแรก</p>
                </Card>
              )}
            </div>
            <PaginationControls
              page={page}
              total={total}
              pageSize={10}
              onPageChange={setPage}
              disabled={loading}
              label="รายการ"
            />
          </>
        )}
      </ContentRegion>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !deletingBusy) setDeleting(null);
        }}
      >
        <DialogContent
          className="modal tournament-delete-dialog"
          onInteractOutside={(event) => {
            if (deletingBusy) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (deletingBusy) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>ลบทัวร์นาเมนต์?</DialogTitle>
            <DialogDescription>{deleting?.name}</DialogDescription>
          </DialogHeader>
          <p>รายการและตารางแข่งจะถูกนำออก แต่ผลที่บันทึกในประวัติรอบเล่นจะยังอยู่</p>
          <DialogFooter className="tournament-delete-actions">
            <Button variant="outline" disabled={deletingBusy} onClick={() => setDeleting(null)}>
              ยกเลิก
            </Button>
            <Button
              className="expense-delete-confirm"
              disabled={deletingBusy}
              onClick={async () => {
                if (!deleting || deletingBusy) return;
                const id = deleting.id;
                setDeletingBusy(true);
                try {
                  await api.deleteTournament(id);
                  setRevealed(null);
                  setDeleting(null);
                  setList((items) => items.filter((item) => item.id !== id));
                  setTotal((total) => Math.max(0, total - 1));
                  if (selected === id) {
                    onSelect('');
                    setDetail(null);
                  }
                  onDeleted(id);
                  setRefresh((value) => value + 1);
                } catch (error) {
                  onError(
                    error instanceof Error ? error.message : 'ลบรายการไม่สำเร็จ กรุณาลองอีกครั้ง',
                  );
                } finally {
                  setDeletingBusy(false);
                }
              }}
            >
              {deletingBusy ? <Spinner aria-hidden="true" /> : <Trash2 size={16} />}
              {deletingBusy ? 'กำลังลบ…' : 'ยืนยันลบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TournamentSetup
        key={draft}
        open={open}
        onOpenChange={setOpen}
        onError={onError}
        onCreated={(t) => {
          setDetail(t);
          onSelect(t.id);
          setPage(1);
          setRefresh((v) => v + 1);
        }}
      />
    </>
  );
}
