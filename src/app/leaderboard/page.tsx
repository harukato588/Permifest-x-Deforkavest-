'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { CheckCircle } from '@phosphor-icons/react';
import { MOCK_LEADERBOARDS } from '@/lib/mock-data';

export default function LeaderboardPage() {
  const { competitions } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all' 
    ? MOCK_LEADERBOARDS 
    : MOCK_LEADERBOARDS.filter(l => l.category === activeCategory);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold font-mono text-sm shadow-md shadow-amber-500/20">
            1
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/50 flex items-center justify-center text-slate-300 font-bold font-mono text-sm">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-700/20 border border-amber-700/50 flex items-center justify-center text-amber-500 font-bold font-mono text-sm">
            3
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold font-mono text-xs">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar />

      <section className="py-12 bg-slate-950 border-b border-slate-900 cyber-grid">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="cyber" className="mb-3">KLASEMEN AKHIR</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Leaderboard & Hasil Lomba</h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
            Hasil resmi setelah penilaian juri dikunci dan pertandingan e-sport disahkan oleh panitia.
          </p>

          {/* Category Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategory === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              Semua Cabang
            </button>
            {competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategory === c.category ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Daftar Pemenang Resmi</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle size={14} weight="bold" />
              <span>Nilai Final Terverifikasi</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Hasil kompetisi resmi belum dirilis oleh panitia.
              </div>
            ) : (
              filtered.map((item, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    {getRankBadge(item.rank)}
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{item.participant_name}</h4>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{item.institution}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{item.competition_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {item.score ? (
                      <div>
                        <div className="text-xs text-slate-500">Nilai Akhir</div>
                        <div className="text-base font-bold font-mono text-cyan-400">{item.score} / 100</div>
                      </div>
                    ) : (
                      <Badge variant="warning">{item.notes || 'Pemenang'}</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
}
