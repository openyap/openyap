import { ProfileCard } from "~/components/auth/profile-card";

// TODO: fix this poop

const PlusSVG = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="9" y1="0" x2="9" y2="18" stroke="#374151" strokeWidth="2" strokeLinecap="butt" />
    <line x1="0" y1="9" x2="18" y2="9" stroke="#374151" strokeWidth="2" strokeLinecap="butt" />
  </svg>
);

export const Route = createFileRoute({
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto h-full w-full overscroll-none md:w-1/2">
      <div className="mx-auto flex w-[94%] flex-col gap-y-4 pt-4 pb-36 items-center justify-center">
        <div className="relative w-full max-w-md border-2 border-dotted border-gray-700 p-8 bg-white">
          <span className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 select-none"><PlusSVG /></span>
          <span className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 select-none"><PlusSVG /></span>
          <ProfileCard />
        </div>
      </div>
      <div className="group fixed bottom-0 w-full md:w-1/2 px-2">
        <div className="relative w-full max-w-md mx-auto border-t-2 border-x-2 border-dotted border-gray-700 bg-white">
          <span className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 select-none"><PlusSVG /></span>
          <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 select-none"><PlusSVG /></span>
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full bg-transparent outline-none px-4 py-3 text-gray-900 placeholder-gray-400 rounded-lg"
            aria-label="Chat message input"
          />
        </div>
      </div>
    </div>
  );
}
