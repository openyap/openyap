import type { Tokens } from "marked";
import { TokenBlock } from "~/components/chat/blocks/token-block";
import { getTokenKey } from "~/lib/utils";

type TableBlockProps = {
  token: Tokens.Table;
};

export function TableBlock({ token }: TableBlockProps) {
  const getAlignmentClass = (align: "center" | "left" | "right" | null) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className="my-1 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted/50">
            {token.header.map((headerCell, colIndex) => {
              const alignment = token.align[colIndex] || headerCell.align;
              return (
                <th
                  key={`header-${colIndex}-${headerCell.text || JSON.stringify(headerCell)}`}
                  className={`border border-border px-4 py-2 font-medium ${getAlignmentClass(alignment)}`}
                >
                  {headerCell.tokens.map((subToken, tokenIndex) => (
                    <TokenBlock
                      key={getTokenKey(subToken, tokenIndex)}
                      token={subToken}
                    />
                  ))}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}-${row.map((c) => c.text || JSON.stringify(c)).join("")}`}
              className="even:bg-muted/25"
            >
              {row.map((cell, colIndex) => {
                const alignment = token.align[colIndex] || cell.align;
                return (
                  <td
                    key={`row-${rowIndex}-col-${colIndex}-${cell.text || JSON.stringify(cell)}`}
                    className={`border border-border px-4 py-2 ${getAlignmentClass(alignment)}`}
                  >
                    {cell.tokens.map((subToken, tokenIndex) => (
                      <TokenBlock
                        key={getTokenKey(subToken, tokenIndex)}
                        token={subToken}
                      />
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
