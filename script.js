/* =============================
   スライダー設定
============================= */

// スライダーAの画像リスト（jpgからpngへ）
const sliderAImages = [
  { src: 'images/slideA-01.webp', alt: 'スライドA 1枚目' },
  { src: 'images/slideA-02.webp', alt: 'スライドA 2枚目' },
  { src: 'images/slideA-03.webp', alt: 'スライドA 3枚目' },
  { src: 'images/slideA-04.webp', alt: 'スライドA 4枚目' },
  { src: 'images/slideA-05.webp', alt: 'スライドA 5枚目' },
  { src: 'images/slideA-06.webp', alt: 'スライドA 6枚目' },
  { src: 'images/slideA-07.webp', alt: 'スライドA 7枚目' },
  { src: 'images/slideA-08.webp', alt: 'スライドA 8枚目' },
];

// スライダーBの画像リスト（jpgからpngへ）
const sliderBImages = [
  { src: 'images/slideB-01.webp', alt: 'スライドB 1枚目' },
  { src: 'images/slideB-02.webp', alt: 'スライドB 2枚目' },
  { src: 'images/slideB-03.webp', alt: 'スライドB 3枚目' },
  { src: 'images/slideB-04.webp', alt: 'スライドB 4枚目' },
  { src: 'images/slideB-05.webp', alt: 'スライドB 5枚目' },
  { src: 'images/slideB-06.webp', alt: 'スライドB 6枚目' },
];

/* =============================
   スライダー初期化関数
============================= */
function initSlider(outerId, wrapId, trackId, dotsId, prevBtnId, nextBtnId, images, counterId, thumbsId) {
  const outer    = document.getElementById(outerId);
  const wrap     = document.getElementById(wrapId);
  const track    = document.getElementById(trackId);
  const prevBtn  = document.getElementById(prevBtnId);
  const nextBtn  = document.getElementById(nextBtnId);
  const counterEl = counterId ? document.getElementById(counterId) : null;
  const thumbsEl  = thumbsId  ? document.getElementById(thumbsId)  : null;

  if (!wrap || !track) return;

  // ドラッグ判定はouter優先、なければwrap
  const dragTarget = outer || wrap;

  const total = images.length;
  if (total === 0) return;

  // クローンループ構成
  const allImages = [images[total - 1], ...images, images[0]];

  allImages.forEach((img) => {
    const item = document.createElement('div');
    item.className = 'slide-item';
    const picture = document.createElement('img');
    picture.src = img.src;
    picture.alt = img.alt;
    picture.className = 'slide-item-img';
    item.appendChild(picture);
    track.appendChild(item);
  });

  // サムネイル生成
  const thumbEls = [];
  if (thumbsEl) {
    images.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'slider-thumb' + (i === 0 ? ' is-active' : '');
      thumb.dataset.index = i;
      const tImg = document.createElement('img');
      tImg.src = img.src;
      tImg.alt = img.alt;
      thumb.appendChild(tImg);
      thumb.addEventListener('click', () => goTo(i));
      thumbsEl.appendChild(thumb);
      thumbEls.push(thumb);
    });
  }

  let currentIndex = 0;
  const SWIPE_THRESHOLD = 0.2;

  function updateUI(index) {
    const realIndex = ((index % total) + total) % total;
    if (counterEl) counterEl.textContent = (realIndex + 1) + ' / ' + total;
    thumbEls.forEach((t, i) => t.classList.toggle('is-active', i === realIndex));
    if (thumbsEl && thumbEls[realIndex]) {
      const thumb = thumbEls[realIndex];
      const thumbLeft = thumb.offsetLeft;
      const thumbWidth = thumb.offsetWidth;
      const stripWidth = thumbsEl.offsetWidth;
      const maxScroll = thumbsEl.scrollWidth - stripWidth;
      const currentScroll = thumbsEl.scrollLeft;
      const targetScroll = Math.max(0, Math.min(thumbLeft - stripWidth / 2 + thumbWidth / 2, maxScroll));

      // ラップ判定：Safari対応のため瞬間移動→scrollToを分離
      const needsWrapToStart = realIndex === 0 && currentScroll > maxScroll * 0.6;
      const needsWrapToEnd   = realIndex === total - 1 && currentScroll < maxScroll * 0.4;

      if (needsWrapToStart || needsWrapToEnd) {
        // まず瞬間移動（animationなし）
        const jumpTo = needsWrapToStart ? 0 : maxScroll;
        thumbsEl.style.scrollBehavior = 'auto';
        thumbsEl.scrollLeft = jumpTo;
        // Safariがレイアウトを確定するのを待ってからスムーズスクロール
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            thumbsEl.style.scrollBehavior = '';
            thumbsEl.scrollTo({ left: targetScroll, behavior: 'smooth' });
          });
        });
      } else {
        thumbsEl.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }
  }

  function moveToReal(index, animate = true) {
    const trackIndex = index + 1;
    track.style.transition = animate ? 'transform var(--slider-transition)' : 'none';
    track.style.transform = `translateX(-${trackIndex * 100}%)`;
  }

  function goTo(index) {
    currentIndex = index;
    moveToReal(currentIndex, true);
    updateUI(currentIndex);
  }

  function next() {
    currentIndex++;
    moveToReal(currentIndex, true);
    updateUI(currentIndex);
  }

  function prev() {
    currentIndex--;
    moveToReal(currentIndex, true);
    updateUI(currentIndex);
  }

  track.addEventListener('transitionend', () => {
    if (currentIndex >= total) {
      currentIndex = 0;
      moveToReal(currentIndex, false);
      updateUI(currentIndex);
    } else if (currentIndex < 0) {
      currentIndex = total - 1;
      moveToReal(currentIndex, false);
      updateUI(currentIndex);
    }
  });

  moveToReal(0, false);
  updateUI(0);

  if (prevBtn) prevBtn.addEventListener('click', (e) => {
    // ドラッグ後の誤クリックを防ぐ（移動量が大きければスキップ）
    if (Math.abs(lastDragDiff) > 5) return;
    prev();
  });
  if (nextBtn) nextBtn.addEventListener('click', (e) => {
    if (Math.abs(lastDragDiff) > 5) return;
    next();
  });

  // ドラッグ中の移動量を記録（ボタンの誤クリック防止用）
  let lastDragDiff = 0;

  // =============================
  // タッチ・マウスイベントを dragTarget（slider-outer）全面で受け取る
  // =============================

  let touchStartX = 0, touchStartY = 0, touchCurrentX = 0, isDragging = false, baseTranslate = 0;
  let swipeDirection = null; // 'horizontal' | 'vertical' | null

  dragTarget.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCurrentX = touchStartX;
    isDragging = true;
    swipeDirection = null;
    lastDragDiff = 0;
    baseTranslate = -((currentIndex + 1) * 100);
    track.style.transition = 'none';
  }, { passive: true });

  dragTarget.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    // 最初の8pxで横か縦かを確定
    if (swipeDirection === null && (Math.abs(dx) > 24 || Math.abs(dy) > 24)) {
      swipeDirection = Math.abs(dx) > Math.abs(dy) * 2.0 ? 'horizontal' : 'vertical';
    }

    // 縦スワイプと判定した場合はスライダーを触らない
    if (swipeDirection === 'vertical') return;

    // 横スワイプ：ページの縦スクロールを止めてスライダーを動かす
    if (swipeDirection === 'horizontal') {
      e.preventDefault();
      touchCurrentX = e.touches[0].clientX;
      const diffPercent = ((touchCurrentX - touchStartX) / wrap.offsetWidth) * 100;
      track.style.transform = `translateX(${baseTranslate + diffPercent}%)`;
    }
  }, { passive: false });

  dragTarget.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    if (swipeDirection !== 'horizontal') {
      moveToReal(currentIndex, true);
      return;
    }
    lastDragDiff = touchCurrentX - touchStartX;
    const threshold = wrap.offsetWidth * SWIPE_THRESHOLD;
    if (lastDragDiff < -threshold) next();
    else if (lastDragDiff > threshold) prev();
    else moveToReal(currentIndex, true);
  });

  // マウスドラッグ
  let mouseStartX = 0, isMouseDragging = false;

  dragTarget.addEventListener('mousedown', (e) => {
    // ボタン上のmousedownも含めてドラッグ開始
    mouseStartX = e.clientX;
    isMouseDragging = true;
    lastDragDiff = 0;
    baseTranslate = -((currentIndex + 1) * 100);
    track.style.transition = 'none';
  });

  dragTarget.addEventListener('mousemove', (e) => {
    if (!isMouseDragging) return;
    const diffPercent = ((e.clientX - mouseStartX) / wrap.offsetWidth) * 100;
    track.style.transform = `translateX(${baseTranslate + diffPercent}%)`;
  });

  dragTarget.addEventListener('mouseup', (e) => {
    if (!isMouseDragging) return;
    isMouseDragging = false;
    lastDragDiff = e.clientX - mouseStartX;
    const threshold = wrap.offsetWidth * SWIPE_THRESHOLD;
    if (lastDragDiff < -threshold) next();
    else if (lastDragDiff > threshold) prev();
    else moveToReal(currentIndex, true);
  });

  dragTarget.addEventListener('mouseleave', () => {
    if (isMouseDragging) {
      isMouseDragging = false;
      moveToReal(currentIndex, true);
    }
  });
}

/* =============================
   価格表モーダル開閉
============================= */
function openKakakuModal() {
  const overlay = document.getElementById('kakakuOverlay');
  const sheet   = document.getElementById('kakakuSheet');
  if (!overlay || !sheet) return;

  sheet.querySelectorAll('img[data-src]').forEach(img => {
    if (!img.src || img.src === window.location.href) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
  });

  overlay.style.display = 'block';
  document.body.classList.add('kakaku-open');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('is-active');
      sheet.classList.add('is-active');
    });
  });
}

function closeKakakuModal() {
  const overlay = document.getElementById('kakakuOverlay');
  const sheet   = document.getElementById('kakakuSheet');
  if (!overlay || !sheet) return;
  overlay.classList.remove('is-active');
  sheet.classList.remove('is-active');
  document.body.classList.remove('kakaku-open');
  setTimeout(() => { overlay.style.display = 'none'; }, 400);
}

function initKakakuModal() {
  const overlay  = document.getElementById('kakakuOverlay');
  const closeBtn = document.getElementById('kakakuClose');

  // モーダル内リンク：閉じてから移動
  document.querySelectorAll('.kakaku-area').forEach(area => {
    area.addEventListener('click', (e) => {
      e.preventDefault();
      const href = area.getAttribute('href');
      closeKakakuModal();
      setTimeout(() => { window.open(href, '_blank'); }, 400);
    });
  });

  ['btnKakaku04b', 'btnKakaku06b', 'btnKakakuMid', 'btnKakaku14b'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', (e) => {
      e.preventDefault();
      openKakakuModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeKakakuModal);
  if (overlay)  overlay.addEventListener('click', closeKakakuModal);
}

/* =============================
   FAQ アコーディオン（meta_13a/b）
============================= */
function initFaqAccordion() {
  document.querySelectorAll('.faq-accordion').forEach(accordion => {
    const question = accordion.querySelector('.faq-question');
    const answer   = accordion.querySelector('.faq-answer');
    const arrow    = accordion.querySelector('.faq-arrow-img');
    const qImg     = accordion.querySelector('.faq-q-img');
    if (!question || !answer) return;

    let isOpen = false;
    answer.style.display = 'none';

    question.addEventListener('click', () => {
      isOpen = !isOpen;
      answer.style.display = isOpen ? 'block' : 'none';
      if (arrow) arrow.classList.toggle('is-open', isOpen);
      if (qImg) {
        qImg.classList.toggle('sp-10', isOpen);
        qImg.classList.toggle('sp-40', !isOpen);
      }
    });
  });
}

/* =============================
   固定フッター スクロールリンク
============================= */
function initFooterNav() {
  const footerImg = document.getElementById('footerImg');
  if (!footerImg) return;

  function setupMap() {
    const w = footerImg.offsetWidth;
    const h = footerImg.offsetHeight;
    const q = Math.floor(w / 4);

    document.getElementById('areaCorner').coords  = `${q * 0},0,${q * 1},${h}`;
    document.getElementById('areaFinish').coords  = `${q * 1},0,${q * 2},${h}`;
    document.getElementById('areaCase').coords    = `${q * 2},0,${q * 3},${h}`;
    document.getElementById('areaContact').coords = `${q * 3},0,${q * 4},${h}`;
  }

  if (footerImg.complete) setupMap();
  else footerImg.addEventListener('load', setupMap);
  window.addEventListener('resize', setupMap);

  // モーダルを閉じてからスクロール
  function closeAndScroll(targetId) {
    const isModalOpen = document.getElementById('kakakuSheet') &&
      document.getElementById('kakakuSheet').classList.contains('is-active');
    if (isModalOpen) {
      closeKakakuModal();
      setTimeout(() => {
        const target = document.querySelector(targetId);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else {
      const target = document.querySelector(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  document.querySelectorAll('map area[href^="#"]').forEach(area => {
    area.addEventListener('click', (e) => {
      e.preventDefault();
      closeAndScroll(area.getAttribute('href'));
    });
  });

  footerImg.addEventListener('click', (e) => {
    const rect = footerImg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = footerImg.offsetWidth;
    const q = w / 4;
    let targetId;
    if      (x < q)     targetId = '#section-meta06';
    else if (x < q * 2) targetId = '#section-meta08';
    else if (x < q * 3) targetId = '#section-meta09';
    else                targetId = null;
    if (targetId) {
      e.preventDefault();
      closeAndScroll(targetId);
    }
  });
}

/* =============================
   DOM読み込み後に初期化
============================= */
document.addEventListener('DOMContentLoaded', () => {
  // 第1引数に slider-outer の ID を追加
  initSlider('sliderA-outer', 'sliderA', 'sliderA-track', 'sliderA-dots', 'sliderA-prev', 'sliderA-next', sliderAImages, 'sliderA-counter', 'sliderA-thumbs');
  initSlider('sliderB-outer', 'sliderB', 'sliderB-track', 'sliderB-dots', 'sliderB-prev', 'sliderB-next', sliderBImages, 'sliderB-counter', 'sliderB-thumbs');
  initKakakuModal();
  initFaqAccordion();
  initFooterNav();
});
