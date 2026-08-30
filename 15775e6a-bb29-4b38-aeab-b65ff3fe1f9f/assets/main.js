/* ----------------------------------------------------------------------
   TRIGGER 2026 フロントページ演出
   原サイト（https://www.st-trigger.co.jp/）のテーマスクリプトを
   オフライン用に再構成したもの。ロジックは原版と同じ。
---------------------------------------------------------------------- */
(function() {

  'use strict';

  let isInitialized = false;

  window.addEventListener('initScript', () => {

    if (isInitialized) return;
    isInitialized = true;

    // Lenis（スムーススクロール）
    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.0,
      wheelMultiplier: 0.7,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);


    // カルーセル（スクロールバー付き）
    const splideConfigs = {
      index_works_slider: {
        autoWidth: true,
        gap: '40px',
        arrows: false,
        breakpoints: {
          900: { gap: '15px' },
          1200: { gap: '20px' },
          1400: { gap: '30px' },
        },
      },
      cb_goods_slider: {
        perPage: 5,
        gap: '40px',
        arrows: true,
        breakpoints: {
          900: { autoWidth: true, perPage: 1, gap: '15px' },
          1200: { perPage: 3, gap: '20px' },
          1500: { perPage: 4, gap: '30px' },
        },
      },
      cb_youtube_slider: {
        perPage: 4,
        gap: '40px',
        arrows: true,
        breakpoints: {
          900: { autoWidth: true, perPage: 1, gap: '15px' },
          1200: { perPage: 3, gap: '20px' },
          1500: { gap: '30px' },
        },
      },
    };
    document.querySelectorAll('.splide_with_scrollbar').forEach((sliderEl) => {
      const id = sliderEl.dataset.splideId;
      if (!id) return;
      const scrollbarEl = document.querySelector(`.splide_scrollbar[data-splide-id="${id}"]`);
      const options = splideConfigs[id];
      if (!scrollbarEl || !options) return;
      initSplideWithScrollbar(sliderEl, scrollbarEl, options);
    });

    // リクルート / グッズのパララックス
    parallaxBanner();

  }); // initScript


  // スクロールバー付きSplide（テーマ main.js より）
  function initSplideWithScrollbar(splideEl, scrollbarEl, options, mobileScrollbarOnly = false) {

    const splideRoot = typeof splideEl === 'string'
      ? document.querySelector(splideEl) : splideEl;
    const scrollbarRoot = typeof scrollbarEl === 'string'
      ? document.querySelector(scrollbarEl) : scrollbarEl;
    const thumb = scrollbarRoot.querySelector('.splide_scrollbar_thumb');

    let defaultOptions;
    const mobileBreakpoint = 768;

    if (mobileScrollbarOnly) {
      defaultOptions = { drag: true, snap: true, arrows: false, pagination: false, type: 'slide' };
      const mergedOptions = Object.assign({}, defaultOptions, options);
      if (!mergedOptions.breakpoints) mergedOptions.breakpoints = {};
      const existingMobile = mergedOptions.breakpoints[mobileBreakpoint] || {};
      mergedOptions.breakpoints[mobileBreakpoint] = Object.assign(
        { drag: 'free', snap: false },
        existingMobile
      );
      var splide = new Splide(splideRoot, mergedOptions).mount();
      scrollbarRoot.classList.add('splide_scrollbar_mobile_only');
    } else {
      defaultOptions = { drag: 'free', snap: false, pagination: false, type: 'slide' };
      var splide = new Splide(splideRoot, Object.assign({}, defaultOptions, options)).mount();
    }

    const { Move, Layout } = splide.Components;
    let isDragging = false;

    function getGapPx() {
      const slide = splideRoot.querySelector('.splide__slide');
      return slide ? (parseFloat(getComputedStyle(slide).marginRight) || 0) : 0;
    }

    function updateThumb() {
      const trackWidth = scrollbarRoot.clientWidth;
      const sliderSize = Layout.sliderSize() - getGapPx();
      const listSize = Layout.listSize();
      const base = sliderSize - listSize;

      const rateOfThumbWidth = Math.min(listSize / sliderSize, 1);
      const thumbWidth = Math.max(trackWidth * rateOfThumbWidth, 24);
      thumb.style.width = thumbWidth + 'px';

      if (base <= 0) { thumb.style.transform = 'translateX(0px)'; return; }

      const position = -Move.getPosition();
      const rate = Math.min(Math.max(position / base, 0), 1);
      thumb.style.transform = `translateX(${(trackWidth - thumbWidth) * rate}px)`;
    }

    splide.on('mounted resize', updateThumb);
    window.addEventListener('resize', updateThumb);

    (function loop() {
      if (!isDragging) updateThumb();
      requestAnimationFrame(loop);
    })();

    let startClientX = 0;
    let startThumbLeft = 0;

    thumb.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startClientX = e.clientX;
      startThumbLeft = thumb.getBoundingClientRect().left
        - scrollbarRoot.getBoundingClientRect().left;
      thumb.setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';
    });

    thumb.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const trackWidth = scrollbarRoot.clientWidth;
      const thumbWidth = thumb.clientWidth;
      let left = startThumbLeft + (e.clientX - startClientX);
      left = Math.max(0, Math.min(left, trackWidth - thumbWidth));
      thumb.style.transform = `translateX(${left}px)`;

      const rate = left / (trackWidth - thumbWidth || 1);
      const base = Layout.sliderSize() - getGapPx() - Layout.listSize();
      Move.translate(-(rate * base));
    });

    thumb.addEventListener('pointerup', () => {
      isDragging = false;
      document.body.style.userSelect = '';
    });

    scrollbarRoot.addEventListener('pointerdown', (e) => {
      if (e.target === thumb) return;
      const thumbWidth = thumb.clientWidth;
      let left = e.clientX - scrollbarRoot.getBoundingClientRect().left - thumbWidth / 2;
      left = Math.max(0, Math.min(left, scrollbarRoot.clientWidth - thumbWidth));
      const rate = left / (scrollbarRoot.clientWidth - thumbWidth || 1);
      const base = Layout.sliderSize() - getGapPx() - Layout.listSize();
      Move.translate(-(rate * base));
      updateThumb();
    });

    updateThumb();
    return splide;

  }


  // リクルート / グッズのパララックス（テーマインラインスクリプトより）
  function parallaxBanner() {
    const INNER_RATIO = 1.4;
    const SPEED = 1.0;

    function init() {
      const wraps = document.querySelectorAll('.parallax_bg_content');
      wraps.forEach(wrap => {
        const useParallax = wrap.querySelector('.use_parallax');
        if (!useParallax) return;
        const inner = wrap.querySelector('.parallax_inner');
        const wrapH = wrap.offsetHeight;
        const surplus = wrapH * (INNER_RATIO - 1);
        inner.style.height = wrapH * INNER_RATIO + 'px';
        inner.style.transform = `translate3d(0, ${-surplus / 2}px, 0)`;
      });
    }

    function update() {
      const wraps = document.querySelectorAll('.parallax_bg_content');
      const viewH = window.innerHeight;
      wraps.forEach(wrap => {
        const useParallax = wrap.querySelector('.use_parallax');
        if (!useParallax) return;
        const inner = wrap.querySelector('.parallax_inner');
        const rect = wrap.getBoundingClientRect();
        const wrapH = wrap.offsetHeight;
        const surplus = wrapH * (INNER_RATIO - 1);
        const progress = Math.min(1, Math.max(0, (viewH - rect.top) / (viewH + wrapH)));
        const translateY = -progress * surplus * SPEED;
        inner.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
      });
    }

    function observeResize() {
      if (!window.ResizeObserver) return;
      const ro = new ResizeObserver(() => {
        init();
        update();
      });
      document.querySelectorAll('.parallax_bg_content').forEach(wrap => ro.observe(wrap));
    }

    function observeWillChange() {
      if (!window.IntersectionObserver) return;
      const options = { rootMargin: '200px 0px 200px 0px' };
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const useParallax = entry.target.querySelector('.use_parallax');
          const inner = entry.target.querySelector('.parallax_inner');
          if (useParallax && inner) {
            inner.style.willChange = entry.isIntersecting ? 'transform' : 'auto';
          }
          const videoTarget = inner || entry.target;
          const video = videoTarget.querySelector('video');
          if (video) {
            if (entry.isIntersecting) video.play();
            else video.pause();
          }
        });
      }, options);
      document.querySelectorAll('.parallax_bg_content').forEach(wrap => io.observe(wrap));
    }

    function start() {
      if (document.querySelectorAll('.parallax_bg_content').length === 0) return;
      init();
      update();
      observeResize();
      observeWillChange();
      window.addEventListener('scroll', update, { passive: true });
    }
    start();
  }


  // 画面上部からスクロールが開始された時にbodyにstart_scrollを付ける
  const jsBodyStart = document.getElementById('js-body-start');
  if (jsBodyStart) {
    const screenScrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].boundingClientRect.y < 0) {
        document.body.classList.add('start_scroll');
      } else {
        document.body.classList.remove('start_scroll');
      }
    }, { threshold: [0] });
    screenScrollObserver.observe(jsBodyStart);
  }

  // ドロワーメニュー
  const drawerMenuButton = document.getElementById('drawer_menu_button');
  if (drawerMenuButton) {
    drawerMenuButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.toggle('open_drawer_menu');
    });
  }

  // スクロールバーの横幅を取得
  document.addEventListener('DOMContentLoaded', () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--tcd-scrollbar-width', `${scrollbarWidth}px`);
  });

  // グローバルメニューの衝突判定
  document.addEventListener("DOMContentLoaded", () => {
    const globalMenu = document.getElementById("global_menu");
    const headerSNS = document.getElementById("header_sns");
    if (!globalMenu || !headerSNS) return;

    const checkDistance = () => {
      const rectMenu = globalMenu.getBoundingClientRect();
      const rectSNS = headerSNS.getBoundingClientRect();
      const distance = rectSNS.left - rectMenu.right;
      if (distance <= 50) document.body.classList.add("mobile_menu");
      else document.body.classList.remove("mobile_menu");
    };
    const ro = new ResizeObserver(() => checkDistance());
    ro.observe(globalMenu);
    ro.observe(headerSNS);
    window.addEventListener("resize", checkDistance);
    checkDistance();
  });

  // ローディング画面（テーマインラインスクリプトより）
  document.addEventListener("DOMContentLoaded", () => {
    // ローディング画面を持たないページ（WORKS 一覧など）は即座に表示を確定させる
    if (!document.getElementById('loading_screen')) {
      window.dispatchEvent(new Event('initScript'));
      setTimeout(() => {
        document.body.classList.add("end_loading");
      }, 10);
      return;
    }
    const imgLoad   = imagesLoaded(document.body);
    const imgTotal  = imgLoad.images.length;
    let   imgLoaded = 0;
    let   current   = 0;
    const opText    = document.querySelector(".loading_text");
    const opBar     = document.querySelector(".loading_bar");
    const startTime = performance.now();
    const minDuration = 1000;

    imgLoad.on("progress", () => { imgLoaded++; });
    opBar.classList.add("active");

    function updateProgress() {
      const target = (imgLoaded / imgTotal) * 100;
      current += (target - current) * 0.1;
      if (opText) opText.textContent = Math.floor(current) + "%";
      if (opBar)  opBar.style.width  = current + "%";
      const elapsed = performance.now() - startTime;

      if (current >= 99.9 && elapsed >= minDuration) {
        current = 100;
        if (opText) opText.textContent = "100%";
        if (opBar)  opBar.style.width  = "100%";
        window.dispatchEvent(new Event('initScript'));
        document.body.classList.add("end_loading");
        setTimeout(() => {
          document.getElementById("loading_screen")?.remove();
        }, 3000);
        return;
      }
      requestAnimationFrame(updateProgress);
    }
    requestAnimationFrame(updateProgress);
  });

})();
