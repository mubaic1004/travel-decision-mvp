#!/usr/bin/env bash
# 把 universe-order（vinext 全栈应用）静态化，产出到 chenmubai.cn 的 public/pipi/universe-order/
# 纯客户端 SPA：esbuild 编译 page.tsx + React，手写 CSS 原样用，系统中文字体，计数器禁用。
set -euo pipefail

SRC="/Users/chenmubai/Documents/胖皮的收纳世界/universe-order"
STAGE="$SRC/.uobuild"                                   # 放项目内，让 esbuild 能解析 node_modules 里的 react
OUT="/Users/chenmubai/初步ai制作/public/pipi/universe-order"

echo "== 1. 准备 staging =="
rm -rf "$STAGE"; mkdir -p "$STAGE"

echo "== 2. 改写 page.tsx（相对资源路径 + 禁用 /api/sales 计数器）=="
node - "$SRC/app/page.tsx" "$STAGE/page.tsx" <<'NODE'
const fs = require("fs");
const [,, inp, outp] = process.argv;
let s = fs.readFileSync(inp, "utf8");
// 绝对资源路径 -> 相对（配合 <base href="/pipi/universe-order/">，有无结尾斜杠都对）
s = s.split('"/categories/').join('"categories/');
s = s.split('"/og-v2.png"').join('"og-v2.png"');
// 禁用跨访客销量计数器（静态站无后端）：GET 直接置空，POST 去掉
s = s.replace(
  'fetch("/api/sales").then((response) => response.json()).then((data: { sales?: Record<string, number> }) => setSales(data.sales ?? {})).catch(() => undefined);',
  'setSales({}); /* sales counter disabled on static host */'
);
s = s.replace(
  'fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category }) }).then((response) => response.json()).then((data: { count?: number }) => { if (typeof data.count === "number") setSales((current) => ({ ...current, [category]: data.count! })); }).catch(() => undefined);',
  '/* sales counter disabled on static host */'
);
// 移除页脚「宇宙总销量 0」块（静态站计数器已禁用，显示 0 无意义）
s = s.split('<div className="sales-trust"><strong>{totalSales}</strong><span>{t.sold}</span><small>{t.realAnonymous}</small></div>').join('');
if (s.includes("/api/sales")) { console.error("WARN: /api/sales 仍残留"); }
if (s.includes('"/categories/') || s.includes('"/og-v2.png"')) { console.error("WARN: 绝对资源路径仍残留"); }
if (s.includes('className="sales-trust"')) { console.error("WARN: 销量块未移除"); }
fs.writeFileSync(outp, s);
console.log("page.tsx 改写完成");
NODE

echo "== 3. 生成入口 main.tsx =="
cat > "$STAGE/main.tsx" <<'EOF'
import { createRoot } from "react-dom/client";
import Home from "./page";
const el = document.getElementById("root");
if (el) createRoot(el).render(<Home />);
EOF

echo "== 4. esbuild 打包 =="
cd "$SRC"
npx --yes esbuild "$STAGE/main.tsx" --bundle --format=esm --minify --jsx=automatic \
  --loader:.tsx=tsx --define:process.env.NODE_ENV='"production"' \
  --outfile="$STAGE/app.js"

echo "== 5. 生成 app.css（系统中文字体 + 手写样式，去掉 tailwind import）=="
{
  cat <<'CSS'
:root{
  --font-sans:"PingFang SC","HarmonyOS Sans SC","Noto Sans SC","Microsoft YaHei",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --font-serif:"Songti SC","Noto Serif SC","Source Han Serif SC","STSong","SimSun",serif;
}
CSS
  grep -v '@import "tailwindcss";' "$SRC/app/globals.css"
} > "$STAGE/app.css"

echo "== 6. 组装输出目录 =="
rm -rf "$OUT"; mkdir -p "$OUT"
cp "$STAGE/app.js" "$OUT/app.js"
cp "$STAGE/app.css" "$OUT/app.css"
# 资源：分类图 + og + favicon
cp -R "$SRC/public/categories" "$OUT/categories"
cp "$SRC/public/og-v2.png" "$OUT/og-v2.png"
cp "$SRC/public/favicon.svg" "$OUT/favicon.svg"

echo "== 7. index.html（<base> + noindex）=="
cat > "$OUT/index.html" <<'EOF'
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <base href="/pipi/universe-order/">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <title>宇宙已接单｜把愿望说清楚，然后放心去生活</title>
  <link rel="icon" href="favicon.svg">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
EOF

echo "== 8. 清理 staging =="
rm -rf "$STAGE"

echo "== 完成。输出： =="
ls -la "$OUT"
du -sh "$OUT"
