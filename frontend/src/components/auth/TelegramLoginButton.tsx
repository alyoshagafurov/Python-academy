import { useEffect, useRef } from "react";

interface Props {
  botUsername: string;
  onAuth: (user: Record<string, unknown>) => void;
}

/** Injects the official Telegram Login Widget. Requires the bot's domain to be
 *  registered with @BotFather (/setdomain) and HTTPS — i.e. production. */
export function TelegramLoginButton({ botUsername, onAuth }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as unknown as { onTelegramAuth?: (u: Record<string, unknown>) => void }).onTelegramAuth =
      onAuth;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    const node = ref.current;
    node?.appendChild(script);
    return () => {
      if (node) node.innerHTML = "";
    };
  }, [botUsername, onAuth]);

  return <div ref={ref} className="flex justify-center" />;
}
