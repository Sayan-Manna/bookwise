"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { Session } from "next-auth";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { signOut } from "next-auth/react";

const Header = ({ session }: { session: Session }) => {
  const pathname = usePathname();
  return (
    <header className="my-10 flex justify-between gap-5">
      <Link href="/">
        <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
      </Link>

      <ul className=" ">
        <li className="flex items-center gap-8">
          <Link href="/library" className={cn("text-base cursor-pointer capitalize", pathname === "/library" ? "text-light-200" : "text-light-100")}>
            Library
          </Link>
          <Link href="/my-profile" className={cn("text-base cursor-pointer capitalize", pathname === "/my-profile" ? "text-light-200" : "text-light-100")}>
            <Avatar>
              <AvatarFallback className="bg-amber-100 cursor-pointer">{getInitials(session?.user?.name || "CN")}</AvatarFallback>
            </Avatar>
          </Link>
          <Button onClick={() => signOut()}>Logout</Button>
        </li>
      </ul>
    </header>
  );
};

export default Header;
