"use client";

import { usePathname } from "next/navigation";
import Rabbits from "@/components/Rabbits";

export default function RabbitWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const showRabbits =
    pathname === "/" ||
    pathname.startsWith("/vault") ||
    pathname.startsWith("/promise");

  return (
    <>
      {children}
      {showRabbits && <Rabbits />}
    </>
  );
}
