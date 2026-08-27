import React from 'react';

interface FanshiLogoProps {
  className?: string;
  onClick?: () => void;
}

/**
 * FANSHI (梵誓 / 放映主理人) 官方品牌矢量徽标
 * 纯正 Slab-Serif 重装粗衬线机能字体
 * 统一基线与字高（F-A-N-S-H-I），S 采用纯正标准的粗衬线结构（双直角平衬线 + 圆润双弓中枢），严整工业美感
 */
export const FanshiLogo: React.FC<FanshiLogoProps> = ({
  className = 'w-32 h-auto text-white',
  onClick,
}) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 select-none ${className}`}
      role="img"
      aria-label="FANSHI"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 680 74"
        fill="currentColor"
        className="w-full h-auto drop-shadow-sm"
      >
        {/* ====================================================================
            Letter 1: 'F' (x: 10 ~ 104)
            ==================================================================== */}
        <path d="M 10,2.22 H 104 V 30.62 H 78.4 V 18.97 H 66.1 V 34.5 H 90.3 V 51.8 H 66.1 V 54.23 H 77.2 V 71.53 H 26.3 V 54.23 H 37.4 V 18.97 H 10 Z" />

        {/* ====================================================================
            Letter 2: 'A' (x: 118 ~ 226)
            ==================================================================== */}
        <path
          fillRule="evenodd"
          d="M 152,2.22 H 192 V 18.97 H 206 V 30.62 H 198 L 226,71.53 H 183 V 54.23 H 192 L 183,38 H 157 L 148,54.23 H 157 V 71.53 H 118 L 146,30.62 H 138 V 18.97 H 152 Z M 172,19 L 161,33 H 183 Z"
        />

        {/* ====================================================================
            Letter 3: 'N' (x: 240 ~ 346)
            ==================================================================== */}
        <path d="M 240,2.22 H 288 V 18.97 H 276 V 54.23 H 288 V 71.53 H 240 V 54.23 H 252 V 18.97 H 240 Z M 298,2.22 H 346 V 18.97 H 334 V 54.23 H 346 V 71.53 H 298 V 54.23 H 310 V 18.97 H 298 Z M 276,18.97 L 314,71.53 H 335 L 276,2.22 Z" />

        {/* ====================================================================
            Letter 4: 'S' (x: 360 ~ 464, Pure Standard Heavy Slab-Serif 'S')
            Top right vertical drop-serif, smooth top/bottom bowls, powerful central spine, bottom left rise-serif
            ==================================================================== */}
        <path d="
          M 464,2.22
          V 28
          H 440
          V 18.97
          H 392
          C 376,18.97 368,23 368,28.5
          C 368,33.5 376,36.5 392,38.5
          L 426,43
          C 448,46 458,53.5 458,62.5
          C 458,71.53 438,71.53 416,71.53
          H 360
          V 46
          H 384
          V 55.2
          C 396,57.5 414,57.5 426,55.2
          C 434,53 434,49 424,47
          L 388,42.5
          C 366,39.5 356,31.5 356,22.5
          C 356,2.22 386,2.22 416,2.22
          H 464
          Z
        " />

        {/* ====================================================================
            Letter 5: 'H' (x: 478 ~ 578)
            ==================================================================== */}
        <path d="M 478,2.22 H 526 V 18.97 H 514 V 34.5 H 542 V 18.97 H 530 V 2.22 H 578 V 18.97 H 566 V 54.23 H 578 V 71.53 H 530 V 54.23 H 542 V 51.5 H 514 V 54.23 H 526 V 71.53 H 478 V 54.23 H 490 V 18.97 H 478 Z M 514,34.5 H 542 V 51.5 H 514 Z" />

        {/* ====================================================================
            Letter 6: 'I' (x: 592 ~ 670)
            ==================================================================== */}
        <path d="M 646,18.97 H 658 V 2.22 H 600 V 18.97 H 612 V 54.24 H 600 V 71.53 H 658 V 54.24 H 646 V 18.97 Z" />
      </svg>
    </span>
  );
};

/** Compatibility alias for zero-regression imports across the entire app */
export const TriggerLogo = FanshiLogo;
