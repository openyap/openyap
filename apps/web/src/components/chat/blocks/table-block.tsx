import type { Tokens } from "marked";
import { TokenBlock } from "~/components/chat/blocks/token-block";
import { getTokenKey } from "~/lib/utils";

type TableBlockProps = {
  token: Tokens.Table;
};

export function TableBlock({ token }: TableBlockProps) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted/50">
            {token.header.map((headerCell, colIndex) => (
              <th
                key={`header-${colIndex}-${headerCell.text || JSON.stringify(headerCell)}`}
                className="border border-border px-4 py-2 text-left font-medium"
              >
                {headerCell.tokens.map((subToken, tokenIndex) => (
                  <TokenBlock
                    key={getTokenKey(subToken, tokenIndex)}
                    token={subToken}
                  />
                ))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}-${row.map((c) => c.text || JSON.stringify(c)).join("")}`}
              className="even:bg-muted/25"
            >
              {row.map((cell, colIndex) => (
                <td
                  key={`row-${rowIndex}-col-${colIndex}-${cell.text || JSON.stringify(cell)}`}
                  className="border border-border px-4 py-2"
                >
                  {cell.tokens.map((subToken, tokenIndex) => (
                    <TokenBlock
                      key={getTokenKey(subToken, tokenIndex)}
                      token={subToken}
                    />
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
