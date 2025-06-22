import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <section className="bg-background font-sans min-h-screen flex items-center justify-center">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full sm:w-10/12 md:w-8/12 text-center">
            <div
              className="bg-[url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)] h-[250px] sm:h-[350px] md:h-[400px] bg-center bg-no-repeat bg-contain"
              aria-hidden="true"
            >
              <h1 className="text-center text-foreground text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8">
                OpenYap
              </h1>
            </div>

            <div className="mt-[-50px]">
              <h3 className="text-2xl text-foreground sm:text-3xl font-bold mb-4">
                Look like you're lost
              </h3>
              <p className="mb-6 text-foreground sm:mb-5">
                The conversation you were looking for could not be found.
              </p>

              <Link
                to="/"
                className="my-5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md"
              >
                Start a new chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
