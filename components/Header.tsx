"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavItem = { name: string; href: string };

const DESKTOP_WIDTH = 1024;
const DETACH_POINT = 576 + 60; // 이 위치를 지나 스크롤하면 헤더를 상단에 고정
const HIDE_SHOW_OFFSET = 6; // 이 값 이상 스크롤해야 헤더를 숨기거나 보임

/**
 * Sleek 테마 헤더 (jQuery 스크립트를 React로 옮김)
 * - 모바일: 햄버거 버튼으로 메뉴 열고 닫기
 * - 데스크톱: 아래로 스크롤하면 숨기고 위로 스크롤하면 다시 보이기
 */
export default function Header({
  title,
  navigation,
}: {
  title: string;
  navigation: readonly NavItem[];
}) {
  // usePathname()을 쓰지 않습니다: 주소를 미리 알 수 없는 페이지(관리 페이지 등)의
  // 정적 렌더링을 막기 때문입니다. 모바일 메뉴는 링크를 누를 때 닫습니다.
  const [open, setOpen] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let previousScroll = window.scrollY;

    const onScroll = () => {
      const current = window.scrollY;

      if (window.innerWidth < DESKTOP_WIDTH) {
        setFixed(true);
        setHidden(false);
        previousScroll = current;
        return;
      }

      const navHeight = headerRef.current?.offsetHeight ?? 60;
      if (current > navHeight) {
        if (current > DETACH_POINT) setFixed(true);
        if (Math.abs(current - previousScroll) >= HIDE_SHOW_OFFSET) {
          setHidden(current > previousScroll);
        }
      } else if (current <= 0) {
        setFixed(false);
        setHidden(false);
      }

      // 페이지 맨 아래에서는 항상 보이기
      if (window.innerHeight + current >= document.body.offsetHeight) {
        setHidden(false);
      }
      previousScroll = current;
    };

    const onResize = () => {
      setHidden(false);
      setOpen(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const className = ["header", fixed && "fix-nav", hidden && "hide-nav"]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header ref={headerRef} className={className} aria-label="Main navigation">
        <div className="container">
          <div className="header__inner">
            <Link className="header__logo" href="/">
              <span className="header__logo--text">{title}</span>
            </Link>
            <nav id="site-nav" className={`header__links${open ? " js--open" : ""}`}>
              <div className="container header__links-wrapper">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    className="header__link"
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <button
              type="button"
              className={`header__toggle${open ? " --open" : ""}`}
              aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={open}
              aria-controls="site-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="header__overlay --open" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
