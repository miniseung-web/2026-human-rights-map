export const CONTENT_VERSION = "2026-08-26-v3-village";

export const ZONES = {
  freedom: {
    label: "자유마을",
    full: "자유롭게 살 권리",
    icon: "🕊️",
    target: 5,
    color: "sky",
    description: "내 생각과 삶을 스스로 선택하는 데 필요한 권리를 찾아요."
  },
  safe: {
    label: "안전마을",
    full: "차별받지 않고 안전하게 살 권리",
    icon: "🛡️",
    target: 5,
    color: "pink",
    description: "누구나 존중받고 생명과 몸을 안전하게 보호받아야 해요."
  },
  dignity: {
    label: "생활마을",
    full: "인간답게 생활할 권리",
    icon: "🏠",
    target: 6,
    color: "yellow",
    description: "배우고, 일하고, 쉬고, 생활하는 데 필요한 권리를 찾아요."
  },
  together: {
    label: "세계마을",
    full: "함께 살아가기 위한 권리",
    icon: "🌏",
    target: 4,
    color: "mint",
    description: "한 사람이나 한 나라의 힘만으로 해결하기 어려운 문제를 함께 살펴봐요."
  }
};

export const DEFAULT_MESSAGES = {
  firstWrong: [
    "음… 사건의 핵심 단서를 한 번 더 찾아볼까? 🔎",
    "아깝다! 어떤 권리가 가장 직접적으로 필요한지 다시 생각해 보자.",
    "괜찮아! 마을 주민의 입장에서 다시 읽어보면 보여요.",
    "한 번 더 도전! 이 사건에서 가장 먼저 지켜져야 할 것은 뭘까?"
  ],
  secondWrong: "괜찮아! 이제 새로운 인권 배지를 하나 배웠어. 🌱",
  correct: [
    "정답! 배지 발견 ✨",
    "딩동댕! 이 권리 맞아!",
    "멋져! 사건 해결!",
    "좋아! 인권 배지를 획득했어!"
  ]
};

export const DEFAULT_QUESTIONS = [
  {id:"q01",zone:"freedom",difficulty:"easy",location:"SNS 광장",emoji:"💬",right:"표현의 자유",
   situation:"민호는 학교 정책에 대한 자신의 생각을 인터넷에 올렸다. 그런데 비판적인 의견을 말했다는 이유만으로 글을 삭제하라는 명령을 받았다.",
   wrong:["종교·양심의 자유","사생활을 보호받을 권리","정치에 참여할 권리"],
   explanation:"자신의 생각과 의견을 자유롭게 표현할 수 있어야 해요."},
  {id:"q02",zone:"freedom",difficulty:"normal",location:"마음의 방",emoji:"🕯️",right:"종교·양심의 자유",
   situation:"지우는 특정 종교를 믿고 싶지 않다고 말했다. 하지만 주변 사람들은 원하지 않는 종교 행사에 반드시 참여하라고 강요했다.",
   wrong:["표현의 자유","사생활을 보호받을 권리","평화롭게 모이고 단체를 만들 자유"],
   explanation:"어떤 종교를 믿거나 믿지 않을지는 스스로 결정할 수 있어야 해요."},
  {id:"q03",zone:"freedom",difficulty:"easy",location:"나의 방",emoji:"🔒",right:"사생활을 보호받을 권리",
   situation:"친구가 수빈이의 허락 없이 휴대전화 메시지를 몰래 읽고 단체 채팅방에 공개했다.",
   wrong:["표현의 자유","정치에 참여할 권리","종교·양심의 자유"],
   explanation:"개인의 대화와 개인정보, 사적인 생활은 함부로 침해해서는 안 돼요."},
  {id:"q04",zone:"freedom",difficulty:"normal",location:"평화광장",emoji:"📣",right:"평화롭게 모이고 단체를 만들 자유",
   situation:"주민들이 공원 보존에 대한 의견을 알리기 위해 평화로운 모임을 열려고 했지만, 아무 이유 없이 모이는 것 자체를 금지당했다.",
   wrong:["표현의 자유","정치에 참여할 권리","종교·양심의 자유"],
   explanation:"사람들은 평화롭게 모이고 공동의 목적을 위한 단체를 만들 수 있어요."},
  {id:"q05",zone:"freedom",difficulty:"normal",location:"투표소",emoji:"🗳️",right:"정치에 참여할 권리",
   situation:"선거가 열렸지만 특정 집단의 사람들에게만 투표하거나 후보로 나설 기회를 주지 않았다.",
   wrong:["표현의 자유","평화롭게 모이고 단체를 만들 자유","사생활을 보호받을 권리"],
   explanation:"사회의 중요한 결정에 참여할 기회는 공정하게 보장되어야 해요."},

  {id:"q06",zone:"safe",difficulty:"easy",location:"놀이공원",emoji:"🎡",right:"차별받지 않을 권리",
   situation:"놀이공원에서 같은 조건의 손님인데도 장애가 있다는 이유만으로 특정 시설의 이용을 거부당했다.",
   wrong:["법 앞에서 평등하게 보호받을 권리","생명과 신체의 안전을 보호받을 권리","강제로 붙잡히거나 갇히지 않을 권리"],
   explanation:"성별, 장애, 인종, 출신 등의 이유로 부당하게 다르게 대우해서는 안 돼요."},
  {id:"q07",zone:"safe",difficulty:"easy",location:"안전센터",emoji:"❤️‍🩹",right:"생명과 신체의 안전을 보호받을 권리",
   situation:"무장한 사람들이 아무런 잘못이 없는 주민들에게 계속 생명의 위협을 가하며 안전하게 생활할 수 없게 했다.",
   wrong:["차별받지 않을 권리","강제로 붙잡히거나 갇히지 않을 권리","법 앞에서 평등하게 보호받을 권리"],
   explanation:"누구나 생명과 신체의 안전을 보호받으며 살아갈 수 있어야 해요."},
  {id:"q08",zone:"safe",difficulty:"normal",location:"경찰서",emoji:"🚓",right:"강제로 붙잡히거나 갇히지 않을 권리",
   situation:"경찰이 아무런 이유도 알려 주지 않고 한 사람을 붙잡아 며칠 동안 밖으로 나가지 못하게 했다.",
   wrong:["차별받지 않을 권리","고문이나 잔혹한 대우를 받지 않을 권리","법 앞에서 평등하게 보호받을 권리"],
   explanation:"정당한 이유와 절차 없이 사람을 마음대로 체포하거나 가둘 수 없어요."},
  {id:"q09",zone:"safe",difficulty:"normal",location:"수사실",emoji:"🚫",right:"고문이나 잔혹한 대우를 받지 않을 권리",
   situation:"수사관이 자백을 받아내려고 사람을 때리고, 잠을 자지 못하게 하며 심한 고통을 주었다.",
   wrong:["생명과 신체의 안전을 보호받을 권리","강제로 붙잡히거나 갇히지 않을 권리","법 앞에서 평등하게 보호받을 권리"],
   explanation:"어떤 이유로도 사람에게 고문이나 잔혹한 대우를 해서는 안 돼요."},
  {id:"q10",zone:"safe",difficulty:"normal",location:"법원",emoji:"⚖️",right:"법 앞에서 평등하게 보호받을 권리",
   situation:"두 사람이 똑같은 잘못을 했는데 한 사람은 힘 있는 집안이라는 이유로 처벌받지 않고 다른 사람만 처벌받았다.",
   wrong:["차별받지 않을 권리","생명과 신체의 안전을 보호받을 권리","강제로 붙잡히거나 갇히지 않을 권리"],
   explanation:"누구나 법 앞에서 동등하게 보호받고 대우받아야 해요."},

  {id:"q11",zone:"dignity",difficulty:"easy",location:"학교",emoji:"🏫",right:"교육받을 권리",
   situation:"유나는 공부를 계속하고 싶지만 집안 형편이 어렵다는 이유로 학교에 다닐 기회를 전혀 얻지 못하고 있다.",
   wrong:["휴식할 권리","문화생활에 참여할 권리","사회보장과 필요한 도움을 받을 권리"],
   explanation:"경제적 형편 때문에 기본적인 교육의 기회에서 배제되어서는 안 돼요."},
  {id:"q12",zone:"dignity",difficulty:"normal",location:"일터",emoji:"🧰",right:"일하고 정당한 대우를 받을 권리",
   situation:"준호는 매일 일을 하지만 약속한 임금을 받지 못하고 위험한 작업도 계속 강요받고 있다.",
   wrong:["교육받을 권리","휴식할 권리","문화생활에 참여할 권리"],
   explanation:"일할 기회뿐 아니라 안전하고 공정한 노동 조건과 정당한 보수도 중요해요."},
  {id:"q13",zone:"dignity",difficulty:"easy",location:"쉼터",emoji:"🛌",right:"휴식할 권리",
   situation:"한 노동자는 매일 새벽부터 밤늦게까지 일하고 쉬는 날도, 충분히 잠잘 시간도 전혀 보장받지 못한다.",
   wrong:["교육받을 권리","문화생활에 참여할 권리","사회보장과 필요한 도움을 받을 권리"],
   explanation:"인간답게 살아가기 위해서는 일뿐 아니라 충분한 휴식도 필요해요."},
  {id:"q14",zone:"dignity",difficulty:"normal",location:"복지센터",emoji:"🤝",right:"사회보장과 필요한 도움을 받을 권리",
   situation:"갑작스러운 사고로 일을 할 수 없게 된 사람이 수입도 없고 생활을 유지할 어떠한 사회적 도움도 받을 수 없다.",
   wrong:["휴식할 권리","교육받을 권리","건강·주거를 포함해 인간다운 생활을 할 권리"],
   explanation:"질병, 실업, 장애, 노령 등으로 생활이 어려워졌을 때 필요한 보호와 도움을 받을 수 있어야 해요."},
  {id:"q15",zone:"dignity",difficulty:"normal",location:"집과 병원",emoji:"🏥",right:"건강·주거를 포함해 인간다운 생활을 할 권리",
   situation:"한 가족은 먹을 것이 부족하고 안전하게 잠잘 집도 없으며, 아파도 기본적인 치료조차 받기 어려운 상태에서 생활한다.",
   wrong:["사회보장과 필요한 도움을 받을 권리","휴식할 권리","문화생활에 참여할 권리"],
   explanation:"음식, 주거, 의료처럼 기본적인 생활 조건이 보장되어야 인간답게 살 수 있어요."},
  {id:"q16",zone:"dignity",difficulty:"easy",location:"문화공간",emoji:"🎨",right:"문화생활에 참여할 권리",
   situation:"수진이는 공연과 전시를 보고 싶지만, 사는 지역에는 이용할 수 있는 도서관이나 문화시설이 거의 없고 교통도 불편해 문화생활에 참여하기가 매우 어렵다.",
   wrong:["교육받을 권리","휴식할 권리","사회보장과 필요한 도움을 받을 권리"],
   explanation:"누구나 문화와 예술을 즐기고 문화생활에 참여할 기회를 누릴 수 있어야 해요."},

  {id:"q17",zone:"together",difficulty:"easy",location:"지구의 숲",emoji:"🌳",right:"깨끗하고 건강한 환경에서 살 권리",
   situation:"공장이 폐수를 계속 흘려보내 주민들이 오염된 물을 마시고 심하게 오염된 공기 속에서 생활하게 되었다.",
   wrong:["평화롭게 살아갈 권리","재난과 위기에서 도움을 받을 권리","국제적 연대와 협력을 통해 인권을 보장받을 권리"],
   explanation:"사람은 건강하고 쾌적한 환경에서 살아갈 수 있어야 해요."},
  {id:"q18",zone:"together",difficulty:"easy",location:"평화광장",emoji:"🕊️",right:"평화롭게 살아갈 권리",
   situation:"전쟁이 계속되면서 주민들은 언제 폭격을 당할지 몰라 매일 두려움 속에서 생활하고 있다.",
   wrong:["깨끗하고 건강한 환경에서 살 권리","재난과 위기에서 도움을 받을 권리","국제적 연대와 협력을 통해 인권을 보장받을 권리"],
   explanation:"전쟁과 폭력의 위협 없이 평화로운 환경에서 살아가는 것도 중요해요."},
  {id:"q19",zone:"together",difficulty:"normal",location:"재난지역",emoji:"⛑️",right:"재난과 위기에서 도움을 받을 권리",
   situation:"큰 지진이 발생해 많은 사람들이 집을 잃고 다쳤다. 피해를 입은 사람들은 안전한 대피 장소와 식량, 의약품, 구조 지원이 꼭 필요한 상황이다.",
   wrong:["깨끗하고 건강한 환경에서 살 권리","평화롭게 살아갈 권리","국제적 연대와 협력을 통해 인권을 보장받을 권리"],
   explanation:"재난이나 큰 위기가 닥쳤을 때 누구나 필요한 구조와 도움을 받을 수 있어야 해요."},
  {id:"q20",zone:"together",difficulty:"normal",location:"해외구호센터",emoji:"🌐",right:"국제적 연대와 협력을 통해 인권을 보장받을 권리",
   situation:"전쟁과 기근으로 어려움을 겪는 나라에 여러 나라와 국제기구가 식량, 의료, 교육 지원을 함께 제공했다.",
   wrong:["깨끗하고 건강한 환경에서 살 권리","평화롭게 살아갈 권리","재난과 위기에서 도움을 받을 권리"],
   explanation:"어떤 인권 문제는 한 나라만의 힘으로 해결하기 어려워서, 세계 여러 나라가 함께 협력해야 해요."}
];
