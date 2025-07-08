import type { Tokens } from "marked";
import { TokenBlock } from "./token-block";

type TableBlockProps = {
  token: Tokens.Table;
};

export function TableBlock({ token }: TableBlockProps) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted/50">
            {token.header.map((headerCell) => (
              <th
                key={crypto.randomUUID()}
                className="border border-border px-4 py-2 text-left font-medium"
              >
                {headerCell.tokens.map((subToken) => (
                  <TokenBlock key={subToken.raw} token={subToken} />
                ))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row) => (
            <tr key={crypto.randomUUID()} className="even:bg-muted/25">
              {row.map((cell) => (
                <td
                  key={crypto.randomUUID()}
                  className="border border-border px-4 py-2"
                >
                  {cell.tokens.map((subToken) => (
                    <TokenBlock key={subToken.raw} token={subToken} />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
