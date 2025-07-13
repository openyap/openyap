import { useEffect, useRef, useState } from "react";

export function useChatScroll() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
      setShowScrollButton(!isAtBottom);
    };

    const handleScroll = () => {
      checkScrollPosition();
    };

    container.addEventListener("scroll", handleScroll);

    const observer = new MutationObserver(() => {
      setTimeout(checkScrollPosition, 0);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    checkScrollPosition();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  return {
    messagesContainerRef,
    bottomRef,
    showScrollButton,
    scrollToBottom,
  };
}
