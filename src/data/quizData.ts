// ====================================================
// 직업 연계 퀴즈 더미 데이터 — data/quizData.ts
//
// [구조]
//   직업 1개당 QuizQuestion 3개 (4지선다)
//   난이도: 초등 고학년 기준
//
// [확장 방법]
//   QUIZ_DATA 배열에 OccupationQuizData 항목 추가
//   occupationId는 직업 상세 페이지 params.id와 일치시킬 것
// ====================================================

export interface QuizQuestion {
  id:           string;
  question:     string;
  options:      string[];
  correctIndex: number;
  explanation:  string;
}

export interface OccupationQuizData {
  occupationId:   string;
  occupationName: string;
  questions:      QuizQuestion[];
}

export const QUIZ_DATA: OccupationQuizData[] = [
  // ── 역사학자 ──────────────────────────────────────────────────
  {
    occupationId:   "historian",
    occupationName: "역사학자",
    questions: [
      {
        id:           "historian-1",
        question:     "역사학자가 주로 하는 일로 알맞지 않은 것은 무엇일까요?",
        options: [
          "오래된 문서와 유물을 조사해요",
          "과거의 사건과 문화를 연구해요",
          "역사책과 논문을 써요",
          "새로운 컴퓨터 소프트웨어를 개발해요",
        ],
        correctIndex: 3,
        explanation:
          "역사학자는 과거의 사건, 사람들의 삶, 문화 등을 연구하고 기록하는 일을 해요. " +
          "소프트웨어 개발은 컴퓨터 공학자나 개발자가 하는 일이에요.",
      },
      {
        id:           "historian-2",
        question:     "조선시대의 역사를 날마다 기록한 책으로, 유네스코 세계기록유산에 등재된 것은?",
        options: [
          "삼국유사",
          "조선왕조실록",
          "동의보감",
          "훈민정음 해례본",
        ],
        correctIndex: 1,
        explanation:
          "조선왕조실록은 조선시대 472년간 왕의 행동과 나라의 일을 날마다 기록한 책이에요. " +
          "세계에서 가장 오래되고 방대한 왕조 역사서 중 하나로 유네스코 세계기록유산이에요.",
      },
      {
        id:           "historian-3",
        question:     "역사학자에게 가장 중요한 능력은 무엇일까요?",
        options: [
          "빠른 달리기 능력",
          "문서와 자료를 꼼꼼히 분석하는 능력",
          "큰 소리로 노래하는 능력",
          "높은 건물을 설계하는 능력",
        ],
        correctIndex: 1,
        explanation:
          "역사학자는 오래된 문서, 유물, 기록들을 꼼꼼하게 분석하고 해석하는 능력이 가장 중요해요. " +
          "과거의 사실을 정확하게 파악하려면 자료 분석력이 핵심이에요.",
      },
    ],
  },

  // ── 수의사 ────────────────────────────────────────────────────
  {
    occupationId:   "veterinarian",
    occupationName: "수의사",
    questions: [
      {
        id:           "vet-1",
        question:     "수의사가 하는 일로 알맞은 것은?",
        options: [
          "사람의 이를 치료해요",
          "동물을 진찰하고 치료해요",
          "집을 설계하고 지어요",
          "바다에서 물고기를 잡아요",
        ],
        correctIndex: 1,
        explanation:
          "수의사는 동물을 진찰하고 아픈 동물을 치료하는 일을 해요. " +
          "반려동물뿐만 아니라 농장 동물, 야생 동물, 동물원 동물도 돌봐요.",
      },
      {
        id:           "vet-2",
        question:     "수의사가 되려면 어떤 과정이 필요할까요?",
        options: [
          "법학과에서 공부하면 돼요",
          "수학만 잘하면 바로 될 수 있어요",
          "수의학과(6년)를 졸업하고 국가시험에 합격해야 해요",
          "요리학교를 졸업하면 돼요",
        ],
        correctIndex: 2,
        explanation:
          "수의사가 되려면 수의학과(6년제)를 졸업하고 수의사 국가시험에 합격해야 해요. " +
          "동물의 몸 구조, 질병, 치료 방법 등을 6년간 깊이 배워요.",
      },
      {
        id:           "vet-3",
        question:     "수의사에게 필요한 성격으로 알맞지 않은 것은?",
        options: [
          "동물을 사랑하는 마음",
          "꼼꼼하고 신중한 성격",
          "동물이 무서워서 항상 피하는 성격",
          "어려운 상황에서도 침착한 성격",
        ],
        correctIndex: 2,
        explanation:
          "수의사는 동물을 사랑하고 가까이에서 돌봐야 해요. " +
          "동물을 무서워하거나 피한다면 치료하기 어려울 수 있어요. " +
          "용기 있게 동물과 친해지는 마음이 필요해요.",
      },
    ],
  },
];
