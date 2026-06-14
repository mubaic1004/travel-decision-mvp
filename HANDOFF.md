# 项目交接文档

写给下一个接手这个项目的 AI agent / 协作者。覆盖必要上下文，让你不用从头摸索就能继续工作。

---

## 1. 项目一句话

**陈慕白的个人站 `chenmubai.cn`**：编辑风首页 + 收纳一组小工具。当前已上线 1 个工具（旅行规划助手）。技术栈 Next.js 15 静态站。
计划长期添加更多"小想法/小工具"作为子页。

- 在线地址（海外节点）：https://travel-decision-mvp.vercel.app
- 在线地址（中国大陆节点）：https://chenmubai.cn （ICP 备案 + 公安备案均已通过）
- GitHub 仓库：https://github.com/mubaic1004/travel-decision-mvp
- 本地目录：`/Users/chenmubai/初步ai制作/`（目录名含中文，但 GitHub 仓库名是英文 `travel-decision-mvp`）

---

## 2. 技术栈

- **Next.js 15.5.15** + App Router
- **React 19** + **TypeScript 5.8.3**
- **Tailwind CSS 3.4.17**（不要升 4.x，Pages 模式没必要）
- **motion** (新版 Framer Motion，已安装)
- **next/font/google**：ZCOOL KuaiLe + Noto Serif SC + Fraunces（italic）
- Node ≥ 20，npm（`.npmrc` 设了 `legacy-peer-deps=true` 兼容 React 19）
- 构建产物：`out/` 目录（`next.config.ts` 开了 `output: "export"`，纯静态）
- **没有**后端，没有数据库，没有用户系统。所有计算在浏览器里跑

---

## 3. 路由 / 关键文件结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局 + 字体加载 + 页脚（含 ICP + 公安备案号）
│   ├── page.tsx            # 首页 → 渲染 <Home/>
│   ├── travel/page.tsx     # 旅行工具 → 渲染 <TravelMvp/>
│   └── globals.css         # 全站样式 + Tailwind 自定义类
├── components/
│   ├── landing/
│   │   ├── home.tsx          # 首页布局 + 入场动画编排
│   │   ├── cursor-follower.tsx  # Aristide 式光标，仅桌面
│   │   ├── live-clock.tsx       # 顶栏右侧的 Shanghai 实时时钟
│   │   └── project-row.tsx      # 项目列表行，含悬停动效 + scroll reveal
│   ├── travel-mvp.tsx      # 向导主容器，状态机（intro/step/result）
│   ├── result-card.tsx     # 三张结果卡渲染
│   ├── state-panel.tsx     # 等待/空/错误状态
│   └── wizard/
│       ├── intro-cards.tsx       # 进入向导前 3 张引导卡
│       ├── wizard-shell.tsx      # 每步的通用外壳（进度条/上下一步按钮）
│       ├── step-origin.tsx       # 第 1 步：出发城市
│       ├── step-destination.tsx  # 第 2 步：目的地
│       ├── step-dates.tsx        # 第 3 步：日期范围
│       ├── step-duration.tsx     # 第 4 步：天数 + 请假
│       ├── step-preferences.tsx  # 第 5 步：航班偏好（可跳过）
│       └── result-screen.tsx     # 最后结果页
├── lib/
│   ├── i18n.ts             # 双语文案 + 格式化工具（zh/en）
│   ├── constants.ts        # 表单默认值（默认 上海 → 北京 / 2026-01-01 至 2026-01-30）
│   ├── travel/
│   │   ├── cities.ts             # 51 个城市元数据 + 大圆距离计算
│   │   ├── matcher.ts            # 路线匹配 + 价格合成（重点）
│   │   ├── candidate-generator.ts # 日期组合生成
│   │   ├── ranker.ts             # 三方案排序
│   │   ├── search.ts             # 总入口 searchTripOptions
│   │   ├── filters.ts            # 过滤红眼/转机/到达/返程
│   │   ├── calculator.ts         # 有效游玩时间计算
│   │   ├── utils.ts              # 时间/哈希工具
│   │   └── pricing-rules.ts      # 仅导入 ../../../pricing-rules.json
│   └── wizard/
│       └── step-validation.ts    # 每步字段级校验（zod-less）
├── types/
│   └── travel.ts           # 全套类型定义
pricing-rules.json          # 50 条 Shanghai 出发的精调路线 + 50 个目的地酒店 + 全套规则
HANDOFF.md                  # 本文档
```

---

## 4. 部署管线（无 CI 脚本，靠平台 Webhook）

`git push` 到 `main` 同时触发两个平台部署，**无需手动操作**：

| 平台 | URL | 受众 | 部署时长 |
|---|---|---|---|
| Vercel | travel-decision-mvp.vercel.app | 海外用户 | 1-2 min |
| EdgeOne Pages | chenmubai.cn / travel-decision-mvp-223wkrbi.edgeone.cool | 中国大陆 | 1-3 min |

两个平台的构建配置都是默认 Next.js 识别 + `output: "export"` 自动跑 `npm run build` → 静态产物 `out/` 上 CDN。

**GitHub 授权**：仓库托管在 `mubaic1004` 个人账号下；两个平台各自做了 GitHub App 授权。

---

## 5. 域名与备案（重要！）

```
域名:   chenmubai.cn （.cn 域名，注册在腾讯云 DNSPod）
工信部 ICP 备案号:   沪ICP备2026019934号
公安联网备案号:       沪公网安备31011502406091号
```

两个备案号已写入 `src/app/layout.tsx` 页脚，**链接指向官方查询页**，符合法规要求。

**腾讯云账号关系（容易踩坑，必须看清）**：
- **账号 A**：最初注册腾讯云、做过 EdgeOne Pages 旧项目 → 已废弃，可不管
- **账号 B**：买了 ¥79 轻量服务器（IP `122.51.246.126`，上海地域）、做了 ICP/公安双备案、买了 chenmubai.cn 域名、当前 EdgeOne Pages 项目部署在此

**所有腾讯云相关运维必须在账号 B 上做**。账号 A 上的 EdgeOne 项目放着不管即可（删不删都行）。

---

## 6. ⚠️ 长期运维（别忘了）

**A. 轻量服务器续费（关键，否则备案被注销）**
- 服务器：¥79/年新人价已用，正常续费 5.5 折约 ¥429/年
- 到期时间：买的时候 1 年期 → 大约 **2027 年 5 月** 到期
- 备案要求**服务器始终保留 ≥ 3 个月有效期**，否则备案被工信部注销
- 到期前 **3 个月**：要么续费这台（¥429/年），要么"接入备案转移"到其他云厂商（阿里云/华为云¥99/年新人价，重新走一遍接入备案流程，可省钱）

**B. HTTPS 证书自动续期**
- EdgeOne Pages 自动签发的 TrustAsia DV 证书，3 个月有效
- 到期前自动续，**不用人工干预**

**C. 公安备案有效期**
- 公安备案号下来后**永久有效**（除非主动注销或长期违规）

---

## 7. 业务逻辑要点

### 价格合成模型（`src/lib/travel/matcher.ts`）

- **50 条精调路线**写死在 `pricing-rules.json`，全部以 Shanghai 为起点
- 其他任意出发地 → 用 `synthesizeRoute()` 即时合成：
  - 国内：`450 + 距离km × 0.5`
  - 东亚/东南亚（< 3500km）：`1800 + 距离 × 0.75`
  - 中长程（3500-7500km）：`2900 + 距离 × 0.65`
  - 跨洲（> 7500km）：`4500 + 距离 × 0.65`
- 一线城市对 1.5 折扣，三线城市 1.18 加价
- 51 个城市的元数据（机场代码、纬经度、城市等级）在 `src/lib/travel/cities.ts`
- 自反路线（origin == destination）自动屏蔽，无效输入返回空

### 向导流程

```
intro → origin → destination → dates → duration → preferences → loading → result
                                                          ↑ 第 5 步可跳过用默认值
```

状态机管在 `travel-mvp.tsx` 顶层 useState `phase`。表单值 `values` 在父组件保留，跨步不丢失。
"重新规划一次"按钮 = `setPhase("origin")`，已填值保留。

---

## 8. 视觉设计语言

**首页 `/`**：编辑风/Aristide Benoist 风
- 字体：Noto Serif SC（中文衬线）+ Fraunces italic（英文斜体强调）
- 配色：石色中性盘（stone-50 → stone-950）+ 大留白
- 动效：motion 库统一缓动 `[0.22, 1, 0.36, 1]`，编排式入场
- Cursor follower（仅桌面，`mix-blend-difference`）

**工具页 `/travel`**：温暖文艺风
- 字体：ZCOOL KuaiLe（圆润中文）+ 系统圆润字
- 配色：米白 + 鼠尾草绿 + 暖金强调
- 渐变标题 `.hero-title-lively`，✈ 飞机伪元素装饰

两种风格刻意做了区分：首页是"门面"，工具页是"功能场景"。

---

## 9. 项目特殊约定

1. **目录名是中文 `初步ai制作`**：路径里包含 Unicode，部分工具（gh CLI）可能行为怪异。**始终用引号包裹路径**
2. **`out/` 已在 `.gitignore`**：构建产物不入 git
3. **没有测试**：没写单元测试或 E2E。如果改了 `matcher.ts` 的价格逻辑，推荐用 `npx tsx <临时脚本>` 跑几组组合验证（之前我写过验证脚本，删了，可仿照重写）
4. **i18n 双语并存**：所有用户可见文案都在 `src/lib/i18n.ts` 的 `APP_COPY.en` / `APP_COPY.zh`，**改一处不要忘了改另一处**
5. **Locale 持久化**：用户选择的语言存在 `localStorage["travel-decision-locale"]`

---

## 10. 待办 / 可选改进

**视觉/交互**：
- 页面过渡动画：点击首页项目 → 跳 `/travel` 时加 fade out/in，目前是硬切
- 暗色模式：风格很适合做深石色版，没做
- 磁吸按钮：cursor follower 靠近可点击元素时轻微吸过去（Aristide 经典效果）
- 移动端"跳过"按钮位置太挤可以再调

**功能/内容**：
- 添加第二个小工具到首页 projects 列表（目前只有 1 个）。结构示意：在 `src/components/landing/home.tsx` 的 `projects` 数组里加一项，新建 `src/app/<工具名>/page.tsx`
- 添加博客功能（如果用户想要）：Markdown 渲染，文章放 `src/content/posts/`
- 旅行工具的"分享结果"功能：当前结果只能截图，可以做个分享链接

**业务**：
- 价格模型可以更精细（按淡旺季动态调整）
- 增加更多城市（目前 51，全球大概还能补 20-30 个热门）
- 加入实时航班/酒店 API 集成（如果有预算的话）

---

## 11. 本地开发与验证

```bash
cd "/Users/chenmubai/初步ai制作"

# 开发
npm install
npm run dev   # http://localhost:3000

# 类型检查
npm run check

# 生产构建（必须能通过，否则 Vercel/EdgeOne 也会失败）
npm run build
```

**改完代码的标准动作**：
```bash
npm run build        # 必须 0 error
git add -A
git commit -m "..."
git push             # 自动触发 Vercel + EdgeOne 双部署
```

部署后验证：
```bash
curl -sI https://travel-decision-mvp.vercel.app   # 海外节点
curl -sI https://chenmubai.cn                      # 国内节点
```

---

## 12. 已知坑 / 历史教训

1. **Next.js 安全漏洞**：之前用 15.2.4 被 Vercel 拒绝构建（CVE-2025-66478）。升到 15.5.15 修复。**别降级**
2. **`out/` 一开始没在 .gitignore**：被误提交了一次，后来才修。检查 .gitignore 别再丢
3. **localhost HTTPS 不行**：`http://localhost:3000` 可以 curl，加 https 不行。验证生产用真实 URL
4. **gh CLI 凭证**：用 `gh auth setup-git` 配过，git push 直接走。如果遇到 401，重新登录 gh
5. **EdgeOne 默认域名 `.cool` 后缀**：是境外节点，对国内用户提速有限。**真正的国内加速来自绑定备案后的 chenmubai.cn**
6. **公安备案接入商深圳找不到腾讯**：要切到北京/海淀，选 "腾讯云计算（北京）有限责任公司"。这是经验
7. **API_KEY 写在 `~/.claude.json`**：21st-dev/magic MCP 的 key 存在用户家目录，不要往 git 推

---

## 13. 联系信息

- **GitHub**: mubaic1004
- **本机用户**: chenmubai
- **邮箱**：（用户自己的邮箱，在腾讯云账号 B 里）

写于 2026-06-13（landing 重设计完成日）
