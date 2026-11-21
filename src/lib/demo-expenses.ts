import type { Session } from './store';
export function demoExpenses(userId: string): Session[] {
  return ['2026-11-20', '2026-11-18', '2026-11-15'].map((date, index) => {
    const sessionId = `demo-session-${index}`;
    const names = [
      'คุณ',
      'นัท',
      'เมย์',
      'นายต้น',
      'บอย',
      'แอน',
      'ปาล์ม',
      'น้ำ',
      'เจมส์',
      'ฟ้า',
      'เอก',
      'บีม',
      'พลอย',
      'พีท',
      'มิน',
      'กิตติพงษ์ เพื่อนที่มีชื่อยาวสำหรับทดสอบ',
      'ศิริพร ผู้เล่นรับเชิญ',
    ];
    const amounts = [85, 100, 75];
    return {
      id: sessionId,
      name: ['ก๊วนวันศุกร์', 'ก๊วนวันพุธ', 'ก๊วนวันอาทิตย์'][index],
      date,
      version: 1,
      matches: [],
      expenses: [],
      members: [],
      paymentRequests: [
        {
          id: `demo-payment-${index}`,
          sessionId,
          createdAt: `${date}T12:00:00Z`,
          createdBy: index === 2 ? userId : 'demo-collector',
          creatorName: 'พี่บอย (ตัวอย่าง)',
          method: 'promptpay',
          recipient: '0812345678',
          totalCents: amounts[index] * 100 * names.length,
          playerCount: names.length,
          members: names.map((name, i) => ({
            id: i === 0 ? userId : `demo-player-${i}`,
            name,
            username: '',
            kind: i === 3 ? 'guest' : 'member',
            avatar: '',
            status: 'active',
            amountCents: amounts[index] * 100,
            paidAt: i === 2 || (index === 2 && i === 0) ? `${date}T13:00:00Z` : null,
          })),
        },
      ],
    };
  });
}
