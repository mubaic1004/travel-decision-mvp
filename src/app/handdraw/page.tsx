import type { Metadata } from "next";

import { CadTool } from "@/components/cad/cad-tool";

export const metadata: Metadata = {
  title: "手绘转 CAD — chenmubai.cn",
  description:
    "上传手绘工程图，浏览器就地识别成矢量几何并导出 DXF。全程本地处理，图片不上传服务器。",
};

export default function HanddrawPage() {
  return <CadTool />;
}
