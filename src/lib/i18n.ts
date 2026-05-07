import { extractTime, toLocalDate } from "@/lib/travel/utils";
import type { RankedTripOption } from "@/types/travel";

export type Locale = "en" | "zh";

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }),
  zh: new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }),
};

function getCurrencyFormatter(
  locale: Locale,
  fractionDigits: number,
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatDisplayDateForLocale(
  dateString: string,
  locale: Locale,
): string {
  return dateFormatters[locale].format(toLocalDate(dateString));
}

export function formatCurrencyForLocale(
  amount: number,
  locale: Locale,
  fractionDigits = 0,
): string {
  return getCurrencyFormatter(locale, fractionDigits).format(amount);
}

export function formatDaysLabel(value: number, locale: Locale): string {
  return locale === "zh"
    ? `${value} 天`
    : `${value} day${value === 1 ? "" : "s"}`;
}

export function formatHoursLabel(
  value: number,
  locale: Locale,
  fractionDigits = 1,
): string {
  const formatted = value.toFixed(fractionDigits);
  return locale === "zh" ? `${formatted} 小时` : `${formatted} h`;
}

export function formatStopsLabel(stops: number, locale: Locale): string {
  if (locale === "zh") {
    return stops === 0 ? "直飞" : `${stops}次中转`;
  }

  return stops === 0 ? "Direct" : `${stops} stop${stops === 1 ? "" : "s"}`;
}

export function buildFlightSummary(
  option: RankedTripOption,
  locale: Locale,
): string {
  const { flight } = option;
  const outboundSegment = `${extractTime(flight.outboundDeparture)} → ${extractTime(
    flight.outboundArrival,
  )}`;
  const returnSegment = `${extractTime(flight.returnDeparture)} → ${extractTime(
    flight.returnArrival,
  )}`;

  if (locale === "zh") {
    return `${formatStopsLabel(flight.stops, locale)} · 去程 ${outboundSegment} · 返程 ${returnSegment} · 转机 ${flight.layoverHours} 小时 · ${formatCurrencyForLocale(
      flight.flightTotalPrice ?? 0,
      locale,
    )}`;
  }

  return `${formatStopsLabel(flight.stops, locale)} · outbound ${outboundSegment} · return ${returnSegment} · layover ${flight.layoverHours}h · ${formatCurrencyForLocale(
    flight.flightTotalPrice ?? 0,
    locale,
  )}`;
}

export function buildHotelSummary(
  option: RankedTripOption,
  locale: Locale,
): string {
  const { hotel } = option;

  if (locale === "zh") {
    return `${hotel.hotelName} · ${hotel.hotelNights}晚 · 均价 ${formatCurrencyForLocale(
      hotel.hotelAvgPricePerNight ?? 0,
      locale,
    )}/晚 · ${formatCurrencyForLocale(hotel.hotelTotalPrice ?? 0, locale)}`;
  }

  return `${hotel.hotelName} · ${hotel.hotelNights} night${
    hotel.hotelNights === 1 ? "" : "s"
  } · avg ${formatCurrencyForLocale(
    hotel.hotelAvgPricePerNight ?? 0,
    locale,
  )}/night · ${formatCurrencyForLocale(hotel.hotelTotalPrice ?? 0, locale)}`;
}

export const APP_COPY = {
  en: {
    language: {
      label: "Language",
      english: "EN",
      chinese: "中文",
    },
    hero: {
      eyebrow: "You pick the dates — I'll sort the rest.",
      title: "Ready when you are.",
      description:
        "Cheapest trip, fewest days off, or best bang per hour. Three picks, ready when you are.",
      stats: [],
    },
    method: {
      eyebrow: "Method",
      title: "Deliberate rather than exhaustive.",
      description:
        "The experience is designed more like a discreet concierge brief than a search results wall. Each option appears only after the itinerary has met time, comfort, and value standards.",
      steps: [
        {
          title: "Frame departures",
          description:
            "Generate date and leave combinations from the travel window and trip-length range.",
        },
        {
          title: "Remove weak fits",
          description:
            "Generate rule-based flights and hotels, then discard options that violate comfort or timing guardrails.",
        },
        {
          title: "Present three recommendations",
          description:
            "Rank the survivors by total spend, leave usage, and cost per effective play hour.",
        },
      ],
    },
    board: {
      eyebrow: "Results",
      title: "3 options only",
      description: "Ranked by total price, leave days, and cost per effective hour.",
      chips: {
        price: "Cheapest",
        leaveDays: "Least leave",
        effectiveHours: "Best value",
      },
      summaries: [
        {
          label: "Cheapest",
          description:
            "The most economical full trip once flight and hotel are combined.",
        },
        {
          label: "Least Leave",
          description:
            "The itinerary that respects your leave balance before optimizing cost.",
        },
        {
          label: "Best Value",
          description:
            "The strongest ratio between money spent and hours actually enjoyed.",
        },
      ],
      evaluated: (count: number) =>
        `Evaluated ${count} candidate trips.`,
      empty: "Fill in the form and run search.",
    },
    options: {
      cheapest: {
        title: "Cheapest Option",
        subtitle: "Lowest total cost.",
        short: "Cheapest",
      },
      leastLeave: {
        title: "Least Leave Option",
        subtitle: "Fewest leave days.",
        short: "Least Leave",
      },
      bestValue: {
        title: "Best Value Option",
        subtitle: "Lowest cost per effective hour.",
        short: "Best Value",
      },
    },
    states: {
      waitingEyebrow: "Ready",
      errorEyebrow: "Error",
      idleTitle: "Start with the form",
      idleDescription: "Fill in the trip details on the left and run search.",
      emptyTitle: "No matching option",
      emptyDescription:
        "Try wider dates, more leave days, or looser filters.",
      errorTitle: "Search failed",
      errorDescription: "Please try again.",
    },
    form: {
      heroEyebrow: "Input",
      heroTitle: "Tell us your trip rules",
      inventoryBadge: "Shanghai rules",
      heroDescription:
        "Origin, dates, leave limit, trip length, destinations, and flight filters. Current pricing rules cover Shanghai departures.",
      filterChips: {
        redEyeOff: "No red-eye",
        redEyeOn: "Red-eye allowed",
        arriveBy: (time: string) => `Arrive by ${time}`,
        returnAfter: (time: string) => `Return after ${time}`,
        layover: (hours: string) => `Layover <= ${hours}h`,
      },
      snapshots: {
        citiesLabel: "Destinations",
        citiesNote: "",
        windowLabel: "Window",
        windowNote: "",
        leaveLabel: "Leave",
        leaveNote: "",
      },
      primaryActionEyebrow: "",
      primaryActionDescription: "",
      primaryActionButton: "Search",
      primaryActionLoading: "Searching...",
      sections: {
        tripWindow: {
          eyebrow: "Trip",
          title: "Time and leave",
          description: "Set your origin, dates, and leave limit.",
        },
        candidatePool: {
          eyebrow: "Destinations",
          title: "Where do you want to compare?",
          description: "Separate multiple destinations with commas.",
        },
        guardrails: {
          eyebrow: "Filters",
          title: "Flight and timing rules",
          description: "Trips that fail these rules will be removed.",
        },
      },
      fields: {
        originCity: "Origin City",
        dateRangeStart: "Start Date",
        dateRangeEnd: "End Date",
        maxLeaveDays: "Max Leave Days",
        tripLengthMin: "Min Trip Days",
        tripLengthMax: "Max Trip Days",
        destinations: "Destinations",
        maxLayoverHours: "Max Layover (h)",
        latestArrivalTime: "Arrive By",
        earliestReturnTime: "Return After",
      },
      placeholders: {
        originCity: "Shanghai",
        destinations: "Tokyo, Seoul, Singapore",
      },
      destinationsEmpty: "Destinations will appear here.",
      destinationsHint: "Use commas.",
      noRedEye: "Filter out red-eye flights",
      dockEyebrow: "Search",
      dockSummary: (
        destinationCount: number,
        tripLengthMin: string,
        tripLengthMax: string,
        maxLeaveDays: string,
      ) =>
        `${destinationCount} destinations · ${tripLengthMin}-${tripLengthMax} days · up to ${maxLeaveDays} leave days`,
      dockButton: "Search",
      dockLoading: "Searching...",
      validation: {
        originCityRequired: "Origin city is required.",
        dateWindowRequired: "A complete travel date window is required.",
        dateRangeEnd: "End date must be after start date.",
        maxLeaveDays: "Enter a valid leave-day limit.",
        tripLengthMin: "Minimum trip length must be at least 1 day.",
        tripLengthMax: "Maximum trip length must be at least 1 day.",
        tripLengthRange:
          "Maximum trip length must be greater than or equal to minimum.",
        layoverHours: "Layover hours must be 0 or more.",
        latestArrivalTime: "Latest arrival time is required.",
        earliestReturnTime: "Earliest return time is required.",
        destinations: "Add at least one destination.",
        dateWindowTooShort:
          "The date window is shorter than the minimum trip length.",
      },
    },
    card: {
      emptyTitle: "No option",
      emptyDescription:
        "Try wider dates or looser filters.",
      curated: "Selected",
      totalPrice: "Total Price",
      costPerHour: "Cost / Hour",
      depart: "Depart",
      return: "Return",
      leaveDays: "Leave Days",
      tripDays: "Trip Days",
      effectivePlay: "Effective Play",
      travelLens: "Travel Lens",
      flightSummary: "Flight Summary",
      hotelSummary: "Hotel Summary",
    },
    wizard: {
      intro: {
        cards: [
          {
            eyebrow: "Hello",
            title: "I'm your trip planner.",
            description:
              "Tell me when you can travel and where you want to go — I'll work out the rest.",
          },
          {
            eyebrow: "Three angles",
            title: "Cheapest, least leave, best value.",
            description:
              "I run hundreds of date combos and surface the three picks worth comparing.",
          },
          {
            eyebrow: "Ready?",
            title: "A few quick questions.",
            description: "Five short steps. Won't take long.",
          },
        ],
        startButton: "Start →",
      },
      steps: {
        origin: {
          eyebrow: "Step 1 / 5",
          title: "Where are you flying from?",
          description: "City name in English or Chinese — I'll find the airport.",
        },
        destination: {
          eyebrow: "Step 2 / 5",
          title: "Where do you want to go?",
          description: "One city is enough. I'll calculate every date combination.",
        },
        dates: {
          eyebrow: "Step 3 / 5",
          title: "When can you travel?",
          description: "Pick the earliest and latest you could be away.",
        },
        duration: {
          eyebrow: "Step 4 / 5",
          title: "How long, and how much leave?",
          description: "Trip length range and max leave days you'd like to use.",
        },
        preferences: {
          eyebrow: "Step 5 / 5",
          title: "Any flying preferences?",
          description:
            "Optional. Skip if defaults work — I'll filter out red-eye flights and unfriendly schedules.",
        },
      },
      nav: {
        back: "Back",
        next: "Next",
        skip: "Skip",
        submit: "Show me three options",
        loading: "Calculating...",
      },
      progress: (current: number, total: number) => `${current} / ${total}`,
      result: {
        eyebrow: "Three for you",
        title: "Pick the one you like best.",
        replanButton: "Plan again",
      },
    },
  },
  zh: {
    language: {
      label: "语言",
      english: "EN",
      chinese: "中文",
    },
    hero: {
      eyebrow: "你说去哪，我来帮你算清楚",
      title: "想出发，就从这里开始",
      description:
        "最省钱、请假最少、最划算 —— 三个方案摆出来，你挑最顺心的那一个。",
      stats: [],
    },
    method: {
      eyebrow: "筛选方式",
      title: "不是尽量多，而是尽量准。",
      description:
        "整个体验更像一份低调的礼宾顾问简报，而不是铺满页面的搜索结果。每个方案都必须先满足时间、舒适度和价值标准，才会被展示出来。",
      steps: [
        {
          title: "框定可出发日期",
          description:
            "根据可出行时间范围、旅行天数范围和请假限制生成候选日期组合。",
        },
        {
          title: "剔除不合适方案",
          description:
            "基于规则生成航班和酒店价格，并过滤掉不符合舒适度与时间规则的组合。",
        },
        {
          title: "输出三个推荐",
          description:
            "对保留下来的方案按总价、请假天数和每有效小时成本进行排序。",
        },
      ],
    },
    board: {
      eyebrow: "看看哪个合心意",
      title: "三个方案，各有各的好",
      description: "一个最省钱，一个最省假，一个最划算 —— 你挑一个就行。",
      chips: {
        price: "最省钱",
        leaveDays: "最省假",
        effectiveHours: "最划算",
      },
      summaries: [
        {
          label: "最省钱",
          description: "机票和酒店合并后，总成本最低的完整方案。",
        },
        {
          label: "请假最少",
          description: "优先保护你的请假额度，其次再考虑总价。",
        },
        {
          label: "性价比最高",
          description: "把真正能玩的时间算进去之后，每小时成本最低。",
        },
      ],
      evaluated: (count: number) =>
        `帮你看过了 ${count} 种行程组合。`,
      empty: "填完左边，方案就出来了。",
    },
    options: {
      cheapest: {
        title: "钱包最开心",
        subtitle: "加起来花得最少的那个。",
        short: "最省钱",
      },
      leastLeave: {
        title: "假期最舍得",
        subtitle: "几乎不动用你的年假。",
        short: "最省假",
      },
      bestValue: {
        title: "每小时最值",
        subtitle: "把能玩的时间算进去，每小时最划算。",
        short: "最划算",
      },
    },
    states: {
      waitingEyebrow: "等你一下",
      errorEyebrow: "出了点小岔子",
      idleTitle: "先告诉我你想怎么出门",
      idleDescription: "填好左边，我这就给你安排。",
      emptyTitle: "这一轮没找到合适的",
      emptyDescription:
        "要不把日期放宽点，或者多给自己几天假，再试试？",
      errorTitle: "刚才没查成",
      errorDescription: "稍等片刻，再来一次就好。",
    },
    form: {
      heroEyebrow: "随手填几项",
      heroTitle: "说说你想怎么玩",
      inventoryBadge: "上海出发",
      heroDescription:
        "出发地、日期、请假天数、想去哪 —— 都告诉我，剩下的我来想。",
      filterChips: {
        redEyeOff: "不要红眼航班",
        redEyeOn: "允许红眼航班",
        arriveBy: (time: string) => `最晚到达 ${time}`,
        returnAfter: (time: string) => `最早返程 ${time} 之后`,
        layover: (hours: string) => `转机不超过 ${hours} 小时`,
      },
      snapshots: {
        citiesLabel: "目的地",
        citiesNote: "",
        windowLabel: "日期跨度",
        windowNote: "",
        leaveLabel: "请假",
        leaveNote: "",
      },
      primaryActionEyebrow: "",
      primaryActionDescription: "",
      primaryActionButton: "开始搜索",
      primaryActionLoading: "搜索中...",
      sections: {
        tripWindow: {
          eyebrow: "时间 & 假期",
          title: "你打算啥时候出门",
          description: "先说说可出发的日子和能请的假。",
        },
        candidatePool: {
          eyebrow: "心仪目的地",
          title: "这次想去哪",
          description: "填一个城市就行，我帮你把各种日期组合都算一遍。",
        },
        guardrails: {
          eyebrow: "小小讲究",
          title: "航班和时间上的偏好",
          description: "不顺心的航班会自动帮你避开。",
        },
      },
      fields: {
        originCity: "出发城市",
        dateRangeStart: "开始日期",
        dateRangeEnd: "结束日期",
        maxLeaveDays: "最多请假天数",
        tripLengthMin: "最短旅行天数",
        tripLengthMax: "最长旅行天数",
        destinations: "想去的目的地",
        maxLayoverHours: "最大转机时长",
        latestArrivalTime: "最晚到达",
        earliestReturnTime: "最早返程",
      },
      placeholders: {
        originCity: "上海",
        destinations: "东京",
      },
      destinationsEmpty: "这里会显示当前目的地。",
      destinationsHint: "中英文都认，比如「巴厘岛」「Bali」「DPS」。",
      noRedEye: "过滤掉红眼航班",
      dockEyebrow: "搜索",
      dockSummary: (
        destinationCount: number,
        tripLengthMin: string,
        tripLengthMax: string,
        maxLeaveDays: string,
      ) =>
        `${tripLengthMin}-${tripLengthMax} 天 · 最多请假 ${maxLeaveDays} 天${destinationCount > 1 ? ` · ${destinationCount} 个目的地` : ""}`,
      dockButton: "开始搜索",
      dockLoading: "搜索中...",
      validation: {
        originCityRequired: "请填写出发城市。",
        dateWindowRequired: "请完整填写可出行时间范围。",
        dateRangeEnd: "结束日期必须晚于或等于开始日期。",
        maxLeaveDays: "请填写有效的请假天数上限。",
        tripLengthMin: "最短旅行天数至少为 1 天。",
        tripLengthMax: "最长旅行天数至少为 1 天。",
        tripLengthRange: "最长旅行天数必须大于或等于最短旅行天数。",
        layoverHours: "最大转机时长必须大于或等于 0。",
        latestArrivalTime: "请填写最晚到达时间。",
        earliestReturnTime: "请填写最早返程时间。",
        destinations: "请至少填写一个候选目的地。",
        dateWindowTooShort: "当前日期范围短于你设置的最短旅行天数。",
      },
    },
    card: {
      emptyTitle: "当前没有合格方案",
      emptyDescription: "试试放宽日期或筛选条件。",
      curated: "推荐",
      totalPrice: "总价",
      costPerHour: "每有效小时成本",
      depart: "出发日期",
      return: "返回日期",
      leaveDays: "请假天数",
      tripDays: "总旅行天数",
      effectivePlay: "有效旅行时间",
      travelLens: "判断维度",
      flightSummary: "航班摘要",
      hotelSummary: "酒店摘要",
    },
    wizard: {
      intro: {
        cards: [
          {
            eyebrow: "你好",
            title: "我是出发助手。",
            description:
              "告诉我你想什么时候、去哪儿，剩下的我帮你算清楚。",
          },
          {
            eyebrow: "三个角度",
            title: "最省钱、最省假、最划算。",
            description:
              "我会跑一遍上百种日期组合，挑三个真正值得对比的方案。",
          },
          {
            eyebrow: "准备好了吗？",
            title: "几个小问题，慢慢来。",
            description: "总共五步，几分钟搞定。",
          },
        ],
        startButton: "开始 →",
      },
      steps: {
        origin: {
          eyebrow: "第 1 步 / 共 5 步",
          title: "你从哪儿出发？",
          description: "中英文都行，我会帮你找到对应机场。",
        },
        destination: {
          eyebrow: "第 2 步 / 共 5 步",
          title: "想去哪儿？",
          description: "填一个城市就行，我会把不同日期组合都算一遍。",
        },
        dates: {
          eyebrow: "第 3 步 / 共 5 步",
          title: "什么时候可以出发？",
          description: "选一个最早和最晚都能接受的日期。",
        },
        duration: {
          eyebrow: "第 4 步 / 共 5 步",
          title: "想玩几天？最多请几天假？",
          description: "给我一个旅行天数的上下限，再说说能请的最多天数。",
        },
        preferences: {
          eyebrow: "第 5 步 / 共 5 步",
          title: "对航班还有什么讲究？",
          description:
            "这步是可选的。不填也能用默认值帮你避开红眼和不顺心的时间。",
        },
      },
      nav: {
        back: "上一步",
        next: "下一步",
        skip: "跳过",
        submit: "看看三个方案",
        loading: "正在算...",
      },
      progress: (current: number, total: number) => `${current} / ${total}`,
      result: {
        eyebrow: "三个方案，挑一个",
        title: "看看哪个最合心意",
        replanButton: "重新规划一次",
      },
    },
  },
} as const;

export type AppCopy = (typeof APP_COPY)[Locale];

export const LOCALE_OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
];

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "zh";
}
