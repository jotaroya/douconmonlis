"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import data from "./audioIndex.json";

// ============================
// DouConMonLis（道コン問リス）
// 年度×第n回のmp3を再生
// ============================

type Item = { year: number; no: number; file: string };
const items = (data as Item[]).sort((a, b) => a.year - b.year || a.no - b.no);

function Btn(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }
) {
  const { className = "", variant = "outline", ...rest } = props;
  const base =
    "px-3 py-2 rounded-2xl text-sm transition shadow-[0_1px_0_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-300";
  const style =
    variant === "solid"
      ? "bg-indigo-600 text-white hover:bg-indigo-500"
      : variant === "ghost"
      ? "hover:bg-neutral-100"
      : "bg-white border border-neutral-300 hover:bg-neutral-50";
  return <button className={`${base} ${style} ${className}`} {...rest} />;
}

export default function App() {
  const years = Array.from(new Set(items.map((i) => i.year))).sort((a, b) => b - a); // 新しい年が上
  const [screen, setScreen] = useState<"top" | "player">("top");
  const [year, setYear] = useState(years[0]);
  const [no, setNo] = useState(items.filter(i => i.year===years[0])[0]?.no ?? 1);

  const current = useMemo(
    () => items.find((x) => x.year === year && x.no === no),
    [year, no]
  );

  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, [current?.file]);

  const onPlayPause = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      await a.play().catch(() => {});
      setIsPlaying(true);
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

  const seek = (delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    const dur = a.duration || Infinity;
    a.currentTime = Math.max(0, Math.min(dur, a.currentTime + delta));
  };

  const restart = () => {
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const gotoNext = () => {
    // 次の「回」。なければ次の年の最小no。最後まで行ったら最初へ。
    const yearNos = items.filter(i => i.year === year).map(i => i.no).sort((a,b)=>a-b);
    const pos = yearNos.indexOf(no);
    if (pos >= 0 && pos < yearNos.length - 1) {
      setNo(yearNos[pos + 1]);
      setScreen("player");
      return;
    }
    // 次の年へ
    const yearIdx = years.indexOf(year);
    const nextYear = yearIdx > 0 ? years[yearIdx - 1] : years[years.length - 1];
    const nextNo = items.filter(i => i.year === nextYear).map(i => i.no).sort((a,b)=>a-b)[0];
    setYear(nextYear);
    setNo(nextNo);
    setScreen("player");
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white text-neutral-900 px-4 sm:px-6 lg:px-8 py-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/90 text-white grid place-items-center font-bold shadow">L</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">道コン問リス</h1>
          </div>
          <p className="mt-2 text-sm text-neutral-600">年度と「第◯回」を選んで再生。3秒スキップ・速度調整に対応。</p>
        </header>

        {screen === "top" ? (
          <TopScreen
            years={years}
            year={year}
            no={no}
            onSelect={(y, n) => { setYear(y); setNo(n); setScreen("player"); }}
          />
        ) : (
          <PlayerScreen
            year={year}
            no={no}
            src={current?.file ?? ""}
            rate={rate}
            setRate={setRate}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onPlayPause={onPlayPause}
            onSeek={seek}
            onRestart={restart}
            onNext={gotoNext}
            onTop={() => setScreen("top")}
            audioRef={audioRef}
          />
        )}
      </div>
    </main>
  );
}

function TopScreen({
  years, year, no, onSelect,
}: {
  years: number[]; year: number; no: number; onSelect: (y: number, n: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/90 backdrop-blur shadow p-4">
        <p className="text-sm text-neutral-600">再生する音源を選んでください（年度 → 第何回）。</p>
      </div>

      <div className="space-y-4">
        {years.map((y) => {
          const nos = items.filter(i => i.year === y).map(i => i.no).sort((a,b)=>a-b);
          return (
            <section key={y} className="rounded-2xl bg-white shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{y}年</h2>
                <span className="text-xs text-neutral-500">{nos.length}本</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {nos.map((n) => {
                  const selected = year === y && no === n;
                  return (
                    <Btn key={n} variant={selected ? "solid" : "outline"} onClick={() => onSelect(y, n)}>
                      第{n}回
                    </Btn>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PlayerScreen({
  year, no, src, rate, setRate, isPlaying, setIsPlaying, onPlayPause, onSeek, onRestart, onNext, onTop, audioRef,
}: {
  year: number; no: number; src: string; rate: number;
  setRate: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean; setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  onPlayPause: () => void; onSeek: (d: number) => void;
  onRestart: () => void; onNext: () => void; onTop: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    setProgress((a.currentTime / a.duration) * 100);
  };
  const onLoaded = () => {
    const a = audioRef.current; if (!a) return;
    setDuration(a.duration || 0); setProgress(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Btn onClick={onTop}><span className="mr-1">🏠</span>トップへ</Btn>
        <div className="text-sm text-neutral-600">{year}年 ／ 第{no}回</div>
        <Btn onClick={onNext}>次の音源へ →</Btn>
      </div>

      <div className="rounded-2xl bg-white shadow p-5">
        <audio ref={audioRef} src={src} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoaded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="w-full" />
        <div className="mt-4 h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Btn onClick={() => onSeek(-3)}>3秒前</Btn>
        <Btn onClick={onPlayPause} variant="solid" className="min-w-28">
          {isPlaying ? "一時停止" : "再生"}
        </Btn>
        <Btn onClick={() => onSeek(3)}>3秒後</Btn>
        <Btn onClick={() => onSeek(10)}>10秒後</Btn>
        <Btn onClick={onRestart}>音声最初へ</Btn>
      </div>

        <div className="mt-6">
          <div className="text-center text-sm mb-2">{rate.toFixed(1)}倍</div>
          <div className="flex items-center gap-3">
            <Btn onClick={() => setRate((r) => Math.max(0.5, +(r - 0.1).toFixed(1)))}>遅</Btn>
            <input
              type="range" min={0.5} max={1.5} step={0.05} value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="flex-1 accent-black"
            />
            <Btn onClick={() => setRate((r) => Math.min(1.5, +(r + 0.1).toFixed(1)))}>速</Btn>
          </div>
        </div>

        <div className="mt-4 text-xs text-neutral-500">
          <span>長さ: {duration ? formatTime(duration) : "--:--"}</span>
        </div>
      </div>

      <div className="text-xs text-neutral-500">音源パス: <code className="bg-neutral-100 px-1 py-0.5 rounded">{src}</code></div>
    </div>
  );
}

function formatTime(sec: number) {
  if (!sec || !isFinite(sec)) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
