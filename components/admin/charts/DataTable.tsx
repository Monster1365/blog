/** 차트 아래 "표로 보기" (모든 값을 툴팁 없이도 볼 수 있게) */
export default function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="viz-table">
      <summary>표로 보기</summary>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={typeof cell === "number" ? "--num" : undefined}>
                    {typeof cell === "number" ? cell.toLocaleString("ko-KR") : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
