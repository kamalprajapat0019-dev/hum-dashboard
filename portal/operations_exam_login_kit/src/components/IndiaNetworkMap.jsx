import React from "react";

/**
 * Decorative, locally-rendered network-map motif. This stylized outline is intentionally
 * illustrative rather than a geographically precise map. Replace with an approved SVG
 * asset if the product has a branded map illustration.
 */
export default function IndiaNetworkMap() {
  return (
    <svg className="india-network" viewBox="0 0 360 390" aria-hidden="true">
      <defs>
        <filter id="mapGlow"><feGaussianBlur stdDeviation="3.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <pattern id="dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="1" fill="#00e5ff" opacity=".85" />
        </pattern>
      </defs>
      <path d="M115 14 143 28 152 48 177 55 183 76 207 83 217 103 246 115 239 137 264 150 248 169 227 173 217 194 194 204 188 229 171 244 164 270 146 285 140 317 123 338 110 312 101 289 88 269 83 241 67 224 60 202 40 189 49 169 37 151 53 133 66 113 70 90 86 72 87 50 102 35Z" fill="url(#dots)" stroke="#00dff8" strokeWidth="1.5" opacity=".95" filter="url(#mapGlow)" />
      <path d="M244 121 265 106 286 111 298 128 286 143 266 148 250 139Z" fill="url(#dots)" stroke="#00dff8" strokeWidth="1.3" />
      <g stroke="#00e5ff" strokeWidth="1" opacity=".75">
        <path d="M112 61 151 111 103 159 168 177 128 226 146 282" fill="none" />
        <path d="M151 111 205 135 168 177 213 205 184 243" fill="none" />
        <path d="M103 159 75 202 128 226 92 266" fill="none" />
        <path d="M205 135 250 130" fill="none" />
      </g>
      <g fill="#eaffff" stroke="#00dff8" strokeWidth="3" filter="url(#mapGlow)">
        <circle cx="112" cy="61" r="4" /><circle cx="151" cy="111" r="4.5" /><circle cx="103" cy="159" r="4" />
        <circle cx="168" cy="177" r="5" /><circle cx="205" cy="135" r="4" /><circle cx="213" cy="205" r="4" />
        <circle cx="128" cy="226" r="4" /><circle cx="146" cy="282" r="4.5" /><circle cx="75" cy="202" r="3.5" />
      </g>
    </svg>
  );
}
