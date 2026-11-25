'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Competition } from '@/lib/types';
import {
  FileText,
  Palette,
  HardDrives as Server,
  GameController as Gamepad2,
  Trophy,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react';

interface Props {
  competitions: Competition[];
}

export function KompetisiListClient({ competitions }: Props) {
  const [filterType, setFilterType] = useState<'all' | 'academic' | 'non_academic'>('all');

  const filtered = competitions.filter((comp) => {
    if (filterType === 'all') return true;
    return comp.type === filterType;
  });

  const academicCount = competitions.filter((c) => c.type === 'academic').length;
  const nonAcademicCount = competitions.filter((c) => c.type === 'non_academic').length;

  const getCompIcon = (category: string) => {
    switch (category) {
      case 'esai':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'uiux':
        return <Palette className="w-5 h-5 text-[var(--success)]" />;
      case 'it_system_arch':
        return <Server className="w-5 h-5 text-primary" />;
      case 'pes':
        return <Gamepad2 className="w-5 h-5 text-primary" />;
      case 'ml':
        return <Trophy className="w-5 h-5 text-[var(--warning)]" />;
      default:
        return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Filter Tabs (hanya tampil jika ada lebih dari 1 kategori) */}
      {nonAcademicCount > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua Lomba ({competitions.length})
            </button>
            <button
              onClick={() => setFilterType('academic')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'academic'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Akademik ({academicCount})
            </button>
            <button
              onClick={() => setFilterType('non_academic')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'non_academic'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              E-Sport ({nonAcademicCount})
            </button>
          </div>
        </div>
      )}

      {/* Grid Perlombaan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((comp) => {
          const isAcademic = comp.type === 'academic';
          return (
            <Card key={comp.id} glow className="flex flex-col justify-between">
              <CardContent className="p-6">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-muted/60 border border-border">
                      {getCompIcon(comp.category)}
                    </div>
                    <div>
                      <Badge variant={isAcademic ? 'info' : 'warning'} size="sm">
                        {isAcademic ? 'Akademik' : 'E-Sport'}
                      </Badge>
                      <h3 className="text-xl font-bold text-foreground mt-1 font-[family-name:var(--font-bricolage)]">
                        {comp.name}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Biaya</div>
                    <div className="text-sm font-bold font-mono text-primary">
                      {formatCurrency(comp.registration_fee)}
                    </div>
                  </div>
                </div>

                {/* Deskripsi */}
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  {comp.description}
                </p>

                {/* Highlights */}
                <div className="grid grid-cols-2 gap-3 mt-5 p-3 rounded-lg bg-muted/40 border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tema:</span>
                    <span className="text-foreground font-medium truncate block">{comp.theme}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Partisipasi:</span>
                    <span className="text-foreground font-medium capitalize">
                      {comp.participation_type === 'individual'
                        ? 'Individu (1 Orang)'
                        : `Tim (${comp.min_team_size}-${comp.max_team_size} Orang)`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tahapan:</span>
                    <span className="text-foreground font-medium">
                      {comp.stages && comp.stages.length > 0
                        ? comp.stages.map((s) => s.name).join(' → ')
                        : 'Penyisihan → Final'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Terdaftar:</span>
                    <span className="text-primary font-mono font-medium">
                      {comp.registered_count} Peserta {comp.quota ? `/ ${comp.quota}` : ''}
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="p-6 pt-0 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--success)]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Pendaftaran Terbuka</span>
                </div>
                <Link href={`/kompetisi/${comp.slug}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Detail &amp; Form Pendaftaran
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
