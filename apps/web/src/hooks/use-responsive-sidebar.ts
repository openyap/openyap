import * as React from "react";
import { useIsMdScreen, useIsMobile } from "./use-mobile";

export function useResponsiveSidebar(defaultOpen?: boolean) {
  const isMobile = useIsMobile();
  const isMdScreen = useIsMdScreen();

  const responsiveDefaultOpen = React.useMemo(() => {
    if (defaultOpen !== undefined) return defaultOpen;
    if (isMobile) return false;
    return !isMdScreen;
  }, [defaultOpen, isMobile, isMdScreen]);

  const [open, setOpen] = React.useState(responsiveDefaultOpen);

  React.useEffect(() => {
    if (defaultOpen === undefined) {
      setOpen(responsiveDefaultOpen);
    }
  }, [responsiveDefaultOpen, defaultOpen]);

  return {
    open,
    setOpen,
    responsiveDefaultOpen,
  };
}
