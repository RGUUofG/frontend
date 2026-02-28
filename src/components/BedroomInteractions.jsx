"use client";

import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import Book from "./Book";
import Safe from "./Safe";
import { useRouter } from "next/navigation";

function BedroomInteractions() {
  const [openBook, setOpenBook] = useState(false);
  const [openSafe, setOpenSafe] = useState(false);
  const router = useRouter();

  // 🔹 所有互动按钮数据化，支持宽高百分比
  const hotspots = [
    {
      id: "book",
      left: 0.37,
      top: 0.67,
      width: 0.12, // 12% 宽
      height: 0.08, // 8% 高
      onClick: () => setOpenBook(true),
    },
    {
      id: "safe",
      left: 0.9,
      top: 0.6,
      width: 0.1,
      height: 0.1,
      onClick: () => setOpenSafe(true),
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
      {hotspots.map((h) => (
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
        {openBook && <Book setOpenBook={setOpenBook} />}
        {openSafe && <Safe setOpenSafe={setOpenSafe} />}
      </AnimatePresence>
    </div>
  );
}

export default BedroomInteractions;
