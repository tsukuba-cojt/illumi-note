export const projects = [
  {
    id: 'p1',
    name: '舞台A公演2025',
    updatedAt: '最終更新: 2025-11-20',
    scenes: [
      {
        id: 's1',
        time: '00:00',
        sceneName: 'SCENE 1',
        lighting: ['SS 30%', 'ホリ', 'ピンスポットライト'],
        memo: '本公演に向けた照明プランの検討用シーンです。',
        members: [
          { id: 'm1', name: '山田 太郎' },
          { id: 'm2', name: '佐藤 花子' },
          { id: 'm3', name: '鈴木 健' },
        ],
      },
      {
        id: 's2',
        time: '00:30',
        sceneName: 'SCENE 2',
        lighting: ['SS 40%', 'ホリ', 'ピンスポットライト'],
        memo: '本編序盤のシーン。キャストの動きに合わせたライティング。',
        members: [
          { id: 'm1', name: '山田 太郎' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
      {
        id: 's3',
        time: '01:00',
        sceneName: 'SCENE 3',
        lighting: ['SS 35%', 'ホリ', 'ピンスポットライト'],
        memo: '中盤の静かなシーン。落ち着いた色味で演出。',
        members: [
          { id: 'm1', name: '山田 太郎' },
          { id: 'm5', name: '小林 陽子' },
        ],
      },
      {
        id: 's4',
        time: '01:30',
        sceneName: 'FINALE',
        lighting: ['SS 60%', 'ホリ', 'ピンスポットライト'],
        memo: 'カーテンコール用のフィナーレシーン。会場全体を明るく照らす。',
        members: [
          { id: 'm1', name: '山田 太郎' },
          { id: 'm2', name: '佐藤 花子' },
        ],
      },
    ],
  },
  {
    id: 'p2',
    name: '文化祭ステージ',
    updatedAt: '最終更新: 2025-10-05',
    scenes: [
      {
        id: 's1',
        time: '00:10',
        sceneName: 'SCENE 1',
        lighting: ['SS 40%', 'ホリ', 'ピンスポットライト'],
        memo: '文化祭オープニングの一場面。生徒会挨拶を想定。',
        members: [
          { id: 'm1', name: '山田 太郎' },
          { id: 'm3', name: '鈴木 健' },
        ],
      },
      {
        id: 's2',
        time: '00:20',
        sceneName: 'SCENE 2',
        lighting: ['SS 45%', 'ホリ', 'ピンスポットライト'],
        memo: '各クラス紹介シーン。客席側も少し明るめに。',
        members: [
          { id: 'm1', name: '山田 太郎' },
          { id: 'm3', name: '鈴木 健' },
        ],
      },
      {
        id: 's3',
        time: '00:35',
        sceneName: 'CLOSING',
        lighting: ['SS 35%', 'ホリ', 'ピンスポットライト'],
        memo: 'エンディング挨拶用シーン。写真撮影も想定。',
        members: [
          { id: 'm1', name: '山田 太郎' },
          { id: 'm3', name: '鈴木 健' },
        ],
      },
    ],
  },
  {
    id: 'p3',
    name: '照明テストプロジェクト',
    updatedAt: '最終更新: 2025-09-12',
    scenes: [
      {
        id: 's1',
        time: '00:00',
        sceneName: 'TEST 1',
        lighting: ['SS 10%', 'ホリ', 'ピンスポットライト'],
        memo: '色味テスト用のシーン。配色の印象を比較する。',
        members: [
          { id: 'm2', name: '佐藤 花子' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
      {
        id: 's2',
        time: '00:10',
        sceneName: 'TEST 2',
        lighting: ['SS 20%', 'ホリ', 'ピンスポットライト'],
        memo: '補色の組み合わせテスト。舞台奥の見え方を確認。',
        members: [
          { id: 'm2', name: '佐藤 花子' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
      {
        id: 's3',
        time: '00:20',
        sceneName: 'TEST 3',
        lighting: ['SS 15%', 'ホリ', 'ピンスポットライト'],
        memo: '暗転直前のレベル確認。トランジションも含めて検証。',
        members: [
          { id: 'm2', name: '佐藤 花子' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
    ],
  },
  {
    id: 'p4',
    name: '演劇部 本公演',
    updatedAt: '最終更新: 2025-08-30',
    scenes: [
      {
        id: 's1',
        time: '00:30',
        sceneName: 'SCENE 3',
        lighting: ['SS 25%', 'ホリ', 'ピンスポットライト'],
        memo: 'クライマックスのシーン。役者の表情がしっかり見えるように。',
        members: [
          { id: 'm5', name: '小林 陽子' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
      {
        id: 's2',
        time: '00:10',
        sceneName: 'OPENING',
        lighting: ['SS 20%', 'ホリ', 'ピンスポットライト'],
        memo: 'オープニングシーン。緞帳前での会話を想定。',
        members: [
          { id: 'm5', name: '小林 陽子' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
      {
        id: 's3',
        time: '00:50',
        sceneName: 'SCENE 2',
        lighting: ['SS 30%', 'ホリ', 'ピンスポットライト'],
        memo: '転換後のシーン。場面転換に合わせた色変化を確認。',
        members: [
          { id: 'm5', name: '小林 陽子' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
    ],
  },
  {
    id: 'p5',
    name: '体育館イベント',
    updatedAt: '最終更新: 2025-07-18',
    scenes: [
      {
        id: 's1',
        time: '00:05',
        sceneName: 'MAIN',
        lighting: [
          'SS 50%',
          'ホリ',
          'ピンスポットライト',
        ],
        memo: '式典用のシーン。壇上全体を均一に照らす。',
        members: [
          { id: 'm6', name: '田中 直樹' },
          { id: 'm1', name: '山田 太郎' },
        ],
      },
      {
        id: 's2',
        time: '00:15',
        sceneName: 'STUDENT AWARD',
        lighting: ['SS 45%', 'ホリ', 'ピンスポットライト'],
        memo: '表彰式シーン。受賞者にスポットを当てる想定。',
        members: [
          { id: 'm6', name: '田中 直樹' },
          { id: 'm1', name: '山田 太郎' },
        ],
      },
      {
        id: 's3',
        time: '00:25',
        sceneName: 'CLOSING',
        lighting: ['SS 35%', 'ホリ', 'ピンスポットライト'],
        memo: '閉会あいさつ用シーン。客席もやや明るく設定。',
        members: [
          { id: 'm6', name: '田中 直樹' },
          { id: 'm1', name: '山田 太郎' },
        ],
      },
    ],
  },
  {
    id: 'p6',
    name: 'ライブハウス予行',
    updatedAt: '最終更新: 2025-06-01',
    scenes: [
      {
        id: 's1',
        time: '00:20',
        sceneName: 'LIVE 1',
        lighting: ['SS 60%', 'ホリ', 'ピンスポットライト'],
        memo: 'アップテンポ曲用。動きのあるライティングを前提。',
        members: [
          { id: 'm7', name: '高橋 光' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
      {
        id: 's2',
        time: '00:30',
        sceneName: 'BALLAD',
        lighting: ['SS 20%', 'ホリ', 'ピンスポットライト'],
        memo: 'バラード曲用のシーン。落ち着いた雰囲気を重視。',
        members: [
          { id: 'm7', name: '高橋 光' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
      {
        id: 's3',
        time: '00:45',
        sceneName: 'ENCORE',
        lighting: ['SS 70%', 'ホリ', 'ピンスポットライト'],
        memo: 'アンコール用シーン。観客も巻き込む派手なライティング。',
        members: [
          { id: 'm7', name: '高橋 光' },
          { id: 'm4', name: '中村 玲' },
        ],
      },
    ],
  },
]

export function findProject(projectId) {
  return projects.find((project) => project.id === projectId)
}

export function findScene(projectId, sceneId) {
  const project = findProject(projectId)
  if (!project) {
    return { project: null, scene: null }
  }
  const scene = project.scenes?.find((s) => s.id === sceneId)
  return { project, scene }
}
