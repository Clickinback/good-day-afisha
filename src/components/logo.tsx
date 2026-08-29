import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Good Day Афиша">
      <Image src="/brand/good-day-logo.png" alt="" width={46} height={46} priority />
      <span>
        <b>GOOD DAY</b>
        <small>АФИША</small>
      </span>
    </Link>
  );
}
