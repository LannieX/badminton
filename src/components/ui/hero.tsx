import { Button } from './button';
import { MeshGradient } from '@paper-design/shaders-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
export default function Hero({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion();
  return (
    <section className="hero">
      <div className="shader" aria-hidden="true">
        <MeshGradient
          colors={['#060a0d', '#06b6d4', '#164e63', '#f97316']}
          speed={reduce ? 0 : 0.15}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="hero-shade" />
      <motion.div
        className="hero-copy"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="eyebrow">
          <i /> YOUR COURT. YOUR GAME.
        </span>
        <h1>
          ทุกแต้มมีความหมาย
          <br />
          <span>ทุกเกมมีเรื่องราว.</span>
        </h1>
        <p>
          นับคะแนน หารค่าเล่น เก็บทุกความทรงจำของก๊วน
          <br />
          จัดการเรื่องนอกสนาม แล้วสนุกกับเกมให้เต็มที่
        </p>
        <Button className="primary" onClick={onStart}>
          เริ่มนับคะแนน <ArrowUpRight size={18} />
        </Button>
      </motion.div>
      <div className="court-art" aria-hidden="true">
        <div />
        <div />
        <div />
        <span>iBadz / PLAY TOGETHER</span>
      </div>
      <span className="hero-foot">MADE FOR THE LOVE OF BADMINTON</span>
    </section>
  );
}
