const MY_SITE = 'https://my.ozcodingschool.site'

export const ROUTES = {
  HOME: MY_SITE,

  AUTH: {
    LOGIN: `${MY_SITE}/login`,
  },

  SIGNUP: {
    SELECT: `${MY_SITE}/signup`,
    FORM: `${MY_SITE}/signup`,
  },

  MYPAGE: {
    HOME: `${MY_SITE}/mypage`,
    EDIT: `${MY_SITE}/mypage/edit`,
    CHANGE_PASSWORD: `${MY_SITE}/mypage/change-password`,
    QUIZ: `${MY_SITE}/mypage/quiz`,
  },

  QUIZ: {
    EXAM: `${MY_SITE}/quiz`,
    RESULT: `${MY_SITE}/quiz/result`,
  },

  QNA: {
    LIST: 'https://qna.ozcodingschool.site',
    WRITE: 'https://qna.ozcodingschool.site/write',
    DETAIL: 'https://qna.ozcodingschool.site',
    EDIT: 'https://qna.ozcodingschool.site',
  },

  COMMUNITY: {
    LIST: '/community',
    WRITE: '/community/write',
    DETAIL: '/community/:postId',
    EDIT: '/community/:postId/edit',
  },
} as const
