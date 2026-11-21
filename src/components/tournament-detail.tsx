import { useState } from 'react';
import { Play, Trophy } from 'lucide-react';
import { standings, type Tournament, type TournamentGame } from '../lib/tournaments';
import type { Active } from '../lib/store';
import { usePagination } from '../hooks/use-pagination';
import { PaginationControls } from './pagination-controls';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

type Props = {
  tournament: Tournament;
  canManage: boolean;
  active: Active | null;
  onStart: (t: Tournament, g: TournamentGame) => void;
};
export function TournamentDetail({ tournament, canManage, active, onStart }: Props) {
  const [round, setRound] = useState('all');
  const completed = tournament.games.filter((game) => game.scores).length;
  const rounds = [...new Set(tournament.games.map((game) => game.round))];
  const games = usePagination(
    tournament.games.filter((game) => round === 'all' || game.round === Number(round)),
    10,
    round,
  );
  const teamNames = new Map(tournament.teams.map((team) => [team.id, team.names.join(' / ')]));
  const table = standings(tournament);
  return (
    <>
      <Card className="panel tournament-summary">
        <div>
          <span className="eyebrow cyan">ROUND ROBIN</span>
          <h3>{tournament.name}</h3>
          <p>
            {tournament.teams.length} คู่ · {tournament.target} แต้ม · คู่ละ{' '}
            {tournament.teams.length - 1} แมตช์
          </p>
        </div>
        <span className="tournament-progress">
          <Trophy size={18} />
          {completed === tournament.games.length
            ? 'จบรายการแล้ว'
            : `${completed}/${tournament.games.length} แมตช์`}
        </span>
      </Card>
      <Card className="panel tournament-standings">
        <h3>ตารางอันดับ</h3>
        <div className="tournament-table-scroll">
          <table>
            <thead>
              <tr>
                <th>อันดับ</th>
                <th>คู่</th>
                <th>แข่ง</th>
                <th>ชนะ</th>
                <th>แพ้</th>
                <th>ผลต่าง</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.team.id}>
                  <td>{row.played ? row.rank : '–'}</td>
                  <td>{row.team.names.join(' / ')}</td>
                  <td>
                    {row.played}/{tournament.teams.length - 1}
                  </td>
                  <td>{row.won}</td>
                  <td>{row.lost}</td>
                  <td>
                    {row.difference > 0 ? '+' : ''}
                    {row.difference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">
          เรียงจากชนะมากที่สุด ผลต่างแต้ม และแต้มที่ได้ หากเท่ากันให้อันดับร่วม
        </p>
      </Card>
      <div className="tournament-schedule-heading">
        <h3>ตารางแข่ง</h3>
        <Select value={round} onValueChange={setRound}>
          <SelectTrigger aria-label="เลือกรอบการแข่งขัน">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกรอบ</SelectItem>
            {rounds.map((n) => (
              <SelectItem key={n} value={String(n)}>
                รอบ {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="tournament-game-list">
        {games.items.map((game) => (
          <Card className="panel tournament-game" key={game.id}>
            <span className="tournament-round">รอบ {game.round}</span>
            <div className="tournament-game-team">{teamNames.get(game.teams[0])}</div>
            <strong className="tournament-game-score">
              {game.scores ? `${game.scores[0]}–${game.scores[1]}` : 'vs'}
            </strong>
            <div className="tournament-game-team">{teamNames.get(game.teams[1])}</div>
            {game.scores ? (
              <span className="tournament-game-finished">จบแล้ว</span>
            ) : canManage ? (
              <Button variant="outline" onClick={() => onStart(tournament, game)}>
                <Play size={14} />
                {active?.tournamentGameId === game.id ? 'เล่นต่อ' : 'เริ่มแข่ง'}
              </Button>
            ) : (
              <span className="hint">รอแข่งขัน</span>
            )}
          </Card>
        ))}
      </div>
      <PaginationControls {...games} label="แมตช์" />
    </>
  );
}
