import { Photo } from '../contexts/PhotoContext'
import { useNavigate, useLocation } from 'react-router-dom'

import { Heart, MapPin } from 'lucide-react'
import { memo, useMemo, useEffect, useRef, useState } from 'react'

const TILE_W = 636; // 4 * 150 + 3 * 12
const GAP = 12;
const BLOCK_CONTENT_W = (TILE_W * 2) + GAP; // 1284
const BLOCK_W = BLOCK_CONTENT_W + GAP; // 1296
const BLOCK_H = BLOCK_W;

const SPAN_SETS = [
  [
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-1', // 2
    'col-span-1 row-span-2', // 2
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
  ], // Total 16
  [
    'col-span-2 row-span-2', // 4
    'col-span-1 row-span-2', // 2
    'col-span-1 row-span-2', // 2
    'col-span-2 row-span-1', // 2
    'col-span-2 row-span-1', // 2
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
  ], // Total 16
  [
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-1', // 2
    'col-span-2 row-span-1', // 2
    'col-span-1 row-span-2', // 2
    'col-span-1 row-span-2', // 2
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
  ], // Total 16
  [
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-2', // 4
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
  ], // Total 16
  [
    'col-span-1 row-span-2', // 2
    'col-span-1 row-span-2', // 2
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-1', // 2
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
  ], // Total 16
  [
    'col-span-2 row-span-1', // 2
    'col-span-2 row-span-1', // 2
    'col-span-1 row-span-2', // 2
    'col-span-1 row-span-2', // 2
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 1
    'col-span-2 row-span-2', // 4
    'col-span-2 row-span-1', // 2
  ] // Total 16 (Wait, 2+2+2+2+1+1+4+2 = 16. Correct.)
];

// ─── Card Hide/Reveal helpers ──────────────────────────────────────────────────

/**
 * Find the card element [data-memory-id=id] whose center is closest to the
 * provided sourceRect center, and instantly set opacity to 0.
 */
const hideSourceCard = (
  memoryId: string,
  srcRect: { top: number; left: number; width: number; height: number }
) => {
  const srcCX = srcRect.left + srcRect.width / 2;
  const srcCY = srcRect.top + srcRect.height / 2;

  const candidates = document.querySelectorAll<HTMLElement>(
    `[data-memory-id="${memoryId}"]`
  );
  let closestEl: HTMLElement | null = null;
  let closestDist = Infinity;

  candidates.forEach((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dist = Math.hypot(cx - srcCX, cy - srcCY);
    if (dist < closestDist) {
      closestDist = dist;
      closestEl = el;
    }
  });

  if (closestEl) {
    (closestEl as HTMLElement).style.opacity = '0';
    (closestEl as HTMLElement).style.transition = 'none';
    (window as any)._hiddenCardEl = closestEl;
  }
};

/** Fade the previously hidden card back in */
const revealHiddenCard = (animated = true) => {
  const el = (window as any)._hiddenCardEl as HTMLElement | null;
  if (!el) return;
  if (animated) {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '1';
    setTimeout(() => {
      if ((window as any)._hiddenCardEl === el) {
        el.style.transition = '';
        (window as any)._hiddenCardEl = null;
      }
    }, 300);
  } else {
    el.style.transition = '';
    el.style.opacity = '1';
    (window as any)._hiddenCardEl = null;
  }
};

// ─── MemoryCard ────────────────────────────────────────────────────────────────

const MemoryCard = memo(({ item, introDelay }: { item: Photo; introDelay?: string }) => {
  if (!item) return null;

  const locationName = useMemo(() => {
    if (!item) return 'Unknown place'
    const name = item.city?.name || item.admin1?.name || item.country?.name
    if (name) return name
    return item.locationTxt || 'Unknown place'
  }, [item])

  const displayUrl = useMemo(() => {
    if (!item) return null;
    const primaryImage = item.images?.[0] || null;
    const url = primaryImage?.imageUrl || primaryImage?.thumbnailUrl || item.imageUrl || null;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // 使用相对路径，让 Vite 代理处理 /uploads
    return url.startsWith('/') ? url : `/${url}`;
  }, [item]);

  return (
    <div
      className={`relative w-full h-full rounded-[20px] overflow-hidden shadow-2xl bg-[#111216] border border-white/5 transition-transform duration-300 hover:scale-[1.02] ${introDelay ? 'card-ripple-intro' : ''}`}
      style={{
        animationDelay: introDelay || '0s',
        transform: 'translateZ(0)',
      }}
    >
      {displayUrl && (
        <img
          src={displayUrl}
          alt={item.title}
          className="w-full h-full object-cover select-none pointer-events-none absolute inset-0"
          decoding="async"
          style={{ imageOrientation: 'from-image' }}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              // @ts-ignore - 存储原始比例用于无缝切换动画
              item._naturalRatio = img.naturalWidth / img.naturalHeight;
              // @ts-ignore
              item._naturalSize = { w: img.naturalWidth, h: img.naturalHeight };
            }
          }}
        />
      )}
      {!displayUrl && (
        <div className="w-full h-full bg-[#1A1B22] flex items-center justify-center absolute inset-0">
          <MapPin className="text-gray-500 w-8 h-8 pointer-events-none" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0B0C10] via-black/40 to-transparent pointer-events-none opacity-90 layer-hw-accel z-10" />

      <div className="absolute top-2 left-2 pointer-events-none z-20 flex items-center gap-1 bg-gradient-to-r from-pink-500/80 to-rose-500/80 px-2 py-1 rounded-lg shadow-sm border border-white/10">
        <Heart className="w-[10px] h-[10px] text-white fill-white" />
        <span className="text-[9px] font-bold text-white tracking-widest uppercase">
          {item.loveDays !== undefined && item.loveDays < 0
            ? `Together in ${Math.abs(item.loveDays)} days`
            : `Together for ${item.loveDays ?? 0} days`}
        </span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex flex-col justify-end pointer-events-none z-20">
        <h3 className="text-white text-[14px] font-bold tracking-tight line-clamp-1 drop-shadow-md mb-0.5">
          {item.title || '我们的回忆'}
        </h3>
        <div className="flex items-center gap-1 opacity-90">
          <MapPin className="w-2.5 h-2.5 text-[#A0A0A5] shrink-0" />
          <p className="text-[#A0A0A5] text-[9px] font-medium truncate">{locationName}</p>
        </div>
      </div>
    </div>
  );
});
MemoryCard.displayName = 'MemoryCard';

// ─── Tile ──────────────────────────────────────────────────────────────────────

const Tile = memo(
  ({
    items,
    onCardClick,
    tileIndex,
    introKey,
    layoutSeed,
  }: {
    items: Photo[];
    onCardClick: (item: Photo, e: any) => void;
    tileIndex: number;
    introKey: number;
    layoutSeed: number;
  }) => {
    // Determine the span set for this tile
    const spanSetIndex = (tileIndex + layoutSeed) % SPAN_SETS.length;
    const currentSpans = SPAN_SETS[spanSetIndex];

    // Map items to the grid spans. If we have more items than spans, they'll be ignored.
    // If we have fewer items, the grid spans will leave gaps.
    // Tile items should be exactly the required count for the set.
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 150px)',
          gridTemplateRows: 'repeat(4, 150px)',
          gridAutoFlow: 'dense',
          gap: `${GAP}px`,
          width: TILE_W,
          height: TILE_W,
        }}
      >
        {items.slice(0, currentSpans.length).map((item, i) => {
          const row = Math.floor(tileIndex / 4);
          const col = tileIndex % 4;
          const distToCenter = Math.sqrt(
            Math.pow(row - 1.5, 2) + Math.pow(col - 1.5, 2)
          );
          const delay = `${distToCenter * 0.15 + i * 0.04}s`;

          return (
            <div
              key={`${item?.id || 'empty'}-${i}`}
              data-memory-id={item?.id}
              className={`${currentSpans[i]} pointer-events-auto cursor-pointer`}
              onClick={(e) => {
                if ((window as any)._timelineState?.isDragBroken()) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                onCardClick(item, e);
              }}
              onTouchEnd={(e) => {
                if ((window as any)._timelineState?.isDragBroken()) {
                  e.stopPropagation();
                  return;
                }
                if (e.cancelable) e.preventDefault();
                onCardClick(item, e);
              }}
            >
              <MemoryCard key={introKey} item={item} introDelay={delay} />
            </div>
          );
        })}
      </div>
    );
  }
);
Tile.displayName = 'Tile';

// ─── Block ─────────────────────────────────────────────────────────────────────

const Block = memo(
  ({
    photos,
    onCardClick,
    introKey,
    layoutSeed,
  }: {
    photos: Photo[];
    onCardClick: (item: Photo, e: any) => void;
    introKey: number;
    layoutSeed: number;
  }) => {
    const tiles = useMemo(() => {
      const mapped = [];
      // Reduce from 16 tiles to 4 tiles for a lighter domestic
      for (let t = 0; t < 4; t++) {
        const tileItems = [];
        for (let i = 0; i < 10; i++) {
          // Use layoutSeed to shift the photo index, making the distribution truly random per session
          const pIndex = Math.abs(t * 17 + i * 11 + (layoutSeed * 7)) % (photos.length || 1);
          tileItems.push(photos[pIndex]);
        }
        mapped.push(tileItems);
      }
      return mapped;
    }, [photos]);

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(2, ${TILE_W}px)`,
          gridTemplateRows: `repeat(2, ${TILE_W}px)`,
          gap: `${GAP}px`,
          width: (TILE_W * 2) + GAP,
          height: (TILE_W * 2) + GAP,
          pointerEvents: 'none',
        }}
      >
        {tiles.map((tileItems, i) => (
          <Tile
            key={i}
            tileIndex={i}
            items={tileItems}
            onCardClick={onCardClick}
            introKey={introKey}
            layoutSeed={layoutSeed}
          />
        ))}
      </div>
    );
  }
);
Block.displayName = 'Block';

// ─── TimelineView ──────────────────────────────────────────────────────────────

export default function TimelineView({
  photos,
  selectedRegion,
  currentCountry,
}: {
  photos: Photo[];
  selectedRegion?: { id: string; name: string } | null;
  currentCountry?: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [introKey, setIntroKey] = useState(0);
  const isIntroActiveRef = useRef(true);
  const introTimerRef = useRef<any>(null);

  // Truly random session seed that changes whenever the component remounts
  // (Component remounts on tag change due to the 'key' assigned in Album.tsx)
  const layoutSeed = useMemo(() => Math.floor(Math.random() * 100), []);

  // ── Photo click ─────────────────────────────────────────────────────────────
  const handlePhotoClick = (item: Photo, e: any) => {
    let rect = { top: 0, left: 0, width: 0, height: 0 };
    let naturalSize = null;

    if (e?.currentTarget) {
      const domRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      rect = {
        top: domRect.top,
        left: domRect.left,
        width: domRect.width,
        height: domRect.height,
      };
      const img = (e.currentTarget as HTMLElement).querySelector('img');
      if (img && img.naturalWidth) {
        naturalSize = { w: img.naturalWidth, h: img.naturalHeight };
      }
    }

    const from = selectedRegion || currentCountry ? 'love-memories' : 'album';
    navigate(`/memory/${item.id}`, {
      state: {
        photo: item,
        from,
        selectedRegion,
        currentCountry,
        sourceRect: rect,
        backgroundLocation: location,
        naturalSize: naturalSize || (item as any)._naturalSize,
        naturalRatio: (item as any)._naturalRatio,
      },
    });
  };

  // ── Listen for detail-view events to hide/reveal cards ────────────────────
  useEffect(() => {
    const handleDetailOpened = (e: any) => {
      const { id, rect } = e.detail;
      hideSourceCard(id, rect);
    };
    const handleDetailClosed = () => revealHiddenCard(true);

    window.addEventListener('memory-detail-opened', handleDetailOpened as EventListener);
    window.addEventListener('memory-detail-closed', handleDetailClosed);
    return () => {
      window.removeEventListener('memory-detail-opened', handleDetailOpened as EventListener);
      window.removeEventListener('memory-detail-closed', handleDetailClosed);
    };
  }, []);

  // Safety reveal when the timeline unmounts (user navigates away entirely)
  useEffect(() => {
    return () => revealHiddenCard(false);
  }, []);

  // ── Viewport position persistence ───────────────────────────────────────────
  const savedPos = useMemo(() => {
    try {
      const s = sessionStorage.getItem('_timeline_vp');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }, []);

  const posRef = useRef({
    x: savedPos?.x || 0,
    y: savedPos?.y || Math.floor(BLOCK_H / 2),
  });

  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        '_timeline_vp',
        JSON.stringify({ x: posRef.current.x, y: posRef.current.y })
      );
    };
  }, []);

  // ── Animation loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    let animationId: number;
    let isDragging = false;
    const autoPanSpeed = { x: 0.5, y: 0 };
    let inertiaVelocity = { x: 0, y: 0 };
    let startCoords = { x: 0, y: 0 };
    let lastCoords = { x: 0, y: 0 };
    let dragThresholdBroken = false;

    const triggerIntro = () => {
      isIntroActiveRef.current = true;
      setIntroKey((prev) => prev + 1);
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      introTimerRef.current = setTimeout(() => {
        isIntroActiveRef.current = false;
      }, 1400);
    };

    triggerIntro();

    const render = () => {
      if (!canvasRef.current) return;
      const moduloX = ((posRef.current.x % BLOCK_W) + BLOCK_W) % BLOCK_W;
      const moduloY = ((posRef.current.y % BLOCK_H) + BLOCK_H) % BLOCK_H;
      canvasRef.current.style.transform = `translate3d(${-moduloX}px, ${-moduloY}px, 0)`;
    };

    const animate = () => {
      if (window.location.pathname.includes('/memory/')) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      if (!isDragging && !isIntroActiveRef.current) {
        posRef.current.x += autoPanSpeed.x + inertiaVelocity.x;
        posRef.current.y += autoPanSpeed.y + inertiaVelocity.y;
        inertiaVelocity.x *= 0.94;
        inertiaVelocity.y *= 0.94;
      }
      render();
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleStart = (clientX: number, clientY: number) => {
      isDragging = true;
      dragThresholdBroken = false;
      startCoords = { x: clientX, y: clientY };
      lastCoords = { x: clientX, y: clientY };
      inertiaVelocity = { x: 0, y: 0 };
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const dx = clientX - lastCoords.x;
      const dy = clientY - lastCoords.y;
      if (Math.abs(clientX - startCoords.x) > 5 || Math.abs(clientY - startCoords.y) > 5) {
        dragThresholdBroken = true;
      }
      posRef.current.x -= dx;
      posRef.current.y -= dy;
      lastCoords = { x: clientX, y: clientY };
      render();
    };

    const handleEnd = () => {
      isDragging = false;
      inertiaVelocity = {
        x: -(lastCoords.x - startCoords.x) * 0.3,
        y: -(lastCoords.y - startCoords.y) * 0.3,
      };
      inertiaVelocity.x = Math.max(-18, Math.min(18, inertiaVelocity.x));
      inertiaVelocity.y = Math.max(-18, Math.min(18, inertiaVelocity.y));
    };

    const handleAppReentry = () => {
      isDragging = false;
      triggerIntro();
    };

    const touchArea = document.getElementById('timeline-viewport-area');
    if (!touchArea) return;

    const onTouchStart = (e: TouchEvent) =>
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    const handleBlur = () => { isDragging = false; };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleAppReentry();
      } else {
        isDragging = false;
      }
    };

    touchArea.addEventListener('touchstart', onTouchStart, { passive: false });
    touchArea.addEventListener('touchmove', onTouchMove, { passive: false });
    touchArea.addEventListener('touchend', onTouchEnd, { passive: false });

    window.addEventListener('focus', handleAppReentry);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    (window as any)._timelineState = { isDragBroken: () => dragThresholdBroken };

    return () => {
      cancelAnimationFrame(animationId);
      touchArea.removeEventListener('touchstart', onTouchStart);
      touchArea.removeEventListener('touchmove', onTouchMove);
      touchArea.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('focus', handleAppReentry);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, [photos.length]);

  const initialModuloX = ((posRef.current.x % BLOCK_W) + BLOCK_W) % BLOCK_W;
  const initialModuloY = ((posRef.current.y % BLOCK_H) + BLOCK_H) % BLOCK_H;

  return (
    <div
      id="timeline-viewport-area"
      className="fixed inset-0 z-0 bg-[#0B0C10] select-none touch-none overscroll-none"
    >
      <div className="w-full h-full overflow-hidden">
        <div
          ref={canvasRef}
          className="relative w-full h-full will-change-transform"
          style={{ transform: `translate3d(-${initialModuloX}px, -${initialModuloY}px, 0)` }}
        >
          <div className="absolute top-0 left-0" style={{ transform: 'translate3d(0px, 0px, 0)' }}>
            <Block photos={photos} onCardClick={handlePhotoClick} introKey={introKey} layoutSeed={layoutSeed} />
          </div>
          <div className="absolute top-0 left-0" style={{ transform: `translate3d(${BLOCK_W}px, 0px, 0)` }}>
            <Block photos={photos} onCardClick={handlePhotoClick} introKey={introKey} layoutSeed={layoutSeed} />
          </div>
          <div className="absolute top-0 left-0" style={{ transform: `translate3d(0px, ${BLOCK_H}px, 0)` }}>
            <Block photos={photos} onCardClick={handlePhotoClick} introKey={introKey} layoutSeed={layoutSeed} />
          </div>
          <div className="absolute top-0 left-0" style={{ transform: `translate3d(${BLOCK_W}px, ${BLOCK_H}px, 0)` }}>
            <Block photos={photos} onCardClick={handlePhotoClick} introKey={introKey} layoutSeed={layoutSeed} />
          </div>
        </div>
      </div>
    </div>
  );
}
