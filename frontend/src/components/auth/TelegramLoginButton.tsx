import { useEffect, useRef } from "react";

interface Props {
  botUsername: string;
}

/** Injects the official Telegram Login Widget. Requires the bot's domain to be
 *  registered with @BotFather (/setdomain) and HTTPS — i.e. production.
 *
 *  The widget evaluates `data-onauth` as JavaScript, which our CSP forbids, so it
 *  uses `data-auth-url`: Telegram sends the signed fields to the server, which
 *  checks them, opens the session and returns the reader to this page. */
export function TelegramLoginButton({ botUsername }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const back = `${location.pathname}${location.search}`;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute(
      "data-auth-url",
      `${location.origin}/api/auth/telegram/callback?next=${encodeURIComponent(back)}`,
    );

    const node = ref.current;
    node?.appendChild(script);
    return () => {
      if (node) node.innerHTML = "";
    };
  }, [botUsername]);

  return <div ref={ref} className="flex justify-center" />;
}
