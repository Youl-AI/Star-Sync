export default function Home() {
  return (
    <main className="nebula-bg min-h-[100dvh] p-10">
      <h1 className="font-display text-4xl text-starlight">별샘</h1>
      <p className="mt-2 text-starlight-dim">밤의 의식, 낮의 기록</p>
      <span className="mt-4 inline-block rounded-full border border-gold/50 px-4 py-2 text-sm text-gold-soft">
        <span className="astro-symbol">{"♂︎"}</span> 화성 <span className="astro-symbol">{"☌︎"}</span> 태양 · 2.1°
      </span>
    </main>
  );
}
