import { computed } from 'vue'
import { usePersistence } from './usePersistence'
import { blobToBase64, base64ToBlob } from '@/utils/helpers'
import type { Difficulty, ItemType } from '@/data/types'

export interface StudentRecording {
  id: string
  studentId: string
  studentName: string
  itemId: string
  itemText: string
  itemType: ItemType
  difficulty: Difficulty
  transcript: string
  score: number
  /** base64-encoded audio data */
  audioData: string
  mimeType: string
  recordedAt: number
}

interface RecordingsState {
  recordings: StudentRecording[]
}

const state = usePersistence<RecordingsState>('parler-student-recordings', {
  recordings: [],
})

export function useStudentRecordings () {
  const recordings = computed(() => state.recordings)

  async function saveRecording (params: {
    studentId: string; studentName: string; itemId: string; itemText: string
    itemType: ItemType; difficulty: Difficulty; transcript: string; score: number; blob: Blob
  }): Promise<StudentRecording> {
    const { blob, ...rest } = params
    const recording: StudentRecording = {
      ...rest,
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      audioData: await blobToBase64(blob),
      mimeType: blob.type || 'audio/webm',
      recordedAt: Date.now(),
    }

    if (state.recordings.length >= 100) state.recordings.splice(0, state.recordings.length - 99)

    state.recordings.push(recording)
    return recording
  }

  function getRecordingBlob (recording: StudentRecording): Blob {
    return base64ToBlob(recording.audioData)
  }

  function removeRecording (id: string) {
    const idx = state.recordings.findIndex(r => r.id === id)
    if (idx !== -1) {
      state.recordings.splice(idx, 1)
    }
  }

  /** Unique student IDs that have recordings */
  const studentIds = computed(() =>
    [...new Set(state.recordings.map(r => r.studentId))],
  )

  return {
    recordings,
    saveRecording,
    getRecordingBlob,
    removeRecording,
    studentIds,
  }
}
