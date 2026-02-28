"use client";

import { AnimatePresence } from "motion/react";
import React, { useState } from "react";
import Tub from "./Tub";
import Toilet from "./Toilet";
import Mirror from "./Mirror";
import { useRouter } from "next/navigation";

const BathroomInteractions = () => {
  const [openTub, setOpenTub] = useState(false);
  const [openToilet, setOpenToilet] = useState(false);
  const [openMirror, setOpenMirror] = useState(false);
  const router = useRouter();

  // 🔹 热点数据化，增加 width/height
  const hotspots = [
    {
      id: "tub",
      left: 0.3,
      top: 0.8,
      width: 0.25,  // 15% 宽
      height: 0.18, // 8% 高
      onClick: () => setOpenTub(true),
    },
    {
      id: "toilet",
      left: 0.52,
      top: 0.88,
      width: 0.1,
      height: 0.14,
      onClick: () => setOpenToilet(true),
    },
    {
      id: "mirror",
      left: 0.78,
      top: 0.38,
      width: 0.12,
      height: 0.3,
      onClick: () => setOpenMirror(true),
    },
    {
      id: "back",
      left: 0.05,
      top: 0.9,
      width: 0.08,
      height: 0.05,
      onClick: () => router.push("/"),
    },
  ];

  return (
    <div className="w-full h-full relative">
      {hotspots.map(h => (
        <button
          key={h.id}
          onClick={h.onClick}
          className={`hotspot ${h.id === "back" ? "text-white text-2xl hover:font-bold" : ""}`}
          style={{
            left: `${h.left * 100}%`,
            top: `${h.top * 100}%`,
            width: `${h.width * 100}%`,
            height: `${h.height * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      <AnimatePresence>
        {openTub && <Tub setOpenTub={setOpenTub} />}
        {openToilet && <Toilet setOpenToilet={setOpenToilet} />}
        {openMirror && <Mirror setOpenMirror={setOpenMirror} />}
      </AnimatePresence>
    </div>
  );
};

export default BathroomInteractions;