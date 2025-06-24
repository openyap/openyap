import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full text-center sm:w-10/12 md:w-8/12">
            <div
              className="h-[250px] bg-[url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)] bg-center bg-contain bg-no-repeat sm:h-[350px] md:h-[400px]"
              aria-hidden="true"
            >
              <h1 className="pt-6 text-center text-6xl text-foreground sm:pt-8 sm:text-7xl md:text-8xl">
                OpenYap
              </h1>
            </div>

            <div className="mt-[-50px]">
              <h3 className="mb-4 font-bold text-2xl text-foreground sm:text-3xl">
                Look like you're lost
              </h3>
              <p className="mb-6 text-foreground sm:mb-5">
                The conversation you were looking for could not be found.
              </p>

              <Link
                to="/"
                className="my-5 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
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
