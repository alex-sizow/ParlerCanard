import type { PracticeItem } from './types'

export interface Sentence extends PracticeItem {
  phrases: {
    text: string
    ipa: string
    translation: string
  }[]
}

export const sentences: Sentence[] = [
  // ─── Beginner ───
  {
    id: 's-001',
    text: 'Je m\'appelle Marie.',
    ipa: '/ʒə ma.pɛl ma.ʁi/',
    translation: 'My name is Marie.',
    difficulty: 'beginner',
    phrases: [
      { text: 'Je m\'appelle', ipa: '/ʒə ma.pɛl/', translation: 'My name is' },
      { text: 'Marie', ipa: '/ma.ʁi/', translation: 'Marie' },
    ],
  },
  {
    id: 's-002',
    text: 'Comment allez-vous ?',
    ipa: '/kɔ.mɑ̃ ta.le vu/',
    translation: 'How are you?',
    difficulty: 'beginner',
    phrases: [
      { text: 'Comment', ipa: '/kɔ.mɑ̃/', translation: 'How' },
      { text: 'allez-vous', ipa: '/a.le vu/', translation: 'are you' },
    ],
  },
  {
    id: 's-003',
    text: 'Il fait beau aujourd\'hui.',
    ipa: '/il fɛ bo o.ʒuʁ.dɥi/',
    translation: 'The weather is nice today.',
    difficulty: 'beginner',
    phrases: [
      { text: 'Il fait beau', ipa: '/il fɛ bo/', translation: 'The weather is nice' },
      { text: 'aujourd\'hui', ipa: '/o.ʒuʁ.dɥi/', translation: 'today' },
    ],
  },
  {
    id: 's-004',
    text: 'Je voudrais un café, s\'il vous plaît.',
    ipa: '/ʒə vu.dʁɛ œ̃ ka.fe sil vu plɛ/',
    translation: 'I would like a coffee, please.',
    difficulty: 'beginner',
    phrases: [
      { text: 'Je voudrais', ipa: '/ʒə vu.dʁɛ/', translation: 'I would like' },
      { text: 'un café', ipa: '/œ̃ ka.fe/', translation: 'a coffee' },
      { text: 's\'il vous plaît', ipa: '/sil vu plɛ/', translation: 'please' },
    ],
  },
  {
    id: 's-005',
    text: 'Où est la gare ?',
    ipa: '/u ɛ la ɡaʁ/',
    translation: 'Where is the train station?',
    difficulty: 'beginner',
    phrases: [
      { text: 'Où est', ipa: '/u ɛ/', translation: 'Where is' },
      { text: 'la gare', ipa: '/la ɡaʁ/', translation: 'the train station' },
    ],
  },

  // ─── Intermediate ───
  {
    id: 's-006',
    text: 'Je suis en train d\'apprendre le français.',
    ipa: '/ʒə sɥi ɑ̃ tʁɛ̃ da.pʁɑ̃dʁ lə fʁɑ̃.sɛ/',
    translation: 'I am learning French.',
    difficulty: 'intermediate',
    phrases: [
      { text: 'Je suis en train', ipa: '/ʒə sɥi ɑ̃ tʁɛ̃/', translation: 'I am in the process' },
      { text: 'd\'apprendre', ipa: '/da.pʁɑ̃dʁ/', translation: 'of learning' },
      { text: 'le français', ipa: '/lə fʁɑ̃.sɛ/', translation: 'French' },
    ],
  },
  {
    id: 's-007',
    text: 'Pourriez-vous parler plus lentement ?',
    ipa: '/pu.ʁje vu paʁ.le ply lɑ̃t.mɑ̃/',
    translation: 'Could you speak more slowly?',
    difficulty: 'intermediate',
    phrases: [
      { text: 'Pourriez-vous', ipa: '/pu.ʁje vu/', translation: 'Could you' },
      { text: 'parler plus lentement', ipa: '/paʁ.le ply lɑ̃t.mɑ̃/', translation: 'speak more slowly' },
    ],
  },
  {
    id: 's-008',
    text: 'La boulangerie ouvre à sept heures du matin.',
    ipa: '/la bu.lɑ̃ʒ.ʁi uvʁ a sɛ.tœʁ dy ma.tɛ̃/',
    translation: 'The bakery opens at seven in the morning.',
    difficulty: 'intermediate',
    phrases: [
      { text: 'La boulangerie', ipa: '/la bu.lɑ̃ʒ.ʁi/', translation: 'The bakery' },
      { text: 'ouvre à sept heures', ipa: '/uvʁ a sɛ.tœʁ/', translation: 'opens at seven' },
      { text: 'du matin', ipa: '/dy ma.tɛ̃/', translation: 'in the morning' },
    ],
  },
  {
    id: 's-009',
    text: 'Nous avons réservé une table pour deux.',
    ipa: '/nu.za.vɔ̃ ʁe.zɛʁ.ve yn tabl puʁ dø/',
    translation: 'We have reserved a table for two.',
    difficulty: 'intermediate',
    phrases: [
      { text: 'Nous avons réservé', ipa: '/nu.za.vɔ̃ ʁe.zɛʁ.ve/', translation: 'We have reserved' },
      { text: 'une table pour deux', ipa: '/yn tabl puʁ dø/', translation: 'a table for two' },
    ],
  },
  {
    id: 's-010',
    text: 'Je cherche la station de métro la plus proche.',
    ipa: '/ʒə ʃɛʁʃ la sta.sjɔ̃ də me.tʁo la ply pʁɔʃ/',
    translation: 'I\'m looking for the nearest metro station.',
    difficulty: 'intermediate',
    phrases: [
      { text: 'Je cherche', ipa: '/ʒə ʃɛʁʃ/', translation: 'I\'m looking for' },
      { text: 'la station de métro', ipa: '/la sta.sjɔ̃ də me.tʁo/', translation: 'the metro station' },
      { text: 'la plus proche', ipa: '/la ply pʁɔʃ/', translation: 'the nearest' },
    ],
  },

  // ─── Advanced ───
  {
    id: 's-011',
    text: 'Il faudrait que nous puissions en discuter davantage.',
    ipa: '/il fo.dʁɛ kə nu pɥi.sjɔ̃ ɑ̃ dis.ky.te da.vɑ̃.taʒ/',
    translation: 'We would need to discuss it further.',
    difficulty: 'advanced',
    phrases: [
      { text: 'Il faudrait que', ipa: '/il fo.dʁɛ kə/', translation: 'It would be necessary that' },
      { text: 'nous puissions', ipa: '/nu pɥi.sjɔ̃/', translation: 'we could' },
      { text: 'en discuter davantage', ipa: '/ɑ̃ dis.ky.te da.vɑ̃.taʒ/', translation: 'discuss it further' },
    ],
  },
  {
    id: 's-012',
    text: 'Bien que ce soit difficile, je persévère.',
    ipa: '/bjɛ̃ kə sə swa di.fi.sil ʒə pɛʁ.se.vɛʁ/',
    translation: 'Although it\'s difficult, I persevere.',
    difficulty: 'advanced',
    phrases: [
      { text: 'Bien que ce soit', ipa: '/bjɛ̃ kə sə swa/', translation: 'Although it is' },
      { text: 'difficile', ipa: '/di.fi.sil/', translation: 'difficult' },
      { text: 'je persévère', ipa: '/ʒə pɛʁ.se.vɛʁ/', translation: 'I persevere' },
    ],
  },
  {
    id: 's-013',
    text: 'Les champs Élysées sont magnifiques au printemps.',
    ipa: '/le ʃɑ̃.ze.li.ze sɔ̃ ma.ɲi.fik o pʁɛ̃.tɑ̃/',
    translation: 'The Champs-Élysées are magnificent in spring.',
    difficulty: 'advanced',
    phrases: [
      { text: 'Les champs Élysées', ipa: '/le ʃɑ̃.ze.li.ze/', translation: 'The Champs-Élysées' },
      { text: 'sont magnifiques', ipa: '/sɔ̃ ma.ɲi.fik/', translation: 'are magnificent' },
      { text: 'au printemps', ipa: '/o pʁɛ̃.tɑ̃/', translation: 'in spring' },
    ],
  },
  {
    id: 's-014',
    text: 'Quoiqu\'il en soit, la décision a été prise à l\'unanimité.',
    ipa: '/kwа.kil ɑ̃ swa la de.si.zjɔ̃ a e.te pʁiz a ly.na.ni.mi.te/',
    translation: 'Be that as it may, the decision was taken unanimously.',
    difficulty: 'advanced',
    phrases: [
      { text: 'Quoiqu\'il en soit', ipa: '/kwа.kil ɑ̃ swa/', translation: 'Be that as it may' },
      { text: 'la décision a été prise', ipa: '/la de.si.zjɔ̃ a e.te pʁiz/', translation: 'the decision was taken' },
      { text: 'à l\'unanimité', ipa: '/a ly.na.ni.mi.te/', translation: 'unanimously' },
    ],
  },
  {
    id: 's-015',
    text: 'Je me suis rendu compte que j\'avais oublié mon parapluie.',
    ipa: '/ʒə mə sɥi ʁɑ̃.dy kɔ̃t kə ʒa.vɛ u.bli.je mɔ̃ pa.ʁa.plɥi/',
    translation: 'I realized that I had forgotten my umbrella.',
    difficulty: 'advanced',
    phrases: [
      { text: 'Je me suis rendu compte', ipa: '/ʒə mə sɥi ʁɑ̃.dy kɔ̃t/', translation: 'I realized' },
      { text: 'que j\'avais oublié', ipa: '/kə ʒa.vɛ u.bli.je/', translation: 'that I had forgotten' },
      { text: 'mon parapluie', ipa: '/mɔ̃ pa.ʁa.plɥi/', translation: 'my umbrella' },
    ],
  },
]
